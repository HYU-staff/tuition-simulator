"""편제(코호트) 엔진 Python 참조 구현 — JS 결과 교차검증용.
사용법: python tools/ref.py [P.json]
"""
import sys, json
P=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'P.json',encoding='utf-8'))
G=P['G']; BY=P['BY']
def proj(r=2.5,cut=5,move=10,split=70,fill=-2,drop=0,el=0.3,gd=0,pay=0,T=4):
    Q={e['g']:round(e['h'][0]) for e in G}; out=[]
    st={e['g']:{'b':e['h'][:],'d':[0]*e['L']} for e in G}
    for t in range(0,T+1):
        if t>0:
            F=max(0,1+fill/100-el*max(r,0)/100)
            for e in G:
                g=e['g'];L=e['L'];E=e['h'][0];f=E/Q[g]
                d=-cut/100*Q[g]; m=move/100*Q['인문·사회계열']
                if g=='인문·사회계열': d-=m
                if g=='공학계열': d+=m*split/100
                if g=='이학계열': d+=m*(1-split/100)
                def step(H,E0):
                    n=[0]*L; n[0]=E0
                    for k in range(1,L): n[k]=e['c'][k-1]*(1-drop/100)*H[k-1]
                    if L>1: n[L-1]+=e['st']*(1-drop/100)*H[L-1]
                    return n
                st[g]['b']=step(st[g]['b'],E*F); st[g]['d']=step(st[g]['d'],d*f*F)
                for k in range(L):
                    if st[g]['b'][k]+st[g]['d'][k]<0: st[g]['d'][k]=-st[g]['b'][k]
        ug=sum(sum(st[e['g']]['b'])*e['rev']/sum(e['h'])+sum(st[e['g']]['d'])*e['uD'] for e in G)
        gr=P['grad']['rev']*(1-gd/100)**t
        out.append(((ug+gr)*(1+pay/100)*(1+r/100)**t+P['res'])/1e8)
    return out
print([round(x,1) for x in proj()])
print([round(x,1) for x in proj(cut=0,move=0,fill=0)])
