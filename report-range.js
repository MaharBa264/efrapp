// Business dates are calendar days in San Luis (UTC-03), with an exclusive end.
export function reportRange(from,to){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||'')||from>to)return null;
 const start=new Date(from+'T00:00:00-03:00'),end=new Date(to+'T00:00:00-03:00');
 if(isNaN(start.valueOf())||isNaN(end.valueOf())||start.toISOString().slice(0,10)!==from||end.toISOString().slice(0,10)!==to)return null;
 end.setUTCDate(end.getUTCDate()+1);
 return {start:start.toISOString(),end:end.toISOString()}
}
