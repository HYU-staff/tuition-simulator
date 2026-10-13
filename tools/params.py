"""통합 RAW(xlsx 또는 pkl)에서 편제 시뮬레이터 파라미터(P.json)를 산출합니다.
사용법: python tools/params.py <통합RAW.xlsx|.pkl> [출력 P.json]
"""
import sys, pandas as pd, numpy as np, json
src=sys.argv[1] if len(sys.argv)>1 else 'raw.pkl'
OUT=sys.argv[2] if len(sys.argv)>2 else 'P.json'
raw=pd.read_pickle(src) if src.endswith('.pkl') else pd.read_excel(src,sheet_name='통합RAW',dtype={'연도':str,'학번':str})
 raw['합계']=raw['합계'].astype('int64'); raw['학년']=raw['학년'].astype(int)
BY=2026; PY=2025
x=raw[raw['연구등록구분']=='X'].copy()
u=x[x['대학(원)구분']=='학부'].copy()
u['계']=u['계열명'].replace({'의예계열':'의학계열'})
u.loc[u['계열명']=='의학계열','학년']+=2
SIX={'의학계열','약학계열'}
L={g:(6 if g in SIX else 4) for g in u['계'].unique()}
u['k']=[min(k,L[g]) for k,g in zip(u['학년'],u['계'])]
def H(df,y,keys):
    d=df[df['연도']==str(y)]; return d.groupby(keys+['학기','k']).size().groupby(keys+['k']).mean()
H25=H(u,PY,['계']); H26=H(u,BY,['계'])
def stay_of(g):
    sh=[]
    for s in ['1학기','2학기']:
        a=set(u[(u['연도']==str(PY))&(u['학기']==s)&(u['계']==g)&(u['k']==L[g])]['학번']); b=set(u[(u['연도']==str(BY))&(u['학기']==s)]['학번'])
        if len(a)>=20: sh.append(len(a&b)/len(a))
    return float(np.mean(sh)) if sh else None
stay={g:stay_of(g) for g in L}
raw_r={}
for g in L:
    r=[]
    for k in range(1,L[g]):
        den=H25.get((g,k),0); num=H26.get((g,k+1),0)
        if k+1==L[g]: num-= (stay[g] or 0)*H25.get((g,L[g]),0)
        v=num/den if den>=30 else None
        r.append(v if (v is not None and 0.7<=v<=1.3) else None)
    raw_r[g]=r
# fallbacks: weighted avg among 4-year 계열 for k=1..3
four=[g for g in L if L[g]==4]
avg=[]
for k in range(3):
    num=sum(raw_r[g][k]*H25.get((g,k+1),0) for g in four if raw_r[g][k] is not None); den=sum(H25.get((g,k+1),0) for g in four if raw_r[g][k] is not None)
    avg.append(num/den)
sv=[(stay[g],H25.get((g,4),0)) for g in four if stay[g] is not None]; stay_avg=sum(a*b for a,b in sv)/sum(b for a,b in sv)
C={}; ST={}; FB={}
for g in L:
    c=[]; fb=[]
    for k,v in enumerate(raw_r[g]):
        if v is None: c.append(avg[k] if k<3 else 1.0); fb.append(k+1)
        else: c.append(v)
    C[g]=[round(v,4) for v in c]; FB[g]=fb
    ST[g]=round(stay[g] if stay[g] is not None else (stay_avg if L[g]==4 else 0.0),4)
rev=u[u['연도']==str(BY)].groupby('계')['합계'].sum()
dom=u[(u['연도']==str(BY))&(u['외국인구분']=='내국인')]
Hd=dom.groupby(['계','학기']).size().groupby('계').mean(); revd=dom.groupby('계')['합계'].sum()
order=['인문·사회계열','이학계열','공학계열','예능계열','음악계열','체육계열','의학계열','약학계열','한양인터칼리지계열']
G=[]
for g in order:
    h=[round(float(H26.get((g,k),0)),1) for k in range(1,L[g]+1)]
    tot=sum(H26.get((g,k),0) for k in range(1,L[g]+1))
    G.append(dict(g=g,L=L[g],h=h,c=C[g],st=ST[g],fb=FB[g],uA=round(rev[g]/tot),uD=round(revd[g]/Hd[g]) if g in Hd else round(rev[g]/tot),rev=int(rev[g])))
gr=x[(x['연도']==str(BY))&(x['대학(원)구분']!='학부')]
grad=dict(rev=int(gr['합계'].sum()),n=round(float(gr.groupby('학기').size().mean()),1))
res=int(raw[(raw['연도']==str(BY))&(raw['연구등록구분']=='Y')]['합계'].sum())
# departments
uu=u[u['연도']==str(BY)]
D=[]
for (g,c,d),z in uu.groupby(['계','rc캠퍼스','학과전공명']):
    h=z.groupby(['학기','k']).size().groupby('k').mean()
    hh=[round(float(h.get(k,0)),1) for k in range(1,L[g]+1)]
    if sum(hh)>=5: D.append([g,c,d,hh])
P=dict(BY=BY,G=G,grad=grad,res=res,depts=D,avg=[round(a,4) for a in avg],stayAvg=round(stay_avg,4))
json.dump(P,open(OUT,'w',encoding='utf-8'),ensure_ascii=False)
base=sum(e['rev'] for e in G)+grad['rev']+res
print('BASE',base,'학부',sum(e['rev'] for e in G),'grad',grad,'res',res)
for e in G: print(e['g'],e['L'],e['h'],e['c'],e['st'],'fb',e['fb'],e['uA'],e['uD'])
print('avg',avg,stay_avg,'depts',len(D))
