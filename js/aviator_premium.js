// ═══════════════════════════════════════════════════════════════
// AVIATOR — Realistic Plane Flight with Canvas
// Sky gradient, clouds, plane trail, smooth physics
// ═══════════════════════════════════════════════════════════════

let avCanvas, avCtx, avParts, avAnim;
let avState = { active:false, multi:1, crashAt:1, bet:0, startTime:0, planeX:0, planeY:0, trail:[], clouds:[] };

function renderAviatorReal(body){
    body.innerHTML=`
        <div id="av-box" style="width:100%;max-width:360px;margin:0 auto;"></div>
        <div style="text-align:center;margin:6px 0;">
            <div id="av-multi" style="font-size:44px;font-weight:900;color:#10b981;text-shadow:0 0 20px rgba(16,185,129,0.4);">1.00x</div>
        </div>
        ${betUI('avr')}
        <button class="play-button" id="av-go" onclick="startAvReal()">✈️ FLY!</button>
        <button class="play-button hidden" id="av-cash" onclick="cashAvReal()" style="background:linear-gradient(135deg,#10b981,#059669)">💰 CASH OUT — <span id="av-amt">$0.00</span></button>
        <div id="av-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const box=document.getElementById('av-box');
    avCanvas=createGameCanvas(box,'av-cv',360,200);
    avCtx=avCanvas.getContext('2d');
    avParts=new ParticleSystem();
    // Generate clouds
    avState.clouds=[];
    for(let i=0;i<8;i++) avState.clouds.push({x:Math.random()*360,y:20+Math.random()*100,r:15+Math.random()*25,speed:0.2+Math.random()*0.3});
    drawAvIdle();
}

function drawAvIdle(){
    const ctx=avCtx,w=avCanvas.width,h=avCanvas.height;
    ctx.clearRect(0,0,w,h);
    // Sky gradient
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#0c1445');sky.addColorStop(0.4,'#1a237e');sky.addColorStop(0.7,'#283593');sky.addColorStop(1,'#3949ab');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    // Stars
    ctx.fillStyle='rgba(255,255,255,0.4)';
    for(let i=0;i<20;i++){ctx.beginPath();ctx.arc((i*47+13)%w,(i*31+7)%h,0.8,0,Math.PI*2);ctx.fill();}
    // Clouds
    ctx.fillStyle='rgba(255,255,255,0.06)';
    for(const c of avState.clouds){
        ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(c.x+c.r*0.6,c.y-c.r*0.2,c.r*0.7,0,Math.PI*2);ctx.fill();
    }
    // Ground line
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,h-5);ctx.lineTo(w,h-5);ctx.stroke();
}

function drawAvScene(){
    const ctx=avCtx,w=avCanvas.width,h=avCanvas.height;
    drawAvIdle();
    
    // Move clouds
    for(const c of avState.clouds){c.x-=c.speed;if(c.x<-40)c.x=w+40;}
    
    // Trail
    if(avState.trail.length>1){
        ctx.strokeStyle='rgba(255,160,0,0.4)';ctx.lineWidth=3;ctx.lineCap='round';
        ctx.beginPath();
        for(let i=0;i<avState.trail.length;i++){
            const p=avState.trail[i];
            if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
        }
        ctx.stroke();
        // Glow trail
        ctx.strokeStyle='rgba(255,200,0,0.15)';ctx.lineWidth=8;
        ctx.beginPath();
        for(let i=Math.max(0,avState.trail.length-20);i<avState.trail.length;i++){
            const p=avState.trail[i];
            if(i===Math.max(0,avState.trail.length-20))ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
        }
        ctx.stroke();
    }
    
    // Plane
    const px=avState.planeX,py=avState.planeY;
    const angle=Math.atan2(-1,2)*0.5; // Slight upward angle
    ctx.save();ctx.translate(px,py);ctx.rotate(angle-(avState.multi*0.01));
    // Body
    ctx.fillStyle='#e0e0e0';
    ctx.beginPath();ctx.ellipse(0,0,18,6,0,0,Math.PI*2);ctx.fill();
    // Wings
    ctx.fillStyle='#bdbdbd';
    ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(5,-5);ctx.lineTo(3,-15);ctx.lineTo(-3,-15);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(-5,5);ctx.lineTo(5,5);ctx.lineTo(3,15);ctx.lineTo(-3,15);ctx.closePath();ctx.fill();
    // Tail
    ctx.fillStyle='#ef4444';
    ctx.beginPath();ctx.moveTo(-16,-2);ctx.lineTo(-18,-8);ctx.lineTo(-12,-2);ctx.closePath();ctx.fill();
    // Window
    ctx.fillStyle='#42a5f5';
    ctx.beginPath();ctx.ellipse(8,0,4,3,0,0,Math.PI*2);ctx.fill();
    // Engine glow
    ctx.fillStyle='rgba(255,150,0,0.6)';
    ctx.beginPath();ctx.ellipse(-20,0,4+Math.random()*2,2+Math.random(),0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    
    // Engine particles
    if(avState.active&&Math.random()<0.4){
        avParts.emit(px-20,py,1,'#ff9800',2,2);
    }
    
    avParts.update();avParts.draw(ctx);
}

function startAvReal(){
    const bet=getBet('avr');if(!bet)return;
    const crashAt=1/(1-Math.random()*(window.DYNAMIC_RTP||0.97));
    avState={...avState,active:true,multi:1,crashAt,bet,startTime:Date.now(),planeX:30,planeY:180,trail:[]};
    document.getElementById('av-go').classList.add('hidden');
    document.getElementById('av-cash').classList.remove('hidden');
    document.getElementById('av-result').innerHTML='';
    if(avAnim)cancelAnimationFrame(avAnim);
    tickAv();
}

function tickAv(){
    if(!avState.active)return;
    const elapsed=(Date.now()-avState.startTime)/1000;
    avState.multi=1+elapsed*0.12+(elapsed*elapsed*0.015);
    
    // Plane position
    const progress=Math.min(0.85,avState.multi/avState.crashAt);
    avState.planeX=30+progress*280;
    avState.planeY=180-progress*160;
    avState.trail.push({x:avState.planeX,y:avState.planeY});
    if(avState.trail.length>80)avState.trail.shift();
    
    drawAvScene();
    
    // UI
    const display=document.getElementById('av-multi');
    display.textContent=avState.multi.toFixed(2)+'x';
    document.getElementById('av-amt').textContent='$'+(avState.bet*avState.multi).toFixed(2);
    if(avState.multi>2)display.style.color='#fbbf24';
    if(avState.multi>5)display.style.color='#f97316';
    if(avState.multi>10)display.style.color='#ec4899';
    if(avState.multi>20)display.style.color='#a855f7';
    display.style.textShadow=`0 0 ${8+avState.multi*2}px currentColor`;
    
    if(avState.multi>=avState.crashAt){
        avState.active=false;
        avCrash();return;
    }
    avAnim=requestAnimationFrame(tickAv);
}

function avCrash(){
    const px=avState.planeX,py=avState.planeY;
    avParts.explode(px,py,40,['#ef4444','#ff9800','#fbbf24','#fff']);
    
    let f=0;
    function crashAnim(){
        drawAvIdle();
        // Explosion
        const ctx=avCtx;
        ctx.fillStyle='#ef4444';ctx.font='bold 28px Inter';ctx.textAlign='center';
        ctx.fillText('FLEW AWAY!',avCanvas.width/2,avCanvas.height/2);
        ctx.font='14px Inter';ctx.fillStyle='#fbbf24';
        ctx.fillText(avState.crashAt.toFixed(2)+'x',avCanvas.width/2,avCanvas.height/2+25);
        ctx.textAlign='left';
        avParts.update();avParts.draw(ctx);
        if(++f<50)requestAnimationFrame(crashAnim);
    }
    crashAnim();
    
    document.getElementById('av-multi').textContent='💥 '+avState.crashAt.toFixed(2)+'x';
    document.getElementById('av-multi').style.color='#ef4444';
    recordGame('Aviator',avState.bet,false,-avState.bet);
    document.getElementById('av-result').innerHTML=showLoseResult(avState.bet);
    document.getElementById('av-cash').classList.add('hidden');
    document.getElementById('av-go').classList.remove('hidden');
    playSound('lose');
    
    setTimeout(()=>{
        document.getElementById('av-multi').textContent='1.00x';
        document.getElementById('av-multi').style.color='#10b981';
        document.getElementById('av-multi').style.textShadow='0 0 20px rgba(16,185,129,0.4)';
        drawAvIdle();
    },3500);
}

function cashAvReal(){
    if(!avState.active)return;
    avState.active=false;
    if(avAnim)cancelAnimationFrame(avAnim);
    
    const profit=avState.bet*avState.multi-avState.bet;
    recordGame('Aviator',avState.bet,true,profit);
    
    avParts.explode(avState.planeX,avState.planeY,25,['#10b981','#34d399','#fbbf24']);
    let f=0;
    function winAnim(){drawAvScene();avParts.update();avParts.draw(avCtx);if(++f<25)requestAnimationFrame(winAnim);}
    winAnim();
    
    document.getElementById('av-multi').textContent=avState.multi.toFixed(2)+'x ✓';
    document.getElementById('av-result').innerHTML=showWinResult(avState.bet*avState.multi);
    document.getElementById('av-cash').classList.add('hidden');
    document.getElementById('av-go').classList.remove('hidden');
    showConfetti();playSound('win');
    
    setTimeout(()=>{
        document.getElementById('av-multi').textContent='1.00x';
        document.getElementById('av-multi').style.color='#10b981';
        drawAvIdle();
    },3000);
}

// Override
const _origLoadAv=loadGameUI;
loadGameUI=function(id){if(id==='aviator'){renderAviatorReal(document.getElementById('game-body'));return;}_origLoadAv(id);};
