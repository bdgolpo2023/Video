import re,json,math,sys
t=open('/projects/sandbox/Video/voiceover/elevenlabs_v4_script.txt').read()
t=re.sub(r'\[[^\]]*\]',' | ',t).replace('\n',' | ')
def syl(w):
    w=re.sub(r'[^a-z]','',w.lower())
    if not w: return 0
    if len(w)<=3: return 1
    w=re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$','',w); w=re.sub(r'^y','',w)
    return max(1,len(re.findall(r'[aeiouy]{1,2}',w)))
ph=[p.strip() for p in re.split(r'(?<=[.,?!])\s+|\|',t) if p.strip()]
S=[sum(syl(w) for w in p.split()) for p in ph]
segs=json.load(open(sys.argv[1]))['segs']; D=[b-a for a,b in segs]
P,M=len(ph),len(D); pre=[0]
for s in S: pre.append(pre[-1]+s)
best=None
for rate in [x/10 for x in range(25,80,1)]:
    INF=1e18; dp=[[INF]*(P+1) for _ in range(M+1)]; bk=[[0]*(P+1) for _ in range(M+1)]; dp[0][0]=0
    for m in range(1,M+1):
        for p in range(1,P+1):
            for q in range(max(0,p-12),p):
                if dp[m-1][q]>=INF: continue
                c=math.log(D[m-1]*rate/(pre[p]-pre[q]))**2
                if dp[m-1][q]+c<dp[m][p]: dp[m][p]=dp[m-1][q]+c; bk[m][p]=q
    if dp[M][P]<INF and (best is None or dp[M][P]<best[0]): best=(dp[M][P],rate,bk)
cost,rate,bk=best
print('best rate %.1f syl/s, mean sq log err %.3f'%(rate,cost/M))
p=P; rows=[]
for m in range(M,0,-1):
    q=bk[m][p]; rows.append({'start':segs[m-1][0],'end':segs[m-1][1],'text':' '.join(ph[q:p]),'syl':pre[p]-pre[q]}); p=q
rows.reverse(); json.dump(rows,open('timeline.json','w'),indent=1)
for r in rows: print(f"{r['start']:6.2f}-{r['end']:6.2f} ({r['syl']/(r['end']-r['start']):4.1f}/s) {r['text']}")
