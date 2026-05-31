// ═══════════════════════════════════════════════════════════════
// COIN FLIP — Realistic 3D Coin with Canvas
// Spinning coin, metallic shading, bounce on land
// ═══════════════════════════════════════════════════════════════

let cfCanvas, cfCtx, cfParts;
let cfState = { choice:null, flipping:false };

function renderCoinFlipReal(body){
    body.innerHTML=`
        <div id="cf-box" style="width:100%;max-width:360px;margin:0 auto;"></div>
        <div class="multi-display"><div class="multi-value" style="color:var(--gold)">1.98x</div><div class="multi-label">Pick a side • RTP 97%</div></div>
        <div class="choice-row">
            <button class="choice-btn" id="cf-heads" onclick="cfState.choice='h';document.getElementById('cf-heads').classList.add('selected');document.getElementById('cf-tails').classList.remove('selected')">
                <div style="font-size:28px;color:#fbbf24;">👑</div><div style="font-weight:700;margin-top:4px;">HEADS</div>
            </button>
            <button class="choice-btn" id="cf-tails" onclick="cfState.choice='t';document.getElementById('cf-tails').classList.add('selected');document.getElementById('cf-heads').classList.remove('selected')">
                <div style="font-size:28px;color:#9e9e9e;">🦅</div><div style="font-weight:700;margin-top:4px;">TAILS</div>
            </button>
        </div>
        ${betUI('cfr')}
        <button class="play-button" id="cf-flip-btn" onclick="flipCoinReal()">🪙 FLIP COIN</button>
        <div id="cf-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const box=document.getElementById('cf-box');
    cfCanvas=createGameCanvas(box,'cf-cv',200,200);
    cfCanvas.style.margin='0 auto';
    cfCtx=cfCanvas.getContext('2d');
    cfParts=new ParticleSystem();
    drawCoin(0,'idle');
}

function drawCoin(angle, state){
    const ctx=cfCtx,w=cfCanvas.width,h=cfCanvas.height;
    const cx=w/2,cy=h/2,r=70;
    ctx.clearRect(0,0,w,h);
    
    // Background
    ctx.fillStyle='#0a0e17';ctx.fillRect(0,0,w,h);
    
    // Coin shadow
    const shadowScale=Math.abs(Math.cos(angle));
    ctx.beginPath();ctx.ellipse(cx,cy+r+10,r*0.8,8,0,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fill();
    
    // 3D coin effect using cos(angle) for width scaling
    const scaleX=Math.cos(angle);
    const absScale=Math.abs(scaleX);
    const isHeads=scaleX>=0;
    
    ctx.save();ctx.translate(cx,cy);ctx.scale(absScale<0.05?0.05:absScale,1);
    
    // Coin edge (thickness)
    ctx.beginPath();ctx.ellipse(0,0,r,r,0,0,Math.PI*2);
    const edgeGrad=ctx.createLinearGradient(-r,0,r,0);
    edgeGrad.addColorStop(0,'#b8860b');edgeGrad.addColorStop(0.3,'#ffd700');edgeGrad.addColorStop(0.7,'#daa520');edgeGrad.addColorStop(1,'#b8860b');
    ctx.fillStyle=edgeGrad;ctx.fill();
    ctx.strokeStyle='#8b6914';ctx.lineWidth=3;ctx.stroke();
    
    // Coin face
    ctx.beginPath();ctx.ellipse(0,0,r-4,r-4,0,0,Math.PI*2);
    if(isHeads){
        const faceGrad=ctx.createRadialGradient(-15,-15,0,0,0,r);
        faceGrad.addColorStop(0,'#fff8e1');faceGrad.addColorStop(0.5,'#ffd54f');faceGrad.addColorStop(1,'#f9a825');
        ctx.fillStyle=faceGrad;
    } else {
        const faceGrad=ctx.createRadialGradient(-15,-15,0,0,0,r);
        faceGrad.addColorStop(0,'#e0e0e0');faceGrad.addColorStop(0.5,'#9e9e9e');faceGrad.addColorStop(1,'#616161');
        ctx.fillStyle=faceGrad;
    }
    ctx.fill();
    
    // Face design
    if(absScale>0.3){
        ctx.fillStyle=isHeads?'rgba(183,110,0,0.6)':'rgba(50,50,50,0.6)';
        ctx.font=`bold ${Math.floor(36*absScale)}px serif`;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(isHeads?'👑':'🦅',0,0);
    }
    
    // Rim detail
    ctx.beginPath();ctx.ellipse(0,0,r-8,r-8,0,0,Math.PI*2);
    ctx.strokeStyle=isHeads?'rgba(183,110,0,0.3)':'rgba(100,100,100,0.3)';
    ctx.lineWidth=2;ctx.stroke();
    
    ctx.restore();
    
    // Shine highlight
    if(state!=='idle'){
        ctx.beginPath();ctx.ellipse(cx-20,cy-25,12*absScale,8,0,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fill();
    }
    
    cfParts.update();cfParts.draw(ctx);
}

function flipCoinReal(){
    if(!cfState.choice)return alert('Pick Heads or Tails!');
    if(cfState.flipping)return;
    const bet=getBet('cfr');if(!bet)return;
    cfState.flipping=true;
    document.getElementById('cf-flip-btn').disabled=true;
    document.getElementById('cf-result').innerHTML='';
    
    const won=Math.random()<(0.97/1.98);
    // If won, result matches choice. If lost, result is opposite.
    const resultIsHeads=won?(cfState.choice==='h'):(cfState.choice!=='h');
    
    // Flip animation: spin for ~2 seconds
    let angle=0;
    let speed=0.35;
    let frame=0;
    const totalFrames=90;
    
    function flipFrame(){
        frame++;
        speed*=0.97; // Decelerate
        angle+=speed;
        
        // Near end, align to correct face
        if(frame>totalFrames-15){
            const targetAngle=resultIsHeads?0:Math.PI;
            const diff=targetAngle-((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
            angle+=diff*0.1;
        }
        
        drawCoin(angle,'flipping');
        
        if(frame<totalFrames){
            requestAnimationFrame(flipFrame);
        } else {
            // Final position
            drawCoin(resultIsHeads?0:Math.PI,'result');
            cfState.flipping=false;
            
            const cx=cfCanvas.width/2,cy=cfCanvas.height/2;
            if(won){
                const winAmt=bet*1.98;
                cfParts.explode(cx,cy,25,['#fbbf24','#10b981','#fff']);
                recordGame('Coin Flip',bet,true,winAmt-bet);
                document.getElementById('cf-result').innerHTML=showWinResult(winAmt);
                showConfetti();playSound('win');
            } else {
                cfParts.explode(cx,cy,10,['#ef4444','#9e9e9e']);
                recordGame('Coin Flip',bet,false,-bet);
                document.getElementById('cf-result').innerHTML=showLoseResult(bet);
                playSound('lose');
            }
            // Particle anim
            let pf=0;function pa(){cfParts.update();drawCoin(resultIsHeads?0:Math.PI,'result');cfParts.draw(cfCtx);if(++pf<20)requestAnimationFrame(pa);}pa();
            
            setTimeout(()=>{document.getElementById('cf-flip-btn').disabled=false;},2000);
        }
    }
    requestAnimationFrame(flipFrame);
}

// Override
const _origLoadCF=loadGameUI;
loadGameUI=function(id){if(id==='coinflip'){renderCoinFlipReal(document.getElementById('game-body'));return;}_origLoadCF(id);};
