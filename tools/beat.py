import subprocess, sys, numpy as np, json
SR=22050
def load(path):
    raw = subprocess.run(['ffmpeg','-v','error','-i',path,'-ac','1','-ar',str(SR),'-f','f32le','-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

def onset_env(y, hop=256, win=1024):
    n = 1 + (len(y)-win)//hop
    frames = np.lib.stride_tricks.as_strided(y, (n,win), (y.strides[0]*hop, y.strides[0]))
    w = np.hanning(win).astype(np.float32)
    S = np.abs(np.fft.rfft(frames*w, axis=1))
    S = np.log1p(S*10)
    flux = np.diff(S, axis=0)
    flux[flux<0]=0
    env = flux.sum(axis=1)
    env = np.concatenate([[0], env])
    env = env - np.median(env)
    env[env<0]=0
    return env/ (env.max()+1e-9), hop

def tempo(env, hop, lo=95, hi=140):
    fps = SR/hop
    best=None
    for bpm in np.arange(lo, hi, 0.05):
        period = 60.0/bpm*fps
        # comb: sum env at multiples of period for many phases
        idx = np.arange(0, len(env)-1, period)
        for ph in np.arange(0, period, max(1,period/24)):
            pts = (idx+ph).astype(int)
            pts = pts[pts<len(env)]
            score = env[pts].mean()
            if best is None or score>best[0]:
                best=(score,bpm,ph/fps)
    return best  # score, bpm, phase_seconds

def coverage(env, hop, bpm, phase, tol_f=3):
    fps=SR/hop
    period=60.0/bpm*fps
    pts=np.arange(phase*fps, len(env), period).astype(int)
    thr=np.percentile(env[env>0], 60)
    hit=0
    for p in pts:
        lo=max(0,p-tol_f); hi=min(len(env),p+tol_f+1)
        if env[lo:hi].max()>=thr: hit+=1
    return hit/len(pts), len(pts)

if __name__=='__main__':
    path=sys.argv[1]
    y=load(path)
    env,hop=onset_env(y)
    score,bpm,phase=tempo(env,hop)
    cov,n=coverage(env,hop,bpm,phase)
    beat_f = 30*60.0/bpm
    print(json.dumps({'file':path,'bpm':round(float(bpm),3),'phase_s':round(float(phase),4),
                      'grid_score':round(float(score),4),'coverage':round(float(cov),3),'beats':int(n),
                      'beat_frames@30fps':round(beat_f,4),'bar_frames':round(beat_f*4,3),
                      'duration_s':round(len(y)/SR,2)}, ensure_ascii=False))
