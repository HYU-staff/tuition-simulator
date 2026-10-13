/* 공개 저장소용 빈 데이터 — 내장 데이터 없음.
   실행 후 화면에서 학과별징수총액통계표(RAW)를 업로드하면 계산됩니다.
   내장 데이터를 넣은 로컬 빌드: python build.py --data local-data/embedded.js  (README 참고) */
const SEGS=[];           // [캠퍼스, 과정, 계열, 내외국인, 인원, 단가, 징수액] 배열
const RESEARCH=0;        // 연구등록금
const EMB_SEM=[];        // 학기별 검증 요약
const EMB_META=null;     // {y:기준년도, src:'출처 문구', prev:전년도 인상률}
const SP_EMB={BY:new Date().getFullYear(),G:[],grad:{rev:0,n:0},res:0,depts:[],avg:[1,1,1],stayAvg:0};
