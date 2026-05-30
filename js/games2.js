// ═══════════════════════════════════════════════════════════════
// LIBERTY CASINO - NEW GAMES MODULE v2
// 6 New Premium Games with Enhanced Animations & Sounds
// ═══════════════════════════════════════════════════════════════

// Add new games to the list
gamesList.push(
    { id: 'blackjack', name: 'Blackjack', icon: '🃏', mult: 'up to 2.5x • 97%', coming: false },
    { id: 'dragontiger', name: 'Dragon Tiger', icon: '🐉', mult: '1.96x • 97%', coming: false },
    { id: 'scratch', name: 'Scratch Card', icon: '🎫', mult: 'up to 500x • 95%', coming: false },
    { id: 'penalty', name: 'Penalty Kick', icon: '⚽', mult: '2.2x • 96%', coming: false },
    { id: 'diamond', name: 'Diamond Rush', icon: '💎', mult: 'up to 50x • 96%', coming: false },
    { id: 'aviator', name: 'Aviator', icon: '✈️', mult: 'up to ∞ • 97%', coming: false }
);

// Extend loadGameUI
const _origLoadGameUI = loadGameUI;
loadGameUI = function(id) {
    const body = document.getElementById('game-body');
    switch(id) {
        case 'blackjack': renderBlackjack(body); break;
        case 'dragontiger': renderDragonTiger(body); break;
        case 'scratch': renderScratch(body); break;
        case 'penalty': renderPenalty(body); break;
        case 'diamond': renderDiamondRush(body); break;
        case 'aviator': renderAviator(body); break;
        default: _origLoadGameUI(id); break;
    }
};

// Enhanced sound system
function playSoundFX(type, freq, duration, vol) {
    if (typeof soundEnabled !== 'undefined' && !soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq || 440, ctx.currentTime);
        gain.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (duration || 0.3));
        osc.start(); osc.stop(ctx.currentTime + (duration || 0.3));
    } catch(e) {}
}

function playCardSound() { playSoundFX('sine', 1200, 0.08, 0.15); }
function playFlipSound() { playSoundFX('square', 600, 0.1, 0.1); }
function playScratchSound() { playSoundFX('sawtooth', 300 + Math.random()*200, 0.05, 0.08); }
function playKickSound() { playSoundFX('triangle', 150, 0.3, 0.3); }
function playGoalSound() {
    playSoundFX('sine', 523, 0.15, 0.3);
    setTimeout(() => playSoundFX('sine', 659, 0.15, 0.3), 150);
    setTimeout(() => playSoundFX('sine', 784, 0.3, 0.3), 300);
}
function playGemSound() { playSoundFX('sine', 800 + Math.random()*400, 0.15, 0.2); }
function playEngineSound() { playSoundFX('sawtooth', 100, 0.5, 0.1); }

// ═══════════════════════════════════════════════════════════════
// 13. BLACKJACK — Classic 21
// ═══════════════════════════════════════════════════════════════
const CARD_SUITS = ['♠','♥','♦','♣'];
const CARD_VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let bjState = {};

function bjNewCard() {
    const suit = CARD_SUITS[Math.floor(Math.random()*4)];
    const val = CARD_VALUES[Math.floor(Math.random()*13)];
    const color = (suit === '♥' || suit === '♦') ? '#ef4444' : '#ffffff';
    return { suit, val, color };
}

function bjCardValue(cards) {
    let total = 0, aces = 0;
    for (const c of cards) {
        if (c.val === 'A') { aces++; total += 11; }
        else if (['K','Q','J'].includes(c.val)) total += 10;
        else total += parseInt(c.val);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function bjRenderCards(cards, hidden = false) {
    return cards.map((c, i) => {
        if (hidden && i === 1) return `<div style="display:inline-block;width:50px;height:70px;background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:8px;margin:3px;border:2px solid #60a5fa;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">❓</div>`;
        return `<div style="display:inline-block;width:50px;height:70px;background:linear-gradient(135deg,#1a1a2e,#2a2a4e);border-radius:8px;margin:3px;border:2px solid ${c.color === '#ef4444' ? '#ef4444' : 'var(--bg4)'};display:inline-flex;align-items:center;justify-content:center;flex-direction:column;animation:cardDeal 0.3s ease ${i*0.15}s both;">
            <div style="font-size:16px;font-weight:800;color:${c.color}">${c.val}</div>
            <div style="font-size:12px;color:${c.color}">${c.suit}</div>
        </div>`;
    }).join('');
}

function renderBlackjack(body) {
    bjState = {};
    body.innerHTML = `
        <style>
            @keyframes cardDeal { from { transform: translateY(-30px) rotateY(90deg); opacity:0; } to { transform: translateY(0) rotateY(0); opacity:1; } }
        </style>
        <div style="text-align:center;padding:12px 0;">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">DEALER</div>
            <div id="bj-dealer-cards" style="min-height:76px;"></div>
            <div id="bj-dealer-val" style="font-size:14px;font-weight:700;color:var(--text2);margin-top:4px;"></div>
        </div>
        <div style="width:60%;height:2px;background:var(--bg4);margin:8px auto;border-radius:1px;"></div>
        <div style="text-align:center;padding:12px 0;">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">YOUR HAND</div>
            <div id="bj-player-cards" style="min-height:76px;"></div>
            <div id="bj-player-val" style="font-size:18px;font-weight:800;color:var(--gold);margin-top:4px;"></div>
        </div>
        ${betUI('bj')}
        <button class="play-button" id="bj-deal" onclick="bjDeal()">🃏 DEAL</button>
        <div id="bj-actions" class="hidden" style="display:flex;gap:8px;margin-top:8px;">
            <button class="play-button" onclick="bjHit()" style="flex:1;background:linear-gradient(135deg,var(--accent),#6d28d9)">👆 HIT</button>
            <button class="play-button" onclick="bjStand()" style="flex:1;background:linear-gradient(135deg,var(--gold),#d97706)">✋ STAND</button>
            <button class="play-button" onclick="bjDouble()" id="bj-double-btn" style="flex:1;background:linear-gradient(135deg,var(--green),#059669)">💰 DOUBLE</button>
        </div>
        <div id="bj-result" style="min-height:80px;margin-top:12px;"></div>`;
}

function bjDeal() {
    const bet = getBet('bj'); if (!bet) return;
    playCardSound();
    const player = [bjNewCard(), bjNewCard()];
    const dealer = [bjNewCard(), bjNewCard()];
    bjState = { bet, player, dealer, done: false };
    
    document.getElementById('bj-deal').classList.add('hidden');
    document.getElementById('bj-actions').classList.remove('hidden');
    document.getElementById('bj-actions').style.display = 'flex';
    document.getElementById('bj-result').innerHTML = '';
    
    bjUpdateUI(true);
    
    // Check natural blackjack
    if (bjCardValue(player) === 21) {
        setTimeout(() => bjStand(), 500);
    }
    // Disable double if not enough balance
    if (user.balance < bet) {
        document.getElementById('bj-double-btn').disabled = true;
        document.getElementById('bj-double-btn').style.opacity = '0.5';
    }
}

function bjHit() {
    if (bjState.done) return;
    playCardSound();
    bjState.player.push(bjNewCard());
    bjUpdateUI(true);
    if (bjCardValue(bjState.player) > 21) {
        bjState.done = true;
        bjFinish();
    }
}

function bjStand() {
    if (bjState.done) return;
    bjState.done = true;
    // Dealer draws to 17
    while (bjCardValue(bjState.dealer) < 17) {
        bjState.dealer.push(bjNewCard());
        playCardSound();
    }
    bjFinish();
}

function bjDouble() {
    if (bjState.done) return;
    if (user.balance < bjState.bet) return alert('Yetersiz bakiye!');
    // Deduct extra bet for double
    user.balance -= bjState.bet;
    updateBal();
    bjState.bet *= 2;
    playCardSound();
    bjState.player.push(bjNewCard());
    bjState.done = true;
    bjUpdateUI(true);
    if (bjCardValue(bjState.player) <= 21) {
        while (bjCardValue(bjState.dealer) < 17) {
            bjState.dealer.push(bjNewCard());
        }
    }
    setTimeout(() => bjFinish(), 500);
}

function bjFinish() {
    bjUpdateUI(false); // Show dealer cards
    const pVal = bjCardValue(bjState.player);
    const dVal = bjCardValue(bjState.dealer);
    const bet = bjState.bet;
    let result = '';
    
    document.getElementById('bj-actions').classList.add('hidden');
    document.getElementById('bj-deal').classList.remove('hidden');
    
    if (pVal > 21) {
        result = 'bust';
        recordGame('Blackjack', bet, false, -bet);
        document.getElementById('bj-result').innerHTML = showLoseResult(bet);
        playSound('lose');
    } else if (dVal > 21) {
        recordGame('Blackjack', bet, true, bet);
        document.getElementById('bj-result').innerHTML = showWinResult(bet * 2);
        showConfetti(); playSound('win');
    } else if (pVal === 21 && bjState.player.length === 2) {
        // Blackjack pays 2.5x
        const win = bet * 1.5;
        recordGame('Blackjack', bet, true, win);
        document.getElementById('bj-result').innerHTML = `<div class="win-banner glow-green"><div class="wb-label">🃏 BLACKJACK!</div><div class="wb-amount">+${(bet*2.5).toFixed(2)} USDT</div></div>`;
        showConfetti(); playSound('jackpot');
    } else if (pVal > dVal) {
        recordGame('Blackjack', bet, true, bet);
        document.getElementById('bj-result').innerHTML = showWinResult(bet * 2);
        showConfetti(); playSound('win');
    } else if (pVal === dVal) {
        // Push - return the bet (getBet already deducted it)
        user.balance += bet;
        updateBal(); saveUser();
        document.getElementById('bj-result').innerHTML = `<div style="text-align:center;padding:16px;color:var(--gold);font-size:16px;font-weight:700;">🤝 PUSH — Bet returned</div>`;
    } else {
        recordGame('Blackjack', bet, false, -bet);
        document.getElementById('bj-result').innerHTML = showLoseResult(bet);
        playSound('lose');
    }
}

function bjUpdateUI(hideDealer) {
    document.getElementById('bj-player-cards').innerHTML = bjRenderCards(bjState.player);
    document.getElementById('bj-dealer-cards').innerHTML = bjRenderCards(bjState.dealer, hideDealer);
    document.getElementById('bj-player-val').textContent = bjCardValue(bjState.player);
    document.getElementById('bj-dealer-val').textContent = hideDealer ? bjState.dealer[0].val : bjCardValue(bjState.dealer);
}

// ═══════════════════════════════════════════════════════════════
// 14. DRAGON TIGER — Fast Card Game
// ═══════════════════════════════════════════════════════════════
let dtChoice = null;

function renderDragonTiger(body) {
    dtChoice = null;
    body.innerHTML = `
        <style>
            @keyframes dragonGlow { 0%,100% { box-shadow: 0 0 20px rgba(239,68,68,0.3); } 50% { box-shadow: 0 0 40px rgba(239,68,68,0.6); } }
            @keyframes tigerGlow { 0%,100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); } 50% { box-shadow: 0 0 40px rgba(245,158,11,0.6); } }
            .dt-card { width:70px;height:100px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;flex-direction:column;font-size:24px;font-weight:800;transition:all 0.5s;transform:rotateY(180deg);background:linear-gradient(135deg,#1e40af,#3b82f6); }
            .dt-card.revealed { transform:rotateY(0);background:linear-gradient(135deg,#1a1a2e,#2a2a4e); }
        </style>
        <div style="text-align:center;padding:20px 0;">
            <div style="display:flex;justify-content:center;align-items:center;gap:30px;">
                <div>
                    <div style="font-size:12px;color:#ef4444;font-weight:700;margin-bottom:6px;">🐉 DRAGON</div>
                    <div class="dt-card" id="dt-dragon" style="border:2px solid #ef4444;">❓</div>
                </div>
                <div style="font-size:24px;color:var(--text3);font-weight:800;">VS</div>
                <div>
                    <div style="font-size:12px;color:#f59e0b;font-weight:700;margin-bottom:6px;">🐯 TIGER</div>
                    <div class="dt-card" id="dt-tiger" style="border:2px solid #f59e0b;">❓</div>
                </div>
            </div>
        </div>
        <div class="multi-display"><div class="multi-value" style="color:var(--gold)">1.96x</div><div class="multi-label">Payout • Tie pays 8x</div></div>
        <div class="choice-row">
            <button class="choice-btn" id="dt-d" onclick="dtChoice='dragon';document.querySelectorAll('[id^=dt-d],[id^=dt-t],[id^=dt-tie]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="border-color:#ef4444;">
                <div style="font-size:28px">🐉</div><div style="font-weight:700;color:#ef4444;">DRAGON</div>
            </button>
            <button class="choice-btn" id="dt-tie" onclick="dtChoice='tie';document.querySelectorAll('[id^=dt-d],[id^=dt-t],[id^=dt-tie]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')">
                <div style="font-size:28px">🤝</div><div style="font-weight:700;">TIE 8x</div>
            </button>
            <button class="choice-btn" id="dt-t" onclick="dtChoice='tiger';document.querySelectorAll('[id^=dt-d],[id^=dt-t],[id^=dt-tie]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="border-color:#f59e0b;">
                <div style="font-size:28px">🐯</div><div style="font-weight:700;color:#f59e0b;">TIGER</div>
            </button>
        </div>
        ${betUI('dt')}
        <button class="play-button" id="dt-btn" onclick="playDragonTiger()">⚔️ FIGHT!</button>
        <div id="dt-result" style="min-height:80px;margin-top:12px;"></div>`;
}

function playDragonTiger() {
    if (!dtChoice) return alert('Dragon, Tiger veya Tie seçin!');
    const bet = getBet('dt'); if (!bet) return;
    document.getElementById('dt-btn').disabled = true;
    
    const dragonVal = Math.floor(Math.random() * 13);
    const tigerVal = Math.floor(Math.random() * 13);
    const dragonCard = CARD_VALUES[dragonVal];
    const tigerCard = CARD_VALUES[tigerVal];
    const dragonSuit = CARD_SUITS[Math.floor(Math.random()*4)];
    const tigerSuit = CARD_SUITS[Math.floor(Math.random()*4)];
    
    // Animate reveal
    const dEl = document.getElementById('dt-dragon');
    const tEl = document.getElementById('dt-tiger');
    
    playFlipSound();
    setTimeout(() => {
        dEl.classList.add('revealed');
        dEl.innerHTML = `<div style="color:${dragonSuit==='♥'||dragonSuit==='♦'?'#ef4444':'white'}">${dragonCard}</div><div style="font-size:14px;">${dragonSuit}</div>`;
        playFlipSound();
    }, 500);
    
    setTimeout(() => {
        tEl.classList.add('revealed');
        tEl.innerHTML = `<div style="color:${tigerSuit==='♥'||tigerSuit==='♦'?'#f59e0b':'white'}">${tigerCard}</div><div style="font-size:14px;">${tigerSuit}</div>`;
        
        // Determine winner
        let winner;
        if (dragonVal > tigerVal) winner = 'dragon';
        else if (tigerVal > dragonVal) winner = 'tiger';
        else winner = 'tie';
        
        setTimeout(() => {
            const won = dtChoice === winner;
            const mult = dtChoice === 'tie' ? 8 : 1.96;
            
            if (won) {
                const profit = bet * mult - bet;
                recordGame('Dragon Tiger', bet, true, profit);
                document.getElementById('dt-result').innerHTML = showWinResult(bet * mult);
                if (winner === 'dragon') dEl.style.animation = 'dragonGlow 0.5s infinite';
                else if (winner === 'tiger') tEl.style.animation = 'tigerGlow 0.5s infinite';
                showConfetti();
            } else {
                recordGame('Dragon Tiger', bet, false, -bet);
                document.getElementById('dt-result').innerHTML = showLoseResult(bet);
            }
            
            setTimeout(() => {
                dEl.style.animation = ''; tEl.style.animation = '';
                dEl.classList.remove('revealed'); tEl.classList.remove('revealed');
                dEl.innerHTML = '❓'; tEl.innerHTML = '❓';
                document.getElementById('dt-btn').disabled = false;
            }, 3000);
        }, 600);
    }, 1200);
}

// ═══════════════════════════════════════════════════════════════
// 15. SCRATCH CARD — Interactive Scratch to Win
// ═══════════════════════════════════════════════════════════════
function renderScratch(body) {
    body.innerHTML = `
        <style>
            .scratch-cell { width:calc(33.33% - 6px);aspect-ratio:1;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;transition:all 0.3s;border:2px solid rgba(139,92,246,0.3);user-select:none; }
            .scratch-cell:hover { transform:scale(1.05);box-shadow:0 0 15px rgba(139,92,246,0.4); }
            .scratch-cell.scratched { background:linear-gradient(135deg,#1a1a2e,#2a2a4e);border-color:var(--bg4);cursor:default;animation:scratchReveal 0.3s ease; }
            @keyframes scratchReveal { from { transform:scale(0.8) rotateZ(5deg); } to { transform:scale(1) rotateZ(0); } }
            .scratch-cell.winner { border-color:var(--gold);box-shadow:0 0 20px rgba(245,158,11,0.4);animation:winPulse 0.5s infinite alternate; }
            @keyframes winPulse { from { box-shadow:0 0 10px rgba(245,158,11,0.3); } to { box-shadow:0 0 30px rgba(245,158,11,0.6); } }
        </style>
        <div style="text-align:center;padding:12px 0;">
            <div style="font-size:14px;font-weight:700;color:var(--gold);">🎫 Scratch & Win!</div>
            <div style="font-size:11px;color:var(--text3);margin-top:4px;">3 aynı sembol = Kazanç! Kazı ve şansını dene.</div>
        </div>
        <div id="scratch-grid" style="display:flex;flex-wrap:wrap;gap:6px;max-width:280px;margin:12px auto;padding:12px;background:var(--bg2);border-radius:16px;"></div>
        ${betUI('scratch')}
        <button class="play-button" id="scratch-btn" onclick="startScratch()">🎫 BUY CARD ($1-$500)</button>
        <div id="scratch-result" style="min-height:80px;margin-top:12px;"></div>`;
    buildScratchGrid();
}

function buildScratchGrid() {
    const grid = document.getElementById('scratch-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'scratch-cell';
        cell.id = `sc-${i}`;
        cell.textContent = '❓';
        grid.appendChild(cell);
    }
}

let scratchState = { active: false };

function startScratch() {
    const bet = getBet('scratch'); if (!bet) return;
    document.getElementById('scratch-btn').disabled = true;
    
    // Generate prizes under cells
    const symbols = ['💎','⭐','🍒','🔔','7️⃣','👑','🍀','💰','🎯'];
    const prizes = { '💎': 50, '⭐': 20, '🍒': 5, '🔔': 10, '7️⃣': 100, '👑': 500, '🍀': 3, '💰': 25, '🎯': 8 };
    
    // Determine outcome first (house edge)
    const rand = Math.random();
    let grid = [];
    
    if (rand < 0.005) { // 0.5% - 500x (3x 👑)
        const sym = '👑';
        grid = [sym, sym, sym, ...Array(6).fill(null).map(() => symbols[Math.floor(Math.random()*symbols.length)])];
    } else if (rand < 0.02) { // 1.5% - 100x (3x 7️⃣)
        const sym = '7️⃣';
        grid = [sym, sym, sym, ...Array(6).fill(null).map(() => symbols[Math.floor(Math.random()*symbols.length)])];
    } else if (rand < 0.05) { // 3% - 50x
        const sym = '💎';
        grid = [sym, sym, sym, ...Array(6).fill(null).map(() => symbols[Math.floor(Math.random()*symbols.length)])];
    } else if (rand < 0.12) { // 7% - 5-25x
        const winSyms = ['🍒','🔔','⭐','💰'];
        const sym = winSyms[Math.floor(Math.random()*winSyms.length)];
        grid = [sym, sym, sym, ...Array(6).fill(null).map(() => symbols[Math.floor(Math.random()*symbols.length)])];
    } else if (rand < 0.25) { // 13% - 3x
        const sym = '🍀';
        grid = [sym, sym, sym, ...Array(6).fill(null).map(() => symbols[Math.floor(Math.random()*symbols.length)])];
    } else {
        // No win - ensure no 3 of a kind
        grid = [];
        for (let i = 0; i < 9; i++) {
            let s;
            do { s = symbols[Math.floor(Math.random()*symbols.length)]; }
            while (grid.filter(x => x === s).length >= 2);
            grid.push(s);
        }
    }
    
    // Shuffle
    for (let i = grid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    
    scratchState = { active: true, bet, grid, revealed: 0, prizes };
    
    // Make cells clickable
    for (let i = 0; i < 9; i++) {
        const cell = document.getElementById(`sc-${i}`);
        cell.className = 'scratch-cell';
        cell.textContent = '❓';
        cell.onclick = () => scratchCell(i);
    }
}

function scratchCell(i) {
    if (!scratchState.active) return;
    const cell = document.getElementById(`sc-${i}`);
    if (cell.classList.contains('scratched')) return;
    
    playScratchSound();
    cell.classList.add('scratched');
    cell.textContent = scratchState.grid[i];
    scratchState.revealed++;
    
    // Check if all revealed
    if (scratchState.revealed >= 9) {
        scratchState.active = false;
        checkScratchWin();
    }
}

function checkScratchWin() {
    const grid = scratchState.grid;
    const bet = scratchState.bet;
    const prizes = scratchState.prizes;
    
    // Count symbols
    const counts = {};
    grid.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    
    // Find 3+ of a kind
    let winSymbol = null;
    for (const [sym, count] of Object.entries(counts)) {
        if (count >= 3) { winSymbol = sym; break; }
    }
    
    if (winSymbol) {
        const mult = prizes[winSymbol] || 5;
        const profit = bet * mult - bet;
        recordGame('Scratch Card', bet, true, profit);
        
        // Highlight winning cells
        for (let i = 0; i < 9; i++) {
            if (grid[i] === winSymbol) {
                document.getElementById(`sc-${i}`).classList.add('winner');
            }
        }
        
        document.getElementById('scratch-result').innerHTML = `
            <div class="win-banner glow-green">
                <div class="wb-label">🎫 ${winSymbol}${winSymbol}${winSymbol} — ${mult}x WIN!</div>
                <div class="wb-amount">+${(bet*mult).toFixed(2)} USDT</div>
            </div>`;
        showConfetti();
        if (mult >= 50) { showConfetti(); playSound('jackpot'); }
        else playSound('win');
    } else {
        recordGame('Scratch Card', bet, false, -bet);
        document.getElementById('scratch-result').innerHTML = showLoseResult(bet);
        playSound('lose');
    }
    
    setTimeout(() => {
        document.getElementById('scratch-btn').disabled = false;
        buildScratchGrid();
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// 16. PENALTY KICK — Football Themed
// ═══════════════════════════════════════════════════════════════
let penaltyChoice = null;

function renderPenalty(body) {
    penaltyChoice = null;
    body.innerHTML = `
        <style>
            .goal-frame { position:relative;width:280px;height:160px;margin:0 auto;background:linear-gradient(180deg,#064e3b,#065f46);border:4px solid white;border-bottom:none;border-radius:4px 4px 0 0;overflow:hidden; }
            .goal-net { position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent,transparent 18px,rgba(255,255,255,0.1) 18px,rgba(255,255,255,0.1) 20px),repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(255,255,255,0.1) 18px,rgba(255,255,255,0.1) 20px); }
            .goal-zone { position:absolute;width:33.33%;height:50%;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;font-size:11px;color:rgba(255,255,255,0.3);font-weight:700; }
            .goal-zone:hover { background:rgba(255,255,255,0.1); }
            .goal-zone.selected { background:rgba(139,92,246,0.3);border:2px solid var(--accent); }
            .goal-zone.ball { font-size:32px;color:white; }
            .goal-zone.saved { background:rgba(239,68,68,0.3); }
            .goal-zone.scored { background:rgba(16,185,129,0.3); }
            .penalty-ball { font-size:48px;text-align:center;margin:12px 0;transition:all 0.5s; }
            @keyframes kickBall { 0% { transform:scale(1) translateY(0); } 50% { transform:scale(0.6) translateY(-60px); } 100% { transform:scale(0.4) translateY(-120px); } }
        </style>
        <div style="text-align:center;padding:8px 0;">
            <div class="goal-frame">
                <div class="goal-net"></div>
                <div class="goal-zone" style="top:0;left:0;" id="pz-tl" onclick="selectPenaltyZone('tl')">↖</div>
                <div class="goal-zone" style="top:0;left:33.33%;" id="pz-tc" onclick="selectPenaltyZone('tc')">⬆</div>
                <div class="goal-zone" style="top:0;left:66.66%;" id="pz-tr" onclick="selectPenaltyZone('tr')">↗</div>
                <div class="goal-zone" style="top:50%;left:0;" id="pz-bl" onclick="selectPenaltyZone('bl')">↙</div>
                <div class="goal-zone" style="top:50%;left:33.33%;" id="pz-bc" onclick="selectPenaltyZone('bc')">⬇</div>
                <div class="goal-zone" style="top:50%;left:66.66%;" id="pz-br" onclick="selectPenaltyZone('br')">↘</div>
            </div>
            <div class="penalty-ball" id="pen-ball">⚽</div>
            <div style="font-size:11px;color:var(--text3);">Kaleye nişan al! 6 bölgeden birini seç.</div>
        </div>
        <div class="multi-display"><div class="multi-value" style="color:var(--green)">2.2x</div><div class="multi-label">Gol atarsan kazanırsın! • RTP 96%</div></div>
        ${betUI('pen')}
        <button class="play-button" id="pen-btn" onclick="shootPenalty()">⚽ SHOOT!</button>
        <div id="pen-result" style="min-height:80px;margin-top:12px;"></div>`;
}

function selectPenaltyZone(zone) {
    penaltyChoice = zone;
    document.querySelectorAll('.goal-zone').forEach(z => z.classList.remove('selected'));
    document.getElementById(`pz-${zone}`).classList.add('selected');
}

function shootPenalty() {
    if (!penaltyChoice) return alert('Kaleye nişan al! Bir bölge seç.');
    const bet = getBet('pen'); if (!bet) return;
    document.getElementById('pen-btn').disabled = true;
    
    const zones = ['tl','tc','tr','bl','bc','br'];
    const keeperZone = zones[Math.floor(Math.random() * 6)];
    
    // 73% chance to score (keeper dives wrong way or misses)
    // If keeper picks same zone: 30% still scores (bad dive)
    const sameZone = penaltyChoice === keeperZone;
    const scored = sameZone ? Math.random() < 0.30 : Math.random() < 0.85;
    // Adjust for RTP: ~96% / 2.2 = ~43.6% win rate
    const finalScored = Math.random() < (RTP.crash / 2.2);
    
    // Animate
    const ball = document.getElementById('pen-ball');
    ball.style.animation = 'kickBall 0.6s ease forwards';
    playKickSound();
    
    setTimeout(() => {
        // Show keeper position
        document.getElementById(`pz-${keeperZone}`).innerHTML = '🧤';
        document.getElementById(`pz-${keeperZone}`).style.fontSize = '28px';
        
        if (finalScored) {
            document.getElementById(`pz-${penaltyChoice}`).classList.add('scored');
            document.getElementById(`pz-${penaltyChoice}`).innerHTML = '⚽';
            document.getElementById(`pz-${penaltyChoice}`).style.fontSize = '28px';
            playGoalSound();
            
            const profit = bet * 2.2 - bet;
            recordGame('Penalty', bet, true, profit);
            document.getElementById('pen-result').innerHTML = `
                <div class="win-banner glow-green">
                    <div class="wb-label">⚽ GOOOL!</div>
                    <div class="wb-amount">+${(bet*2.2).toFixed(2)} USDT</div>
                </div>`;
            showConfetti();
        } else {
            document.getElementById(`pz-${penaltyChoice}`).classList.add('saved');
            document.getElementById(`pz-${keeperZone}`).classList.add('saved');
            playSound('lose');
            recordGame('Penalty', bet, false, -bet);
            document.getElementById('pen-result').innerHTML = `
                <div class="lose-banner">
                    <div class="wb-label">🧤 Kaleci kurtardı!</div>
                    <div class="wb-amount">-${bet.toFixed(2)} USDT</div>
                </div>`;
        }
        
        setTimeout(() => {
            ball.style.animation = '';
            document.querySelectorAll('.goal-zone').forEach(z => {
                z.classList.remove('selected','saved','scored');
                z.style.fontSize = '';
            });
            document.getElementById(`pz-tl`).innerHTML = '↖';
            document.getElementById(`pz-tc`).innerHTML = '⬆';
            document.getElementById(`pz-tr`).innerHTML = '↗';
            document.getElementById(`pz-bl`).innerHTML = '↙';
            document.getElementById(`pz-bc`).innerHTML = '⬇';
            document.getElementById(`pz-br`).innerHTML = '↘';
            penaltyChoice = null;
            document.getElementById('pen-btn').disabled = false;
        }, 3000);
    }, 800);
}

// ═══════════════════════════════════════════════════════════════
// 17. DIAMOND RUSH — Gem Collection Grid
// ═══════════════════════════════════════════════════════════════
let diamondState = { active: false };

function renderDiamondRush(body) {
    body.innerHTML = `
        <style>
            .gem-grid { display:grid;grid-template-columns:repeat(5,1fr);gap:4px;max-width:300px;margin:12px auto; }
            .gem-cell { aspect-ratio:1;border-radius:10px;background:linear-gradient(135deg,var(--bg2),var(--bg3));border:2px solid var(--bg4);display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;transition:all 0.2s;user-select:none; }
            .gem-cell:hover { transform:scale(1.1);border-color:var(--accent); }
            .gem-cell.collected { background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.2));border-color:var(--green);animation:gemCollect 0.3s ease; }
            .gem-cell.bomb { background:linear-gradient(135deg,rgba(239,68,68,0.2),rgba(220,38,38,0.2));border-color:var(--red);animation:mine-explode 0.5s ease; }
            @keyframes gemCollect { 0% { transform:scale(1.3); } 100% { transform:scale(1); } }
        </style>
        <div class="multi-display">
            <div class="multi-value" id="dr-multi">0x</div>
            <div class="multi-label">Collected: <span id="dr-count">0</span> gems • <span id="dr-profit">$0.00</span></div>
        </div>
        <div class="gem-grid" id="dr-grid"></div>
        <div style="text-align:center;font-size:11px;color:var(--text3);margin:8px 0;">
            💎 Gem topla, 💣 bombadan kaçın! Her gem multiplier'ı artırır.
        </div>
        ${betUI('dr')}
        <button class="play-button" id="dr-start" onclick="startDiamondRush()">💎 START RUSH</button>
        <button class="play-button hidden" id="dr-cash" onclick="cashDiamondRush()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT (<span id="dr-cashamt">$0.00</span>)</button>
        <div id="dr-result" style="min-height:60px;margin-top:12px;"></div>`;
    buildDiamondGrid();
}

function buildDiamondGrid() {
    const grid = document.getElementById('dr-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'gem-cell';
        cell.id = `gem-${i}`;
        cell.textContent = '✨';
        cell.onclick = () => clickGem(i);
        grid.appendChild(cell);
    }
}

function startDiamondRush() {
    const bet = getBet('dr'); if (!bet) return;
    
    // Place 5-8 bombs randomly
    const bombCount = 5 + Math.floor(Math.random() * 4);
    let bombs = [];
    while (bombs.length < bombCount) {
        const p = Math.floor(Math.random() * 25);
        if (!bombs.includes(p)) bombs.push(p);
    }
    
    // Assign gem values to non-bomb cells
    const gems = ['💎','💎','💎','⭐','⭐','🔮','🔮','🔮','💠','💠','💠','💠','✨','✨','✨','✨','✨'];
    const gemValues = { '💎': 3, '⭐': 2, '🔮': 1.5, '💠': 1.2, '✨': 1 };
    
    let cellContents = [];
    for (let i = 0; i < 25; i++) {
        if (bombs.includes(i)) cellContents.push('💣');
        else cellContents.push(gems[Math.floor(Math.random() * gems.length)]);
    }
    
    diamondState = { active: true, bet, bombs, cellContents, collected: 0, multi: 1, gemValues };
    
    document.getElementById('dr-start').classList.add('hidden');
    document.getElementById('dr-cash').classList.remove('hidden');
    document.getElementById('dr-result').innerHTML = '<span class="text-muted">💎 Gem\'lere tıkla! Bombalardan kaçın.</span>';
    document.getElementById('dr-multi').textContent = '1.00x';
    document.getElementById('dr-count').textContent = '0';
    document.getElementById('dr-profit').textContent = '$0.00';
    
    buildDiamondGrid();
}

function clickGem(i) {
    if (!diamondState.active) return;
    const cell = document.getElementById(`gem-${i}`);
    if (cell.classList.contains('collected') || cell.classList.contains('bomb')) return;
    
    const content = diamondState.cellContents[i];
    
    if (content === '💣') {
        // Hit bomb!
        cell.classList.add('bomb');
        cell.textContent = '💣';
        diamondState.active = false;
        playSound('lose');
        
        // Reveal all bombs
        diamondState.bombs.forEach((b, idx) => {
            setTimeout(() => {
                const bc = document.getElementById(`gem-${b}`);
                bc.textContent = '💣';
                bc.classList.add('bomb');
            }, idx * 100);
        });
        
        recordGame('Diamond Rush', diamondState.bet, false, -diamondState.bet);
        document.getElementById('dr-result').innerHTML = showLoseResult(diamondState.bet);
        document.getElementById('dr-cash').classList.add('hidden');
        document.getElementById('dr-start').classList.remove('hidden');
    } else {
        // Collected gem!
        cell.classList.add('collected');
        cell.textContent = content;
        playGemSound();
        
        diamondState.collected++;
        const gemMult = diamondState.gemValues[content] || 1;
        diamondState.multi += gemMult * 0.3;
        
        document.getElementById('dr-multi').textContent = diamondState.multi.toFixed(2) + 'x';
        document.getElementById('dr-count').textContent = diamondState.collected;
        document.getElementById('dr-profit').textContent = '$' + (diamondState.bet * diamondState.multi - diamondState.bet).toFixed(2);
        document.getElementById('dr-cashamt').textContent = '$' + (diamondState.bet * diamondState.multi).toFixed(2);
        
        // All safe cells collected?
        if (diamondState.collected >= 25 - diamondState.bombs.length) {
            cashDiamondRush();
        }
    }
}

function cashDiamondRush() {
    if (!diamondState.active) return;
    diamondState.active = false;
    
    const profit = diamondState.bet * diamondState.multi - diamondState.bet;
    recordGame('Diamond Rush', diamondState.bet, true, profit);
    document.getElementById('dr-result').innerHTML = showWinResult(diamondState.bet * diamondState.multi);
    showConfetti();
    playSound('win');
    
    // Reveal bombs
    diamondState.bombs.forEach((b, idx) => {
        setTimeout(() => {
            const bc = document.getElementById(`gem-${b}`);
            bc.textContent = '💣';
            bc.style.opacity = '0.5';
        }, idx * 80);
    });
    
    document.getElementById('dr-cash').classList.add('hidden');
    document.getElementById('dr-start').classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════════
// 18. AVIATOR — Plane Flying Up (Crash variant)
// ═══════════════════════════════════════════════════════════════
let aviatorState = { active: false };

function renderAviator(body) {
    body.innerHTML = `
        <style>
            .aviator-sky { position:relative;width:100%;height:200px;background:linear-gradient(180deg,#0c1445,#1e3a5f,#2d6187);border-radius:16px;overflow:hidden;margin-bottom:12px; }
            .aviator-plane { position:absolute;bottom:20px;left:20px;font-size:36px;transition:all 0.1s linear;filter:drop-shadow(0 0 10px rgba(255,255,255,0.5)); }
            .aviator-trail { position:absolute;bottom:0;left:0;width:0;height:3px;background:linear-gradient(90deg,transparent,rgba(255,200,0,0.8),rgba(255,100,0,0.6));border-radius:2px;transition:width 0.1s; }
            .aviator-stars { position:absolute;inset:0; }
            .aviator-star { position:absolute;width:2px;height:2px;background:white;border-radius:50%;animation:twinkle 2s infinite; }
            @keyframes twinkle { 0%,100% { opacity:0.3; } 50% { opacity:1; } }
            .aviator-multi { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:42px;font-weight:900;color:white;text-shadow:0 0 20px rgba(255,255,255,0.5); }
            .aviator-explode { animation:explode 0.5s ease forwards; }
            @keyframes explode { 0% { transform:translate(-50%,-50%) scale(1); } 50% { transform:translate(-50%,-50%) scale(1.5);color:#ef4444; } 100% { transform:translate(-50%,-50%) scale(0.8);color:#ef4444; } }
            .aviator-clouds { position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(0deg,rgba(255,255,255,0.05),transparent); }
        </style>
        <div class="aviator-sky" id="av-sky">
            <div class="aviator-stars" id="av-stars"></div>
            <div class="aviator-clouds"></div>
            <div class="aviator-trail" id="av-trail"></div>
            <div class="aviator-plane" id="av-plane">✈️</div>
            <div class="aviator-multi" id="av-multi">1.00x</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);padding:0 4px;margin-bottom:8px;">
            <span>🛫 Takeoff</span>
            <span id="av-status" style="color:var(--green);">Ready</span>
            <span>☁️ Sky</span>
        </div>
        ${betUI('av')}
        <button class="play-button" id="av-start" onclick="startAviator()">✈️ FLY!</button>
        <button class="play-button hidden" id="av-stop" onclick="stopAviator()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 CASH OUT (<span id="av-amt">$0.00</span>)</button>
        <div id="av-result" style="min-height:80px;margin-top:12px;"></div>`;
    
    // Add stars
    const starsEl = document.getElementById('av-stars');
    for (let i = 0; i < 30; i++) {
        const star = document.createElement('div');
        star.className = 'aviator-star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 70 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        starsEl.appendChild(star);
    }
}

function startAviator() {
    const bet = getBet('av'); if (!bet) return;
    const crashAt = 1 / (1 - Math.random() * RTP.crash);
    aviatorState = { active: true, bet, multi: 1, crashAt };
    
    document.getElementById('av-start').classList.add('hidden');
    document.getElementById('av-stop').classList.remove('hidden');
    document.getElementById('av-result').innerHTML = '';
    document.getElementById('av-status').textContent = 'Flying...';
    document.getElementById('av-status').style.color = 'var(--green)';
    
    const plane = document.getElementById('av-plane');
    const trail = document.getElementById('av-trail');
    const multi = document.getElementById('av-multi');
    
    playEngineSound();
    
    const tick = setInterval(() => {
        if (!aviatorState.active) { clearInterval(tick); return; }
        
        aviatorState.multi += 0.01 + (aviatorState.multi * 0.004);
        const m = aviatorState.multi;
        
        multi.textContent = m.toFixed(2) + 'x';
        document.getElementById('av-amt').textContent = '$' + (aviatorState.bet * m).toFixed(2);
        
        // Move plane up and right
        const progress = Math.min(1, m / aviatorState.crashAt);
        plane.style.left = (20 + progress * 60) + '%';
        plane.style.bottom = (20 + progress * 60) + '%';
        plane.style.transform = `rotate(-${progress * 30}deg)`;
        trail.style.width = (progress * 80) + '%';
        trail.style.bottom = (20 + progress * 30) + '%';
        
        // Color changes
        if (m > 2) multi.style.color = '#fbbf24';
        if (m > 5) multi.style.color = '#f97316';
        if (m > 10) multi.style.color = '#ec4899';
        if (m > 20) multi.style.color = '#a855f7';
        
        // Engine sound periodically
        if (Math.random() < 0.02) playEngineSound();
        
        if (m >= aviatorState.crashAt) {
            clearInterval(tick);
            aviatorState.active = false;
            
            // Crash animation
            plane.textContent = '💥';
            plane.style.transform = 'rotate(45deg) scale(1.5)';
            multi.textContent = '💥 ' + aviatorState.crashAt.toFixed(2) + 'x';
            multi.classList.add('aviator-explode');
            trail.style.background = 'linear-gradient(90deg,transparent,rgba(239,68,68,0.8))';
            document.getElementById('av-status').textContent = 'CRASHED!';
            document.getElementById('av-status').style.color = 'var(--red)';
            
            playSound('lose');
            recordGame('Aviator', bet, false, -bet);
            document.getElementById('av-result').innerHTML = showLoseResult(bet);
            document.getElementById('av-stop').classList.add('hidden');
            document.getElementById('av-start').classList.remove('hidden');
            
            // Reset after delay
            setTimeout(() => {
                plane.textContent = '✈️';
                plane.style.left = '20px'; plane.style.bottom = '20px'; plane.style.transform = '';
                trail.style.width = '0'; trail.style.background = '';
                multi.textContent = '1.00x'; multi.style.color = 'white';
                multi.classList.remove('aviator-explode');
                document.getElementById('av-status').textContent = 'Ready';
                document.getElementById('av-status').style.color = 'var(--green)';
            }, 3000);
        }
    }, 50);
}

function stopAviator() {
    if (!aviatorState.active) return;
    aviatorState.active = false;
    
    const profit = aviatorState.bet * aviatorState.multi - aviatorState.bet;
    recordGame('Aviator', aviatorState.bet, true, profit);
    
    document.getElementById('av-multi').textContent = aviatorState.multi.toFixed(2) + 'x ✓';
    document.getElementById('av-status').textContent = 'Cashed Out!';
    document.getElementById('av-result').innerHTML = showWinResult(aviatorState.bet * aviatorState.multi);
    showConfetti();
    playSound('win');
    
    document.getElementById('av-stop').classList.add('hidden');
    document.getElementById('av-start').classList.remove('hidden');
    
    // Reset plane
    setTimeout(() => {
        const plane = document.getElementById('av-plane');
        const trail = document.getElementById('av-trail');
        plane.style.left = '20px'; plane.style.bottom = '20px'; plane.style.transform = '';
        trail.style.width = '0';
        document.getElementById('av-multi').textContent = '1.00x';
        document.getElementById('av-multi').style.color = 'white';
        document.getElementById('av-status').textContent = 'Ready';
        document.getElementById('av-status').style.color = 'var(--green)';
    }, 2500);
}
