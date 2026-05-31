// ═══════════════════════════════════════════════════════════════
// BLACKJACK — Realistic Card Table with Canvas
// Smooth card dealing, flip animations, chip stacking
// ═══════════════════════════════════════════════════════════════

let bjCanvas, bjCtx, bjParts;
let bj = { phase:'idle', deck:[], player:[], dealer:[], bet:0, doubled:false };

const SUITS = ['♠','♥','♦','♣'];
const VALS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUIT_COLORS = {'♠':'#fff','♥':'#ef4444','♦':'#ef4444','♣':'#fff'};

function bjMakeDeck(){
    let d=[];
    for(let s of SUITS) for(let v of VALS) d.push({suit:s,val:v,faceUp:false,x:0,y:-80,targetX:0,targetY:0,angle:0});
    for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
    return d;
}

function bjHandValue(cards){
    let t=0,a=0;
    for(const c of cards){
        if(c.val==='A'){a++;t+=11;}
        else if(['K','Q','J'].includes(c.val)) t+=10;
        else t+=parseInt(c.val);
    }
    while(t>21&&a>0){t-=10;a--;}
    return t;
}

function renderBlackjackReal(body){
    body.innerHTML=`
        <div id="bj-box" style="width:100%;max-width:360px;margin:0 auto;"></div>
        <div style="display:flex;justify-content:space-between;padding:4px 20px;font-size:12px;">
            <div>Dealer: <b id="bj-dval" style="color:var(--gold);">-</b></div>
            <div>You: <b id="bj-pval" style="color:var(--green);">-</b></div>
        </div>
        <div id="bj-status" style="text-align:center;font-size:14px;font-weight:700;min-height:24px;margin:4px 0;"></div>
        ${betUI('bjr')}
        <button class="play-button" id="bj-deal-btn" onclick="bjDealReal()">🃏 DEAL</button>
        <div id="bj-actions" style="display:none;gap:8px;margin-top:8px;">
            <button class="play-button" onclick="bjHitReal()" style="flex:1;background:linear-gradient(135deg,#8b5cf6,#6d28d9)">HIT</button>
            <button class="play-button" onclick="bjStandReal()" style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706)">STAND</button>
            <button class="play-button" id="bj-dbl-btn" onclick="bjDoubleReal()" style="flex:1;background:linear-gradient(135deg,#10b981,#059669)">DOUBLE</button>
        </div>
        <div id="bj-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const box=document.getElementById('bj-box');
    bjCanvas=createGameCanvas(box,'bj-cv',360,240);
    bjCtx=bjCanvas.getContext('2d');
    bjParts=new ParticleSystem();
    drawBjTable();
}

function drawBjTable(){
    const ctx=bjCtx,w=bjCanvas.width,h=bjCanvas.height;
    ctx.clearRect(0,0,w,h);
    // Green felt
    const felt=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,200);
    felt.addColorStop(0,'#1b5e20');felt.addColorStop(1,'#0d3010');
    ctx.fillStyle=felt;ctx.fillRect(0,0,w,h);
    // Table edge
    ctx.strokeStyle='#4e342e';ctx.lineWidth=6;
    ctx.strokeRect(3,3,w-6,h-6);
    ctx.strokeStyle='#d4a017';ctx.lineWidth=1;
    ctx.strokeRect(8,8,w-16,h-16);
    // Dealer area label
    ctx.fillStyle='rgba(255,255,255,0.08)';ctx.font='11px Inter';ctx.textAlign='center';
    ctx.fillText('DEALER',w/2,30);
    ctx.fillText('PLAYER',w/2,h-15);
    ctx.textAlign='left';
    
    // Draw cards
    drawBjCards(bj.dealer, w/2, 65, true);
    drawBjCards(bj.player, w/2, 170, false);
    
    bjParts.update();bjParts.draw(ctx);
}

function drawBjCards(cards, cx, cy, isDealer){
    const ctx=bjCtx;
    const spacing=55;
    const startX=cx-(cards.length-1)*spacing/2;
    
    for(let i=0;i<cards.length;i++){
        const c=cards[i];
        const x=startX+i*spacing-25;
        const y=cy-35;
        
        // Card shadow
        ctx.fillStyle='rgba(0,0,0,0.3)';
        drawRoundedRect(ctx,x+3,y+3,50,70,6);ctx.fill();
        
        if(!c.faceUp){
            // Card back
            const back=ctx.createLinearGradient(x,y,x+50,y+70);
            back.addColorStop(0,'#1565c0');back.addColorStop(1,'#0d47a1');
            drawRoundedRect(ctx,x,y,50,70,6);ctx.fillStyle=back;ctx.fill();
            ctx.strokeStyle='#42a5f5';ctx.lineWidth=1;drawRoundedRect(ctx,x,y,50,70,6);ctx.stroke();
            // Pattern
            ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=0.5;
            for(let p=0;p<5;p++){ctx.beginPath();ctx.moveTo(x+10+p*8,y+5);ctx.lineTo(x+5+p*8,y+65);ctx.stroke();}
        } else {
            // Card face
            drawRoundedRect(ctx,x,y,50,70,6);ctx.fillStyle='#fafafa';ctx.fill();
            ctx.strokeStyle='#ddd';ctx.lineWidth=1;drawRoundedRect(ctx,x,y,50,70,6);ctx.stroke();
            // Value + suit
            const color=SUIT_COLORS[c.suit];
            const isRed=c.suit==='♥'||c.suit==='♦';
            ctx.fillStyle=isRed?'#c62828':'#212121';
            ctx.font='bold 16px Inter';ctx.textAlign='center';
            ctx.fillText(c.val,x+25,y+28);
            ctx.font='18px serif';
            ctx.fillText(c.suit,x+25,y+50);
            // Corner
            ctx.font='bold 9px Inter';ctx.textAlign='left';
            ctx.fillText(c.val,x+4,y+12);
            ctx.font='10px serif';
            ctx.fillText(c.suit,x+4,y+22);
            ctx.textAlign='left';
        }
    }
}

function bjDealReal(){
    const bet=getBet('bjr');if(!bet)return;
    bj.deck=bjMakeDeck();
    bj.player=[];bj.dealer=[];bj.bet=bet;bj.doubled=false;bj.phase='playing';
    document.getElementById('bj-deal-btn').style.display='none';
    document.getElementById('bj-actions').style.display='flex';
    document.getElementById('bj-result').innerHTML='';
    document.getElementById('bj-status').textContent='';
    
    // Deal 4 cards with animation
    setTimeout(()=>{dealCard('player',true);},200);
    setTimeout(()=>{dealCard('dealer',true);},500);
    setTimeout(()=>{dealCard('player',true);},800);
    setTimeout(()=>{dealCard('dealer',false);},1100); // Dealer 2nd face down
    setTimeout(()=>{
        updateBjUI();
        if(bjHandValue(bj.player)===21){bjStandReal();}
        if(user.balance<bj.bet){document.getElementById('bj-dbl-btn').style.opacity='0.4';document.getElementById('bj-dbl-btn').disabled=true;}
    },1300);
}

function dealCard(to,faceUp){
    const card=bj.deck.pop();
    card.faceUp=faceUp;
    if(to==='player') bj.player.push(card);
    else bj.dealer.push(card);
    playSoundFX('sine',1000+Math.random()*200,0.06,0.12);
    drawBjTable();
}

function bjHitReal(){
    if(bj.phase!=='playing')return;
    dealCard('player',true);
    updateBjUI();
    if(bjHandValue(bj.player)>21){
        bj.phase='done';
        document.getElementById('bj-status').innerHTML='<span style="color:#ef4444;">BUST!</span>';
        bjFinishReal();
    }
}

function bjStandReal(){
    if(bj.phase!=='playing')return;
    bj.phase='dealer';
    document.getElementById('bj-actions').style.display='none';
    // Reveal dealer card
    bj.dealer[1].faceUp=true;
    drawBjTable();updateBjUI();
    // Dealer draws
    function dealerDraw(){
        if(bjHandValue(bj.dealer)<17){
            setTimeout(()=>{dealCard('dealer',true);updateBjUI();dealerDraw();},600);
        } else {
            setTimeout(()=>{bj.phase='done';bjFinishReal();},400);
        }
    }
    setTimeout(dealerDraw,600);
}

function bjDoubleReal(){
    if(bj.phase!=='playing')return;
    if(user.balance<bj.bet)return alert('Insufficient balance for double!');
    user.balance-=bj.bet;updateBal();
    bj.bet*=2;bj.doubled=true;
    dealCard('player',true);updateBjUI();
    document.getElementById('bj-actions').style.display='none';
    if(bjHandValue(bj.player)>21){bj.phase='done';bjFinishReal();}
    else{setTimeout(()=>bjStandReal(),500);}
}

function bjFinishReal(){
    document.getElementById('bj-actions').style.display='none';
    document.getElementById('bj-deal-btn').style.display='block';
    // Reveal all
    bj.dealer.forEach(c=>c.faceUp=true);
    drawBjTable();updateBjUI();
    
    const pv=bjHandValue(bj.player),dv=bjHandValue(bj.dealer);
    const bet=bj.bet;
    const cx=bjCanvas.width/2,cy=bjCanvas.height/2;
    
    if(pv>21){
        recordGame('Blackjack',bet,false,-bet);
        document.getElementById('bj-result').innerHTML=showLoseResult(bet);
        document.getElementById('bj-status').innerHTML='<span style="color:#ef4444;">BUST! You lose.</span>';
        playSound('lose');
    } else if(pv===21&&bj.player.length===2){
        const win=bet*1.5;
        recordGame('Blackjack',bet,true,win);
        document.getElementById('bj-result').innerHTML=`<div class="win-banner glow-green"><div class="wb-label">🃏 BLACKJACK!</div><div class="wb-amount">+$${(bet+win).toFixed(2)}</div></div>`;
        document.getElementById('bj-status').innerHTML='<span style="color:#fbbf24;">BLACKJACK! 2.5x</span>';
        bjParts.explode(cx,cy,30,['#fbbf24','#10b981','#8b5cf6']);
        showConfetti();playSound('jackpot');
    } else if(dv>21){
        recordGame('Blackjack',bet,true,bet);
        document.getElementById('bj-result').innerHTML=showWinResult(bet*2);
        document.getElementById('bj-status').innerHTML='<span style="color:#10b981;">Dealer busts! You win!</span>';
        bjParts.explode(cx,cy,20,['#10b981','#34d399']);
        showConfetti();playSound('win');
    } else if(pv>dv){
        recordGame('Blackjack',bet,true,bet);
        document.getElementById('bj-result').innerHTML=showWinResult(bet*2);
        document.getElementById('bj-status').innerHTML='<span style="color:#10b981;">You win!</span>';
        bjParts.explode(cx,cy,20,['#10b981','#fbbf24']);
        showConfetti();playSound('win');
    } else if(pv===dv){
        user.balance+=bet;updateBal();saveUser();
        document.getElementById('bj-result').innerHTML='<div style="text-align:center;padding:12px;color:var(--gold);font-weight:700;">🤝 PUSH — Bet returned</div>';
        document.getElementById('bj-status').innerHTML='<span style="color:#fbbf24;">Push!</span>';
    } else {
        recordGame('Blackjack',bet,false,-bet);
        document.getElementById('bj-result').innerHTML=showLoseResult(bet);
        document.getElementById('bj-status').innerHTML='<span style="color:#ef4444;">Dealer wins.</span>';
        playSound('lose');
    }
    // Animate particles
    let f=0;function pa(){bjParts.update();drawBjTable();bjParts.draw(bjCtx);if(++f<25)requestAnimationFrame(pa);}pa();
}

function updateBjUI(){
    const pv=bjHandValue(bj.player);
    const dv=bj.dealer[1]&&bj.dealer[1].faceUp?bjHandValue(bj.dealer):bj.dealer[0]?'?':'';
    document.getElementById('bj-pval').textContent=pv;
    document.getElementById('bj-dval').textContent=dv;
    drawBjTable();
}

// Override handled by game_router.js
