// === LIBERTY CASINO - Premium Games Engine ===
const EDGE = 0.05;

const gamesList = [
    { id: 'coinflip', name: 'Coin Flip', icon: '🪙', mult: '1.95x', coming: false },
    { id: 'dice', name: 'Dice Roll', icon: '🎲', mult: '1.95x', coming: false },
    { id: 'slots', name: 'Mega Slots', icon: '🎰', mult: 'up to 100x', coming: false },
    { id: 'mines', name: 'Mines', icon: '💣', mult: 'up to 25x', coming: false },
    { id: 'crash', name: 'Crash', icon: '🚀', mult: 'up to ∞', coming: false },
    { id: 'plinko', name: 'Plinko', icon: '⚪', mult: 'up to 1000x', coming: false },
    { id: 'wheel', name: 'Fortune Wheel', icon: '🎡', mult: 'up to 50x', coming: false },
    { id: 'hilo', name: 'Hi-Lo Cards', icon: '🃏', mult: 'up to 12x', coming: false },
    { id: 'keno', name: 'Keno', icon: '🔢', mult: 'up to 100x', coming: false },
    { id: 'roulette', name: 'Roulette', icon: '🔴', mult: 'up to 36x', coming: false },
    { id: 'limbo', name: 'Limbo', icon: '📊', mult: 'up to 1000x', coming: false },
    { id: 'tower', name: 'Tower', icon: '🏗️', mult: 'up to 50x', coming: false },
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

// === BET UI COMPONENT ===
function betUI(id) {
    return `<div class="bet-container">
        <div class="bet-label">BET AMOUNT</div>
        <div class="bet-input-wrap">
            <input type="number" id="${id}-bet" value="1" min="0.1" step="0.1">
            <div class="bet-quick">
                <button onclick="document.getElementById('${id}-bet').value='0.5'">0.5</button>
                <button onclick="document.getElementById('${id}-bet').value='1'">1</button>
                <button onclick="document.getElementById('${id}-bet').value='5'">5</button>
                <button onclick="document.getElementById('${id}-bet').value='10'">10</button>
                <button onclick="document.getElementById('${id}-bet').value=(user.balance/2).toFixed(2)">½</button>
                <button onclick="document.getElementById('${id}-bet').value=user.balance.toFixed(2)">MAX</button>
            </div>
        </div>
    </div>`;
}

function getBet(id) {
    const v = parseFloat(document.getElementById(`${id}-bet`)?.value);
    if (!v || v <= 0) { alert('Enter a valid bet!'); return null; }
    if (v > user.balance) { alert('Insufficient balance!'); return null; }
    if (user.balance <= 0) { alert('No balance! Please deposit.'); return null; }
    user.balance -= v;
    if (user.balance < 0) user.balance = 0;
    save(); updateBal();
    return v;
}

function winRate() { return 0.5 - EDGE / 2; }


// ═══════════════════════════════════════════
// 1. COIN FLIP - Premium Animated
// ═══════════════════════════════════════════
function renderCoinFlip(body) {
    body.innerHTML = `
        <div class="result-area">
            <div id="cf-coin" style="font-size:80px;transition:transform 0.6s;transform-style:preserve-3d;">🪙</div>
        </div>
        <div class="multi-display"><div class="multi-value">1.95x</div><div class="multi-label">Payout</div></div>
        <div class="choice-row">
            <button class="choice-btn" id="cf-h" onclick="selectCF('h')">
                <div style="font-size:28px">👑</div><div>HEADS</div>
            </button>
            <button class="choice-btn" id="cf-t" onclick="selectCF('t')">
                <div style="font-size:28px">🦅</div><div>TAILS</div>
            </button>
        </div>
        ${betUI('cf')}
        <button class="play-button" onclick="playCoinFlip()">FLIP COIN</button>
        <div id="cf-result" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
}
let cfChoice = null;
function selectCF(c) {
    cfChoice = c;
    document.getElementById('cf-h').classList.toggle('selected', c==='h');
    document.getElementById('cf-t').classList.toggle('selected', c==='t');
}
function playCoinFlip() {
    if (!cfChoice) return alert('Pick Heads or Tails!');
    const bet = getBet('cf'); if (!bet) return;
    const coin = document.getElementById('cf-coin');
    const won = Math.random() < winRate();
    
    // Spin animation
    coin.style.transform = 'rotateY(1800deg)';
    coin.style.transition = 'transform 1.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    
    setTimeout(() => {
        coin.style.transition = 'none';
        coin.style.transform = 'rotateY(0)';
        coin.textContent = won ? (cfChoice==='h' ? '👑' : '🦅') : (cfChoice==='h' ? '🦅' : '👑');
        
        const res = document.getElementById('cf-result');
        if (won) {
            const profit = bet * 0.95;
            recordGame('Coin Flip', bet, true, profit);
            res.innerHTML = `<div class="win-popup">🎉 WIN! +${(bet*1.95).toFixed(2)} USDT</div>`;
        } else {
            recordGame('Coin Flip', bet, false, -bet);
            res.innerHTML = `<div class="lose-popup">❌ LOSE -${bet.toFixed(2)} USDT</div>`;
        }
        setTimeout(() => { coin.textContent = '🪙'; }, 3000);
    }, 1500);
}

// ═══════════════════════════════════════════
// 2. DICE - Animated Roll
// ═══════════════════════════════════════════
function renderDice(body) {
    body.innerHTML = `
        <div class="result-area">
            <div id="dice-face" style="font-size:80px;transition:transform 0.3s;">🎲</div>
        </div>
        <div id="dice-num" style="font-size:24px;font-weight:800;text-align:center;min-height:30px;"></div>
        <div style="text-align:center;margin:8px 0;">
            <input type="range" id="dice-slider" min="1" max="95" value="50" 
                style="width:80%;accent-color:var(--accent);" oninput="updateDiceSlider()">
            <div style="display:flex;justify-content:space-between;padding:0 10%;font-size:12px;color:var(--text3);">
                <span>1</span><span id="dice-target">50</span><span>100</span>
            </div>
        </div>
        <div class="choice-row">
            <button class="choice-btn selected" id="d-over" onclick="diceDir='over';document.getElementById('d-over').classList.add('selected');document.getElementById('d-under').classList.remove('selected');updateDiceSlider()">⬆️ OVER</button>
            <button class="choice-btn" id="d-under" onclick="diceDir='under';document.getElementById('d-under').classList.add('selected');document.getElementById('d-over').classList.remove('selected');updateDiceSlider()">⬇️ UNDER</button>
        </div>
        <div class="multi-display"><div class="multi-value" id="dice-multi">1.95x</div><div class="multi-label">Multiplier</div></div>
        ${betUI('dice')}
        <button class="play-button" onclick="playDice()">ROLL DICE</button>
        <div id="dice-result" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
    updateDiceSlider();
}
let diceDir = 'over';
function updateDiceSlider() {
    const val = parseInt(document.getElementById('dice-slider').value);
    document.getElementById('dice-target').textContent = val;
    const chance = diceDir === 'over' ? (100 - val) / 100 : val / 100;
    const multi = Math.max(1.01, (0.95 / chance)).toFixed(2);
    document.getElementById('dice-multi').textContent = multi + 'x';
}
function playDice() {
    const bet = getBet('dice'); if (!bet) return;
    const target = parseInt(document.getElementById('dice-slider').value);
    const chance = diceDir === 'over' ? (100 - target) / 100 : target / 100;
    const multi = Math.max(1.01, 0.95 / chance);
    
    const face = document.getElementById('dice-face');
    const emojis = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    let count = 0;
    const anim = setInterval(() => {
        face.textContent = emojis[Math.floor(Math.random()*6)];
        face.style.transform = `rotate(${Math.random()*360}deg)`;
        if (++count > 15) {
            clearInterval(anim);
            face.style.transform = 'rotate(0)';
            
            const roll = Math.floor(Math.random() * 100) + 1;
            const won = diceDir === 'over' ? roll > target : roll < target;
            
            document.getElementById('dice-num').textContent = roll;
            face.textContent = emojis[Math.min(5, Math.floor(roll/17))];
            
            const res = document.getElementById('dice-result');
            if (won) {
                const profit = bet * (multi - 1);
                recordGame('Dice', bet, true, profit);
                res.innerHTML = `<div class="win-popup">🎲 ${roll}! WIN +${(bet*multi).toFixed(2)} (${multi.toFixed(2)}x)</div>`;
            } else {
                recordGame('Dice', bet, false, -bet);
                res.innerHTML = `<div class="lose-popup">🎲 ${roll}! LOSE -${bet.toFixed(2)}</div>`;
            }
        }
    }, 60);
}

// ═══════════════════════════════════════════
// 3. MEGA SLOTS - 5 Reels
// ═══════════════════════════════════════════
function renderSlots(body) {
    body.innerHTML = `
        <div class="slots-display" style="gap:6px;">
            <div class="slot-reel" id="sr1">🍒</div>
            <div class="slot-reel" id="sr2">🍋</div>
            <div class="slot-reel" id="sr3">🍊</div>
        </div>
        <div id="slots-info" style="text-align:center;font-size:12px;color:var(--text3);margin:8px 0;">
            3x 7️⃣ = 100x • 3x 💎 = 50x • 3x Match = 10x • 2x Match = 2x
        </div>
        ${betUI('slots')}
        <button class="play-button" onclick="playSlots()">🎰 SPIN</button>
        <div id="slots-result" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
}
function playSlots() {
    const bet = getBet('slots'); if (!bet) return;
    const symbols = ['🍒','🍋','🍊','🍇','⭐','💎','7️⃣'];
    const reels = ['sr1','sr2','sr3'];
    
    reels.forEach(r => document.getElementById(r).classList.add('spinning'));
    
    let count = 0;
    const anim = setInterval(() => {
        reels.forEach(r => document.getElementById(r).textContent = symbols[Math.floor(Math.random()*7)]);
        if (++count > 25) {
            clearInterval(anim);
            reels.forEach(r => document.getElementById(r).classList.remove('spinning'));
            
            // Determine result with house edge
            const rand = Math.random();
            let s1, s2, s3, mult = 0;
            
            if (rand < 0.005) { s1=s2=s3='7️⃣'; mult=100; }       // 0.5% - 100x
            else if (rand < 0.01) { s1=s2=s3='💎'; mult=50; }      // 0.5% - 50x
            else if (rand < 0.03) { s1=s2=s3=symbols[Math.floor(Math.random()*5)]; mult=10; } // 2% - 10x
            else if (rand < 0.15) { s1=s2=symbols[Math.floor(Math.random()*7)]; do{s3=symbols[Math.floor(Math.random()*7)];}while(s3===s1); mult=2; } // 12% - 2x
            else { s1=symbols[Math.floor(Math.random()*7)]; do{s2=symbols[Math.floor(Math.random()*7)];}while(s2===s1); do{s3=symbols[Math.floor(Math.random()*7)];}while(s3===s1||s3===s2); mult=0; }
            
            document.getElementById('sr1').textContent = s1;
            document.getElementById('sr2').textContent = s2;
            document.getElementById('sr3').textContent = s3;
            
            const res = document.getElementById('slots-result');
            if (mult > 0) {
                const profit = bet * (mult - 1);
                recordGame('Slots', bet, true, profit);
                if (mult >= 50) res.innerHTML = `<div class="win-popup" style="font-size:24px;">🎰 MEGA WIN! ${mult}x +${(bet*mult).toFixed(2)}</div>`;
                else res.innerHTML = `<div class="win-popup">${mult}x WIN! +${(bet*mult).toFixed(2)}</div>`;
            } else {
                recordGame('Slots', bet, false, -bet);
                res.innerHTML = `<div class="lose-popup">No match -${bet.toFixed(2)}</div>`;
            }
        }
    }, 60);
}


// ═══════════════════════════════════════════
// 4. MINES - Interactive Grid
// ═══════════════════════════════════════════
let mState = { active: false };
function renderMines(body) {
    body.innerHTML = `
        <div class="multi-display"><div class="multi-value" id="m-multi">1.00x</div><div class="multi-label">Current Multiplier</div></div>
        <div class="mines-board" id="m-board"></div>
        <div style="text-align:center;margin:8px 0;font-size:12px;color:var(--text3);">
            Mines: <select id="m-count" style="background:var(--bg3);color:white;border:none;padding:4px 8px;border-radius:6px;">
                <option value="3">3</option><option value="5" selected>5</option><option value="10">10</option><option value="15">15</option><option value="20">20</option>
            </select>
        </div>
        ${betUI('mines')}
        <button class="play-button" id="m-start" onclick="startMines()">START GAME</button>
        <button class="play-button hidden" id="m-cash" onclick="cashMines()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT</button>
        <div id="m-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
    buildMineBoard();
}
function buildMineBoard() {
    const board = document.getElementById('m-board');
    board.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.id = `mc-${i}`;
        cell.onclick = () => clickMine(i);
        board.appendChild(cell);
    }
}
function startMines() {
    const bet = getBet('mines'); if (!bet) return;
    const mineCount = parseInt(document.getElementById('m-count').value);
    let mines = [];
    while (mines.length < mineCount) { const p = Math.floor(Math.random()*25); if (!mines.includes(p)) mines.push(p); }
    mState = { active: true, bet, mines, revealed: [], multi: 1, mineCount };
    document.getElementById('m-start').classList.add('hidden');
    document.getElementById('m-cash').classList.remove('hidden');
    document.getElementById('m-multi').textContent = '1.00x';
    document.getElementById('m-msg').innerHTML = '<span class="text-muted">Tap tiles to find 💎 Avoid 💣</span>';
    buildMineBoard();
}
function clickMine(i) {
    if (!mState.active || mState.revealed.includes(i)) return;
    mState.revealed.push(i);
    const cell = document.getElementById(`mc-${i}`);
    
    if (mState.mines.includes(i)) {
        cell.textContent = '💣'; cell.className = 'mine-cell revealed-mine';
        mState.active = false;
        mState.mines.forEach(p => { document.getElementById(`mc-${p}`).textContent = '💣'; document.getElementById(`mc-${p}`).className = 'mine-cell revealed-mine'; });
        recordGame('Mines', mState.bet, false, -mState.bet);
        document.getElementById('m-msg').innerHTML = `<div class="lose-popup">💣 BOOM! -${mState.bet.toFixed(2)}</div>`;
        document.getElementById('m-cash').classList.add('hidden');
        document.getElementById('m-start').classList.remove('hidden');
    } else {
        cell.textContent = '💎'; cell.className = 'mine-cell revealed-gem';
        // Multiplier increases based on mine count
        const safeLeft = 25 - mState.mineCount - mState.revealed.length + 1;
        const totalSafe = 25 - mState.mineCount;
        mState.multi *= (25 - mState.revealed.length + 1) / safeLeft;
        mState.multi = Math.max(mState.multi, 1 + mState.revealed.length * 0.2);
        document.getElementById('m-multi').textContent = mState.multi.toFixed(2) + 'x';
    }
}
function cashMines() {
    if (!mState.active) return;
    mState.active = false;
    const profit = mState.bet * mState.multi - mState.bet;
    recordGame('Mines', mState.bet, true, profit);
    document.getElementById('m-msg').innerHTML = `<div class="win-popup">💎 Cashed ${mState.multi.toFixed(2)}x! +${(mState.bet*mState.multi).toFixed(2)}</div>`;
    mState.mines.forEach(p => { document.getElementById(`mc-${p}`).textContent = '💣'; document.getElementById(`mc-${p}`).className = 'mine-cell revealed-mine'; });
    document.getElementById('m-cash').classList.add('hidden');
    document.getElementById('m-start').classList.remove('hidden');
}

// ═══════════════════════════════════════════
// 5. CRASH - Live Multiplier
// ═══════════════════════════════════════════
let crashState = { active: false };
function renderCrash(body) {
    body.innerHTML = `
        <div style="width:100%;max-width:360px;height:180px;background:var(--bg2);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:12px 0;border:1px solid var(--bg4);position:relative;overflow:hidden;">
            <div id="crash-graph" style="position:absolute;bottom:0;left:0;width:0;height:2px;background:linear-gradient(90deg,var(--green),var(--gold));transition:width 0.1s,height 0.1s;border-radius:0 4px 0 0;"></div>
            <div id="crash-multi" style="font-size:48px;font-weight:800;color:var(--green);z-index:1;">1.00x</div>
        </div>
        ${betUI('crash')}
        <button class="play-button" id="crash-start" onclick="startCrash()">🚀 START</button>
        <button class="play-button hidden" id="crash-stop" onclick="stopCrash()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT</button>
        <div id="crash-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
}
function startCrash() {
    const bet = getBet('crash'); if (!bet) return;
    const crashAt = 1 + (Math.random() * Math.random() * 20); // Weighted toward lower
    crashState = { active: true, bet, multi: 1, crashAt };
    document.getElementById('crash-start').classList.add('hidden');
    document.getElementById('crash-stop').classList.remove('hidden');
    document.getElementById('crash-msg').innerHTML = '';
    document.getElementById('crash-multi').style.color = 'var(--green)';
    
    const tick = setInterval(() => {
        if (!crashState.active) { clearInterval(tick); return; }
        crashState.multi += 0.02 + (crashState.multi * 0.005);
        const display = document.getElementById('crash-multi');
        const graph = document.getElementById('crash-graph');
        display.textContent = crashState.multi.toFixed(2) + 'x';
        graph.style.width = Math.min(100, (crashState.multi / crashState.crashAt) * 100) + '%';
        graph.style.height = Math.min(100, (crashState.multi / crashState.crashAt) * 80) + '%';
        
        if (crashState.multi >= crashState.crashAt) {
            clearInterval(tick);
            crashState.active = false;
            display.textContent = '💥 CRASH';
            display.style.color = 'var(--red)';
            graph.style.background = 'var(--red)';
            recordGame('Crash', bet, false, -bet);
            document.getElementById('crash-msg').innerHTML = `<div class="lose-popup">Crashed at ${crashState.crashAt.toFixed(2)}x! -${bet.toFixed(2)}</div>`;
            document.getElementById('crash-stop').classList.add('hidden');
            document.getElementById('crash-start').classList.remove('hidden');
        }
    }, 50);
}
function stopCrash() {
    if (!crashState.active) return;
    crashState.active = false;
    const profit = crashState.bet * crashState.multi - crashState.bet;
    recordGame('Crash', crashState.bet, true, profit);
    document.getElementById('crash-multi').textContent = crashState.multi.toFixed(2) + 'x ✓';
    document.getElementById('crash-msg').innerHTML = `<div class="win-popup">🚀 Cashed at ${crashState.multi.toFixed(2)}x! +${(crashState.bet*crashState.multi).toFixed(2)}</div>`;
    document.getElementById('crash-stop').classList.add('hidden');
    document.getElementById('crash-start').classList.remove('hidden');
}

// ═══════════════════════════════════════════
// 6. PLINKO - Ball Drop
// ═══════════════════════════════════════════
function renderPlinko(body) {
    body.innerHTML = `
        <div style="text-align:center;margin:12px 0;">
            <div style="font-size:14px;color:var(--text3);margin-bottom:8px;">Risk Level:</div>
            <div class="choice-row">
                <button class="choice-btn selected" id="pl-low" onclick="plinkoRisk='low';document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Low</button>
                <button class="choice-btn" id="pl-med" onclick="plinkoRisk='med';document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">Medium</button>
                <button class="choice-btn" id="pl-high" onclick="plinkoRisk='high';document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">High</button>
            </div>
        </div>
        <div id="plinko-result" class="result-area" style="font-size:36px;">⚪</div>
        ${betUI('plinko')}
        <button class="play-button" onclick="playPlinko()">⚪ DROP BALL</button>
        <div id="plinko-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
}
let plinkoRisk = 'low';
function playPlinko() {
    const bet = getBet('plinko'); if (!bet) return;
    const mults = {
        low: [1.5, 1.2, 1, 0.8, 0.5, 0.3, 0.5, 0.8, 1, 1.2, 1.5, 2, 3, 2, 1.5],
        med: [5, 2, 1.5, 1, 0.5, 0.3, 0.2, 0.3, 0.5, 1, 1.5, 2, 5, 8, 3],
        high: [1000, 50, 10, 5, 2, 0.2, 0.1, 0.1, 0.1, 0.2, 2, 5, 10, 50, 1000],
    };
    const pool = mults[plinkoRisk];
    // Weighted toward center (lower values)
    const weights = pool.map((_, i) => Math.exp(-Math.pow((i - pool.length/2) / (pool.length/4), 2)));
    const totalW = weights.reduce((a,b) => a+b);
    let r = Math.random() * totalW, idx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
    
    const mult = pool[idx];
    const res = document.getElementById('plinko-result');
    res.textContent = '⚪ ...';
    res.style.animation = 'float 0.5s infinite';
    
    setTimeout(() => {
        res.style.animation = '';
        res.textContent = mult + 'x';
        const profit = bet * mult - bet;
        if (profit >= 0) {
            recordGame('Plinko', bet, true, profit);
            document.getElementById('plinko-msg').innerHTML = `<div class="win-popup">${mult}x! +${(bet*mult).toFixed(2)}</div>`;
        } else {
            recordGame('Plinko', bet, false, profit);
            document.getElementById('plinko-msg').innerHTML = `<div class="lose-popup">${mult}x -${(-profit).toFixed(2)}</div>`;
        }
    }, 1200);
}


// ═══════════════════════════════════════════
// 7. FORTUNE WHEEL
// ═══════════════════════════════════════════
function renderWheel(body) {
    body.innerHTML = `
        <div class="result-area" style="position:relative;">
            <div id="wheel-spinner" style="font-size:72px;transition:transform 3s cubic-bezier(0.17,0.67,0.12,0.99);">🎡</div>
            <div id="wheel-mult" style="font-size:28px;font-weight:800;color:var(--gold);margin-top:8px;min-height:36px;"></div>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--text3);margin:8px 0;">
            💀0x • 🟢1.5x • 🔵2x • 🟡3x • 🟠5x • 🔴10x • 💎50x
        </div>
        ${betUI('wheel')}
        <button class="play-button" onclick="playWheel()">🎡 SPIN WHEEL</button>
        <div id="wheel-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
}
function playWheel() {
    const bet = getBet('wheel'); if (!bet) return;
    const segments = [{m:0,e:'💀'},{m:1.5,e:'🟢'},{m:2,e:'🔵'},{m:0,e:'💀'},{m:3,e:'🟡'},{m:1.5,e:'🟢'},{m:0,e:'💀'},{m:5,e:'🟠'},{m:1.5,e:'🟢'},{m:0,e:'💀'},{m:2,e:'🔵'},{m:10,e:'🔴'},{m:0,e:'💀'},{m:1.5,e:'🟢'},{m:50,e:'💎'},{m:0,e:'💀'}];
    
    const spinner = document.getElementById('wheel-spinner');
    const rotation = 1440 + Math.random() * 720; // 4-6 full spins
    spinner.style.transform = `rotate(${rotation}deg)`;
    
    setTimeout(() => {
        spinner.style.transition = 'none';
        spinner.style.transform = 'rotate(0)';
        setTimeout(() => { spinner.style.transition = 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)'; }, 50);
        
        const seg = segments[Math.floor(Math.random() * segments.length)];
        document.getElementById('wheel-mult').textContent = seg.e + ' ' + seg.m + 'x';
        
        if (seg.m > 0) {
            const profit = bet * seg.m - bet;
            recordGame('Wheel', bet, true, profit);
            document.getElementById('wheel-msg').innerHTML = `<div class="win-popup">${seg.e} ${seg.m}x! +${(bet*seg.m).toFixed(2)}</div>`;
        } else {
            recordGame('Wheel', bet, false, -bet);
            document.getElementById('wheel-msg').innerHTML = `<div class="lose-popup">${seg.e} 0x! -${bet.toFixed(2)}</div>`;
        }
    }, 3000);
}

// ═══════════════════════════════════════════
// 8. HI-LO CARDS
// ═══════════════════════════════════════════
function renderHiLo(body) {
    const cards = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const startCard = Math.floor(Math.random()*13);
    body.innerHTML = `
        <div style="text-align:center;margin:16px 0;">
            <div style="font-size:12px;color:var(--text3);">Current Card:</div>
            <div id="hilo-card" style="font-size:64px;font-weight:800;background:var(--bg2);width:100px;height:140px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:8px auto;border:2px solid var(--bg4);">${cards[startCard]}</div>
            <div style="font-size:12px;color:var(--text3);">Value: ${startCard + 1}/13</div>
        </div>
        <div class="multi-display"><div class="multi-value" id="hilo-multi">1.95x</div><div class="multi-label">Payout</div></div>
        ${betUI('hilo')}
        <div class="choice-row">
            <button class="choice-btn" onclick="playHiLo('hi',${startCard})">⬆️ HIGHER</button>
            <button class="choice-btn" onclick="playHiLo('lo',${startCard})">⬇️ LOWER</button>
        </div>
        <div id="hilo-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
}
function playHiLo(choice, current) {
    const bet = getBet('hilo'); if (!bet) return;
    const cards = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const next = Math.floor(Math.random()*13);
    const won = (choice==='hi' && next > current) || (choice==='lo' && next < current);
    
    document.getElementById('hilo-card').textContent = cards[next];
    document.getElementById('hilo-card').style.borderColor = won ? 'var(--green)' : 'var(--red)';
    
    if (won) {
        const profit = bet * 0.95;
        recordGame('Hi-Lo', bet, true, profit);
        document.getElementById('hilo-msg').innerHTML = `<div class="win-popup">${cards[current]}→${cards[next]} WIN! +${(bet*1.95).toFixed(2)}</div>`;
    } else {
        recordGame('Hi-Lo', bet, false, -bet);
        document.getElementById('hilo-msg').innerHTML = `<div class="lose-popup">${cards[current]}→${cards[next]} LOSE -${bet.toFixed(2)}</div>`;
    }
    // Reset after 2s
    setTimeout(() => renderHiLo(document.getElementById('game-body')), 2500);
}

// ═══════════════════════════════════════════
// 9. KENO - Number Pick
// ═══════════════════════════════════════════
let kenoSelected = [];
function renderKeno(body) {
    kenoSelected = [];
    body.innerHTML = `
        <div style="text-align:center;font-size:12px;color:var(--text3);margin-bottom:8px;">Pick 1-10 numbers, then draw!</div>
        <div id="keno-board" style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;max-width:320px;margin:0 auto;"></div>
        <div style="text-align:center;margin:8px 0;font-size:13px;">Selected: <b id="keno-count">0</b>/10</div>
        ${betUI('keno')}
        <button class="play-button" onclick="playKeno()">🔢 DRAW</button>
        <div id="keno-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
    const board = document.getElementById('keno-board');
    for (let i = 1; i <= 40; i++) {
        const cell = document.createElement('button');
        cell.style.cssText = 'padding:8px 4px;background:var(--bg2);border:1px solid var(--bg4);border-radius:6px;color:white;font-size:12px;font-weight:700;cursor:pointer;';
        cell.textContent = i;
        cell.id = `kn-${i}`;
        cell.onclick = () => toggleKeno(i, cell);
        board.appendChild(cell);
    }
}
function toggleKeno(n, cell) {
    if (kenoSelected.includes(n)) {
        kenoSelected = kenoSelected.filter(x => x !== n);
        cell.style.borderColor = 'var(--bg4)'; cell.style.background = 'var(--bg2)';
    } else if (kenoSelected.length < 10) {
        kenoSelected.push(n);
        cell.style.borderColor = 'var(--accent)'; cell.style.background = 'rgba(139,92,246,0.2)';
    }
    document.getElementById('keno-count').textContent = kenoSelected.length;
}
function playKeno() {
    if (kenoSelected.length < 1) return alert('Pick at least 1 number!');
    const bet = getBet('keno'); if (!bet) return;
    
    let drawn = [];
    while (drawn.length < 10) { const n = Math.floor(Math.random()*40)+1; if (!drawn.includes(n)) drawn.push(n); }
    
    // Highlight drawn numbers
    drawn.forEach(n => { const cell = document.getElementById(`kn-${n}`); if (cell) { cell.style.background = kenoSelected.includes(n) ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.2)'; cell.style.borderColor = kenoSelected.includes(n) ? 'var(--green)' : 'var(--red)'; }});
    
    const hits = kenoSelected.filter(n => drawn.includes(n)).length;
    const picked = kenoSelected.length;
    // Payout table based on picks and hits
    const payouts = { 1:{1:3}, 2:{2:6}, 3:{2:2,3:10}, 4:{2:1.5,3:5,4:20}, 5:{3:3,4:10,5:50}, 6:{3:2,4:5,5:20,6:100}, 7:{4:3,5:10,6:30,7:100}, 8:{4:2,5:5,6:15,7:50,8:100}, 9:{5:3,6:10,7:30,8:50,9:100}, 10:{5:2,6:5,7:15,8:40,9:80,10:100} };
    const mult = payouts[picked]?.[hits] || 0;
    
    const res = document.getElementById('keno-msg');
    if (mult > 0) {
        const profit = bet * mult - bet;
        recordGame('Keno', bet, true, profit);
        res.innerHTML = `<div class="win-popup">🎯 ${hits}/${picked} hits! ${mult}x +${(bet*mult).toFixed(2)}</div>`;
    } else {
        recordGame('Keno', bet, false, -bet);
        res.innerHTML = `<div class="lose-popup">${hits}/${picked} hits. -${bet.toFixed(2)}</div>`;
    }
}

// ═══════════════════════════════════════════
// 10. ROULETTE
// ═══════════════════════════════════════════
function renderRoulette(body) {
    body.innerHTML = `
        <div class="result-area">
            <div id="roul-ball" style="font-size:64px;transition:transform 2s;">🔴</div>
            <div id="roul-num" style="font-size:24px;font-weight:800;min-height:30px;"></div>
        </div>
        <div class="choice-row">
            <button class="choice-btn" id="r-red" onclick="roulChoice='red';document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">🔴 Red<br><small>2x</small></button>
            <button class="choice-btn" id="r-blk" onclick="roulChoice='black';document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">⚫ Black<br><small>2x</small></button>
            <button class="choice-btn" id="r-grn" onclick="roulChoice='green';document.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">🟢 Green<br><small>36x</small></button>
        </div>
        ${betUI('roul')}
        <button class="play-button" onclick="playRoulette()">🔴 SPIN</button>
        <div id="roul-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
}
let roulChoice = null;
function playRoulette() {
    if (!roulChoice) return alert('Pick Red, Black, or Green!');
    const bet = getBet('roul'); if (!bet) return;
    
    const ball = document.getElementById('roul-ball');
    const colors = ['🔴','⚫','🔴','⚫','🟢','🔴','⚫','🔴','⚫'];
    let count = 0;
    const anim = setInterval(() => {
        ball.textContent = colors[Math.floor(Math.random()*colors.length)];
        ball.style.transform = `rotate(${count*30}deg)`;
        if (++count > 25) {
            clearInterval(anim);
            ball.style.transform = 'rotate(0)';
            
            const rand = Math.random();
            let result; 
            if (rand < 0.027) result = 'green';
            else if (rand < 0.5) result = 'red';
            else result = 'black';
            
            const num = result === 'green' ? 0 : Math.floor(Math.random()*36)+1;
            ball.textContent = result==='green' ? '🟢' : result==='red' ? '🔴' : '⚫';
            document.getElementById('roul-num').textContent = num;
            
            const won = roulChoice === result;
            const mult = roulChoice === 'green' ? 36 : 2;
            
            if (won) {
                const profit = bet * (mult - 1);
                recordGame('Roulette', bet, true, profit);
                document.getElementById('roul-msg').innerHTML = `<div class="win-popup">${result} ${num}! ${mult}x +${(bet*mult).toFixed(2)}</div>`;
            } else {
                recordGame('Roulette', bet, false, -bet);
                document.getElementById('roul-msg').innerHTML = `<div class="lose-popup">${result} ${num}! -${bet.toFixed(2)}</div>`;
            }
        }
    }, 70);
}

// ═══════════════════════════════════════════
// 11. LIMBO - Target Multiplier
// ═══════════════════════════════════════════
function renderLimbo(body) {
    body.innerHTML = `
        <div class="result-area">
            <div id="limbo-res" style="font-size:48px;font-weight:800;color:var(--gold);">?</div>
        </div>
        <div style="text-align:center;margin:12px 0;">
            <div style="font-size:12px;color:var(--text3);">Target Multiplier:</div>
            <input type="number" id="limbo-target" value="2" min="1.01" max="1000" step="0.1"
                style="width:120px;padding:10px;background:var(--bg2);border:2px solid var(--gold);border-radius:10px;color:var(--gold);font-size:20px;font-weight:800;text-align:center;">
            <div style="font-size:11px;color:var(--text3);margin-top:4px;">Win chance: <span id="limbo-chance">47.5%</span></div>
        </div>
        ${betUI('limbo')}
        <button class="play-button" onclick="playLimbo()">📊 PLAY</button>
        <div id="limbo-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
    document.getElementById('limbo-target').oninput = () => {
        const t = parseFloat(document.getElementById('limbo-target').value) || 2;
        document.getElementById('limbo-chance').textContent = ((0.95/t)*100).toFixed(1) + '%';
    };
}
function playLimbo() {
    const bet = getBet('limbo'); if (!bet) return;
    const target = parseFloat(document.getElementById('limbo-target').value) || 2;
    if (target < 1.01) return alert('Min target: 1.01x');
    
    // Generate result
    const result = 0.95 / Math.random(); // Exponential distribution
    const won = result >= target;
    
    const res = document.getElementById('limbo-res');
    res.textContent = result.toFixed(2) + 'x';
    res.style.color = won ? 'var(--green)' : 'var(--red)';
    
    if (won) {
        const profit = bet * (target - 1);
        recordGame('Limbo', bet, true, profit);
        document.getElementById('limbo-msg').innerHTML = `<div class="win-popup">${result.toFixed(2)}x ≥ ${target}x! +${(bet*target).toFixed(2)}</div>`;
    } else {
        recordGame('Limbo', bet, false, -bet);
        document.getElementById('limbo-msg').innerHTML = `<div class="lose-popup">${result.toFixed(2)}x < ${target}x! -${bet.toFixed(2)}</div>`;
    }
}

// ═══════════════════════════════════════════
// 12. TOWER - Climb Floors
// ═══════════════════════════════════════════
let towerState = { active: false };
function renderTower(body) {
    body.innerHTML = `
        <div class="multi-display"><div class="multi-value" id="tw-multi">1.00x</div><div class="multi-label">Floor <span id="tw-floor">0</span>/10</div></div>
        <div id="tw-grid" style="display:flex;flex-direction:column-reverse;gap:4px;max-width:320px;margin:12px auto;"></div>
        ${betUI('tower')}
        <button class="play-button" id="tw-start" onclick="startTower()">🏗️ START CLIMB</button>
        <button class="play-button hidden" id="tw-cash" onclick="cashTower()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT</button>
        <div id="tw-msg" class="mt-12 text-center" style="min-height:40px;"></div>
    `;
    buildTower();
}
function buildTower() {
    const grid = document.getElementById('tw-grid');
    grid.innerHTML = '';
    for (let floor = 0; floor < 10; floor++) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:4px;';
        for (let col = 0; col < 3; col++) {
            const cell = document.createElement('button');
            cell.style.cssText = 'flex:1;padding:12px;background:var(--bg2);border:1px solid var(--bg4);border-radius:8px;font-size:16px;cursor:pointer;';
            cell.textContent = '?';
            cell.id = `tw-${floor}-${col}`;
            cell.onclick = () => clickTower(floor, col);
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}
function startTower() {
    const bet = getBet('tower'); if (!bet) return;
    // Each floor has 1 bomb in 3 columns
    let bombs = [];
    for (let i = 0; i < 10; i++) bombs.push(Math.floor(Math.random()*3));
    towerState = { active: true, bet, bombs, floor: 0, multi: 1 };
    document.getElementById('tw-start').classList.add('hidden');
    document.getElementById('tw-cash').classList.remove('hidden');
    document.getElementById('tw-msg').innerHTML = '<span class="text-muted">Pick a tile on floor 1!</span>';
    buildTower();
}
function clickTower(floor, col) {
    if (!towerState.active || floor !== towerState.floor) return;
    const cell = document.getElementById(`tw-${floor}-${col}`);
    
    if (towerState.bombs[floor] === col) {
        cell.textContent = '💣'; cell.style.background = 'rgba(239,68,68,0.3)'; cell.style.borderColor = 'var(--red)';
        towerState.active = false;
        // Reveal all bombs
        towerState.bombs.forEach((b, i) => { document.getElementById(`tw-${i}-${b}`).textContent = '💣'; document.getElementById(`tw-${i}-${b}`).style.background = 'rgba(239,68,68,0.1)'; });
        recordGame('Tower', towerState.bet, false, -towerState.bet);
        document.getElementById('tw-msg').innerHTML = `<div class="lose-popup">💣 Floor ${floor+1}! -${towerState.bet.toFixed(2)}</div>`;
        document.getElementById('tw-cash').classList.add('hidden');
        document.getElementById('tw-start').classList.remove('hidden');
    } else {
        cell.textContent = '⭐'; cell.style.background = 'rgba(16,185,129,0.2)'; cell.style.borderColor = 'var(--green)';
        towerState.floor++;
        towerState.multi *= 1.45;
        document.getElementById('tw-multi').textContent = towerState.multi.toFixed(2) + 'x';
        document.getElementById('tw-floor').textContent = towerState.floor;
        
        if (towerState.floor >= 10) {
            towerState.active = false;
            const profit = towerState.bet * towerState.multi - towerState.bet;
            recordGame('Tower', towerState.bet, true, profit);
            document.getElementById('tw-msg').innerHTML = `<div class="win-popup">🏆 TOP! ${towerState.multi.toFixed(2)}x +${(towerState.bet*towerState.multi).toFixed(2)}</div>`;
            document.getElementById('tw-cash').classList.add('hidden');
            document.getElementById('tw-start').classList.remove('hidden');
        }
    }
}
function cashTower() {
    if (!towerState.active) return;
    towerState.active = false;
    const profit = towerState.bet * towerState.multi - towerState.bet;
    recordGame('Tower', towerState.bet, true, profit);
    document.getElementById('tw-msg').innerHTML = `<div class="win-popup">🏗️ Floor ${towerState.floor}! ${towerState.multi.toFixed(2)}x +${(towerState.bet*towerState.multi).toFixed(2)}</div>`;
    towerState.bombs.forEach((b, i) => { document.getElementById(`tw-${i}-${b}`).textContent = '💣'; document.getElementById(`tw-${i}-${b}`).style.background = 'rgba(239,68,68,0.1)'; });
    document.getElementById('tw-cash').classList.add('hidden');
    document.getElementById('tw-start').classList.remove('hidden');
}
