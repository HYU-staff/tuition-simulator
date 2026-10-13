/* ===== 검토 결과 엑셀 내려받기 ===== */
function cellVal(s){s=String(s).replace(/−/g,'-').replace(/\s+/g,' ').trim();
  const m=s.match(/^([+-]?)([\d,]+(?:\.\d+)?)\s*(억원|억|만원|만|명|%|원)?$/);
  if(!m)return {v:s};const n=parseFloat(m[2].replace(/,/g,''))*(m[1]==='-'?-1:1);
  if(m[3]==='%')return {v:n/100,z:'0.00%'};return {v:n,z:Number.isInteger(n)&&!/\./.test(m[2])?'#,##0':'#,##0.0'}}
function tableAOA(el){const out=[];if(!el)return out;const grid=[];
  [...el.querySelectorAll('tr')].forEach((tr,ri)=>{grid[ri]=grid[ri]||[];let ci=0;
    for(const td of tr.children){while(grid[ri][ci]!==undefined)ci++;let t=td.querySelector('input,select')?(td.querySelector('select')?td.querySelector('select').selectedOptions[0]?.text:td.querySelector('input').value):td.innerText;
      const cs=+td.colSpan||1,rs=+td.rowSpan||1;for(let r=0;r<rs;r++){grid[ri+r]=grid[ri+r]||[];for(let c=0;c<cs;c++)grid[ri+r][ci+c]=(r===0&&c===0)?t:''}ci+=cs}});
  return grid.map(r=>Array.from(r,v=>v===undefined?'':v))}
function cardsAOA(root){const out=[];root.querySelectorAll('.card').forEach(cd=>{out.push([(cd.querySelector('h4')?.innerText||'').replace(/\n/g,' ').replace(/^([A-D])\s*/,'[$1] ')]);
  const sub=cd.querySelector('.sub');if(sub)out.push(['설명',sub.innerText]);const rt=cd.querySelector('.rate,.rate2');if(rt)out.push(['조합',rt.innerText.replace(/\n/g,' ')]);
  const dts=[...cd.querySelectorAll('dt')],dds=[...cd.querySelectorAll('dd')];dts.forEach((dt,i)=>{const b=dds[i]?.querySelectorAll('.risk i.on');out.push([dt.innerText,b&&dds[i].querySelector('.risk')?`${b.length}/5`:dds[i]?.innerText||''])});
  const pr=cd.querySelector('.prop');if(pr)out.push(['제안',pr.innerText.replace(/^제안\s*/,'')]);cd.querySelectorAll('li').forEach(li=>out.push(['•',li.innerText]));out.push([])});return out}
function textAOA(el){return el?el.innerText.split('\n').map(s=>s.trim()).filter(Boolean).map(s=>[s]):[]}
function inputsAOA(scope){const out=[];document.querySelectorAll(scope+' aside .grp').forEach(g=>{const h=g.querySelector('h3');if(h)out.push([h.innerText]);
  g.querySelectorAll('label').forEach(l=>{const el=l.querySelector('input,select');if(!el)return;const sp=l.querySelector(':scope > span');const name=(sp?sp.innerText:l.innerText).split('\n')[0].trim();
    const v=el.type==='checkbox'?(el.checked?'예':'아니오'):el.tagName==='SELECT'?el.selectedOptions[0]?.text:el.value;out.push(['',name,v])});
  const cap=g.querySelector('.capbox');if(cap)out.push(['',cap.innerText.replace(/\s+/g,' ')])});return out}
function sheet(aoa,widths){const ws={};let maxC=0;aoa.forEach((r,ri)=>{r.forEach((v,ci)=>{if(v===''||v===undefined||v===null)return;const c=typeof v==='number'?{v,t:'n',z:'#,##0.0'}:(()=>{const x=cellVal(v);return typeof x.v==='number'?{v:x.v,t:'n',z:x.z}:{v:x.v,t:'s'}})();
    ws[XLSX.utils.encode_cell({r:ri,c:ci})]=c;maxC=Math.max(maxC,ci)})});
  ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(aoa.length-1,0),c:maxC}});
  const w=[];for(let c=0;c<=maxC;c++){let m=6;aoa.forEach(r=>{const v=r[c];if(v!==undefined&&v!==null){const s=String(v);let len=0;for(const ch of s)len+=ch.charCodeAt(0)>255?2:1;m=Math.max(m,Math.min(len+2,widths||60))}});w.push({wch:m})}ws['!cols']=w;return ws}
function sensAOA(){const o=opts(),S=scen(o);S.D=Math.round((parseFloat($('rD').value)||0)*100)/100;const pays=[0.5,0,-0.5,-1,-2],drops=[0,1,2,3];const out=[];
  for(const k of ['A','B','C','D']){out.push([`시나리오 ${k} (인상률 ${S[k].toFixed(2)}%) · 최종 순재정 수지 변화(억원)`]);out.push(['충원율 하락 \\ 납부율 변동',...pays.map(p=>(p>0?'+':'')+p+'%p')]);
    for(const fd of drops)out.push([fd===0?'변동 없음':'-'+fd+'%p',...pays.map(p=>Math.round(calc(S[k],o,o.fillDrop+fd,o.pay+p).net/1e7)/10)]);out.push([])}return out}
function planAOA(){const out=[['신설 학과'],['학과명','계열','입학정원','예상 충원율(%)','개설 연도']];NEWD.forEach(x=>out.push([x.name,x.g,x.q,x.f,x.y]));if(!NEWD.length)out.push(['(없음)']);
  out.push([],['폐지·감축 학과'],['캠퍼스','계열','학과','입학정원 감축 인원','적용 연도']);CLOSED.forEach(x=>out.push([x.c,x.g,x.d,x.n,x.y]));if(!CLOSED.length)out.push(['(없음)']);
  if(CLOSED.length){out.push([],['폐지·감축 학과 연차별 잔여 재학생']);tableAOA($('tCloseSch')).forEach(r=>out.push(r))}
  out.push([],['계열 간 정원 이동(직접 입력)'],['감원 계열','증원 계열','이동 인원','적용 연도']);MOVES.forEach(x=>out.push([x.from,x.to,x.n,x.y]));if(!MOVES.length)out.push(['(없음)']);return out}
async function exportReview(){try{
  if(!SEG.length){document.querySelector('.navtab[data-tab="1"]').click();status(NO_DATA_MSG);$('s0').scrollIntoView({behavior:'smooth'});return}
  if(typeof XLSX==='undefined')throw new Error('엑셀 모듈 없음');
  const hid=[$('tab1').hidden,$('tab2').hidden];$('tab1').hidden=false;$('tab2').hidden=false;
  try{render();stRender();var o=opts(),now=new Date();var ts=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  var wb=XLSX.utils.book_new();const add=(name,aoa,w)=>XLSX.utils.book_append_sheet(wb,sheet(aoa,w),name);
  add('표지',[[`${BY+1}학년도 등록금·정원 재정 시뮬레이션 검토 결과`],[],['작성 일시',now.toLocaleString('ko-KR')],['작성 부서','기획처 예산팀'],['기준년도 자료',SRC],['기준년도 징수액(억원)',Math.round(BASE/1e7)/10],['추정 법정 인상률 한도',pct(cap(o))],['정원·편제 진급률 출처',SPX.src||`${SPX.BY-1}→${SPX.BY} 실적`],[],
    ['시트 구성'],['1_입력가정','두 탭의 모든 가정값과 계열별 입학정원'],['2_등록금_대시보드','인상률별 징수액·순재정 수지·법정 한도'],['3_등록금_시나리오','A·B·C 추천안과 D 직접 입력안'],['4_등록금_민감도','시나리오별 충원율×납부율 리스크 매트릭스'],['5_등록금_가이드','추천안·상정 문안·확인 사항'],
    ['6_편제_기준구조','계열별 학년 재학생·진급률·1인당 징수'],['7_편제_개편계획','신설·폐지·이동 입력과 폐과 잔여 인원'],['8_편제_대시보드','인상률별 편제정원·재학생·효과 분해'],['9_편제_영향분석','가격·물량·구조 효과, 계열별 영향, 연차별 추이'],['10_편제_시나리오','정원×등록금 A·B·C·D'],['11_편제_최적조합','4년 누적 최적 조합 매트릭스와 보고 요약'],[],
    ['※ 가정치(편제정원·충원율·Ⅱ유형 지원액·필수 증액분·인상 탄력성 등)는 1_입력가정 시트 값 기준이며 실제 값으로 교체 후 재산출 필요']],80);
  const qa=[['계열별 입학정원(정원·편제 탭)'],['계열','입학정원','기준년도 1학년 재학생','신입생 충원율']];SPX.G.forEach(e=>qa.push([e.g,QUOTA[e.g],Math.round(e.E*10)/10,QUOTA[e.g]?e.E/QUOTA[e.g]:'']));
  add('1_입력가정',[['[등록금 인상률 탭]'],...inputsAOA('#tab1'),['','D안 직접 입력 인상률(%)',$('rD').value],[],['[정원·편제 개편 탭]'],...inputsAOA('#tab2'),[],...qa],40);
  add('2_등록금_대시보드',[['인상률별 요약 대시보드 (단위: 억원)'],...tableAOA($('dash')),[],['KPI'],...[...document.querySelectorAll('#kpis .kpi')].map(k=>[k.querySelector('.k').innerText,k.querySelector('.v').innerText])]);
  add('3_등록금_시나리오',cardsAOA($('cards')),70);
  add('4_등록금_민감도',sensAOA());
  add('5_등록금_가이드',textAOA($('guide')),120);
  add('6_편제_기준구조',[['학부 재학 구조 (기준년도 1·2학기 평균)'],...tableAOA($('stBase')),[],...textAOA($('stBaseNote'))],50);
  add('7_편제_개편계획',planAOA());
  add('8_편제_대시보드',[[$('stDashLead').innerText],...tableAOA($('stDash'))]);
  add('9_편제_영향분석',[[$('stDecLead').innerText],[],['구분','억원'],...[...document.querySelectorAll('#stKpi .kpi')].map(k=>[k.querySelector('.k').innerText,k.querySelector('.v').innerText]),[],['계열별 영향'],...tableAOA($('stSer')),[],...textAOA($('stMix')),[],['연차별 추이'],...tableAOA($('stTraj'))],100);
  add('10_편제_시나리오',[[$('stScLead').innerText],[],...cardsAOA($('stCards'))],70);
  add('11_편제_최적조합',[[$('stOptLead').innerText],...tableAOA($('stOpt')),[],...textAOA($('stGuide'))],100);
  }finally{$('tab1').hidden=hid[0];$('tab2').hidden=hid[1]}
  const fn=`등록금·정원 시뮬레이션 검토결과_${BY+1}학년도_${ts}.xlsx`;
  const buf=XLSX.write(wb,{type:'array',bookType:'xlsx',compression:true});const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  if(window.showSaveFilePicker){try{const h=await window.showSaveFilePicker({suggestedName:fn,types:[{description:'Excel 통합 문서',accept:{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx']}}]});const w=await h.createWritable();await w.write(blob);await w.close();status(`검토 결과를 「${h.name}」로 저장했습니다.`);return}
    catch(e){if(e&&e.name==='AbortError'){status('저장을 취소했습니다.');return}}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
  status(`검토 결과를 「${fn}」로 내려받았습니다. 브라우저의 다운로드 폴더를 확인하세요.`)}
  catch(e){status('내려받기에 실패했습니다: '+e.message,'err')}}
$('exportBtn').addEventListener('click',()=>{exportReview();document.getElementById('s0')&&!$('tab1').hidden&&document.getElementById('upStatus').scrollIntoView({block:'nearest'})});
