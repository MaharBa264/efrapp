const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const one=(db,q,...v)=>db.prepare(q).bind(...v).first();
const all=(db,q,...v)=>db.prepare(q).bind(...v).all().then(r=>r.results);
export async function stockRoute(req,db,user,permissions,path,url){
 const enabled=(await one(db,"SELECT value FROM settings WHERE key='stock_enabled'"))?.value==='1';
 if(path[1]==='state'&&req.method==='GET')return json({enabled,canRead:permissions.has('stock.read')||permissions.has('*'),canManage:permissions.has('stock.manage')||permissions.has('*')});
 if(path[1]==='settings'){
  if(req.method==='GET'){if(user.role_id!=='superadmin')fail('Sin permiso',403);return json({enabled})}
  if(req.method!=='PUT')fail('Método inválido',405);
  if(user.role_id!=='superadmin')fail('Sólo el superadmin puede activar stock',403);
  const data=await req.json();if(typeof data.enabled!=='boolean')fail('Elegí activar o desactivar stock');
  await db.prepare("UPDATE settings SET value=? WHERE key='stock_enabled'").bind(data.enabled?'1':'0').run();return json({enabled:data.enabled});
 }
 if(!enabled)fail('Stock deshabilitado',403);
 const can=(permission)=>permissions.has(permission)||permissions.has('*');
 if(!can('stock.read'))fail('Sin permiso',403);
 if(path[1]==='levels'&&req.method==='GET'){
  let search=(url.searchParams.get('search')||'').trim().slice(0,120),onlyLow=url.searchParams.get('low')==='1';
  return json(await all(db,`SELECT p.id product_id,p.name,p.packaging,p.weight_kg,p.active,COALESCE(f.name||' · '||v.name||' · '||p.packaging,p.name) display_name,s.quantity,s.minimum,s.updated_at FROM stock_levels s JOIN products p ON p.id=s.product_id LEFT JOIN product_varieties v ON v.id=p.variety_id LEFT JOIN product_families f ON f.id=v.family_id WHERE (?='' OR lower(COALESCE(f.name||' · '||v.name||' · '||p.packaging,p.name)) LIKE '%'||lower(?)||'%') AND (?=0 OR s.quantity<=s.minimum) ORDER BY p.active DESC,display_name LIMIT 300`,search,search,onlyLow?1:0));
 }
 if(path[1]==='movements'&&req.method==='GET'){
  let product=url.searchParams.get('product_id')||'';
  return json(await all(db,`SELECT m.*,p.name product_name,u.name actor_name FROM stock_movements m JOIN products p ON p.id=m.product_id JOIN users u ON u.id=m.actor_id WHERE (?='' OR m.product_id=?) ORDER BY m.created_at DESC LIMIT 100`,product,product));
 }
 if(!can('stock.manage'))fail('Sin permiso',403);
 if(path[1]==='levels'&&path[2]&&req.method==='PUT'){
  let data=await req.json(),minimum=Number(data.minimum);
  if(!Number.isSafeInteger(minimum)||minimum<0||minimum>100000000)fail('Mínimo inválido');
  let result=await db.prepare('UPDATE stock_levels SET minimum=?,updated_at=? WHERE product_id=?').bind(minimum,new Date().toISOString(),path[2]).run();
  if(!result.meta.changes)fail('Presentación inexistente',404);return json({ok:true});
 }
 if(path[1]==='movements'&&req.method==='POST'){
  let data=await req.json(),product=await one(db,'SELECT id,active FROM products WHERE id=?',data.product_id);
  if(typeof data.id!=='string'||!/^[-a-f0-9]{36}$/i.test(data.id))fail('Identificador de movimiento inválido');
  let previous=await one(db,'SELECT id,product_id,actor_id,kind FROM stock_movements WHERE id=?',data.id);if(previous){if(previous.product_id!==data.product_id||previous.actor_id!==user.id||previous.kind!==data.kind)fail('Identificador ya utilizado',409);return json({id:previous.id,already_recorded:true})}
  if(!product)fail('Presentación inexistente',404);
  let kind=data.kind,quantity=Number(data.quantity),note=String(data.note||'').trim().slice(0,300);
  if(!['IN','OUT','ADJUST'].includes(kind))fail('Tipo de movimiento inválido');
  if(!Number.isSafeInteger(quantity)||quantity<0||quantity>100000000)fail('Cantidad inválida');
  if(kind!=='ADJUST'&&quantity===0)fail('Ingresá una cantidad');
  if(kind==='ADJUST'&&!note)fail('Indicá el motivo del ajuste');
  let current=await one(db,'SELECT quantity FROM stock_levels WHERE product_id=?',product.id),delta=kind==='ADJUST'?quantity-(current?.quantity||0):kind==='IN'?quantity:-quantity;
  if(delta===0)fail('El saldo no cambia');
  let id=data.id;try{await db.prepare('INSERT INTO stock_movements(id,product_id,delta,kind,note,dispatch_id,actor_id,expected_quantity,created_at) VALUES(?,?,?,?,?,NULL,?,?,?)').bind(id,product.id,delta,kind,note||null,user.id,current?.quantity||0,new Date().toISOString()).run()}catch(e){if(/UNIQUE constraint failed: stock_movements.id/.test(e.message)){let previous=await one(db,'SELECT product_id,actor_id,kind FROM stock_movements WHERE id=?',id);if(previous?.product_id===product.id&&previous.actor_id===user.id&&previous.kind===kind)return json({id,already_recorded:true});fail('Identificador ya utilizado',409)}if(/Stock insuficiente/.test(e.message))fail('Stock insuficiente',409);if(/Saldo modificado/.test(e.message))fail('El saldo cambió; actualizá la pantalla y repetí',409);throw e}
  return json({id,quantity:(current?.quantity||0)+delta},201);
 }
 fail('Ruta inexistente',404);
}
