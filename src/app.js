const $=id=>document.getElementById(id);
const PROCS=['학부','일반대학원','전문대학원','특수대학원'];
let SEG=SEGS,RES=RESEARCH,BY=EMB_META?EMB_META.y:new Date().getFullYear(),BASE=0,UG_AVG=0,SRC=EMB_META?EMB_META.src:'기준 데이터 없음',PREV_UP=EMB_META?EMB_META.prev:null;
const CPI={2022:5.1,2023:3.6,2024:2.3,2025:2.1,2026:2.6}; // 통계청 연간 소비자물가 상승률(2026은 추정치)
let lastBY=null;
function setData(segs,res,by,src,prevUp){if(by!==lastBY){lastBY=by;[by-2,by-1,by].forEach((y,i)=>{const el=document.getElementById('cpi'+(i+1));if(el&&CPI[y]!==undefined)el.value=CPI[y]})}SEG=segs;RES=res;BY=by;SRC=src;PREV_UP=prevUp;
  BASE=SEG.reduce((s,x)=>s+x[6],0)+RES;
  const UG=SEG.filter(x=>x[1]==='학부'&&x[3]==='내국인');const un=UG.reduce((s,x)=>s+x[4],0);
  UG_AVG=un?2*UG.reduce((s,x)=>s+x[6],0)/un:0;}
setData(SEGS,RESEARCH,BY,SRC,PREV_UP);
const eok=v=>(v/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1});
const sg=v=>(v>0?'+':'')+eok(v);
const cls=v=>v<-0.5e7?'neg':(v>0.5e7?'pos':'');
const pct=v=>(Math.round(v*100)/100).toFixed(2).replace(/\.?0+$/,'')+'%';
function opts(){
  const n=id=>parseFloat($(id).value)||0;
  const scope={};PROCS.forEach(p=>scope[p]=$('sc'+p).checked);
  return {rMin:n('rMin'),rMax:n('rMax'),rStep:Math.max(0.1,n('rStep')),cpi:[n('cpi1'),n('cpi2'),n('cpi3')],mult:n('mult'),
    scope,foreign:$('scForeign').checked,link:!!($('linkST')&&$('linkST').checked),decline:n('decline'),fill:n('fill')||100,fillDrop:n('fillDrop'),pay:n('pay'),
    nssBase:$('nssBase').value,nssExist:$('nssExist').value,nssAmt:n('nssAmt'),mand:n('mand'),buffer:n('buffer')};
}
function cap(o){return Math.round(o.mult*(o.cpi[0]+o.cpi[1]+o.cpi[2])/3*100)/100}
function project(r,o,fillDrop=o.fillDrop,pay=o.pay){
  const f=(1-o.decline/100)*((o.fill-fillDrop)/o.fill);
  let P=RES;
  for(const [c,p,s,nw,n,u,a] of SEG){
    const k=a/(u*n); const apply=o.scope[p]&&(nw==='내국인'||o.foreign);
    P+=u*(1+(apply?r/100:0))*n*f*(k+pay/100);
  }
  return P;
}
function nss(r,o){
  if(o.nssExist!=='keep')return 0; const A=o.nssAmt*1e8;
  if(o.nssBase==='recv')return r>0?A:0;
  return r<=0?-A:0;
}
function calc(r,o,fd,py){fd=fd===undefined?o.fillDrop:fd;py=py===undefined?o.pay:py;const P=(o.link&&window.__stReady)?linkedProject(r,o,fd,py):project(r,o,fd,py);const d=P-BASE;const l=nss(r,o);const m=o.mand*1e8;return {r,P,d,l,m,net:d-l-m}}
function scen(o){
  const c=cap(o);const latest=o.cpi[2];
  let b=Math.floor((Math.min(c-o.buffer,latest)+1e-9)/o.rStep)*o.rStep;b=Math.round(b*100)/100;
  if(b<=0)b=Math.min(o.rStep,c);
  return {A:0,B:b,C:c};
}
function risk(r,net,o){
  const c=cap(o);
  const rep=r<=0?1:r<c*0.6?2:r<c-0.25?3:r<c-0.005?4:5;
  const p=net/BASE*100;
  const fin=p<-1?5:p<0?4:p<0.5?3:p<1.5?2:1;
  return {rep,fin};
}
const bars=n=>'<span class="risk">'+[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')+'</span>';
let sel='B';
function render(){if(window.__stReady)LMEMO.clear();
  const nd=!SEG.length;document.body.classList.toggle('nodata',nd);if(nd){$('baseLine').textContent='기준 데이터 없음 · RAW 파일을 올려 주세요';$('cpiY1').textContent=BY-2;$('cpiY2').textContent=BY-1;$('cpiY3').textContent=BY;$('capOut').textContent=pct(cap(opts()));return}
  const o=opts();const c=cap(o);const S=scen(o);S.D=Math.round((parseFloat($('rD').value)||0)*100)/100;
  $('capOut').textContent=pct(c);if(window.__stReady)syncLinkUI();
  $('baseLine').textContent=`${BY}학년도 징수액 ${eok(BASE)}억원 · 학부 내국인 1인당 연간 등록금 ${Math.round(UG_AVG/1e4).toLocaleString('ko-KR')}만원`;
  $('h1').textContent=`${BY+1}학년도 등록금·정원 재정 시뮬레이터`;document.title='등록금·정원 재정 시뮬레이터';
  $('subLine').textContent=`기준: ${BY}학년도 실제 징수액 · 단위: 억원 · 기획처 예산팀`;
  $('cpiY1').textContent=BY-2;$('cpiY2').textContent=BY-1;$('cpiY3').textContent=BY;
  $('nssHint').textContent=PREV_UP===null?'전년도 자료 없음 · 직접 선택':`${BY}학년도 단가 전년 대비 ${PREV_UP>=0?'+':''}${PREV_UP.toFixed(2)}% → ${PREV_UP>0.005?'인상(미수혜)':'동결·인하(수혜 가능)'}`;
  // grid
  let rates=[];for(let r=o.rMin;r<=o.rMax+1e-9;r+=o.rStep)rates.push(Math.round(r*100)/100);
  [S.A,S.B,S.C,S.D].forEach(x=>{if(!rates.some(y=>Math.abs(y-x)<1e-9))rates.push(x)});
  rates.sort((a,b)=>a-b);
  const rows=rates.map(r=>calc(r,o));
  const tags=r=>['A','B','C','D'].filter(k=>Math.abs(r-S[k])<1e-9);
  $('dash').querySelector('tbody').innerHTML=rows.map(x=>{const tg=tags(x.r);const t=tg[0]||'';const ok=x.r<=c+1e-9;
    return `<tr class="${t?'s'+t:''} ${ok?'':'over'}"><td>${x.r.toFixed(2)}</td><td>${eok(x.P)}</td><td class="${cls(x.d)}">${sg(x.d)}</td><td class="${cls(-x.l)}">${x.l?sg(-x.l):'0.0'}</td><td>${x.m?sg(-x.m):'0.0'}</td><td class="${cls(x.net)}"><b>${sg(x.net)}</b></td><td class="t"><span class="pill ${ok?'p-ok':'p-no'}">${ok?'준수':'초과'}</span></td><td class="t">${tg.map(k=>`<span class="pill p-${k}">${k}</span>`).join(' ')}</td></tr>`}).join('');
  const sv={A:calc(S.A,o),B:calc(S.B,o),C:calc(S.C,o),D:calc(S.D,o)};
  const per1=o.scope['학부']?UG_AVG/100:0;
  $('kpis').innerHTML=[
    [`기준년도(${BY}) 징수액`,eok(BASE)+'억'],
    ['추정 법정 한도',pct(c)],
    ['인상률 1%p당 징수 효과',sg(calc(1,o).P-calc(0,o).P)+'억'],
    ['동결 시 순재정 수지',sg(sv.A.net)+'억'],
    ['추천(B '+pct(S.B)+') 순재정 수지',sg(sv.B.net)+'억']
  ].map(([k,v])=>`<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
  drawChart(rows.filter(x=>Math.abs(((x.r-o.rMin)/o.rStep)-Math.round((x.r-o.rMin)/o.rStep))<1e-6),c,S);
  // cards
  const meta={
    A:{t:'시나리오 A · 동결',d:'학생 부담 완화 및 정부 지원금 확보',pts:[
      o.nssExist==='keep'?(o.nssBase==='recv'?'Ⅱ유형 수혜 유지(인상 시 상실분 방어)':`Ⅱ유형 재참여로 ${o.nssAmt}억원 확보 가정`):'Ⅱ유형 폐지 가정 → 동결해도 확보할 정부 지원금 없음',
      `재학생 감소분이 그대로 수입 감소로 이어짐`,`${PREV_UP>0.005?'연속 인상 부담 해소, ':''}학생·여론 리스크 최소`]},
    B:{t:'시나리오 B · 적정 인상',d:'법정 한도 내 재정 수지 개선 · 최적 지점',pts:[
      `최적 지점 = min(법정 한도 ${pct(c)} − 여유폭 ${o.buffer}%p, 최근 CPI ${o.cpi[2]}%)을 ${o.rStep}%p 단위로 내림`,
      '물가상승률 이하 인상 → 실질 등록금 동결 수준 논리 확보','12월 한도 공고치가 추정보다 낮아도 한도 내 유지 여지']},
    C:{t:'시나리오 C · 법정 최대',d:'법정 최대 한도 적용 · 평판 리스크 평가',pts:[
      `B안 대비 추가 수입 ${sg(sv.C.P-sv.B.P)}억원에 그침`,'한도를 꽉 채운 인상은 등록금심의위원회·언론·평가 지표에서 부정적 신호',
      '한도 공고치가 추정보다 낮으면 재심의 필요']}
  };
  $('cards').innerHTML=['A','B','C'].map(k=>{const x=sv[k];const rk=risk(x.r,x.net,o);const rec=k===recommend(sv,o);
    return `<div class="card ${rec?'rec':''}"><h4><span class="pill p-${k}">${k}</span>${meta[k].t}${rec?' <span class="pill p-ok">추천</span>':''}</h4>
    <div class="sub">${meta[k].d}</div><div class="rate">${x.r.toFixed(2)}%</div>
    <dl><dt>총 징수 예상액</dt><dd>${eok(x.P)}억</dd><dt>기준 대비 증감</dt><dd class="${cls(x.d)}">${sg(x.d)}억</dd>
    <dt>국장 Ⅱ유형 영향</dt><dd class="${cls(-x.l)}">${x.l?sg(-x.l):'0.0'}억</dd><dt>최종 순재정 수지</dt><dd class="${cls(x.net)}"><b>${sg(x.net)}억</b></dd>
    <dt>학부생 1인당 연 부담 증가</dt><dd>${Math.round(per1*x.r/1e3)/10}만원</dd>
    <dt>재정 리스크</dt><dd>${bars(rk.fin)}</dd><dt>평판·학생 리스크</dt><dd>${bars(rk.rep)}</dd></dl>
    <ul>${meta[k].pts.map(p=>`<li>${p}</li>`).join('')}</ul></div>`}).join('')+userCard(sv,o,c,S,per1);
  // matrix
  const r=S[sel];const pays=[0.5,0,-0.5,-1,-2];const drops=[0,1,2,3];
  let h='<thead><tr><th>충원율 하락 \\ 납부율 변동</th>'+pays.map(p=>`<th>${p>0?'+':''}${p}%p</th>`).join('')+'</tr></thead><tbody>';
  for(const fd of drops){h+=`<tr><th>${fd===0?'변동 없음':'−'+fd+'%p'}</th>`+pays.map(p=>{const v=calc(r,o,o.fillDrop+fd,o.pay+p).net;const q=v/BASE*100;
    const bg=q>=0?'var(--good-soft)':q>=-1?'var(--warn-soft)':'var(--bad-soft)';const fg=q>=0?'var(--good)':q>=-1?'var(--warn)':'var(--bad)';
    return `<td style="background:${bg};color:${fg}">${sg(v)}</td>`}).join('')+'</tr>'}
  $('mx').innerHTML=h+'</tbody>';
  const worst=calc(r,o,o.fillDrop+3,o.pay-2).net;
  const be=breakEven(o,3,-1);
  $('mxNote').innerHTML=`시나리오 ${sel}(${r.toFixed(2)}%) 최악 조합(충원율 −3%p·납부율 −2%p): <b>${sg(worst)}억원</b>. 충원율 −3%p·납부율 −1%p를 동시에 맞을 때 순수지를 0 이상으로 지키려면 인상률 <b>${be===null?'법정 한도 내 불가':be.toFixed(2)+'%'}</b> 이상 필요. 초록 ≥ 0, 노랑 = 기준 징수액의 0~−1%, 빨강 = −1% 미만.`;
  guide(sv,o,c,S);
  if(typeof stRender==='function'&&!$('tab2').hidden)stRender();
}
function minBalanced(o){const c=cap(o);for(let r=-10;r<=c+1e-9;r+=0.01){if(calc(r,o).net>=-1e-6)return Math.round(r*100)/100}return null}
function userEval(sv,o,c,S,per1){
  const x=sv.D,r=x.r,cpi=o.cpi[2];const bal=minBalanced(o);const stress=calc(r,o,o.fillDrop+2,o.pay-1).net;
  let type,tone='p-D';
  if(r>c+1e-9){type='법정 한도 초과 · 시행 불가';tone='p-no'}else if(r<0)type='인하형';else if(r===0)type='동결형';else if(r<=cpi)type='물가 이하 인상형';else type='물가 초과 · 한도 내 인상형';
  const dB=x.P-sv.B.P,burden=Math.round(per1*r/1e3)/10,burB=Math.round(per1*(r-S.B)/1e3)/10;
  let head;
  if(r>c+1e-9)head=`법정 한도 ${pct(c)} 이하로 낮춰 다시 검토하세요.`;
  else if(x.net<0)head=bal===null?'법정 한도 안에서는 수지 균형이 어렵습니다. 지출 구조조정 계획과 함께 상정하세요.':`순수지 적자입니다. 지출 절감 계획을 함께 내거나 인상률을 ${bal.toFixed(2)}% 이상으로 올려 검토하세요.`;
  else if(r<=cpi)head=`상정 가능한 대안입니다. B안(${S.B.toFixed(2)}%)과 함께 복수안으로 제시하기 좋습니다.`;
  else head='물가보다 높은 인상이므로 교내장학 환원 등 학생 부담 완화책을 묶어 상정하세요.';
  const pts=[`B안 대비 수입 ${sg(dB)}억원, 학부생 1인당 연 부담 ${burB>0?'+':''}${burB}만원`,
    x.net>=0?`기준년도 대비 순수지 흑자 ${sg(x.net)}억원 유지`:`기준년도 대비 순수지 ${sg(x.net)}억원 적자 · 현재 가정에서 수지 균형 최소 인상률 ${bal===null?'한도 내 없음':bal.toFixed(2)+'%'}`,
    `충원율 −2%p·납부율 −1%p 동시 발생 시 ${sg(stress)}억원${stress<0?' → 예비비 확보나 단계적 인상 검토':' → 완충 여력 있음'}`];
  if(r>cpi&&r<=c+1e-9)pts.push(`최근 물가상승률 ${cpi}%보다 ${(r-cpi).toFixed(2)}%p 높음 → 등록금심의위원회 설득 논리 보강 필요`);
  if(r<=0)pts.push(o.nssExist==='keep'?(o.nssBase==='none'?`Ⅱ유형 재참여 시 ${o.nssAmt}억원 확보 가정 반영`:'Ⅱ유형 수혜 유지'):'Ⅱ유형 폐지 가정이라 동결·인하에 따른 정부 보전 없음');
  return {type,tone,head,pts,burden};
}
function userCard(sv,o,c,S,per1){const x=sv.D;const e=userEval(sv,o,c,S,per1);const rk=risk(x.r,x.net,o);
  return `<div class="card user"><h4><span class="pill p-D">D</span>시나리오 D · 직접 입력 <span class="pill ${e.tone}">${e.type}</span></h4>
  <div class="sub">위 입력칸에 넣은 인상률로 계산한 사용자 시나리오</div><div class="rate">${x.r.toFixed(2)}%</div>
  <dl><dt>총 징수 예상액</dt><dd>${eok(x.P)}억</dd><dt>기준 대비 증감</dt><dd class="${cls(x.d)}">${sg(x.d)}억</dd>
  <dt>국장 Ⅱ유형 영향</dt><dd class="${cls(-x.l)}">${x.l?sg(-x.l):'0.0'}억</dd><dt>최종 순재정 수지</dt><dd class="${cls(x.net)}"><b>${sg(x.net)}억</b></dd>
  <dt>학부생 1인당 연 부담 증가</dt><dd>${e.burden}만원</dd><dt>법정 한도</dt><dd><span class="pill ${x.r<=c+1e-9?'p-ok':'p-no'}">${x.r<=c+1e-9?'준수':'초과'}</span></dd>
  <dt>재정 리스크</dt><dd>${bars(rk.fin)}</dd><dt>평판·학생 리스크</dt><dd>${bars(rk.rep)}</dd></dl>
  <p class="prop"><b>제안</b> ${e.head}</p>
  <ul>${e.pts.map(p=>`<li>${p}</li>`).join('')}</ul></div>`}
function breakEven(o,fd,py){const c=cap(o);for(let r=0;r<=c+1e-9;r+=0.01){if(calc(r,o,o.fillDrop+fd,o.pay+py).net>=0)return r}return null}
function recommend(sv,o){return (o.nssExist==='keep'&&o.nssBase==='none'&&sv.A.net>=sv.B.net)?'A':'B'}
function guide(sv,o,c,S){
  const k=recommend(sv,o);const x=sv[k];const per=Math.round(UG_AVG/100*x.r/1e3)/10;
  const lines=k==='B'?[
    `<b>재정 효과</b>: 인상률 ${x.r.toFixed(2)}% 적용 시 총 징수 ${eok(x.P)}억원, 기준년도 대비 순재정 수지 ${sg(x.net)}억원. 동결(${sg(sv.A.net)}억원) 대비 ${sg(x.net-sv.A.net)}억원 개선.`,
    `<b>법적 안정성</b>: 추정 한도 ${pct(c)}보다 ${(c-x.r).toFixed(2)}%p 낮아 12월 교육부 공고치가 추정보다 다소 낮아도 재심의 위험이 작음.`,
    `<b>학생 부담 논리</b>: 최근 물가상승률(${o.cpi[2]}%) 이하 인상으로 실질 등록금은 동결 수준. 학부생 1인당 연간 약 ${per}만원 증가.`,
    `<b>정부 지원 연계</b>: ${o.nssExist==='keep'?(o.nssBase==='recv'?`인상 시 Ⅱ유형 ${o.nssAmt}억원 상실을 반영한 결과임.`:`기준년도(${BY})에 이미 Ⅱ유형 미수혜 상태이므로 인상에 따른 추가 손실 없음.`):'Ⅱ유형 폐지 가정이라 동결로 얻을 정부 지원금이 사실상 없음(존속 시 왼쪽 패널에서 재계산).'}`,
    `<b>최대 인상(C) 대비</b>: 추가 수입은 ${sg(sv.C.P-x.P)}억원에 불과한 반면 한도에 근접한 인상에 따른 평판·학생 반발 리스크가 큼.`]
   :[`<b>재정 효과</b>: Ⅱ유형 ${o.nssAmt}억원 확보를 반영하면 동결 순재정 수지 ${sg(sv.A.net)}억원이 B안(${sg(sv.B.net)}억원) 이상.`,
     `<b>학생 부담</b>: 학생 부담 동결, 대외 평판 리스크 최소.`,`<b>전제 조건</b>: Ⅱ유형 존속과 지원액 ${o.nssAmt}억원 배정이 확정될 때만 유효.`];
  $('guide').innerHTML=`<p><span class="pill p-${k}">${k}</span> <b>추천: 시나리오 ${k} — ${BY+1}학년도 등록금 ${x.r.toFixed(2)}% ${x.r>0?'인상':'동결'}</b></p>
  <ol>${lines.map(l=>`<li>${l}</li>`).join('')}</ol>
  <p><b>이사회·대학평의원회 상정 문안(초안)</b><br>「${BY+1}학년도 등록금은 법정 인상 한도(추정 ${pct(c)}) 이내인 ${x.r.toFixed(2)}% ${x.r>0?'인상':'동결'}을 원안으로 하며, 이에 따른 순재정 수지 변화는 ${sg(x.net)}억원으로 추계됨. 교육부 한도 공고 및 등록금심의위원회 심의 결과에 따라 조정함.」</p>
  <p><b>상정 전 확인 사항</b></p>
  <ol><li>12월 교육부 법정 한도 공고치로 CPI 입력값 교체 후 재계산</li><li>국가장학금 Ⅱ유형 ${BY+1}년 운영 여부와 배정액 확인</li><li>교원 처우개선 등 법정 필수 증액분 확정액 입력</li><li>편제정원·충원율 실제 값과 학과별 재학생 전망 반영</li><li>등록금심의위원회 일정과 학생위원 협의 계획, 인상분의 교내장학 환원 규모 검토</li></ol>
  ${(()=>{const d=sv.D,e=userEval(sv,o,c,S,o.scope['학부']?UG_AVG/100:0);return `<p><span class="pill p-D">D</span> <b>직접 입력안(${d.r.toFixed(2)}%) 비교</b>: 추천안 대비 수입 ${sg(d.P-x.P)}억원, 순재정 수지 ${sg(d.net)}억원(${e.type}). ${e.head}</p>`})()}
  <p class="note">본 추계는 ${BY}학년도 징수 실적을 계열·과정·내외국인 ${SEG.length}개 단위로 나눠 같은 비율로 외삽한 것이며, 신입생 정원 조정·학사구조 개편·외국인 유학생 정책 변화는 반영하지 않았습니다.</p>`;
}
function drawChart(rows,c,S){
  const W=Math.max(520,Math.round(($('chart').clientWidth||760))),H=Math.round(Math.min(320,Math.max(230,W*0.2))),L=56,R=12,T=14,B=34;const vals=rows.map(x=>x.net/1e8);
  const mx=Math.max(1,...vals),mn=Math.min(0,...vals);const y=v=>T+(mx-v)/(mx-mn)*(H-T-B);
  const bw=(W-L-R)/rows.length;const x0=i=>L+i*bw;
  const step=niceStep((mx-mn)/4);let g='';
  for(let v=Math.ceil(mn/step)*step;v<=mx+1e-9;v+=step){g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${Math.round(v).toLocaleString('ko-KR')}</text>`}
  const bars=rows.map((x,i)=>{const v=x.net/1e8;const top=y(Math.max(v,0)),hh=Math.abs(y(v)-y(0));const over=x.r>c+1e-9;
    const col=over?'var(--line)':v>=0?'var(--accent)':'var(--bad)';
    return `<rect x="${x0(i)+bw*0.18}" y="${top}" width="${bw*0.64}" height="${Math.max(hh,1)}" fill="${col}"><title>${x.r}%: ${sg(x.net)}억</title></rect><text x="${x0(i)+bw/2}" y="${H-B+16}" text-anchor="middle">${x.r}</text>`}).join('');
  const rIdx=v=>rows.findIndex(x=>x.r>=v-1e-9);let cl='';
  const ci=rows.findIndex(x=>x.r>c+1e-9);if(ci>0){const cx=x0(ci);cl=`<line x1="${cx}" x2="${cx}" y1="${T}" y2="${H-B}" stroke="var(--bad)" stroke-dasharray="4 3"/><text x="${cx+4}" y="${T+10}" style="fill:var(--bad)">법정 한도 ${pct(c)}</text>`}
  $('chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;max-width:none" role="img" aria-label="인상률별 최종 순재정 수지 변화(억원)">${g}<line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)"/>${bars}${cl}<text x="${L}" y="${H-4}">인상률(%) · 막대 = 최종 순재정 수지 변화(억원), 회색 = 한도 초과</text></svg>`;
}
function niceStep(s){const p=Math.pow(10,Math.floor(Math.log10(s)));const m=s/p;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*p}
document.querySelectorAll('aside input,aside select,#rD').forEach(el=>el.addEventListener('input',render));
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{sel=b.dataset.s;document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-pressed',x===b));render()}));

/* ---------- 기준 데이터 업로드 ---------- */
const REQ=['연도','학기','대학(원)구분','계열명','rc캠퍼스','외국인구분','연구등록구분','등록구분','수업료','합계'];
const STORE={}; // key "연도|학기" -> {rows,file}
let LOADED=[];
const num=v=>{if(v===null||v===undefined||v==='')return 0;if(typeof v==='number')return v;const x=Number(String(v).replace(/[,\s원]/g,''));return isNaN(x)?0:x};
const str=v=>v===null||v===undefined?'':String(v).trim();
function status(msg,kind){const s=$('upStatus');s.className='status'+(kind?' '+kind:'');s.innerHTML=msg}
function parseCSV(t){const out=[];let row=[],cur='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
  else if(ch==='"')q=true;else if(ch===','){row.push(cur);cur=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;row.push(cur);out.push(row);row=[];cur=''}else cur+=ch}
  if(cur!==''||row.length){row.push(cur);out.push(row)}return out}
function pickTable(aoa){for(let i=0;i<Math.min(15,aoa.length);i++){const h=(aoa[i]||[]).map(str);if(REQ.every(c=>h.includes(c)))return {hi:i,h}}return null}
function ingest(aoa,fname,sheet){const t=pickTable(aoa);if(!t)return 0;const idx={};REQ.forEach(c=>idx[c]=t.h.indexOf(c));let k=0;const local={};const oi={};['학년','학번','학과전공명'].forEach(c=>oi[c]=t.h.indexOf(c));const OPT=(r,c)=>oi[c]>=0?str(r[oi[c]]):'';
  for(let i=t.hi+1;i<aoa.length;i++){const r=aoa[i];if(!r)continue;const y=str(r[idx['연도']]).replace(/\.0$/,''),s=str(r[idx['학기']]);if(!/^\d{4}$/.test(y)||!s)continue;
    const key=y+'|'+s;(local[key]=local[key]||[]).push([str(r[idx['rc캠퍼스']]),str(r[idx['대학(원)구분']]),str(r[idx['계열명']]),str(r[idx['외국인구분']]),str(r[idx['연구등록구분']]),str(r[idx['등록구분']]),num(r[idx['수업료']]),num(r[idx['합계']]),OPT(r,'학년'),OPT(r,'학번'),OPT(r,'학과전공명')]);k++}
  const over=[];for(const key in local){if(STORE[key])over.push(key.replace('|',' '));STORE[key]={rows:local[key],file:fname+(sheet?' ['+sheet+']':'')}}
  return {k,over}}
async function readFile(f){
  if(/\.csv$/i.test(f.name)){let txt=await f.text();if(txt.charCodeAt(0)===0xFEFF)txt=txt.slice(1);return [[parseCSV(txt),'']]}
  if(typeof XLSX==='undefined')throw new Error('엑셀 읽기 모듈을 불러오지 못했습니다. 인터넷에 연결한 뒤 파일을 다시 열거나, 엑셀에서 RAW 시트를 CSV(UTF-8)로 저장해 올려 주세요.');
  const wb=XLSX.read(await f.arrayBuffer(),{type:'array',dense:true});const res=[];
  for(const n of wb.SheetNames){const ws=wb.Sheets[n];const head=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,range:0,blankrows:false}).slice(0,15);
    if(!pickTable(head))continue;res.push([XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,blankrows:false}),n])}
  return res}
$('file').addEventListener('change',async e=>{const files=[...e.target.files];if(!files.length)return;
  status(`${files.length}개 파일을 읽는 중입니다… (큰 파일은 수십 초 걸릴 수 있음)`);
  const msgs=[];let bad=[];
  for(const f of files){try{const tabs=await readFile(f);let tot=0,ov=[];for(const [aoa,sh] of tabs){const r=ingest(aoa,f.name,sh);if(r){tot+=r.k;ov=ov.concat(r.over)}}
      if(!tot)bad.push(`${f.name}: 필수 열(${REQ.join(', ')})이 있는 시트를 찾지 못함`);else{msgs.push(`${f.name}: ${tot.toLocaleString('ko-KR')}행`);if(ov.length)msgs.push(`↳ ${ov.join(', ')}은(는) 이 파일 자료로 교체`)}}
    catch(err){bad.push(`${f.name}: ${err.message}`)}}
  e.target.value='';
  const years=[...new Set(Object.keys(STORE).map(k=>+k.split('|')[0]))].sort((a,b)=>b-a);
  if(!years.length){status(bad.join('<br>')||'읽을 수 있는 자료가 없습니다.','err');return}
  $('yearSel').innerHTML=years.map(y=>`<option value="${y}">${y}학년도</option>`).join('');
  buildFromStore(years[0]);
  status(msgs.join('<br>')+(bad.length?'<br>'+bad.join('<br>'):''),bad.length?'warn':'');
});
$('yearSel').addEventListener('change',()=>buildFromStore(+$('yearSel').value));
$('annualize').addEventListener('change',()=>{if(Object.keys(STORE).length)buildFromStore(+$('yearSel').value)});
function mode(arr){const m=new Map();let best=null,bc=0;for(const v of arr){const c=(m.get(v)||0)+1;m.set(v,c);if(c>bc||(c===bc&&v>best)){bc=c;best=v}}return best}
const serOf=s=>s.replace(/^(일반대학원|전문대학원|특수대학원)\s+/,'');
const nwOf=f=>f==='내국인'?'내국인':'외국인';
function buildFromStore(y){
  const sems=Object.keys(STORE).filter(k=>+k.split('|')[0]===y).map(k=>k.split('|')[1]).sort();
  const one=sems.length===1;$('annWrap').hidden=!one;const mul=one&&$('annualize').checked?2:1;
  const G=new Map();let res=0;const perSem=[];
  for(const s of sems){const {rows,file}=STORE[y+'|'+s];let n=0,a=0,ra=0;
    for(const [c,p,ser,f,rx,reg,tu,am] of rows){if(rx==='Y'){ra+=am;continue}n++;a+=am;
      const key=[c,p,serOf(ser),nwOf(f)].join('|');let g=G.get(key);if(!g){g={n:0,a:0,full:[]};G.set(key,g)}g.n++;g.a+=am;if(reg==='전액')g.full.push(tu)}
    res+=ra;perSem.push({s,file,rows:rows.length,n,a,ra})}
  const segs=[];let fb=0;
  for(const [key,g] of G){const [c,p,s,f]=key.split('|');let u=g.full.length?mode(g.full):0;if(!u){u=Math.round(g.a/g.n);fb++}
    segs.push([c,p,s,f,g.n*mul,u,g.a*mul])}
  // 전년 대비 학부 내국인 단가 인상률
  let prev=null;const pk=Object.keys(STORE).filter(k=>+k.split('|')[0]===y-1);
  if(pk.length){const unit=yy=>{const m=new Map();for(const k of Object.keys(STORE).filter(k=>+k.split('|')[0]===yy)){for(const [c,p,ser,f,rx,reg,tu] of STORE[k].rows){if(p==='학부'&&f==='내국인'&&rx!=='Y'&&reg==='전액'){const kk=serOf(ser);(m.get(kk)||m.set(kk,[]).get(kk)).push(tu)}}}const o={};for(const [k,v] of m)o[k]=mode(v);return o};
    const u1=unit(y),u0=unit(y-1);let w=0,sw=0;for(const s of segs){if(s[1]==='학부'&&s[3]==='내국인'&&u0[s[2]]&&u1[s[2]]){const r=u1[s[2]]/u0[s[2]]-1;if(Math.abs(r)<0.2){w+=r*s[4];sw+=s[4]}}}
    if(sw)prev=w/sw*100}
  const src=`업로드: ${y}학년도 ${sems.join('·')} (${[...new Set(perSem.map(x=>x.file))].join(', ')})${mul===2?' · 한 학기 자료를 연간 환산(×2)':''}`;
  setData(segs,res*mul,y,src,prev);
  if(prev!==null)$('nssBase').value=prev>0.005?'none':'recv';
  const stb=buildStructFromStore(y,mul);if(stb.sp){setSP(stb.sp);stInitControls()}
  try{localStorage.setItem('tuitionSimData',JSON.stringify({segs,res:res*mul,y,src,prev,perSem,fb,mul,sp:stb.sp}))}catch(e){}
  showValidation(perSem,fb,mul);$('valNote').innerHTML+=`<br>정원·편제 탭: ${stb.sp?'업로드 자료로 학년별 재학생·진급률 재산출 ('+stb.msg+')':stb.msg}`;render();
let _rz;window.addEventListener('resize',()=>{clearTimeout(_rz);_rz=setTimeout(render,150)});
}
function showValidation(perSem,fb,mul){
  const procs=['학부','일반대학원','전문대학원','특수대학원'];
  let h='<thead><tr><th>구분</th><th>원자료 행수</th><th>인원(연구등록 제외)</th><th>징수액(연구등록 제외)</th><th>연구등록금</th></tr></thead><tbody>';
  if(perSem){for(const x of perSem)h+=`<tr><td>${BY} ${x.s}</td><td>${x.rows.toLocaleString('ko-KR')}</td><td>${x.n.toLocaleString('ko-KR')}</td><td>${eok(x.a)}억</td><td>${eok(x.ra)}억</td></tr>`}
  for(const p of procs){const s=SEG.filter(x=>x[1]===p);if(!s.length)continue;h+=`<tr><td>└ ${p}</td><td></td><td>${s.reduce((a,x)=>a+x[4],0).toLocaleString('ko-KR')}</td><td>${eok(s.reduce((a,x)=>a+x[6],0))}억</td><td></td></tr>`}
  h+=`<tr><td><b>기준년도 합계</b></td><td></td><td><b>${SEG.reduce((a,x)=>a+x[4],0).toLocaleString('ko-KR')}</b></td><td><b>${eok(BASE-RES)}억</b></td><td><b>${eok(RES)}억</b></td></tr>`;
  const o={...opts(),decline:0,fillDrop:0,pay:0};const diff=project(0,o,0,0)-BASE;
  const ks=SEG.map(x=>x[6]/(x[5]*x[4]));const odd=ks.filter(k=>k<0.9||k>1.15).length;
  h+=`<tr><td>모델 재현 검증</td><td colspan="3" class="t">인상률 0%·감소 0%일 때 예상 징수액 − 기준 징수액 = ${Math.round(diff).toLocaleString('ko-KR')}원</td><td class="t"><span class="pill ${Math.abs(diff)<1?'p-ok':'p-no'}">${Math.abs(diff)<1?'일치':'불일치'}</span></td></tr></tbody>`;
  $('valTbl').innerHTML=h;
  $('valNote').innerHTML=`${SRC}<br>집계 단위 ${SEG.length}개(캠퍼스×과정×계열×내외국인) · 실효 징수율 0.9~1.15 밖 단위 ${odd}개${fb?` · 전액 등록자가 없어 평균 단가로 대체한 단위 ${fb}개`:''}${mul===2?' · <b>한 학기 자료라 연간 환산값입니다</b>':''}`;
}
$('resetData').addEventListener('click',()=>{try{localStorage.removeItem('tuitionSimData')}catch(e){}for(const k in STORE)delete STORE[k];
  $('annWrap').hidden=true;
  if(EMB_META){$('yearSel').innerHTML=`<option>${EMB_META.y}학년도</option>`;setData(SEGS,RESEARCH,EMB_META.y,EMB_META.src,EMB_META.prev);$('nssBase').value='none';setSP(SP_EMB);stInitControls();
    status(`내장 데이터(${EMB_META.y}학년도)로 되돌렸습니다.`);showValidation(EMB_SEM,0,1)}
  else{$('yearSel').innerHTML='<option>—</option>';setData([],0,new Date().getFullYear(),'기준 데이터 없음',null);setSP(SP_EMB);stInitControls();
    $('valTbl').innerHTML='';$('valNote').innerHTML='';status(NO_DATA_MSG)}
  render();if(!$('tab2').hidden)stRender()});
const NO_DATA_MSG='<b>기준 데이터가 없습니다.</b> 「엑셀·CSV 파일 선택」으로 당해연도 학과별징수총액통계표(RAW) 1·2학기 파일(또는 통합 RAW)을 올리면 시뮬레이션이 시작됩니다.';
$('resetData').textContent=EMB_META?`내장 데이터(${EMB_META.y})로 되돌리기`:'올린 자료 지우기';
(function boot(){let saved=null;try{saved=JSON.parse(localStorage.getItem('tuitionSimData')||'null')}catch(e){}
  if(saved&&saved.segs){window.__savedSP=saved.sp||null;setData(saved.segs,saved.res,saved.y,saved.src+' (이전에 올린 자료 · 이 브라우저에 저장됨)',saved.prev);
    $('yearSel').innerHTML=`<option>${saved.y}학년도</option>`;if(saved.prev!==null)$('nssBase').value=saved.prev>0.005?'none':'recv';
    status('이전에 올린 기준 데이터를 불러왔습니다. 새 파일을 올리면 교체됩니다.');showValidation(saved.perSem,saved.fb,saved.mul)}
  else if(EMB_META){$('yearSel').innerHTML=`<option>${EMB_META.y}학년도</option>`;status(`내장 데이터(${EMB_META.y}학년도)를 사용 중입니다. 새 기준년도 RAW 파일을 올리면 자동으로 바뀝니다.`);showValidation(EMB_SEM,0,1)}
  else{$('yearSel').innerHTML='<option>—</option>';status(NO_DATA_MSG)}})();
render();
let _rz;window.addEventListener('resize',()=>{clearTimeout(_rz);_rz=setTimeout(render,150)});
