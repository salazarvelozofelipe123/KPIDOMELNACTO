(() => {
  'use strict';
  const DATA_URL = './data/monthly.json';
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n || 0).toLocaleString('es-CL',{maximumFractionDigits:1});
  const pct = n => `${fmt(n)}%`;
  const rate = (a,b) => b ? a / b * 100 : 0;
  const monthYear = m => `${m.name} ${m.key.slice(0,4)}`;
  const kpi = (value,label,sub,accent) => `<div class="card kpi" style="--accent:${accent}"><b>${value}</b><span>${label}</span><small>${sub}</small></div>`;
  let months = [];

  function validate(payload){
    if(!payload || !Array.isArray(payload.months)) throw new Error('monthly.json no contiene months[].');
    const required = ['key','name','total','domel','presencial','digital','noadm','envios'];
    payload.months.forEach((m,i) => {
      required.forEach(k => { if(m[k] === undefined || m[k] === null) throw new Error(`Mes ${i+1}: falta ${k}`); });
      if(m.domel + m.presencial !== m.total) throw new Error(`${m.key}: DOMEL + presencial debe ser igual al total.`);
      if(m.domel + m.noadm !== m.envios) throw new Error(`${m.key}: DOMEL admisible + no admisible debe ser igual a envíos.`);
    });
    return payload.months.slice().sort((a,b) => a.key.localeCompare(b.key));
  }

  function renderPareto(id, rows){
    const el = $(id); if(!el) return;
    if(!rows || !rows.length){
      el.innerHTML = '<div class="empty">Sin detalle Pareto cargado para este período.</div>';
      return;
    }
    const max = Math.max(...rows.map(r => r.total), 1);
    el.innerHTML = rows.map(r => `<div class="pareto-row"><div class="pareto-label"><b>${r.name}</b><span>${r.total} total · ${r.domel || 0} DOMEL</span></div><div class="track"><div style="width:${r.total/max*100}%"></div></div></div>`).join('');
  }

  function trendSvg(){
    const W=500,H=210,p=35, vals=months.map(m=>m.digital);
    let min=Math.floor(Math.min(...vals)-2), max=Math.ceil(Math.max(...vals)+2);
    if(max<=min) max=min+1;
    const pts=months.map((m,i)=>[p+(months.length===1?0:i*(W-2*p)/(months.length-1)),H-p-(m.digital-min)/(max-min)*(H-2*p)]);
    const ticks=Array.from({length:5},(_,i)=>min+(max-min)*i/4);
    return `<svg viewBox="0 0 ${W} ${H}">${ticks.map(v=>{const y=H-p-(v-min)/(max-min)*(H-2*p);return `<line class="axis" x1="${p}" y1="${y}" x2="${W-p}" y2="${y}"/><text class="svgtxt" x="2" y="${y+4}">${fmt(v)}%</text>`}).join('')}<polyline class="trend" points="${pts.map(x=>x.join(',')).join(' ')}"/>${pts.map((pt,i)=>`<circle class="point" cx="${pt[0]}" cy="${pt[1]}" r="6"/><text class="svgval" x="${pt[0]-12}" y="${pt[1]-13}">${pct(months[i].digital)}</text><text class="svgtxt" x="${pt[0]-14}" y="${H-7}">${months[i].name.slice(0,3)}</text>`).join('')}</svg>`;
  }

  function renderAnnual(){
    const total=months.reduce((a,m)=>a+m.total,0), domel=months.reduce((a,m)=>a+m.domel,0), noadm=months.reduce((a,m)=>a+m.noadm,0), envios=months.reduce((a,m)=>a+m.envios,0);
    const cum=rate(domel,total), avgTotal=total/months.length, avgDomel=domel/months.length, avgDig=months.reduce((a,m)=>a+m.digital,0)/months.length, adm=rate(domel,envios);
    const first=months[0], last=months[months.length-1], best=months.reduce((a,b)=>a.digital>b.digital?a:b);
    const totalGrowth=first.total?(last.total-first.total)/first.total*100:0, domelGrowth=first.domel?(last.domel-first.domel)/first.domel*100:0;
    $('periodText').textContent=`${first.name} a ${last.name} ${last.key.slice(0,4)} · ${months.length} cierres cargados`;
    $('annualKpis').innerHTML=[kpi(fmt(total),'Trámites acumulados',`${months.length} meses cargados`,'#0877c9'),kpi(fmt(domel),'DOMEL acumulados','Canal digital','#10b981'),kpi(pct(cum),'Digitalización acumulada',`${domel} de ${total}`,'#ec4899'),kpi(fmt(avgTotal),'Promedio mensual','Trámites admisibles','#10b8d7'),kpi(fmt(avgDomel),'Promedio DOMEL/mes','Admisibles digitales','#f59e0b'),kpi(pct(avgDig),'Promedio tasa mensual','Media simple','#8b5cf6')].join('');
    const maxVol=Math.max(...months.map(m=>m.total),1);
    $('volumeChart').innerHTML=months.map(m=>`<div class="bgroup"><div class="bar total" title="Total ${m.total}" style="height:${m.total/maxVol*190}px"></div><div class="bar domel" title="DOMEL ${m.domel}" style="height:${m.domel/maxVol*190}px"></div><div class="bar pres" title="Presencial ${m.presencial}" style="height:${m.presencial/maxVol*190}px"></div><span>${m.name.slice(0,3)}</span></div>`).join('');
    $('trendChart').innerHTML=trendSvg();
    $('annualQuality').innerHTML=`<div class="donut" style="background:conic-gradient(#16a34a 0 ${adm}%,#ef4444 ${adm}% 100%)"><div><b>${fmt(adm)}%</b><small>admisible</small></div></div><div class="metric-list"><div><b>${domel}</b><span>admisibles DOMEL</span></div><div><b>${noadm}</b><span>no admisibles</span></div><div><b>${envios}</b><span>envíos DOMEL</span></div></div>`;
    $('historyTable').innerHTML=months.map(m=>`<tr><td>${m.name}</td><td>${m.total}</td><td>${m.domel}</td><td>${m.noadm}</td><td><b>${pct(m.digital)}</b></td></tr>`).join('');
    $('annualInsights').innerHTML=`<div><b>${totalGrowth>=0?'+':''}${fmt(totalGrowth)}%</b><span>variación del volumen entre ${first.name} y ${last.name}</span></div><div><b>${domelGrowth>=0?'+':''}${fmt(domelGrowth)}%</b><span>variación de trámites DOMEL</span></div><div><b>${best.name}: ${pct(best.digital)}</b><span>mayor tasa mensual cargada</span></div><div><b>${pct(cum)}</b><span>digitalización acumulada ponderada</span></div>`;
    $('annualParetoTitle').textContent=`Pareto del último mes · ${monthYear(last)}`;
    renderPareto('annualParetoCert',last.paretoCert||[]); renderPareto('annualParetoExp',last.paretoExp||[]);
  }

  function renderMonth(i){
    const m=months[i], adm=rate(m.domel,m.envios), share=rate(m.domel,m.total);
    $('monthTitle').textContent=monthYear(m); $('monthNote').textContent=m.note||'Cierre mensual cargado desde GitHub.'; $('monthTag').textContent=`${pct(m.digital)} digital`;
    $('monthKpis').innerHTML=[kpi(m.total,'Total admisible','Universo KPI','#0877c9'),kpi(m.domel,'DOMEL admisibles','Canal digital','#10b981'),kpi(m.presencial,'Presencial/interno','Canal tradicional','#f59e0b'),kpi(pct(m.digital),'Digitalización global','Cierre mensual','#ec4899'),kpi(m.noadm,'No admisibles DOMEL','Calidad de entrada','#ef4444'),kpi(m.envios,'Envíos DOMEL','Total registrado','#8b5cf6')].join('');
    $('monthDonut').innerHTML=`<div class="donut" style="background:conic-gradient(#10b981 0 ${share}%,#f59e0b ${share}% 100%)"><div><b>${pct(m.digital)}</b><small>DOMEL</small></div></div><div class="metric-list"><div><b>${m.domel}</b><span>DOMEL</span></div><div><b>${m.presencial}</b><span>presencial/interno</span></div><div><b>${m.total}</b><span>total admisible</span></div></div>`;
    const spec=[]; if(m.certPct!=null)spec.push([pct(m.certPct),'Digitalización Certificados']); if(m.expPct!=null)spec.push([pct(m.expPct),'Digitalización Expedientes']); spec.push([pct(adm),'Admisibilidad de envíos DOMEL']);
    $('monthSpecific').innerHTML=spec.map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
    $('quality').innerHTML=`<div class="donut-wrap"><div class="donut" style="background:conic-gradient(#16a34a 0 ${adm}%,#ef4444 ${adm}% 100%)"><div><b>${fmt(adm)}%</b><small>ADMISIBLE</small></div></div><div class="metric-list"><div><b>${m.domel}</b><span>admisibles</span></div><div><b>${m.noadm}</b><span>no admisibles</span></div><div><b>${m.envios}</b><span>envíos</span></div></div></div>`;
    renderPareto('paretoCert',m.paretoCert||[]); renderPareto('paretoExp',m.paretoExp||[]);
    const sources=m.sources||[{name:'Certificados DOM',location:'Fuente institucional'},{name:'Permisos y expedientes',location:'Fuente institucional'},{name:'Reporte DOMEL mensual',location:'Reporte mensual'}];
    $('sources').innerHTML=sources.map(x=>`<div class="source"><b>${x.name}</b><span>${x.location||''}</span><span>VALIDADA</span></div>`).join('');
  }

  function setup(){
    const sel=$('monthSelect'); sel.innerHTML=''; months.forEach((m,i)=>sel.insertAdjacentHTML('beforeend',`<option value="${i}" ${i===months.length-1?'selected':''}>${monthYear(m)}</option>`));
    sel.onchange=()=>renderMonth(+sel.value); renderMonth(months.length-1);
    $('annualBtn').onclick=()=>{document.body.classList.remove('monthmode');$('annualBtn').classList.add('active');$('monthBtn').classList.remove('active')};
    $('monthBtn').onclick=()=>{document.body.classList.add('monthmode');$('monthBtn').classList.add('active');$('annualBtn').classList.remove('active')};
  }

  async function boot(){
    try{
      const r=await fetch(`${DATA_URL}?v=${Date.now()}`,{cache:'no-store'}); if(!r.ok)throw new Error(`HTTP ${r.status}`);
      months=validate(await r.json()); if(!months.length)throw new Error('No hay meses cargados.'); renderAnnual(); setup();
      $('syncBadge').textContent='DATOS GITHUB ACTUALIZADOS';
    }catch(e){ console.error(e); $('syncBadge').textContent='ERROR DE SINCRONIZACIÓN'; $('syncBadge').classList.add('error'); $('syncMessage').textContent=e.message; }
  }
  boot();
})();