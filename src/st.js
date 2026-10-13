/* ===== 정원·편제 개편 모듈 ===== */
let SPX=null;            // 현재 구조 파라미터
const SIX=new Set(['의학계열','약학계열']);
const HUM='인문·사회계열',ENG='공학계열',SCI='이학계열';
let NEWD=[],CLOSED=[],MOVES=[],QUOTA={};
function prepSP(p){const G=p.G.map(e=>{const tot=e.h.reduce((a,b)=>a+b,0);return {...e,tot,uAx:e.rev/tot,E:e.h[0]}});
  return {...p,G,byG:Object.fromEntries(G.map(e=>[e.g,e])),uBar:G.reduce((a,e)=>a+e.uD*e.tot,0)/G.reduce((a,e)=>a+e.tot,0)}}
function setSP(p){SPX=prepSP(p);QUOTA={};SPX.G.forEach(e=>QUOTA[e.g]=Math.round(e.E));
  NEWD=NEWD.filter(x=>SPX.byG[x.g]);CLOSED=CLOSED.filter(x=>SPX.depts.some(d=>d[2]===x.d&&d[1]===x.c));MOVES=MOVES.filter(x=>SPX.byG[x.from]&&SPX.byG[x.to])}
setSP(SP_EMB);if(window.__savedSP){try{setSP(window.__savedSP)}catch(e){setSP(SP_EMB)}}
/* 업로드 자료로 구조 파라미터 재산출 (Python 산식과 동일) */
function buildStructFromStore(y,mul){
  const rowsOf=yy=>{const out=[];for(const k of Object.keys(STORE)){const [Y,S]=k.split('|');if(+Y!==yy)continue;for(const r of STORE[k].rows)out.push([S,...r])}return out};
  const norm=rows=>{const o=[];for(const [S,c,p,ser,f,rx,reg,tu,am,gr,id,dept] of rows){if(rx==='Y')continue;o.push({S,c,p,g:ser==='의예계열'?'의학계열':ser,raw:ser,f,am,k:+gr,id,dept})}
    for(const r of o){if(r.raw==='의학계열')r.k+=2;const L=SIX.has(r.g)?6:4;r.L=L;if(r.k>L)r.k=L}return o};
  const cur=norm(rowsOf(y));if(!cur.length)return {sp:null,msg:'기준년도 자료 없음'};
  if(cur.some(r=>!(r.k>=1)))return {sp:null,msg:'학년 열이 없어 정원·편제 탭은 내장 2026 구조를 사용합니다'};
  const ug=cur.filter(r=>r.p==='학부');
  const meanH=(rows,keyf)=>{const m=new Map();for(const r of rows){const kk=keyf(r)+'|'+r.S;m.set(kk,(m.get(kk)||0)+1)}const s=new Map(),n=new Map();for(const [kk,v] of m){const b=kk.slice(0,kk.lastIndexOf('|'));s.set(b,(s.get(b)||0)+v);n.set(b,(n.get(b)||0)+1)}const o=new Map();for(const [b,v] of s)o.set(b,v/n.get(b));return o};
  const H1=meanH(ug,r=>r.g+'|'+r.k);const h=(H,g,k)=>H.get(g+'|'+k)||0;
  const Ls={};ug.forEach(r=>Ls[r.g]=r.L);const gs=Object.keys(Ls);
  const prevRows=norm(rowsOf(y-1)).filter(r=>r.p==='학부');const hasPrev=prevRows.length&&prevRows.every(r=>r.k>=1)&&prevRows.some(r=>r.id);
  let C={},ST={},FB={},avg=SP_EMB.avg,stayAvg=SP_EMB.stayAvg,ratioSrc;
  if(hasPrev){const H0=meanH(prevRows,r=>r.g+'|'+r.k);const raw={},stay={};
    for(const g of gs){const L=Ls[g];const sh=[];for(const S of ['1학기','2학기']){const a=new Set(prevRows.filter(r=>r.S===S&&r.g===g&&r.k===L).map(r=>r.id));if(a.size<20)continue;const b=new Set(ug.filter(r=>r.S===S).map(r=>r.id));let m=0;for(const i of a)if(b.has(i))m++;sh.push(m/a.size)}
      stay[g]=sh.length?sh.reduce((a,b)=>a+b,0)/sh.length:null;raw[g]=[];
      for(let k=1;k<L;k++){const den=h(H0,g,k);let num=h(H1,g,k+1);if(k+1===L)num-=(stay[g]||0)*h(H0,g,L);const v=den>=30?num/den:null;raw[g].push(v!==null&&v>=0.7&&v<=1.3?v:null)}}
    const four=gs.filter(g=>Ls[g]===4);avg=[0,1,2].map(k=>{let n=0,d=0;for(const g of four){if(raw[g][k]!==null&&raw[g][k]!==undefined){n+=raw[g][k]*h(H0,g,k+1);d+=h(H0,g,k+1)}}return d?n/d:SP_EMB.avg[k]});
    {let n=0,d=0;for(const g of four)if(stay[g]!==null){n+=stay[g]*h(H0,g,4);d+=h(H0,g,4)}stayAvg=d?n/d:SP_EMB.stayAvg}
    for(const g of gs){C[g]=[];FB[g]=[];raw[g].forEach((v,k)=>{if(v===null){C[g].push(k<3?avg[k]:1);FB[g].push(k+1)}else C[g].push(v)});ST[g]=stay[g]!==null?stay[g]:(Ls[g]===4?stayAvg:0)}
    ratioSrc=`${y-1}→${y} 실적`}
  else{for(const g of gs){const e=SP_EMB.G.find(x=>x.g===g);C[g]=e?e.c.slice():Array.from({length:Ls[g]-1},(_,k)=>k<3?SP_EMB.avg[k]:1);ST[g]=e?e.st:(Ls[g]===4?SP_EMB.stayAvg:0);FB[g]=e?e.fb:[]}ratioSrc='전년도 자료가 없어 내장 2025→2026 진급률 사용'}
  const order=['인문·사회계열','이학계열','공학계열','예능계열','음악계열','체육계열','의학계열','약학계열','한양인터칼리지계열'];
  const gsO=[...order.filter(g=>gs.includes(g)),...gs.filter(g=>!order.includes(g))];
  const domH=meanH(ug.filter(r=>r.f==='내국인'),r=>r.g);
  const G=gsO.map(g=>{const L=Ls[g];const hh=Array.from({length:L},(_,i)=>h(H1,g,i+1));const tot=hh.reduce((a,b)=>a+b,0);const rev=ug.filter(r=>r.g===g).reduce((a,r)=>a+r.am,0)*mul;
    const rd=ug.filter(r=>r.g===g&&r.f==='내국인').reduce((a,r)=>a+r.am,0)*mul;const dh=domH.get(g)||0;
    return {g,L,h:hh,c:C[g],st:ST[g],fb:FB[g]||[],uA:Math.round(rev/tot),uD:dh?Math.round(rd/dh):Math.round(rev/tot),rev}});
  const gr=cur.filter(r=>r.p!=='학부');const grN=meanH(gr,()=>'x').get('x')||0;
  const depts=[];const DH=meanH(ug,r=>r.g+'\u0001'+r.c+'\u0001'+r.dept+'\u0001'+r.k);const dm=new Map();
  for(const [kk,v] of DH){const [g,c,d,k]=kk.split('\u0001');const key=g+'\u0001'+c+'\u0001'+d;if(!dm.has(key))dm.set(key,Array(Ls[g]).fill(0));dm.get(key)[+k-1]=v}
  for(const [key,hh] of dm){const [g,c,d]=key.split('\u0001');if(d&&hh.reduce((a,b)=>a+b,0)>=5)depts.push([g,c,d,hh])}
  depts.sort((a,b)=>(a[0]+a[1]+a[2]).localeCompare(b[0]+b[1]+b[2],'ko'));
  return {sp:{BY:y,G,grad:{rev:gr.reduce((a,r)=>a+r.am,0)*mul,n:grN},res:RES,depts,avg,stayAvg,src:ratioSrc},msg:ratioSrc}}
/* 코호트 추계 엔진 */
function stCfg(){const n=id=>parseFloat($(id).value)||0;const o=opts();
  return {r:n('stRate'),cut:n('stCut'),move:n('stMove'),split:n('stSplit'),start:+$('stStart').value||SPX.BY+1,fillDx:n('stFill'),dropDx:n('stDrop'),elast:n('stElast'),gradDecl:n('stGrad'),pay:o.pay,struct:true,plan:true,T:4}}
function seatDelta(cfg,g,N){if(!cfg.struct)return 0;let d=0;
  if(N>=cfg.start){d+=-cfg.cut/100*(QUOTA[g]||0);
    if(cfg.move){const m=cfg.move/100*(QUOTA[HUM]||0);if(g===HUM)d-=m;if(g===ENG)d+=m*cfg.split/100;if(g===SCI)d+=m*(1-cfg.split/100)}}
  if(cfg.plan){for(const x of MOVES)if(N>=x.y){if(x.from===g)d-=x.n;if(x.to===g)d+=x.n}
    for(const x of CLOSED)if(N>=x.y&&x.g===g)d-=x.n}
  return d}
function newSeats(cfg,g,N){if(!cfg.struct||!cfg.plan)return {q:0,e:0};let q=0,e=0;for(const x of NEWD)if(x.g===g&&N>=x.y){q+=x.q;e+=x.q*x.f/100}return {q,e}}
function stProject(cfg){const S=SPX,T=cfg.T||4,out=[];const keep=1-cfg.dropDx/100;
  const st={};S.G.forEach(e=>st[e.g]={b:e.h.slice(),d:Array(e.L).fill(0)});
  const snap=t=>{let ug=0,stu=0,dsum={},dstu=0;for(const e of S.G){const s=st[e.g];let hb=0,hd=0;for(let k=0;k<e.L;k++){hb+=s.b[k];hd+=s.d[k]}ug+=hb*e.uAx+hd*e.uD;stu+=hb+hd;dsum[e.g]=hd;dstu+=hd}
    const gf=Math.pow(1-cfg.gradDecl/100,t);
    let seats=0;const N=S.BY+t;for(const e of S.G){for(let j=0;j<e.L;j++){const yy=N-j;seats+=(QUOTA[e.g]||0)+(yy>S.BY?seatDelta(cfg,e.g,yy)+newSeats(cfg,e.g,yy).q:0)}}
    return {t,N,ug,stu:stu+S.grad.n*gf,ugStu:stu,grev:S.grad.rev*gf,dsum,dstu,seats}};
  out.push(snap(0));
  for(let t=1;t<=T;t++){const N=S.BY+t;const F=Math.max(0,1+cfg.fillDx/100-cfg.elast*Math.max(cfg.r,0)/100);
    for(const e of S.G){const s=st[e.g];const fill=(QUOTA[e.g]>0?e.E/QUOTA[e.g]:1);const ns=newSeats(cfg,e.g,N);
      const Eb=e.E*F,Ed=(seatDelta(cfg,e.g,N)*fill+ns.e)*F;
      const step=(H,E0)=>{const L=e.L,nH=Array(L).fill(0);nH[0]=E0;for(let k=1;k<L;k++)nH[k]=e.c[k-1]*keep*H[k-1];if(L>1)nH[L-1]+=e.st*keep*H[L-1];return nH};
      s.b=step(s.b,Eb);s.d=step(s.d,Ed);for(let k=0;k<e.L;k++)if(s.b[k]+s.d[k]<0)s.d[k]=-s.b[k]}
    out.push(snap(t))}
  return out}
const pfOf=(r,t)=>Math.pow(1+r/100,t);
function revAt(p,t,r,pay,tp){const x=p[t];const pf=pfOf(r,tp===undefined?t:tp);return (x.ug+x.grev)*(1+pay/100)*pf+SPX.res}
function cum(p,r,pay,cost){let s=0;for(let t=1;t<p.length;t++)s+=revAt(p,t,r,pay)-(cost||0)*1e4*Math.max(0,posD(p[t]));return s}
function posD(x){let s=0;for(const g in x.dsum)if(x.dsum[g]>0)s+=x.dsum[g];return s}
const BASEst=()=>SPX.G.reduce((a,e)=>a+e.rev,0)+SPX.grad.rev+SPX.res;
/* 렌더링 */
const fmtN=v=>Math.round(v).toLocaleString('ko-KR');
function stRender(){if(!SPX)return;const S=SPX,o=opts(),c=cap(o),Sx=scen(o),cfg=stCfg();const T=+$('stYear').value||1;const N=S.BY+T;
  // 0. 기준 구조 표
  const maxL=Math.max(...S.G.map(e=>e.L));
  let h=`<thead><tr><th>계열</th>${Array.from({length:maxL},(_,i)=>`<th>${i+1}학년</th>`).join('')}<th>재학생 계</th><th>진급률(1→2, 2→3, 3→4…, 잔류)</th><th>1인당 연 징수(전체)</th><th>1인당 연 징수(내국인)</th><th>입학정원(편집)</th><th>신입생 충원율</th></tr></thead><tbody>`;
  for(const e of S.G){h+=`<tr><td>${e.g.replace('계열','')}</td>${Array.from({length:maxL},(_,i)=>`<td>${i<e.L?fmtN(e.h[i]):''}</td>`).join('')}<td>${fmtN(e.tot)}</td><td class="t">${e.c.map((v,i)=>`<span title="${e.fb.includes(i+1)?'대체값':'실적'}" class="${e.fb.includes(i+1)?'fb':''}">${v.toFixed(2)}</span>`).join(' · ')} / ${e.st.toFixed(2)}</td><td>${Math.round(e.uAx/1e4).toLocaleString('ko-KR')}만</td><td>${Math.round(e.uD/1e4).toLocaleString('ko-KR')}만</td><td><input type="number" class="qIn" data-g="${e.g}" value="${QUOTA[e.g]}" step="1"></td><td>${QUOTA[e.g]>0?(e.E/QUOTA[e.g]*100).toFixed(1)+'%':'-'}</td></tr>`}
  const ugRev=S.G.reduce((a,e)=>a+e.rev,0);
  const p0=stProject({...cfg,r:0,struct:false,fillDx:0,dropDx:0,elast:0,gradDecl:0,pay:0,T:0});const chk=revAt(p0,0,0,0)-BASEst();
  h+=`<tr><td><b>학부 계</b></td>${Array.from({length:maxL},(_,i)=>`<td><b>${fmtN(S.G.reduce((a,e)=>a+(e.h[i]||0),0))}</b></td>`).join('')}<td><b>${fmtN(S.G.reduce((a,e)=>a+e.tot,0))}</b></td><td></td><td colspan="2" class="t">학부 ${eok(ugRev)}억 + 대학원 ${eok(S.grad.rev)}억 + 연구등록 ${eok(S.res)}억</td><td colspan="2" class="t"><span class="pill ${Math.abs(chk)<1?'p-ok':'p-no'}">${Math.abs(chk)<1?'기준 징수액 재현 일치':'불일치 '+fmtN(chk)}</span></td></tr></tbody>`;
  $('stBase').innerHTML=h;
  $('stBaseNote').innerHTML=`기준년도 ${S.BY} · 진급률 출처: ${S.src||'2025→2026 실적'} · 회색 진급률은 표본이 적거나 비정상(0.7~1.3 밖)이라 학부 평균(1→2 ${S.avg[0].toFixed(2)}, 2→3 ${S.avg[1].toFixed(2)}, 3→4 ${S.avg[2].toFixed(2)}) 또는 1.0으로 대체. 4학년 칸은 초과학기 재학생 포함(잔류율). 의예는 의학 1~2학년, 의학은 3~6학년으로 합쳐 6년 과정으로 계산.`;
  document.querySelectorAll('.qIn').forEach(el=>el.addEventListener('change',()=>{QUOTA[el.dataset.g]=Math.max(0,+el.value||0);stRender()}));
  renderPlanTables(S);
  // 1. 대시보드
  const rates=[];for(let r=o.rMin;r<=o.rMax+1e-9;r+=o.rStep)rates.push(Math.round(r*100)/100);
  const pNo=r=>stProject({...cfg,r,struct:false});
  let d=`<thead><tr><th>인상률(%)</th><th>학부 편제정원</th><th>실제 재학생수</th><th>자연 증감</th><th>편제/정원변동 수입효과</th><th>인상률 수입효과</th><th>최종 총 징수액</th><th>전년대비 순증감</th><th>법정 한도</th></tr></thead><tbody>`;
  for(const r of rates){const P=stProject({...cfg,r}),P0=pNo(r);const TN=revAt(P,T,r,o.pay);const prev=T===1?BASEst():revAt(P,T-1,r,o.pay);
    const price=TN-revAt(P,T,r,o.pay,T-1);const sI=(revAt(P,T,r,o.pay,T-1)-revAt(P0,T,r,o.pay,T-1))-(T===1?0:(revAt(P,T-1,r,o.pay)-revAt(P0,T-1,r,o.pay)));const nat=TN-prev-price-sI;const ok=r<=c+1e-9;
    const tg=['A','B','C'].filter(k=>Math.abs(r-Sx[k])<1e-9);
    d+=`<tr class="${tg.length?'s'+tg[0]:''} ${ok?'':'over'}"><td>${r.toFixed(2)} ${tg.map(k=>`<span class="pill p-${k}">${k}</span>`).join('')}</td><td>${fmtN(P[T].seats)}</td><td>${fmtN(P[T].stu)}</td><td class="${cls(nat)}">${sg(nat)}</td><td class="${cls(sI)}">${sg(sI)}</td><td class="${cls(price)}">${sg(price)}</td><td><b>${eok(TN)}</b></td><td class="${cls(TN-prev)}"><b>${sg(TN-prev)}</b></td><td class="t"><span class="pill ${ok?'p-ok':'p-no'}">${ok?'준수':'초과'}</span></td></tr>`}
  $('stDash').innerHTML=d+'</tbody>';
  $('stDashLead').textContent=`${N}학년도(기준년도 ${S.BY} 대비 ${T}년 후) 추계 · 단위: 억원, 명 · 현재 왼쪽 정원·편제 설정과 아래 개편 계획 반영 · 인상률은 매년 같은 비율로 누적 적용`;
  // 2. 분해
  const rA=cfg.r;const P=stProject(cfg),P0=stProject({...cfg,struct:false});const TN=revAt(P,T,rA,o.pay);
  const price=TN-revAt(P,T,rA,o.pay,0);const struct=revAt(P,T,rA,o.pay,0)-revAt(P0,T,rA,o.pay,0);const nat=revAt(P0,T,rA,o.pay,0)-BASEst();
  const vol=P[T].dstu*S.uBar*(1+o.pay/100);const mix=struct-vol;
  $('stDecLead').textContent=`${N}학년도 총 징수액을 기준년도(${S.BY}) 실적 ${eok(BASEst())}억원과 비교해 가격·물량·구조 효과로 나눔 · 분석용 인상률 ${rA}%(매년)`;
  $('stKpi').innerHTML=[[`${N} 총 징수액`,eok(TN)+'억'],['가격 효과(인상률)',sg(price)+'억'],['자연 증감(진급·졸업·학령인구)',sg(nat)+'억'],['정원 물량 효과',sg(vol)+'억'],['계열 구조(Mix) 효과',sg(mix)+'억']].map(([k,v])=>`<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
  let s=`<thead><tr><th>계열</th><th>${N} 입학정원 변동</th><th>${N} 재학생 변동(개편분)</th><th>1인당 연 징수(내국인)</th><th>개편 수입효과(동결 기준)</th></tr></thead><tbody>`;let sumD=0,sumR=0;
  for(const e of S.G){const dq=seatDelta(cfg,e.g,N)+newSeats(cfg,e.g,N).q;const dh=P[T].dsum[e.g];if(Math.abs(dq)<0.01&&Math.abs(dh)<0.01)continue;const rv=dh*e.uD*(1+o.pay/100);sumD+=dh;sumR+=rv;
    s+=`<tr><td>${e.g.replace('계열','')}</td><td class="${cls(dq*1e8)}">${dq>0?'+':''}${fmtN(dq)}</td><td class="${cls(dh*1e8)}">${dh>0?'+':''}${fmtN(dh)}</td><td>${Math.round(e.uD/1e4)}만</td><td class="${cls(rv)}">${sg(rv)}</td></tr>`}
  s+=`<tr><td><b>계</b></td><td></td><td><b>${sumD>0?'+':''}${fmtN(sumD)}</b></td><td></td><td><b>${sg(sumR)}</b></td></tr></tbody>`;
  $('stSer').innerHTML=sumD||sumR?s:'<tbody><tr><td class="t">정원 감축·계열 이동·신설·폐지 설정이 없습니다. 왼쪽이나 0번 섹션에서 입력하면 계열별 영향이 표시됩니다.</td></tr></tbody>';
  const eH=S.byG[HUM],eE=S.byG[ENG],eS=S.byG[SCI];
  const fz=stProject({...cfg,r:0}),fz0=stProject({...cfg,r:0,struct:false});const fzS=revAt(fz,T,0,o.pay)-revAt(fz0,T,0,o.pay);
  const m100=stProject({...cfg,r:0,cut:0,move:100/QUOTA[HUM]*100,split:100,plan:false}),m0=stProject({...cfg,r:0,cut:0,move:0,plan:false});
  const per100=[1,2,3,4].map(t=>revAt(m100,t,0,o.pay)-revAt(m0,t,0,o.pay));
  $('stMix').innerHTML=`<p><b>가격 효과 vs 물량·구조 효과</b>: ${N}학년도 기준년도 대비 변화 ${sg(TN-BASEst())}억원 중 인상률 ${sg(price)}억원, 자연 증감 ${sg(nat)}억원, 정원 물량 ${sg(vol)}억원, 계열 구조(Mix) ${sg(mix)}억원.</p>
  <p><b>고단가 계열 증원의 동결 시 수입 개선</b>: 등록금을 동결해도 현재 개편 설정만으로 ${N}학년도 ${sg(fzS)}억원(상태 유지 대비)의 수입 변화가 생깁니다. 내국인 1인당 연 징수는 공학 ${Math.round(eE.uD/1e4)}만원, 이학 ${Math.round(eS.uD/1e4)}만원, 인문·사회 ${Math.round(eH.uD/1e4)}만원으로, 인문·사회 1명을 공학으로 옮기면 1인당 연 ${Math.round((eE.uD-eH.uD)/1e4)}만원 차익이 납니다.</p>
  <p>인문·사회 입학정원 <b>100명</b>을 공학으로 옮기면(동결 기준) 수입 개선이 1년차 ${sg(per100[0])}억 → 2년차 ${sg(per100[1])}억 → 3년차 ${sg(per100[2])}억 → 4년차 ${sg(per100[3])}억원으로 편제가 완성될수록 커집니다.</p>`;
  let tj=`<thead><tr><th>연도</th><th>학부 편제정원</th><th>학부 재학생</th><th>전체 재학생</th><th>총 징수액</th><th>전년대비</th><th>상태 유지 대비(구조 효과)</th></tr></thead><tbody><tr><td>${S.BY}(실적)</td><td>${fmtN(P[0].seats)}</td><td>${fmtN(P[0].ugStu)}</td><td>${fmtN(P[0].stu)}</td><td>${eok(BASEst())}</td><td></td><td></td></tr>`;
  for(let t=1;t<P.length;t++){const v=revAt(P,t,rA,o.pay),pv=t===1?BASEst():revAt(P,t-1,rA,o.pay);tj+=`<tr class="${t===T?'sB':''}"><td>${S.BY+t}</td><td>${fmtN(P[t].seats)}</td><td>${fmtN(P[t].ugStu)}</td><td>${fmtN(P[t].stu)}</td><td>${eok(v)}</td><td class="${cls(v-pv)}">${sg(v-pv)}</td><td class="${cls(v-revAt(P0,t,rA,o.pay))}">${sg(v-revAt(P0,t,rA,o.pay))}</td></tr>`}
  $('stTraj').innerHTML=tj+'</tbody>';
  // 3. 시나리오
  const plan=$('scPlan').checked;const cutA=+$('scA').value||0,movB=+$('scB').value||0,strC=+$('scC').value||0;
  const SQ=stProject({...cfg,r:0,struct:false});const sqCum=cum(SQ,0,o.pay);
  const defs=[
    {k:'A',t:'정원 감축 + 등록금 동결',d:'소극적 재정 대응',cfg:{...cfg,r:0,cut:cutA,move:0,plan}},
    {k:'B',t:'정원 재배치 + 소폭 인상',d:'구조개혁 중심',cfg:{...cfg,r:Sx.B,cut:0,move:movB,plan}},
    {k:'C',t:'정원 유지 + 최대 인상',d:'재정 수지 극대화 · 충원율 리스크',cfg:{...cfg,r:c,cut:0,move:0,plan},stress:{fillDx:cfg.fillDx-strC}},
    {k:'D',t:'현재 설정 조합',d:'왼쪽 패널과 0번 섹션 입력값 그대로',cfg:{...cfg}}];
  const cost=+$('optCost').value||0;
  const res=defs.map(df=>{const p=stProject(df.cfg);const r=df.cfg.r;const y1=revAt(p,1,r,o.pay);const yT=revAt(p,T,r,o.pay);const cm=cum(p,r,o.pay,cost)-sqCum;
    let st=null;if(df.stress){const ps=stProject({...df.cfg,...df.stress});st={yT:revAt(ps,T,r,o.pay),cm:cum(ps,r,o.pay,cost)-sqCum}}
    return {...df,p,r,y1,yT,cm,st}});
  const best=res.slice(0,3).reduce((a,b)=>b.cm>a.cm&&b.r<=Sx.B+1e-9?b:a,res[0]);
  $('stCards').innerHTML=res.map(x=>{const rk=risk(x.r,x.yT-BASEst(),o);const p=x.p[x.p.length-1];
    const notes={A:[`정원 ${x.cfg.cut}% 감축 → ${S.BY+4}년 학부 재학생 ${fmtN(p.ugStu)}명(상태 유지 ${fmtN(SQ[SQ.length-1].ugStu)}명)`,'동결로 학생·여론 부담은 가장 적지만 수입은 편제가 줄어드는 만큼 매년 감소','감축 정원만큼 교원·시설 비용 절감이 동반되어야 수지 균형'],
      B:[`인문·사회 입학정원 ${x.cfg.move}% 이동(공학 ${cfg.split}% · 이학 ${100-cfg.split}%) + 인상률 ${x.r.toFixed(2)}%`,'동결이어도 계열 단가 차익으로 수입 개선, 편제 완성(4년)까지 효과 확대','공학·바이오 교원 확보와 실험실습비 증가를 함께 계획해야 함'],
      C:[`법정 한도 ${pct(c)}까지 매년 인상, 정원 유지`,x.st?`충원율 ${strC}%p 추가 하락 시 4년 누적 ${sg(x.st.cm)}억원(무위험 ${sg(x.cm)}억원)`:'','한도 인상 반복은 평판·등록금심의위 부담, 학령인구 감소기에 충원율 하락 위험 확대'],
      D:['직접 입력한 신설·폐지·이동 계획 포함',`인상률 ${x.r.toFixed(2)}% · 감축 ${x.cfg.cut}% · 계열 이동 ${x.cfg.move}%`,'왼쪽 값을 바꾸면 즉시 다시 계산']}[x.k].filter(Boolean);
    return `<div class="card ${x.k==='D'?'user':''} ${x.k===best.k?'rec':''}"><h4><span class="pill p-${x.k}">${x.k}</span>${x.t}${x.k===best.k?' <span class="pill p-ok">추천</span>':''}</h4><div class="sub">${x.d}</div><div class="rate2">인상 <b>${x.r.toFixed(2)}%</b> · 감축 <b>${x.cfg.cut}%</b> · 이동 <b>${x.cfg.move}%</b></div>
    <dl><dt>${S.BY+1} 총 징수액</dt><dd>${eok(x.y1)}억</dd><dt>${S.BY+1} 기준년도 대비</dt><dd class="${cls(x.y1-BASEst())}">${sg(x.y1-BASEst())}억</dd>
    ${T>1?`<dt>${N} 총 징수액</dt><dd>${eok(x.yT)}억</dd>`:''}<dt>4년 누적(상태 유지 대비)</dt><dd class="${cls(x.cm)}"><b>${sg(x.cm)}억</b></dd>
    <dt>${S.BY+4} 학부 편제정원</dt><dd>${fmtN(p.seats)}명</dd><dt>${S.BY+4} 학부 재학생</dt><dd>${fmtN(p.ugStu)}명</dd>
    <dt>재정 리스크</dt><dd>${bars(risk(x.r,x.cm/4,o).fin)}</dd><dt>평판·충원 리스크</dt><dd>${bars(Math.min(5,rk.rep+(x.k==='C'?1:0)))}</dd></dl>
    <ul>${notes.map(n=>`<li>${n}</li>`).join('')}</ul></div>`}).join('');
  $('stScLead').textContent=`상태 유지 = 인상률 0%, 정원·편제 변동 없음(같은 학령인구·탈락 가정). 4년 누적은 ${S.BY+1}~${S.BY+4}학년도 합계 차이${cost?`, 증원 학생 1명당 연 ${cost}만원 교육비 차감`:''}. B안 인상률은 「등록금 인상률」 탭의 B안(${Sx.B.toFixed(2)}%)과 같음.`;
  // 4. 최적 조합
  const mx=+$('optMax').value||0;const rs=[];for(let r=0;r<=c+1e-9;r+=o.rStep)rs.push(Math.round(r*100)/100);if(!rs.some(r=>Math.abs(r-c)<1e-9))rs.push(c);
  const ms=[0,5,10,15,20,25,30].filter(m=>m<=Math.max(mx,0)+1e-9||m===0);const extra=[0,5,10,15,20,25,30].filter(m=>m>mx).slice(0,1);
  let bestO=null;const grid={};
  for(const r of rs)for(const m of [...ms,...extra]){const p=stProject({...cfg,r,move:m});const v=cum(p,r,o.pay,cost)-sqCum;grid[r+'|'+m]=v;const feas=r<=Sx.B+1e-9&&m<=mx;if(feas&&(!bestO||v>bestO.v))bestO={r,m,v,p}}
  let g=`<thead><tr><th>인상률 \\ 계열 이동</th>${[...ms,...extra].map(m=>`<th>${m}%${m>mx?' (상한 초과)':''}</th>`).join('')}</tr></thead><tbody>`;
  for(const r of rs){g+=`<tr><th>${r.toFixed(2)}%${r>Sx.B+1e-9?(r>c+1e-9?' 한도 초과':' 여유폭 밖'):''}</th>`+[...ms,...extra].map(m=>{const v=grid[r+'|'+m];const feas=r<=Sx.B+1e-9&&m<=mx;const isB=bestO&&bestO.r===r&&bestO.m===m;
    return `<td style="background:${isB?'var(--accent)':feas?'var(--good-soft)':'var(--bg)'};color:${isB?'var(--panel)':feas?'var(--good)':'var(--muted)'}">${sg(v)}${isB?' ★':''}</td>`}).join('')+'</tr>'}
  $('stOpt').innerHTML=g+'</tbody>';
  $('stOptLead').textContent=`4년(${S.BY+1}~${S.BY+4}) 누적 징수액의 상태 유지 대비 증감(억원) · 정원 감축 ${cfg.cut}%와 왼쪽 학령인구·탄력성 가정 고정 · 초록 = 실행 가능 영역(인상률 ≤ B안 ${Sx.B.toFixed(2)}%, 이동 ≤ ${mx}%), ★ = 최적 조합`;
  if(bestO){const pB=bestO.p,y1=revAt(pB,1,bestO.r,o.pay);const stress=stProject({...cfg,r:bestO.r,move:bestO.m,fillDx:cfg.fillDx-2,dropDx:cfg.dropDx+0.5});const sc=cum(stress,bestO.r,o.pay,cost)-sqCum;
    const pr=stProject({...cfg,r:bestO.r,move:0}),pm=stProject({...cfg,r:0,move:bestO.m});const onlyP=cum(pr,bestO.r,o.pay,cost)-sqCum,onlyM=cum(pm,0,o.pay,cost)-sqCum;
    $('stGuide').innerHTML=`<p><span class="pill p-ok">추천</span> <b>최적 조합: 매년 등록금 ${bestO.r.toFixed(2)}% 인상 + 인문·사회 입학정원 ${bestO.m}% 공학·이학 재배치${cfg.cut?` + 정원 ${cfg.cut}% 감축`:''}</b></p>
    <ol><li><b>재정 효과</b>: ${S.BY+1}학년도 총 징수 ${eok(y1)}억원(기준년도 대비 ${sg(y1-BASEst())}억원), 4년 누적 상태 유지 대비 ${sg(bestO.v)}억원.</li>
    <li><b>효과 분해</b>: 인상만 했을 때 ${sg(onlyP)}억원, 재배치만(동결) ${sg(onlyM)}억원. 수입 개선의 대부분은 가격 효과이고, 재배치 효과는 편제가 완성되는 4년차에 가장 커집니다${nat<0?'. 학령인구 감소에 따른 물량 손실을 두 효과로 함께 메워야 합니다':''}.</li>
    <li><b>법적·평판 안정성</b>: 인상률이 추정 법정 한도 ${pct(c)}보다 ${(c-bestO.r).toFixed(2)}%p 낮고, 최대 인상(C안)보다 학생·여론 부담이 작음.</li>
    <li><b>스트레스 테스트</b>: 신입생 충원율 −2%p, 중도탈락 +0.5%p가 겹쳐도 4년 누적 ${sg(sc)}억원.</li></ol>
    <p class="note">최적 조합은 4년 누적 수입이 가장 큰 실행 가능 조합입니다. 인상률과 이동 규모는 수입을 늘리는 방향이라 보통 설정한 상한(B안 인상률, 이동 가능 상한)에서 정해지므로, 상한 값 자체가 정책 판단입니다. 증원 학생 1명당 추가 교육비가 계열 단가 차익(공학 기준 연 ${Math.round((eE.uD-eH.uD)/1e4)}만원)보다 크면 이동 규모 최적점은 0으로 내려갑니다.</p>
    <p><b>리스크 요인</b></p><ol><li>공학·바이오 증원분은 교원 확보·실험실습 비용이 늘어 순수지 개선폭이 줄 수 있음(현재 추가 교육비 ${cost}만원/인·년 가정).</li><li>인문·사회 정원 축소는 학내 구성원 협의와 교육부 정원 조정 절차(학칙 개정) 일정이 필요.</li><li>학령인구 감소가 가정보다 빠르면 정원 미충원이 커져 물량 효과가 악화됨 — 신입생 충원율 변화 값을 바꿔 확인.</li><li>입학정원은 자료상 1학년 재학생으로 대신했으므로 실제 입학정원·충원율로 교체 후 재산출 필요.</li></ol>
    <p><b>이사회 상정 문안(초안)</b><br>「${S.BY+1}학년도부터 인문·사회계열 입학정원의 ${bestO.m}%를 공학·이학(바이오)계열로 단계 재배치하고, 등록금은 법정 한도(추정 ${pct(c)}) 이내인 ${bestO.r.toFixed(2)}% 인상을 원안으로 함. 이에 따른 4년 누적 징수 개선은 ${sg(bestO.v)}억원으로 추계됨.」</p>`}
  else $('stGuide').innerHTML='<p>실행 가능 영역이 없습니다. 이동 가능 상한이나 인상률 범위를 확인하세요.</p>';
}
/* 개편 계획 입력 표 */
function renderPlanTables(S){const gOpt=sel=>S.G.map(e=>`<option ${e.g===sel?'selected':''}>${e.g}</option>`).join('');const yOpt=sel=>[1,2,3,4].map(t=>`<option ${S.BY+t===sel?'selected':''}>${S.BY+t}</option>`).join('');
  $('tNew').innerHTML=NEWD.length?`<thead><tr><th>학과명</th><th>계열</th><th>입학정원</th><th>예상 충원율(%)</th><th>개설 연도</th><th></th></tr></thead><tbody>`+NEWD.map((x,i)=>`<tr><td><input data-t="n" data-i="${i}" data-f="name" value="${x.name}" class="txt"></td><td><select data-t="n" data-i="${i}" data-f="g">${gOpt(x.g)}</select></td><td><input data-t="n" data-i="${i}" data-f="q" type="number" value="${x.q}"></td><td><input data-t="n" data-i="${i}" data-f="f" type="number" value="${x.f}"></td><td><select data-t="n" data-i="${i}" data-f="y">${yOpt(x.y)}</select></td><td><button type="button" class="x" data-t="n" data-i="${i}">삭제</button></td></tr>`).join('')+'</tbody>':'<tbody><tr><td class="t sub">신설 학과가 없습니다.</td></tr></tbody>';
  const dOpt=sel=>S.depts.map((d,j)=>`<option value="${j}" ${sel===j?'selected':''}>${d[1]} · ${d[0].replace('계열','')} · ${d[2]} (1학년 ${Math.round(d[3][0])})</option>`).join('');
  $('tClose').innerHTML=CLOSED.length?`<thead><tr><th>학과(캠퍼스·계열·학과, 현 1학년)</th><th>입학정원 감축 인원</th><th>적용 연도</th><th></th></tr></thead><tbody>`+CLOSED.map((x,i)=>`<tr><td><select data-t="c" data-i="${i}" data-f="j" class="wide">${dOpt(x.j)}</select></td><td><input data-t="c" data-i="${i}" data-f="n" type="number" value="${x.n}"></td><td><select data-t="c" data-i="${i}" data-f="y">${yOpt(x.y)}</select></td><td><button type="button" class="x" data-t="c" data-i="${i}">삭제</button></td></tr>`).join('')+'</tbody>':'<tbody><tr><td class="t sub">폐지·감축 학과가 없습니다.</td></tr></tbody>';
  // 폐과 잔여 인원 스케줄
  if(CLOSED.length){const cfg=stCfg();let h=`<thead><tr><th>학과</th><th>${S.BY}(현재)</th>${[1,2,3,4,5,6].map(t=>`<th>${S.BY+t}</th>`).join('')}</tr></thead><tbody>`;
    for(const x of CLOSED){const d=S.depts[x.j];if(!d)continue;const e=S.byG[d[0]];let H=d[3].slice();const E0=H[0];const fill=QUOTA[e.g]>0?e.E/QUOTA[e.g]:1;const row=[H.reduce((a,b)=>a+b,0)];
      for(let t=1;t<=6;t++){const N=S.BY+t;const ent=Math.max(0,E0-(N>=x.y?x.n*fill:0));const nH=Array(e.L).fill(0);nH[0]=ent;for(let k=1;k<e.L;k++)nH[k]=e.c[k-1]*H[k-1];if(e.L>1)nH[e.L-1]+=e.st*H[e.L-1];H=nH;row.push(H.reduce((a,b)=>a+b,0))}
      h+=`<tr><td>${d[2]} (${d[1]})</td>${row.map(v=>`<td>${fmtN(v)}</td>`).join('')}</tr>`}
    $('tCloseSch').innerHTML=h+'</tbody>'}else $('tCloseSch').innerHTML='';
  $('tMove').innerHTML=MOVES.length?`<thead><tr><th>감원 계열</th><th>증원 계열</th><th>이동 인원(입학정원)</th><th>적용 연도</th><th></th></tr></thead><tbody>`+MOVES.map((x,i)=>`<tr><td><select data-t="m" data-i="${i}" data-f="from">${gOpt(x.from)}</select></td><td><select data-t="m" data-i="${i}" data-f="to">${gOpt(x.to)}</select></td><td><input data-t="m" data-i="${i}" data-f="n" type="number" value="${x.n}"></td><td><select data-t="m" data-i="${i}" data-f="y">${yOpt(x.y)}</select></td><td><button type="button" class="x" data-t="m" data-i="${i}">삭제</button></td></tr>`).join('')+'</tbody>':'<tbody><tr><td class="t sub">직접 입력한 정원 이동이 없습니다. (왼쪽 「계열 이동 비율」과 별도로 합산)</td></tr></tbody>';
  document.querySelectorAll('#tNew [data-f],#tClose [data-f],#tMove [data-f]').forEach(el=>el.addEventListener('change',()=>{const L={n:NEWD,c:CLOSED,m:MOVES}[el.dataset.t];const x=L[+el.dataset.i];const f=el.dataset.f;let v=el.value;
    if(['q','f','n','y','j'].includes(f))v=+v;x[f]=v;if(el.dataset.t==='c'&&f==='j'){const d=S.depts[v];x.g=d[0];x.d=d[2];x.c=d[1];x.n=Math.round(d[3][0])}stRender()}));
  document.querySelectorAll('#tNew .x,#tClose .x,#tMove .x').forEach(b=>b.addEventListener('click',()=>{({n:NEWD,c:CLOSED,m:MOVES})[b.dataset.t].splice(+b.dataset.i,1);stRender()}));
}
function stInitControls(){const S=SPX;$('stYear').innerHTML=[1,2,3,4].map(t=>`<option value="${t}">${S.BY+t}학년도 (${t}년 후)</option>`).join('');
  $('stStart').innerHTML=[1,2,3,4].map(t=>`<option value="${S.BY+t}">${S.BY+t}학년도</option>`).join('');
  const o=opts();$('stRate').value=scen(o).B}
$('addNew').addEventListener('click',()=>{NEWD.push({name:'AI융합학과(예시)',g:ENG,q:40,f:100,y:SPX.BY+1});stRender()});
$('addClose').addEventListener('click',()=>{const j=SPX.depts.findIndex(d=>d[0]===HUM);const d=SPX.depts[j>=0?j:0];CLOSED.push({j:j>=0?j:0,g:d[0],d:d[2],c:d[1],n:Math.round(d[3][0]),y:SPX.BY+1});stRender()});
$('addMove').addEventListener('click',()=>{MOVES.push({from:HUM,to:ENG,n:50,y:SPX.BY+1});stRender()});
document.querySelectorAll('#tab2 aside input,#tab2 aside select').forEach(el=>el.addEventListener('input',stRender));
document.querySelectorAll('.navtab').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.tab;document.querySelectorAll('.navtab').forEach(x=>x.setAttribute('aria-selected',x===b));
  $('tab1').hidden=t!=='1';$('tab2').hidden=t!=='2';if(t==='2')stRender();else{syncLinkUI();render()}try{localStorage.setItem('simTab',t)}catch(e){}}));
stInitControls();
try{if(localStorage.getItem('simTab')==='2')document.querySelector('.navtab[data-tab="2"]').click()}catch(e){}
/* ===== 등록금 인상률 탭 연동 ===== */
const LMEMO=new Map();
function scopeShares(o){let uA=0,uT=0,gA=0,gT=0;for(const [c,p,s,nw,n,u,a] of SEG){const ap=o.scope[p]&&(nw==='내국인'||o.foreign);if(p==='학부'){uT+=a;if(ap)uA+=a}else{gT+=a;if(ap)gA+=a}}return {sU:uT?uA/uT:0,sG:gT?gA/gT:0}}
function linkedProject(r,o,fd,py){const key=r.toFixed(4);let x=LMEMO.get(key);
  if(!x){const p=stProject({...stCfg(),r,pay:0,T:1});x={ug:p[1].ug,gr:p[1].grev};LMEMO.set(key,x)}
  const sh=scopeShares(o);const vf=(o.fill-fd)/o.fill;
  return (x.ug*(1+r/100*sh.sU)+x.gr*(1+r/100*sh.sG))*vf*(1+py/100)+SPX.res}
function linkInfo(){const c=stCfg();const parts=[];if(c.cut)parts.push(`정원 감축 ${c.cut}%`);if(c.move)parts.push(`인문·사회 ${c.move}% 이동`);if(NEWD.length)parts.push(`신설 ${NEWD.length}건`);if(CLOSED.length)parts.push(`폐지·감축 ${CLOSED.length}건`);if(MOVES.length)parts.push(`정원 이동 ${MOVES.length}건`);
  if(c.fillDx)parts.push(`신입생 충원율 ${c.fillDx>0?'+':''}${c.fillDx}%p`);if(c.dropDx)parts.push(`중도탈락 +${c.dropDx}%p`);if(c.elast)parts.push(`인상 탄력성 ${c.elast}%p`);if(c.gradDecl)parts.push(`대학원 감소 ${c.gradDecl}%`);
  return parts.length?parts.join(' · '):'정원·편제 변동 없음(학년별 진급 추계만 반영)'}
function syncLinkUI(){const on=$('linkST').checked;$('decline').disabled=on;$('declineWrap').style.opacity=on?0.5:1;
  $('declineSmall').textContent=on?'연동 중: 편제 탭의 학년별 추계가 대신 적용됨':'인구변동 반영 · 가정치';
  const ld=document.querySelector('#s1 .lead');if(ld)ld.textContent=on?`정원·편제 연동 중 · 예상 총 징수액 = Σ(계열별 학년별 재학생 추계 × 1인당 징수액 × (1+인상률)) + 대학원 + 연구등록금, 학년별 재학생 = 입학정원 × 충원율 + 전년도 재학생 × 진급률 · 순재정 수지 변화 = 총 징수 − 기준년도 징수 − 국장 Ⅱ유형 손실 − 법정 필수 증액분`:'예상 총 징수액 = Σ(계열별 단가 × (1+인상률) × 예상 재학생 수 × 예상 납부율) + 연구등록금 · 순재정 수지 변화 = 총 징수 − 기준년도 징수 − 국장 Ⅱ유형 손실 − 법정 필수 증액분';
  $('linkNote').innerHTML=on?`${SPX.BY+1}학년도 재학생·정원은 편제 탭 추계를 사용합니다. 현재: ${linkInfo()}`:'꺼져 있음: 기준년도 실적 × 재학생 감소율로 단순 추계'}
$('linkST').addEventListener('change',()=>{syncLinkUI();render()});
window.__stReady=true;
