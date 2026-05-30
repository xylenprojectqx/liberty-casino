// === LIBERTY CASINO - Premium Games Engine v3 ===
let EDGE = 0.03;

// === RTP Rates (Real Casino Standards) - Can be overridden by admin via Firebase ===
let RTP = { coinflip: 0.97, dice: 0.97, slots: 0.96, mines: 0.97, crash: 0.96, plinko: 0.97, wheel: 0.95, hilo: 0.97, keno: 0.95, roulette: 0.973, limbo: 0.97, tower: 0.97 };
let CF_MULTI = 1.98;
let DICE_RTP = 0.97;

// Dynamic RTP override (loaded from Firebase by features.js)
function applyDynamicRTP(newRTP) {
    if (!newRTP || newRTP < 0.8 || newRTP > 0.99) return;
    EDGE = 1 - newRTP;
    for (const key of Object.keys(RTP)) {
        RTP[key] = newRTP;
    }
    CF_MULTI = newRTP * 2 + 0.04; // Adjust coinflip multiplier
    DICE_RTP = newRTP;
}

// === EFFECTS ===
function showConfetti() {
    const c = document.createElement('div'); c.className = 'confetti-container'; document.body.appendChild(c);
    const colors = ['#f59e0b','#10b981','#8b5cf6','#ef4444','#3b82f6','#ec4899','#14b8a6'];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div'); p.className = 'confetti-piece';
        p.style.cssText = `left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*7)]};animation-delay:${Math.random()*2}s;animation-duration:${2+Math.random()*2}s;width:${6+Math.random()*10}px;height:${6+Math.random()*10}px;border-radius:${Math.random()>0.5?'50%':'2px'};`;
        c.appendChild(p);
    }
    setTimeout(() => c.remove(), 4000);
}
function showWinResult(amount) { return `<div class="win-banner glow-green"><div class="wb-label">🎉 YOU WIN!</div><div class="wb-amount">+${amount.toFixed(2)} USDT</div></div>`; }
function showLoseResult(amount) { return `<div class="lose-banner"><div class="wb-label">Better luck next time</div><div class="wb-amount">-${amount.toFixed(2)} USDT</div></div>`; }

// === GAMES LIST ===
const gamesList = [
    { id: 'coinflip', name: 'Coin Flip', icon: '🪙', mult: '1.98x • 97%', coming: false },
    { id: 'dice', name: 'Dice Roll', icon: '🎲', mult: 'Custom • 97%', coming: false },
    { id: 'slots', name: 'Mega Slots', icon: '🎰', mult: 'up to 100x • 96%', coming: false },
    { id: 'mines', name: 'Mines', icon: '💣', mult: 'up to 25x • 97%', coming: false },
    { id: 'crash', name: 'Crash', icon: '🚀', mult: 'up to ∞ • 96%', coming: false },
    { id: 'plinko', name: 'Plinko', icon: '⚪', mult: 'up to 1000x • 97%', coming: false },
    { id: 'wheel', name: 'Fortune Wheel', icon: '🎡', mult: 'up to 50x • 95%', coming: false },
    { id: 'hilo', name: 'Hi-Lo Cards', icon: '🃏', mult: 'up to 12x • 97%', coming: false },
    { id: 'keno', name: 'Keno', icon: '🔢', mult: 'up to 100x • 95%', coming: false },
    { id: 'roulette', name: 'Roulette', icon: '🔴', mult: 'up to 36x • 97.3%', coming: false },
    { id: 'limbo', name: 'Limbo', icon: '📊', mult: 'up to 1000x • 97%', coming: false },
    { id: 'tower', name: 'Tower', icon: '🏗️', mult: 'up to 50x • 97%', coming: false },
];

function loadGameUI(id) {
    const body = document.getElementById('game-body');
    switch(id) {
        case 'coinflip': renderCoinFlip(body); break;
        case 'dice': renderDice(body); break;
        case 'slots': renderSlots(body); break;
        case 'mines': renderMines(body); break;
        case 'crash': renderCrash(body); break;
        case 'plinko': renderPlinko(body); break;
        case 'wheel': renderWheel(body); break;
        case 'hilo': renderHiLo(body); break;
        case 'keno': renderKeno(body); break;
        case 'roulette': renderRoulette(body); break;
        case 'limbo': renderLimbo(body); break;
        case 'tower': renderTower(body); break;
    }
}

// === BET UI ===
function betUI(id) {
    return `<div class="bet-container">
        <div class="bet-label">BET AMOUNT <span style="color:var(--text3);font-size:10px;">(Min $1 • Max $500)</span></div>
        <div class="bet-input-wrap">
            <input type="number" id="${id}-bet" value="1" min="1" max="500" step="0.5">
            <div class="bet-quick">
                <button onclick="document.getElementById('${id}-bet').value='1'">$1</button>
                <button onclick="document.getElementById('${id}-bet').value='5'">$5</button>
                <button onclick="document.getElementById('${id}-bet').value='10'">$10</button>
                <button onclick="document.getElementById('${id}-bet').value='50'">$50</button>
                <button onclick="document.getElementById('${id}-bet').value=Math.min(500,user.balance/2).toFixed(2)">½</button>
                <button onclick="document.getElementById('${id}-bet').value=Math.min(500,user.balance).toFixed(2)">MAX</button>
            </div>
        </div>
    </div>`;
}

function getBet(id) {
    const v = parseFloat(document.getElementById(`${id}-bet`)?.value);
    if (!v || v <= 0) { alert('Enter a valid bet!'); return null; }
    if (v < 1) { alert('Minimum bet: $1.00'); return null; }
    if (v > 500) { alert('Maximum bet: $500.00'); return null; }
    if (v > user.balance) { alert('Insufficient balance!'); return null; }
    if (user.balance <= 0) { alert('No balance! Please deposit.'); return null; }
    user.balance -= v;
    if (user.balance < 0) user.balance = 0;
    updateBal();
    saveUser();
    playSound('bet');
    return v;
}


// ═══════════════════════════════════════════════════════════════
// 1. COIN FLIP — 3D Animated Gold Coin
// ═══════════════════════════════════════════════════════════════
let cfChoice = null;
function renderCoinFlip(body) {
    cfChoice = null;
    body.innerHTML = `
        <div style="text-align:center;padding:20px 0;">
            <div style="position:relative;display:inline-block;">
                <div class="pulse-ring" id="cf-ring" style="display:none;margin:auto;"></div>
                <div class="coin-3d" id="cf-coin">🪙</div>
            </div>
        </div>
        <div class="multi-display"><div class="multi-value" style="color:var(--gold)">1.98x</div><div class="multi-label">Payout • RTP 97%</div></div>
        <div class="choice-row">
            <button class="choice-btn" id="cf-h" onclick="cfChoice='h';document.getElementById('cf-h').classList.add('selected');document.getElementById('cf-t').classList.remove('selected')">
                <div style="font-size:32px">👑</div><div style="font-weight:700;margin-top:4px">HEADS</div>
            </button>
            <button class="choice-btn" id="cf-t" onclick="cfChoice='t';document.getElementById('cf-t').classList.add('selected');document.getElementById('cf-h').classList.remove('selected')">
                <div style="font-size:32px">🦅</div><div style="font-weight:700;margin-top:4px">TAILS</div>
            </button>
        </div>
        ${betUI('cf')}
        <button class="play-button" id="cf-btn" onclick="playCoinFlip()">🪙 FLIP COIN</button>
        <div id="cf-result" style="min-height:80px;margin-top:12px;"></div>`;
}
function playCoinFlip() {
    if (!cfChoice) return alert('Pick Heads or Tails!');
    const bet = getBet('cf'); if (!bet) return;
    document.getElementById('cf-btn').disabled = true;
    const coin = document.getElementById('cf-coin');
    const won = Math.random() < (RTP.coinflip / CF_MULTI);
    coin.classList.add('flip-anim');
    setTimeout(() => {
        coin.classList.remove('flip-anim');
        const emoji = won ? (cfChoice==='h'?'👑':'🦅') : (cfChoice==='h'?'🦅':'👑');
        coin.textContent = emoji;
        coin.classList.add('bounce');
        if (won) {
            const winAmt = bet * CF_MULTI;
            recordGame('Coin Flip', bet, true, winAmt - bet);
            coin.classList.add('glow-green');
            document.getElementById('cf-result').innerHTML = showWinResult(winAmt);
            showConfetti();
        } else {
            recordGame('Coin Flip', bet, false, -bet);
            coin.classList.add('glow-red','shake');
            document.getElementById('cf-result').innerHTML = showLoseResult(bet);
        }
        setTimeout(() => { coin.textContent='🪙'; coin.className='coin-3d'; document.getElementById('cf-btn').disabled=false; }, 2500);
    }, 1500);
}

// ═══════════════════════════════════════════════════════════════
// 2. DICE ROLL — Slider + Animated Die
// ═══════════════════════════════════════════════════════════════
let diceDir = 'over';
function renderDice(body) {
    diceDir = 'over';
    body.innerHTML = `
        <div style="text-align:center;padding:16px 0;">
            <div id="dice-face" style="font-size:72px;display:inline-block;transition:transform 0.3s;">🎲</div>
            <div id="dice-num" style="font-size:28px;font-weight:800;min-height:36px;margin-top:8px;color:var(--gold);"></div>
        </div>
        <div style="padding:0 20px;margin:12px 0;">
            <input type="range" id="dice-slider" min="2" max="98" value="50" style="width:100%;accent-color:var(--accent);" oninput="updateDiceUI()">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-top:4px;">
                <span>2</span><span>Roll <span id="dice-dir">Over</span> <b id="dice-target">50</b></span><span>98</span>
            </div>
        </div>
        <div class="choice-row">
            <button class="choice-btn selected" id="d-over" onclick="diceDir='over';document.getElementById('d-over').classList.add('selected');document.getElementById('d-under').classList.remove('selected');updateDiceUI()">⬆️ OVER</button>
            <button class="choice-btn" id="d-under" onclick="diceDir='under';document.getElementById('d-under').classList.add('selected');document.getElementById('d-over').classList.remove('selected');updateDiceUI()">⬇️ UNDER</button>
        </div>
        <div class="multi-display"><div class="multi-value" id="dice-multi">1.94x</div><div class="multi-label">Multiplier • <span id="dice-chance">50%</span> chance</div></div>
        ${betUI('dice')}
        <button class="play-button" id="dice-btn" onclick="playDice()">🎲 ROLL DICE</button>
        <div id="dice-result" style="min-height:80px;margin-top:12px;"></div>`;
    updateDiceUI();
}
function updateDiceUI() {
    const val = parseInt(document.getElementById('dice-slider').value);
    document.getElementById('dice-target').textContent = val;
    document.getElementById('dice-dir').textContent = diceDir === 'over' ? 'Over' : 'Under';
    const chance = diceDir === 'over' ? (99 - val) / 100 : (val - 1) / 100;
    const multi = Math.max(1.01, (DICE_RTP / chance)).toFixed(4);
    document.getElementById('dice-multi').textContent = parseFloat(multi).toFixed(2) + 'x';
    document.getElementById('dice-chance').textContent = (chance * 100).toFixed(1) + '%';
}
function playDice() {
    const bet = getBet('dice'); if (!bet) return;
    document.getElementById('dice-btn').disabled = true;
    const target = parseInt(document.getElementById('dice-slider').value);
    const chance = diceDir === 'over' ? (99 - target) / 100 : (target - 1) / 100;
    const multi = Math.max(1.01, DICE_RTP / chance);
    const face = document.getElementById('dice-face');
    const emojis = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    let c = 0;
    const anim = setInterval(() => {
        face.textContent = emojis[Math.floor(Math.random()*6)];
        face.style.transform = `rotate(${Math.random()*40-20}deg) scale(${0.9+Math.random()*0.2})`;
        if (++c > 18) { clearInterval(anim); face.style.transform = 'rotate(0) scale(1)';
            const roll = Math.floor(Math.random()*99)+1;
            const won = diceDir==='over' ? roll > target : roll < target;
            face.textContent = emojis[Math.min(5,Math.floor(roll/17))];
            document.getElementById('dice-num').textContent = roll;
            document.getElementById('dice-num').classList.add('count-up');
            if (won) {
                const profit = bet * multi - bet;
                recordGame('Dice', bet, true, profit);
                face.classList.add('glow-green','bounce');
                document.getElementById('dice-result').innerHTML = showWinResult(bet * multi);
                if (multi >= 5) showConfetti();
            } else {
                recordGame('Dice', bet, false, -bet);
                face.classList.add('shake');
                document.getElementById('dice-result').innerHTML = showLoseResult(bet);
            }
            setTimeout(() => { face.className=''; document.getElementById('dice-btn').disabled=false; }, 2000);
        }
    }, 55);
}


// ═══════════════════════════════════════════════════════════════
// 3. MEGA SLOTS — 3 Reels with Spinning Animation
// ═══════════════════════════════════════════════════════════════
function renderSlots(body) {
    body.innerHTML = `
        <div style="text-align:center;padding:12px 0;">
            <div class="slots-display">
                <div class="slot-reel" id="sr1">🍒</div>
                <div class="slot-reel" id="sr2">🍋</div>
                <div class="slot-reel" id="sr3">🍊</div>
            </div>
            <div style="font-size:11px;color:var(--text3);margin-top:8px;">
                7️⃣7️⃣7️⃣ = 100x • 💎💎💎 = 50x • ⭐⭐⭐ = 20x • 3x = 10x • 2x = 2x | RTP 96%
            </div>
        </div>
        ${betUI('slots')}
        <button class="play-button" id="slots-btn" onclick="playSlots()">🎰 SPIN</button>
        <div id="slots-result" style="min-height:80px;margin-top:12px;"></div>`;
}
function playSlots() {
    const bet = getBet('slots'); if (!bet) return;
    document.getElementById('slots-btn').disabled = true;
    const symbols = ['🍒','🍋','🍊','🍇','⭐','💎','7️⃣'];
    const reels = ['sr1','sr2','sr3'];
    reels.forEach(r => document.getElementById(r).classList.add('slot-spinning'));
    let c = 0;
    const anim = setInterval(() => {
        reels.forEach(r => document.getElementById(r).textContent = symbols[Math.floor(Math.random()*7)]);
        if (++c > 30) { clearInterval(anim);
            reels.forEach(r => document.getElementById(r).classList.remove('slot-spinning'));
            const rand = Math.random(); let s1,s2,s3,mult=0;
            if (rand<0.003){s1=s2=s3='7️⃣';mult=100;}
            else if(rand<0.008){s1=s2=s3='💎';mult=50;}
            else if(rand<0.02){s1=s2=s3='⭐';mult=20;}
            else if(rand<0.05){s1=s2=s3=symbols[Math.floor(Math.random()*4)];mult=10;}
            else if(rand<0.18){s1=s2=symbols[Math.floor(Math.random()*7)];do{s3=symbols[Math.floor(Math.random()*7)];}while(s3===s1);mult=2;}
            else if(rand<0.30){s1=s2=symbols[Math.floor(Math.random()*7)];do{s3=symbols[Math.floor(Math.random()*7)];}while(s3===s1);mult=1.5;}
            else{s1=symbols[Math.floor(Math.random()*7)];do{s2=symbols[Math.floor(Math.random()*7)];}while(s2===s1);do{s3=symbols[Math.floor(Math.random()*7)];}while(s3===s1||s3===s2);mult=0;}
            document.getElementById('sr1').textContent=s1; document.getElementById('sr2').textContent=s2; document.getElementById('sr3').textContent=s3;
            const res = document.getElementById('slots-result');
            if (mult>0) { recordGame('Slots',bet,true,bet*(mult-1)); reels.forEach(r=>document.getElementById(r).classList.add('glow-gold','bounce')); res.innerHTML=showWinResult(bet*mult); if(mult>=10)showConfetti(); }
            else { recordGame('Slots',bet,false,-bet); reels.forEach(r=>document.getElementById(r).classList.add('shake')); res.innerHTML=showLoseResult(bet); }
            setTimeout(()=>{reels.forEach(r=>{const el=document.getElementById(r);el.className='slot-reel';}); document.getElementById('slots-btn').disabled=false;},2500);
        }
    }, 55);
}

// ═══════════════════════════════════════════════════════════════
// 4. MINES — Interactive 5x5 Grid
// ═══════════════════════════════════════════════════════════════
let mState = { active: false };
function renderMines(body) {
    body.innerHTML = `
        <div class="multi-display"><div class="multi-value" id="m-multi">1.00x</div><div class="multi-label">Multiplier • <span id="m-profit">0.00</span> USDT profit</div></div>
        <div class="mines-board" id="m-board"></div>
        <div style="text-align:center;margin:8px 0;font-size:12px;color:var(--text3);">
            Mines: <select id="m-count" style="background:var(--bg3);color:white;border:none;padding:4px 8px;border-radius:6px;font-size:13px;">
                <option value="1">1 (Safe)</option><option value="3">3</option><option value="5" selected>5</option><option value="10">10</option><option value="15">15</option><option value="20">20 (Risky)</option><option value="24">24 (Extreme)</option>
            </select>
        </div>
        ${betUI('mines')}
        <button class="play-button" id="m-start" onclick="startMines()">💣 START GAME</button>
        <button class="play-button hidden" id="m-cash" onclick="cashMines()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT (<span id="m-cashamt">0.00</span>)</button>
        <div id="m-msg" style="min-height:60px;margin-top:12px;"></div>`;
    buildMineBoard();
}
function buildMineBoard() { const b=document.getElementById('m-board'); b.innerHTML=''; for(let i=0;i<25;i++){const c=document.createElement('div');c.className='mine-cell';c.id=`mc-${i}`;c.onclick=()=>clickMine(i);b.appendChild(c);} }
function startMines() {
    const bet = getBet('mines'); if (!bet) return;
    const mc = parseInt(document.getElementById('m-count').value);
    let mines=[]; while(mines.length<mc){const p=Math.floor(Math.random()*25);if(!mines.includes(p))mines.push(p);}
    mState={active:true,bet,mines,revealed:[],multi:1,mineCount:mc};
    document.getElementById('m-start').classList.add('hidden');
    document.getElementById('m-cash').classList.remove('hidden');
    document.getElementById('m-msg').innerHTML='<span class="text-muted">🎯 Tap tiles to find gems! Avoid bombs.</span>';
    buildMineBoard();
}
function clickMine(i) {
    if(!mState.active||mState.revealed.includes(i))return;
    mState.revealed.push(i);
    const cell=document.getElementById(`mc-${i}`);
    if(mState.mines.includes(i)){
        cell.textContent='💣'; cell.className='mine-cell revealed-mine mine-explode';
        mState.active=false;
        mState.mines.forEach((p,idx)=>{setTimeout(()=>{document.getElementById(`mc-${p}`).textContent='💣';document.getElementById(`mc-${p}`).className='mine-cell revealed-mine mine-explode';},idx*80);});
        recordGame('Mines',mState.bet,false,-mState.bet);
        document.getElementById('m-msg').innerHTML=showLoseResult(mState.bet);
        document.getElementById('m-cash').classList.add('hidden');document.getElementById('m-start').classList.remove('hidden');
    } else {
        cell.textContent='💎'; cell.className='mine-cell revealed-gem gem-sparkle';
        const safe=25-mState.mineCount; const found=mState.revealed.length;
        mState.multi = 1; for(let k=0;k<found;k++){mState.multi*=safe/(safe-k);} mState.multi*=RTP.mines;
        document.getElementById('m-multi').textContent=mState.multi.toFixed(2)+'x';
        document.getElementById('m-profit').textContent=(mState.bet*mState.multi-mState.bet).toFixed(2);
        document.getElementById('m-cashamt').textContent=(mState.bet*mState.multi).toFixed(2);
        if(mState.revealed.length>=25-mState.mineCount){cashMines();}
    }
}
function cashMines() {
    if(!mState.active)return; mState.active=false;
    const profit=mState.bet*mState.multi-mState.bet;
    recordGame('Mines',mState.bet,true,profit);
    document.getElementById('m-msg').innerHTML=showWinResult(mState.bet*mState.multi); showConfetti();
    mState.mines.forEach((p,idx)=>{setTimeout(()=>{document.getElementById(`mc-${p}`).textContent='💣';document.getElementById(`mc-${p}`).className='mine-cell revealed-mine';},idx*80);});
    document.getElementById('m-cash').classList.add('hidden');document.getElementById('m-start').classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// 5. CRASH — Live Rising Multiplier
// ═══════════════════════════════════════════════════════════════
let crashState = { active: false };
function renderCrash(body) {
    body.innerHTML = `
        <div class="crash-canvas" id="crash-box">
            <div class="crash-line" id="crash-line"></div>
            <div class="crash-multiplier" id="crash-multi">1.00x</div>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--text3);margin:6px 0;">Cash out before it crashes! RTP 96%</div>
        ${betUI('crash')}
        <button class="play-button" id="crash-start" onclick="startCrash()">🚀 LAUNCH</button>
        <button class="play-button hidden" id="crash-stop" onclick="stopCrash()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT (<span id="crash-amt">0.00</span>)</button>
        <div id="crash-msg" style="min-height:80px;margin-top:12px;"></div>`;
}
function startCrash() {
    const bet=getBet('crash'); if(!bet)return;
    const crashAt=1/(1-Math.random()*RTP.crash);
    crashState={active:true,bet,multi:1,crashAt};
    document.getElementById('crash-start').classList.add('hidden');
    document.getElementById('crash-stop').classList.remove('hidden');
    document.getElementById('crash-msg').innerHTML='';
    const display=document.getElementById('crash-multi');
    const line=document.getElementById('crash-line');
    display.className='crash-multiplier'; display.style.color='var(--green)';
    line.style.background='linear-gradient(90deg,var(--green),var(--gold))';
    const tick=setInterval(()=>{
        if(!crashState.active){clearInterval(tick);return;}
        crashState.multi+=0.01+(crashState.multi*0.003);
        display.textContent=crashState.multi.toFixed(2)+'x';
        document.getElementById('crash-amt').textContent=(crashState.bet*crashState.multi).toFixed(2);
        line.style.width=Math.min(100,(crashState.multi/crashState.crashAt)*100)+'%';
        line.style.height=Math.min(180,(crashState.multi/crashState.crashAt)*150)+'px';
        if(crashState.multi>3)display.style.color='var(--gold)';
        if(crashState.multi>8)display.style.color='#ec4899';
        if(crashState.multi>=crashState.crashAt){
            clearInterval(tick); crashState.active=false;
            display.textContent='💥 '+crashState.crashAt.toFixed(2)+'x';
            display.className='crash-multiplier crashed';
            line.style.background='var(--red)';
            document.getElementById('crash-box').classList.add('shake');
            recordGame('Crash',bet,false,-bet);
            document.getElementById('crash-msg').innerHTML=showLoseResult(bet);
            document.getElementById('crash-stop').classList.add('hidden');document.getElementById('crash-start').classList.remove('hidden');
            setTimeout(()=>document.getElementById('crash-box').classList.remove('shake'),500);
        }
    },50);
}
function stopCrash(){
    if(!crashState.active)return; crashState.active=false;
    const profit=crashState.bet*crashState.multi-crashState.bet;
    recordGame('Crash',crashState.bet,true,profit);
    document.getElementById('crash-multi').textContent=crashState.multi.toFixed(2)+'x ✓';
    document.getElementById('crash-msg').innerHTML=showWinResult(crashState.bet*crashState.multi);
    showConfetti();
    document.getElementById('crash-stop').classList.add('hidden');document.getElementById('crash-start').classList.remove('hidden');
}


// ═══════════════════════════════════════════════════════════════
// 6. PLINKO — Risk Levels
// ═══════════════════════════════════════════════════════════════
let plinkoRisk='low';
function renderPlinko(body) {
    body.innerHTML = `
        <div style="text-align:center;margin:12px 0;">
            <div class="choice-row">
                <button class="choice-btn selected" id="pl-l" onclick="plinkoRisk='low';document.querySelectorAll('[id^=pl-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">🟢 Low</button>
                <button class="choice-btn" id="pl-m" onclick="plinkoRisk='med';document.querySelectorAll('[id^=pl-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">🟡 Medium</button>
                <button class="choice-btn" id="pl-h" onclick="plinkoRisk='high';document.querySelectorAll('[id^=pl-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">🔴 High</button>
            </div>
        </div>
        <div style="text-align:center;padding:20px 0;">
            <div id="plinko-ball" style="font-size:48px;display:inline-block;">⚪</div>
            <div id="plinko-mult" style="font-size:36px;font-weight:800;color:var(--gold);min-height:44px;margin-top:8px;"></div>
        </div>
        ${betUI('plinko')}
        <button class="play-button" id="plinko-btn" onclick="playPlinko()">⚪ DROP BALL</button>
        <div id="plinko-msg" style="min-height:80px;margin-top:12px;"></div>`;
}
function playPlinko(){
    const bet=getBet('plinko');if(!bet)return;
    document.getElementById('plinko-btn').disabled=true;
    const mults={low:[1.5,1.2,1.1,0.9,0.7,0.5,0.7,0.9,1.1,1.2,1.5,2,3,2,1.5],med:[5,3,1.5,1,0.5,0.3,0.2,0.3,0.5,1,1.5,3,5,8,3],high:[100,25,10,5,2,0.2,0.1,0.1,0.1,0.2,2,5,10,25,100]};
    const pool=mults[plinkoRisk];
    const weights=pool.map((_,i)=>Math.exp(-Math.pow((i-pool.length/2)/(pool.length/4),2)));
    const totalW=weights.reduce((a,b)=>a+b); let r=Math.random()*totalW,idx=0;
    for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0){idx=i;break;}}
    const mult=pool[idx];
    const ball=document.getElementById('plinko-ball');
    ball.style.animation='float 0.3s infinite';
    setTimeout(()=>{
        ball.style.animation=''; document.getElementById('plinko-mult').textContent=mult+'x';
        const profit=bet*mult-bet;
        if(profit>=0){recordGame('Plinko',bet,true,profit);document.getElementById('plinko-msg').innerHTML=showWinResult(bet*mult);if(mult>=5)showConfetti();}
        else{recordGame('Plinko',bet,false,profit);document.getElementById('plinko-msg').innerHTML=showLoseResult(-profit);}
        document.getElementById('plinko-btn').disabled=false;
    },1200);
}

// ═══════════════════════════════════════════════════════════════
// 7. FORTUNE WHEEL — Spinning Wheel
// ═══════════════════════════════════════════════════════════════
function renderWheel(body) {
    body.innerHTML = `
        <div class="wheel-container">
            <div class="wheel-pointer">🔻</div>
            <div class="wheel-spinner" id="wheel-spin"></div>
            <div class="wheel-center">🎰</div>
        </div>
        <div id="wheel-mult" style="text-align:center;font-size:28px;font-weight:800;color:var(--gold);min-height:36px;margin:12px 0;"></div>
        ${betUI('wheel')}
        <button class="play-button" id="wheel-btn" onclick="playWheel()">🎡 SPIN WHEEL</button>
        <div id="wheel-msg" style="min-height:80px;margin-top:12px;"></div>`;
}
function playWheel(){
    const bet=getBet('wheel');if(!bet)return;
    document.getElementById('wheel-btn').disabled=true;
    const segments=[{m:0,l:'💀'},{m:1.5,l:'🟢'},{m:2,l:'🔵'},{m:0,l:'💀'},{m:3,l:'🟡'},{m:1.5,l:'🟢'},{m:0,l:'💀'},{m:5,l:'🟠'},{m:1.5,l:'🟢'},{m:0,l:'💀'},{m:2,l:'🔵'},{m:10,l:'🔴'},{m:0,l:'💀'},{m:1.5,l:'🟢'},{m:50,l:'💎'},{m:0,l:'💀'}];
    const spinner=document.getElementById('wheel-spin');
    const deg=1800+Math.random()*1440;
    spinner.style.transform=`rotate(${deg}deg)`;
    setTimeout(()=>{
        const idx=Math.floor(Math.random()*segments.length);
        const seg=segments[idx];
        document.getElementById('wheel-mult').textContent=seg.l+' '+seg.m+'x';
        if(seg.m>0){const profit=bet*seg.m-bet;recordGame('Wheel',bet,true,profit);document.getElementById('wheel-msg').innerHTML=showWinResult(bet*seg.m);if(seg.m>=10)showConfetti();}
        else{recordGame('Wheel',bet,false,-bet);document.getElementById('wheel-msg').innerHTML=showLoseResult(bet);}
        document.getElementById('wheel-btn').disabled=false;
        setTimeout(()=>{spinner.style.transition='none';spinner.style.transform='rotate(0)';setTimeout(()=>{spinner.style.transition='transform 4s cubic-bezier(0.17,0.67,0.12,0.99)';},50);},500);
    },4000);
}

// ═══════════════════════════════════════════════════════════════
// 8. HI-LO CARDS
// ═══════════════════════════════════════════════════════════════
function renderHiLo(body){
    const cards=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const cur=Math.floor(Math.random()*13);
    body.innerHTML=`
        <div style="text-align:center;padding:20px 0;">
            <div style="font-size:11px;color:var(--text3);">Current Card</div>
            <div style="font-size:56px;font-weight:800;width:90px;height:120px;background:linear-gradient(135deg,var(--bg2),var(--bg3));border-radius:12px;display:flex;align-items:center;justify-content:center;margin:8px auto;border:2px solid var(--bg4);" id="hilo-card">${cards[cur]}</div>
            <div style="font-size:12px;color:var(--text3);">Value: ${cur+1} of 13</div>
        </div>
        <div class="multi-display"><div class="multi-value">1.98x</div><div class="multi-label">Payout • RTP 97%</div></div>
        ${betUI('hilo')}
        <div class="choice-row">
            <button class="choice-btn" onclick="playHiLo('hi',${cur})">⬆️ HIGHER</button>
            <button class="choice-btn" onclick="playHiLo('lo',${cur})">⬇️ LOWER</button>
        </div>
        <div id="hilo-msg" style="min-height:80px;margin-top:12px;"></div>`;
}
function playHiLo(choice,current){
    const bet=getBet('hilo');if(!bet)return;
    const cards=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const next=Math.floor(Math.random()*13);
    const won=(choice==='hi'&&next>current)||(choice==='lo'&&next<current);
    const card=document.getElementById('hilo-card');
    card.textContent='?'; card.classList.add('flip-anim');
    setTimeout(()=>{
        card.classList.remove('flip-anim'); card.textContent=cards[next];
        card.style.borderColor=won?'var(--green)':'var(--red)';
        if(won){recordGame('Hi-Lo',bet,true,bet*0.98);document.getElementById('hilo-msg').innerHTML=showWinResult(bet*1.98);showConfetti();}
        else{recordGame('Hi-Lo',bet,false,-bet);document.getElementById('hilo-msg').innerHTML=showLoseResult(bet);}
        setTimeout(()=>renderHiLo(document.getElementById('game-body')),2500);
    },800);
}

// ═══════════════════════════════════════════════════════════════
// 9. KENO — Number Grid
// ═══════════════════════════════════════════════════════════════
let kenoSelected=[];
function renderKeno(body){
    kenoSelected=[];
    body.innerHTML=`
        <div style="text-align:center;font-size:12px;color:var(--text3);margin-bottom:8px;">Pick 1-10 numbers • More picks = higher potential</div>
        <div id="keno-board" style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;max-width:320px;margin:0 auto;"></div>
        <div style="text-align:center;margin:8px 0;font-size:13px;font-weight:600;">Selected: <span id="keno-count" style="color:var(--accent);">0</span>/10</div>
        ${betUI('keno')}
        <button class="play-button" id="keno-btn" onclick="playKeno()">🔢 DRAW NUMBERS</button>
        <div id="keno-msg" style="min-height:80px;margin-top:12px;"></div>`;
    const board=document.getElementById('keno-board');
    for(let i=1;i<=40;i++){const c=document.createElement('button');c.style.cssText='padding:7px 2px;background:var(--bg2);border:1px solid var(--bg4);border-radius:6px;color:white;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;';c.textContent=i;c.id=`kn-${i}`;c.onclick=()=>{if(kenoSelected.includes(i)){kenoSelected=kenoSelected.filter(x=>x!==i);c.style.borderColor='var(--bg4)';c.style.background='var(--bg2)';}else if(kenoSelected.length<10){kenoSelected.push(i);c.style.borderColor='var(--accent)';c.style.background='rgba(139,92,246,0.2)';}document.getElementById('keno-count').textContent=kenoSelected.length;};board.appendChild(c);}
}
function playKeno(){
    if(kenoSelected.length<1)return alert('Pick at least 1 number!');
    const bet=getBet('keno');if(!bet)return;
    document.getElementById('keno-btn').disabled=true;
    let drawn=[];while(drawn.length<10){const n=Math.floor(Math.random()*40)+1;if(!drawn.includes(n))drawn.push(n);}
    // Animate drawn numbers
    drawn.forEach((n,idx)=>{setTimeout(()=>{const cell=document.getElementById(`kn-${n}`);if(cell){cell.style.background=kenoSelected.includes(n)?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.15)';cell.style.borderColor=kenoSelected.includes(n)?'var(--green)':'var(--red)';cell.classList.add('bounce');}},idx*200);});
    setTimeout(()=>{
        const hits=kenoSelected.filter(n=>drawn.includes(n)).length;
        const picked=kenoSelected.length;
        const payouts={1:{1:3.5},2:{2:6},3:{2:2,3:12},4:{2:1.5,3:5,4:25},5:{3:3,4:12,5:60},6:{3:2,4:5,5:25,6:100},7:{4:3,5:12,6:36,7:100},8:{4:2,5:6,6:18,7:50,8:100},9:{5:4,6:12,7:36,8:60,9:100},10:{5:3,6:6,7:18,8:50,9:80,10:100}};
        const mult=payouts[picked]?.[hits]||0;
        if(mult>0){const profit=bet*mult-bet;recordGame('Keno',bet,true,profit);document.getElementById('keno-msg').innerHTML=showWinResult(bet*mult);if(mult>=10)showConfetti();}
        else{recordGame('Keno',bet,false,-bet);document.getElementById('keno-msg').innerHTML=showLoseResult(bet);}
        document.getElementById('keno-btn').disabled=false;
    },2200);
}

// ═══════════════════════════════════════════════════════════════
// 10. ROULETTE — Color Bet
// ═══════════════════════════════════════════════════════════════
let roulChoice=null;
function renderRoulette(body){
    roulChoice=null;
    body.innerHTML=`
        <div style="text-align:center;padding:20px 0;">
            <div id="roul-ball" style="font-size:64px;display:inline-block;transition:transform 0.1s;">🔴</div>
            <div id="roul-num" style="font-size:28px;font-weight:800;min-height:36px;margin-top:8px;"></div>
        </div>
        <div class="choice-row">
            <button class="choice-btn" id="r-red" onclick="roulChoice='red';document.querySelectorAll('[id^=r-]').forEach(b=>b.classList.remove('selected'));document.getElementById('r-red').classList.add('selected')">🔴 Red<br><small>2x</small></button>
            <button class="choice-btn" id="r-blk" onclick="roulChoice='black';document.querySelectorAll('[id^=r-]').forEach(b=>b.classList.remove('selected'));document.getElementById('r-blk').classList.add('selected')">⚫ Black<br><small>2x</small></button>
            <button class="choice-btn" id="r-grn" onclick="roulChoice='green';document.querySelectorAll('[id^=r-]').forEach(b=>b.classList.remove('selected'));document.getElementById('r-grn').classList.add('selected')">🟢 Green<br><small>36x</small></button>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--text3);margin:6px 0;">European Roulette • RTP 97.3%</div>
        ${betUI('roul')}
        <button class="play-button" id="roul-btn" onclick="playRoulette()">🔴 SPIN ROULETTE</button>
        <div id="roul-msg" style="min-height:80px;margin-top:12px;"></div>`;
}
function playRoulette(){
    if(!roulChoice)return alert('Pick Red, Black, or Green!');
    const bet=getBet('roul');if(!bet)return;
    document.getElementById('roul-btn').disabled=true;
    const ball=document.getElementById('roul-ball');
    const colors=['🔴','⚫','🔴','⚫','🟢','🔴','⚫','🔴','⚫'];
    let c=0;
    const anim=setInterval(()=>{ball.textContent=colors[Math.floor(Math.random()*colors.length)];ball.style.transform=`rotate(${c*15}deg)`;if(++c>30){clearInterval(anim);ball.style.transform='rotate(0)';
        const rand=Math.random(); let result;
        if(rand<0.027)result='green'; else if(rand<0.5135)result='red'; else result='black';
        const num=result==='green'?0:Math.floor(Math.random()*36)+1;
        ball.textContent=result==='green'?'🟢':result==='red'?'🔴':'⚫';
        document.getElementById('roul-num').textContent=num;
        ball.classList.add('bounce');
        const won=roulChoice===result;
        const mult=roulChoice==='green'?36:2;
        if(won){recordGame('Roulette',bet,true,bet*(mult-1));document.getElementById('roul-msg').innerHTML=showWinResult(bet*mult);if(mult>=36)showConfetti();else showConfetti();}
        else{recordGame('Roulette',bet,false,-bet);ball.classList.add('shake');document.getElementById('roul-msg').innerHTML=showLoseResult(bet);}
        setTimeout(()=>{ball.className='';document.getElementById('roul-btn').disabled=false;},2000);
    }},60);
}

// ═══════════════════════════════════════════════════════════════
// 11. LIMBO — Target Multiplier
// ═══════════════════════════════════════════════════════════════
function renderLimbo(body){
    body.innerHTML=`
        <div style="text-align:center;padding:20px 0;">
            <div id="limbo-res" style="font-size:52px;font-weight:800;color:var(--gold);min-height:60px;">?</div>
        </div>
        <div style="text-align:center;margin:12px 0;">
            <div style="font-size:12px;color:var(--text3);margin-bottom:6px;">Target Multiplier</div>
            <input type="number" id="limbo-target" value="2" min="1.01" max="1000" step="0.1" style="width:140px;padding:12px;background:var(--bg2);border:2px solid var(--gold);border-radius:10px;color:var(--gold);font-size:22px;font-weight:800;text-align:center;" oninput="updateLimboChance()">
            <div style="font-size:11px;color:var(--text3);margin-top:6px;">Win chance: <b id="limbo-chance">48.5%</b> • RTP 97%</div>
        </div>
        ${betUI('limbo')}
        <button class="play-button" id="limbo-btn" onclick="playLimbo()">📊 PLAY LIMBO</button>
        <div id="limbo-msg" style="min-height:80px;margin-top:12px;"></div>`;
    updateLimboChance();
}
function updateLimboChance(){const t=parseFloat(document.getElementById('limbo-target').value)||2;document.getElementById('limbo-chance').textContent=((RTP.limbo/t)*100).toFixed(1)+'%';}
function playLimbo(){
    const bet=getBet('limbo');if(!bet)return;
    document.getElementById('limbo-btn').disabled=true;
    const target=parseFloat(document.getElementById('limbo-target').value)||2;
    if(target<1.01)return alert('Min target: 1.01x');
    const result=RTP.limbo/Math.random();
    const won=result>=target;
    const res=document.getElementById('limbo-res');
    // Counting animation
    let count=1;const anim=setInterval(()=>{count+=0.1+(count*0.05);res.textContent=count.toFixed(2)+'x';if(count>=result||count>result+2){clearInterval(anim);
        res.textContent=result.toFixed(2)+'x';
        res.style.color=won?'var(--green)':'var(--red)';
        res.classList.add('bounce');
        if(won){recordGame('Limbo',bet,true,bet*(target-1));document.getElementById('limbo-msg').innerHTML=showWinResult(bet*target);if(target>=5)showConfetti();}
        else{recordGame('Limbo',bet,false,-bet);document.getElementById('limbo-msg').innerHTML=showLoseResult(bet);}
        setTimeout(()=>{res.style.color='var(--gold)';res.className='';document.getElementById('limbo-btn').disabled=false;},2000);
    }},40);
}

// ═══════════════════════════════════════════════════════════════
// 12. TOWER — Climb 10 Floors
// ═══════════════════════════════════════════════════════════════
let towerState={active:false};
function renderTower(body){
    body.innerHTML=`
        <div class="multi-display"><div class="multi-value" id="tw-multi">1.00x</div><div class="multi-label">Floor <span id="tw-floor">0</span>/10 • Cash out anytime</div></div>
        <div id="tw-grid" style="display:flex;flex-direction:column-reverse;gap:3px;max-width:300px;margin:12px auto;"></div>
        ${betUI('tower')}
        <button class="play-button" id="tw-start" onclick="startTower()">🏗️ START CLIMB</button>
        <button class="play-button hidden" id="tw-cash" onclick="cashTower()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT (<span id="tw-amt">0.00</span>)</button>
        <div id="tw-msg" style="min-height:80px;margin-top:12px;"></div>`;
    buildTowerGrid();
}
function buildTowerGrid(){const g=document.getElementById('tw-grid');g.innerHTML='';for(let f=0;f<10;f++){const row=document.createElement('div');row.style.cssText='display:flex;gap:3px;';for(let c=0;c<3;c++){const cell=document.createElement('button');cell.style.cssText='flex:1;padding:10px;background:var(--bg2);border:1px solid var(--bg4);border-radius:8px;font-size:14px;cursor:pointer;transition:all 0.2s;';cell.textContent=`F${f+1}`;cell.id=`tw-${f}-${c}`;cell.onclick=()=>clickTower(f,c);row.appendChild(cell);}g.appendChild(row);}}
function startTower(){
    const bet=getBet('tower');if(!bet)return;
    let bombs=[];for(let i=0;i<10;i++)bombs.push(Math.floor(Math.random()*3));
    towerState={active:true,bet,bombs,floor:0,multi:1};
    document.getElementById('tw-start').classList.add('hidden');document.getElementById('tw-cash').classList.remove('hidden');
    document.getElementById('tw-msg').innerHTML='<span class="text-muted">🏗️ Pick a tile on Floor 1!</span>';
    buildTowerGrid();
}
function clickTower(floor,col){
    if(!towerState.active||floor!==towerState.floor)return;
    const cell=document.getElementById(`tw-${floor}-${col}`);
    if(towerState.bombs[floor]===col){
        cell.textContent='💣';cell.style.background='rgba(239,68,68,0.3)';cell.style.borderColor='var(--red)';cell.classList.add('mine-explode');
        towerState.active=false;
        towerState.bombs.forEach((b,i)=>{setTimeout(()=>{const c=document.getElementById(`tw-${i}-${b}`);c.textContent='💣';c.style.background='rgba(239,68,68,0.1)';},i*80);});
        recordGame('Tower',towerState.bet,false,-towerState.bet);
        document.getElementById('tw-msg').innerHTML=showLoseResult(towerState.bet);
        document.getElementById('tw-cash').classList.add('hidden');document.getElementById('tw-start').classList.remove('hidden');
    }else{
        cell.textContent='⭐';cell.style.background='rgba(16,185,129,0.2)';cell.style.borderColor='var(--green)';cell.classList.add('gem-sparkle');
        towerState.floor++;towerState.multi*=1.45;
        document.getElementById('tw-multi').textContent=towerState.multi.toFixed(2)+'x';
        document.getElementById('tw-floor').textContent=towerState.floor;
        document.getElementById('tw-amt').textContent=(towerState.bet*towerState.multi).toFixed(2);
        if(towerState.floor>=10){cashTower();}
    }
}
function cashTower(){
    if(!towerState.active)return;towerState.active=false;
    const profit=towerState.bet*towerState.multi-towerState.bet;
    recordGame('Tower',towerState.bet,true,profit);
    document.getElementById('tw-msg').innerHTML=showWinResult(towerState.bet*towerState.multi);showConfetti();
    towerState.bombs.forEach((b,i)=>{setTimeout(()=>{const c=document.getElementById(`tw-${i}-${b}`);c.textContent='💣';c.style.background='rgba(239,68,68,0.1)';},i*80);});
    document.getElementById('tw-cash').classList.add('hidden');document.getElementById('tw-start').classList.remove('hidden');
}
