// ═══════════════════════════════════════════════════════════════
// ROULETTE — Realistic Physics-Based Wheel & Ball
// Real casino: wheel spins one way, ball the other
// Ball decelerates, drops to inner track, bounces, settles
// ═══════════════════════════════════════════════════════════════

const RLT_NUMBERS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RLT_REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

let rltCanvas, rltCtx, rltParticles, rltAnim;
let rltState = {
    wheelAngle: 0, wheelSpeed: 0,
    ballAngle: 0, ballSpeed: 0, ballRadius: 0, ballBounce: 0,
    phase: 'idle', resultIdx: -1, bet: 0
};
let rltChoice = null;

function renderRouletteReal(body) {
    body.innerHTML = `
        <div id="rlt-box" style="width:100%;max-width:330px;margin:0 auto;"></div>
        <div id="rlt-num" style="text-align:center;font-size:32px;font-weight:900;min-height:40px;margin:8px 0;"></div>
        <div class="choice-row">
            <button class="choice-btn" id="rl-red" onclick="rltChoice='red';document.querySelectorAll('[id^=rl-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="background:rgba(229,57,53,0.15);border-color:#e53935;">
                <div style="width:22px;height:22px;background:#e53935;border-radius:50%;margin:0 auto 4px;box-shadow:0 0 8px rgba(229,57,53,0.5);"></div><div style="font-size:12px;font-weight:700;">RED 2x</div>
            </button>
            <button class="choice-btn" id="rl-grn" onclick="rltChoice='green';document.querySelectorAll('[id^=rl-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="background:rgba(67,160,71,0.15);border-color:#43a047;">
                <div style="width:22px;height:22px;background:#43a047;border-radius:50%;margin:0 auto 4px;box-shadow:0 0 8px rgba(67,160,71,0.5);"></div><div style="font-size:12px;font-weight:700;">GREEN 36x</div>
            </button>
            <button class="choice-btn" id="rl-blk" onclick="rltChoice='black';document.querySelectorAll('[id^=rl-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="background:rgba(66,66,66,0.3);border-color:#616161;">
                <div style="width:22px;height:22px;background:#212121;border-radius:4px;margin:0 auto 4px;border:2px solid #616161;"></div><div style="font-size:12px;font-weight:700;">BLACK 2x</div>
            </button>
        </div>
        ${betUI('rlt')}
        <button class="play-button" id="rlt-btn" onclick="spinRlt()">🎯 SPIN</button>
        <div id="rlt-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const box = document.getElementById('rlt-box');
    rltCanvas = createGameCanvas(box, 'rlt-cv', 320, 320);
    rltCtx = rltCanvas.getContext('2d');
    rltParticles = new ParticleSystem();
    rltState.phase = 'idle';
    rltState.wheelAngle = Math.random() * Math.PI * 2;
    drawRlt();
}

function drawRlt() {
    const ctx = rltCtx, w = rltCanvas.width, h = rltCanvas.height;
    const cx = w/2, cy = h/2, outerR = 140, pocketR = 95, hubR = 32;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // Outer wooden rim
    ctx.beginPath(); ctx.arc(cx, cy, outerR+8, 0, Math.PI*2);
    ctx.arc(cx, cy, outerR-2, 0, Math.PI*2, true);
    const rimG = ctx.createRadialGradient(cx,cy,outerR-2,cx,cy,outerR+8);
    rimG.addColorStop(0,'#5d4037'); rimG.addColorStop(0.5,'#795548'); rimG.addColorStop(1,'#3e2723');
    ctx.fillStyle = rimG; ctx.fill();
    // Gold trim
    ctx.beginPath(); ctx.arc(cx,cy,outerR+9,0,Math.PI*2); ctx.strokeStyle='#d4a017'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,outerR-3,0,Math.PI*2); ctx.stroke();

    // Ball track
    ctx.beginPath(); ctx.arc(cx,cy,outerR-6,0,Math.PI*2);
    ctx.arc(cx,cy,outerR-18,0,Math.PI*2,true);
    ctx.fillStyle='#12121f'; ctx.fill();

    // Wheel (rotates)
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(rltState.wheelAngle);
    const seg = (Math.PI*2)/37;
    for(let i=0;i<37;i++){
        const a1=i*seg, a2=a1+seg, num=RLT_NUMBERS[i];
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,pocketR,a1,a2); ctx.closePath();
        ctx.fillStyle = num===0?'#1b5e20':RLT_REDS.includes(num)?'#b71c1c':'#0d0d0d';
        ctx.fill();
        // Fret
        ctx.beginPath();
        ctx.moveTo(Math.cos(a1)*hubR, Math.sin(a1)*hubR);
        ctx.lineTo(Math.cos(a1)*pocketR, Math.sin(a1)*pocketR);
        ctx.strokeStyle='rgba(192,192,192,0.6)'; ctx.lineWidth=0.7; ctx.stroke();
        // Number
        const ma=a1+seg/2, tx=Math.cos(ma)*(pocketR-16), ty=Math.sin(ma)*(pocketR-16);
        ctx.save(); ctx.translate(tx,ty); ctx.rotate(ma+Math.PI/2);
        ctx.fillStyle='#fff'; ctx.font='bold 8px Inter'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(num+'',0,0); ctx.restore();
    }
    // Inner ring
    ctx.beginPath(); ctx.arc(0,0,pocketR,0,Math.PI*2); ctx.strokeStyle='#aaa'; ctx.lineWidth=1.5; ctx.stroke();
    // Hub
    const hg=ctx.createRadialGradient(0,0,0,0,0,hubR);
    hg.addColorStop(0,'#3a3a3a'); hg.addColorStop(1,'#1a1a1a');
    ctx.beginPath(); ctx.arc(0,0,hubR,0,Math.PI*2); ctx.fillStyle=hg; ctx.fill();
    ctx.strokeStyle='#d4a017'; ctx.lineWidth=2; ctx.stroke();
    // Spokes
    for(let i=0;i<8;i++){const a=(Math.PI*2/8)*i;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*(hubR-2),Math.sin(a)*(hubR-2));ctx.strokeStyle='#d4a017';ctx.lineWidth=1.5;ctx.stroke();}
    // Deflectors
    for(let i=0;i<8;i++){const a=(Math.PI*2/8)*i+Math.PI/8,dx=Math.cos(a)*(pocketR+10),dy=Math.sin(a)*(pocketR+10);ctx.save();ctx.translate(dx,dy);ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(5,0);ctx.lineTo(0,3);ctx.lineTo(-5,0);ctx.closePath();ctx.fillStyle='#bbb';ctx.fill();ctx.restore();}
    ctx.restore();

    // Ball
    if(rltState.phase!=='idle'){
        const bx=cx+Math.cos(rltState.ballAngle)*rltState.ballRadius;
        const by=cy+Math.sin(rltState.ballAngle)*rltState.ballRadius;
        ctx.beginPath();ctx.arc(bx+1.5,by+1.5,4.5,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fill();
        const bg2=ctx.createRadialGradient(bx-1,by-1,0,bx,by,4.5);
        bg2.addColorStop(0,'#fff');bg2.addColorStop(0.4,'#eee');bg2.addColorStop(1,'#999');
        ctx.beginPath();ctx.arc(bx,by,4.5,0,Math.PI*2);ctx.fillStyle=bg2;ctx.fill();
        ctx.beginPath();ctx.arc(bx-1.2,by-1.2,1.2,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fill();
    }

    // Pointer
    ctx.beginPath();ctx.moveTo(cx,cy-outerR+3);ctx.lineTo(cx-5,cy-outerR-7);ctx.lineTo(cx+5,cy-outerR-7);ctx.closePath();ctx.fillStyle='#d4a017';ctx.fill();

    rltParticles.update(); rltParticles.draw(ctx);
}

function spinRlt(){
    if(!rltChoice) return alert('Pick Red, Black, or Green!');
    if(rltState.phase!=='idle') return;
    const bet=getBet('rlt'); if(!bet) return;
    document.getElementById('rlt-btn').disabled=true;
    document.getElementById('rlt-num').textContent='';
    document.getElementById('rlt-result').innerHTML='';

    const rand=Math.random();
    let ri; if(rand<0.027) ri=0; else ri=1+Math.floor(Math.random()*36);

    rltState.bet=bet; rltState.resultIdx=ri;
    rltState.wheelSpeed=0.018+Math.random()*0.01;
    rltState.ballAngle=Math.random()*Math.PI*2;
    rltState.ballSpeed=-(0.11+Math.random()*0.04);
    rltState.ballRadius=128;
    rltState.ballBounce=0;
    rltState.phase='spinning';
    if(rltAnim) cancelAnimationFrame(rltAnim);
    tickRlt();
}

function tickRlt(){
    const s=rltState;
    s.wheelAngle+=s.wheelSpeed;
    s.wheelSpeed*=0.9992;

    if(s.phase==='spinning'){
        s.ballAngle+=s.ballSpeed;
        s.ballSpeed*=0.9935;
        if(Math.abs(s.ballSpeed)<0.025) s.phase='dropping';
    } else if(s.phase==='dropping'){
        s.ballAngle+=s.ballSpeed;
        s.ballSpeed*=0.99;
        s.ballRadius-=0.6;
        s.ballAngle+=Math.sin(s.ballRadius*0.15)*0.004;
        if(s.ballRadius<=100){s.phase='bouncing';s.ballBounce=3+Math.floor(Math.random()*3);playSoundFX('sine',700,0.04,0.15);}
    } else if(s.phase==='bouncing'){
        s.ballAngle+=s.ballSpeed*0.4;
        s.ballSpeed*=0.94;
        s.ballRadius=85+Math.abs(Math.sin(s.ballBounce*1.8))*18;
        s.ballBounce-=0.06;
        if(s.ballBounce<=0){
            s.phase='settling';
            playSoundFX('sine',500,0.06,0.12);
        } else if(Math.random()<0.08){
            playSoundFX('sine',400+Math.random()*300,0.03,0.08);
        }
    } else if(s.phase==='settling'){
        const seg=(Math.PI*2)/37;
        s.ballAngle=s.wheelAngle+s.resultIdx*seg+seg/2;
        s.ballRadius=75;
        s.wheelSpeed*=0.985;
        if(s.wheelSpeed<0.0008){s.wheelSpeed=0;s.phase='result';showRltResult();return;}
    }
    drawRlt();
    rltAnim=requestAnimationFrame(tickRlt);
}

function showRltResult(){
    const num=RLT_NUMBERS[rltState.resultIdx];
    const isRed=RLT_REDS.includes(num);
    const color=num===0?'green':isRed?'red':'black';
    const won=rltChoice===color;
    const mult=rltChoice==='green'?36:2;
    const hex=color==='red'?'#e53935':color==='green'?'#43a047':'#616161';

    document.getElementById('rlt-num').innerHTML=`<span style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:50%;background:${hex};color:#fff;font-size:20px;box-shadow:0 0 15px ${hex};">${num}</span>`;

    const cx=rltCanvas.width/2,cy=rltCanvas.height/2;
    if(won){
        rltParticles.explode(cx,cy,35,color==='red'?['#ef4444','#fbbf24','#ff8a65']:color==='green'?['#43a047','#66bb6a','#fbbf24']:['#9e9e9e','#fbbf24','#e0e0e0']);
        recordGame('Roulette',rltState.bet,true,rltState.bet*(mult-1));
        document.getElementById('rlt-result').innerHTML=showWinResult(rltState.bet*mult);
        showConfetti(); playSound(mult>=36?'jackpot':'win');
    } else {
        recordGame('Roulette',rltState.bet,false,-rltState.bet);
        document.getElementById('rlt-result').innerHTML=showLoseResult(rltState.bet);
        playSound('lose');
    }
    let pf=0;function pa(){rltParticles.update();drawRlt();rltParticles.draw(rltCtx);if(++pf<30)requestAnimationFrame(pa);}pa();
    rltState.phase='idle';
    setTimeout(()=>{document.getElementById('rlt-btn').disabled=false;},2000);
}

// Override roulette in loadGameUI
const _origLoadRlt = loadGameUI;
loadGameUI = function(id) {
    if (id === 'roulette') { renderRouletteReal(document.getElementById('game-body')); return; }
    _origLoadRlt(id);
};
