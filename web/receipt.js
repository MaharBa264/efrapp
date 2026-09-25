const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kg=v=>Number(v).toLocaleString('es-AR',{maximumFractionDigits:3});
function wrap(s,max=45){let words=String(s??'').split(/\s+/),lines=[''];for(let w of words){if((lines.at(-1)+' '+w).length>max)lines.push(w);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+w}return lines}
export function receiptSvg(d,options={}){
 const inst=JSON.parse(d.issuer_snapshot||'{}'),contacts=[];
 if(d.customer_direction)contacts.push('Domicilio: '+d.customer_direction);
 if(d.customer_phone)contacts.push('Teléfono: '+d.customer_phone);
 if(options.salesperson&&d.salesperson_name)contacts.push('Vendedor: '+d.salesperson_name);
 if(options.carrier&&d.carrier_name)contacts.push('Transportista: '+d.carrier_name);
 const lines=[];
 for(const item of d.items)for(const [index,name] of wrap(item.product_name,32).entries())lines.push({name:index?'    '+name:name,units:index?'':String(item.units_count??item.quantity),weight:index?'':item.weight_kg==null?'—':kg(item.weight_kg)});
 const head=357+contacts.length*32,rowStart=head+90,afterRows=rowStart+lines.length*39;
 let afterTotal=afterRows+105+(d.reference?35:0)+(d.notes?29*(1+wrap(d.notes,60).length):0);
 const height=Math.max(900,afterTotal+115),t=(x,y,v,size=25,weight=400,anchor='start')=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="#19332f">${esc(v)}</text>`;
 let out=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}"><rect width="800" height="${height}" fill="white"/><rect width="800" height="14" fill="#12594b"/>`;
 if(inst.logo)out+=`<image x="45" y="42" width="90" height="90" href="${inst.logo}"/>`;
 out+=t(inst.logo?150:45,85,inst.name||'Despacho',34,700)+t(inst.logo?150:45,118,[inst.direction,inst.phone].filter(Boolean).join(' · '),18)+`<line x1="45" x2="755" y1="160" y2="160" stroke="#c9d9ce"/>`+t(45,207,'COMPROBANTE DE DESPACHO',20,700)+t(755,210,'#'+d.number,34,700,'end')+t(45,255,'Fecha: '+new Date(d.confirmed_at||d.created_at).toLocaleString('es-AR'),19)+t(45,289,'Cliente: '+d.customer_name,23,700)+t(45,323,'Despachó: '+d.seller_name,19);
 contacts.forEach((line,i)=>out+=t(45,354+i*32,line,18));
 out+=`<rect x="45" y="${head}" width="710" height="50" rx="8" fill="#e9f2ed"/>`+t(60,head+34,'PRODUCTO',18,700)+t(625,head+34,'UNIDADES',17,700,'end')+t(740,head+34,'KG',18,700,'end');
 let y=rowStart;for(const row of lines){out+=t(60,y,row.name,19)+t(625,y,row.units,19,700,'end')+t(740,y,row.weight,19,700,'end');y+=39}
 out+=`<line x1="45" x2="755" y1="${y+10}" y2="${y+10}" stroke="#c9d9ce"/>`+t(740,y+55,'TOTAL: '+d.items.reduce((a,x)=>a+(x.units_count??x.quantity),0)+' u'+(d.items.every(x=>x.weight_kg!=null)?' · '+kg(d.items.reduce((a,x)=>a+x.weight_kg,0))+' kg':''),23,700,'end');y+=105;
 if(d.reference){out+=t(45,y,'Referencia: '+d.reference,19);y+=35}
 if(d.notes){out+=t(45,y,'Observaciones:',19,700);for(const line of wrap(d.notes,60)){y+=29;out+=t(45,y,line,19)}}
 out+=t(45,height-70,inst.extra||'',17)+t(45,height-35,'Documento generado por EfraApp',14)+`</svg>`;
 return {svg:out,height}
}
