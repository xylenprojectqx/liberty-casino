// === LIBERTY CASINO - Premium App ===
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// === USER DATA ===
let user = {
    id: tg?.initDataUnsafe?.user?.id || 'guest_' + Date.now(),
    name: tg?.initDataUnsafe?.user?.first_name || 'Player',
    balance: 0,
    totalGames: 0,
    totalWins: 0,
    totalProfit: 0,
    history: [],
};

const ADDRESSES = {
    TRX: "TBywuYKGLtaEXLgiq7BMXBjryq7SrtxdFQ",
    USDT_TRC20: "TBywuYKGLtaEXLgiq7BMXBjryq7SrtxdFQ",
    USDT_SOL: "7ubBLrETVYw1KZAXzrmbHydUXiFNu9SF5JoaTq27Hpxi",
};

// Load saved data
const saved = localStorage.getItem(`lc_${user.id}`);
if (saved) user = { ...user, ...JSON.parse(saved) };

function save() { localStorage.setItem(`lc_${user.id}`, JSON.stringify(user)); }

// === INIT ===
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        switchTab('home');
    }, 2800);
});

// === BALANCE UPDATE ===
function updateBal() {
    document.getElementById('balance').textContent = user.balance.toFixed(2);
    const gb = document.getElementById('game-bal');
    if (gb) gb.textContent = user.balance.toFixed(2);
}

// === RECORD GAME ===
function recordGame(game, bet, won, profit) {
    user.totalGames++;
    if (won) user.totalWins++;
    user.totalProfit += profit;
    user.balance += profit;
    user.history.unshift({ game, bet, won, profit, time: new Date().toLocaleTimeString() });
    if (user.history.length > 50) user.history.pop();
    save();
    updateBal();
}

// === TAB SWITCHING ===
function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');

    const content = document.getElementById('content');
    switch(tab) {
        case 'home': content.innerHTML = renderHome(); break;
        case 'games': content.innerHTML = renderGames(); break;
        case 'wallet': content.innerHTML = renderWallet(); break;
        case 'rewards': content.innerHTML = renderRewards(); break;
        case 'profile': content.innerHTML = renderProfile(); break;
    }
    updateBal();
}

// === RENDER HOME ===
function renderHome() {
    return `
        <div class="hero-banner">
            <div class="hero-title">🎰 Welcome to Liberty Casino</div>
            <div class="hero-sub">Play, Win, Withdraw. Provably Fair Games.</div>
            <button class="hero-btn" onclick="switchTab('games')">Play Now →</button>
        </div>

        <div class="section-title"><span>🔥</span> Popular Games</div>
        <div class="games-row">
            ${gamesList.slice(0,6).map(g => `
                <div class="game-card" onclick="openGame('${g.id}')">
                    <div class="gc-icon">${g.icon}</div>
                    <div class="gc-name">${g.name}</div>
                    <div class="gc-mult">${g.mult}</div>
                </div>
            `).join('')}
        </div>

        <div class="section-title mt-20"><span>⚡</span> Recent Activity</div>
        ${user.history.length === 0 ? '<p class="text-sm text-muted">No games yet. Start playing!</p>' :
          user.history.slice(0,5).map(h => `
            <div class="history-item">
                <div class="hi-left">
                    <span class="hi-icon">${h.won ? '✅' : '❌'}</span>
                    <div><div class="hi-game">${h.game}</div><div class="hi-time">${h.time}</div></div>
                </div>
                <div class="hi-amount ${h.won ? 'win' : 'loss'}">${h.won ? '+' : ''}${h.profit.toFixed(2)}</div>
            </div>
          `).join('')}
    `;
}

// === RENDER GAMES ===
function renderGames() {
    return `
        <div class="section-title"><span>🎮</span> All Games</div>
        <div class="games-grid">
            ${gamesList.map(g => `
                <div class="game-card-grid ${g.coming ? 'coming' : ''}" onclick="${g.coming ? '' : `openGame('${g.id}')`}">
                    <div class="gc-icon">${g.icon}</div>
                    <div class="gc-name">${g.name}</div>
                    <div class="gc-mult">${g.mult}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// === RENDER WALLET ===
function renderWallet() {
    return `
        <div class="wallet-hero">
            <div class="wallet-label">Total Balance</div>
            <div class="wallet-amount">${user.balance.toFixed(2)} <span class="currency">USDT</span></div>
            <div class="wallet-actions">
                <button class="wallet-btn dep" onclick="showDeposit()">Deposit</button>
                <button class="wallet-btn wit" onclick="showWithdraw()">Withdraw</button>
            </div>
        </div>
        <div id="wallet-content"></div>
    `;
}

function showDeposit() {
    document.getElementById('wallet-content').innerHTML = `
        <div class="section-title"><span>💳</span> Select Method</div>
        <div class="payment-option" onclick="showAddress('TRX')">
            <div>💠</div>
            <div><div class="po-name">TRX (Tron)</div><div class="po-network">Tron Network</div></div>
        </div>
        <div class="payment-option" onclick="showAddress('USDT_TRC20')">
            <div>💵</div>
            <div><div class="po-name">USDT</div><div class="po-network">TRC-20 Network</div></div>
        </div>
        <div class="payment-option" onclick="showAddress('USDT_SOL')">
            <div>🟣</div>
            <div><div class="po-name">USDT</div><div class="po-network">Solana Network</div></div>
        </div>
        <div id="address-area"></div>
    `;
}

function showAddress(method) {
    const addr = ADDRESSES[method];
    document.getElementById('address-area').innerHTML = `
        <div class="address-display">
            ${addr}
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${addr}');this.textContent='✓'">Copy</button>
        </div>
        <p class="text-sm text-muted text-center">Min: 5 USDT • Auto-credited in 1-5 min</p>
    `;
}

function showWithdraw() {
    document.getElementById('wallet-content').innerHTML = `
        <div class="section-title"><span>📤</span> Withdraw</div>
        <input class="input-field" type="number" id="w-amount" placeholder="Amount (min 10 USDT)">
        <input class="input-field" type="text" id="w-address" placeholder="Your wallet address">
        <button class="play-button mt-12" onclick="doWithdraw()">Request Withdrawal</button>
        <p class="text-sm text-muted text-center mt-12">Processed within 1-24 hours</p>
    `;
}

function doWithdraw() {
    const amt = parseFloat(document.getElementById('w-amount').value);
    const addr = document.getElementById('w-address').value;
    if (!amt || amt < 10) return alert('Min withdrawal: 10 USDT');
    if (!addr) return alert('Enter wallet address');
    if (amt > user.balance) return alert('Insufficient balance');
    user.balance -= amt; save(); updateBal();
    alert('Withdrawal submitted! Processing in 1-24h.');
    if (tg) tg.sendData(JSON.stringify({ action: 'withdraw', amount: amt, address: addr }));
}

// === RENDER REWARDS ===
function renderRewards() {
    return `
        <div class="section-title"><span>🎁</span> Daily Rewards</div>
        <div class="reward-card">
            <div class="reward-icon">🎲</div>
            <div class="reward-info">
                <div class="reward-title">Daily Bonus</div>
                <div class="reward-desc">Claim 0.50 USDT every 24h</div>
            </div>
            <button class="reward-btn" onclick="claimDaily()">Claim</button>
        </div>
        <div class="reward-card">
            <div class="reward-icon">👥</div>
            <div class="reward-info">
                <div class="reward-title">Refer a Friend</div>
                <div class="reward-desc">Get 10% of their deposits</div>
            </div>
            <button class="reward-btn" onclick="alert('Share your link!')">Share</button>
        </div>
        <div class="reward-card">
            <div class="reward-icon">🏆</div>
            <div class="reward-info">
                <div class="reward-title">VIP Program</div>
                <div class="reward-desc">Higher cashback for VIP players</div>
            </div>
            <button class="reward-btn" onclick="alert('Play more to level up!')">Info</button>
        </div>
    `;
}

function claimDaily() {
    const lastClaim = localStorage.getItem(`lc_daily_${user.id}`);
    const now = Date.now();
    if (lastClaim && now - parseInt(lastClaim) < 86400000) {
        alert('Already claimed today! Come back tomorrow.');
        return;
    }
    user.balance += 0.50; save(); updateBal();
    localStorage.setItem(`lc_daily_${user.id}`, now.toString());
    alert('🎉 +0.50 USDT claimed!');
}

// === RENDER PROFILE ===
function renderProfile() {
    const winRate = user.totalGames > 0 ? ((user.totalWins / user.totalGames) * 100).toFixed(1) : '0.0';
    return `
        <div class="profile-header">
            <div class="profile-avatar">🎮</div>
            <div class="profile-name">${user.name}</div>
            <div class="profile-id">ID: ${user.id}</div>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="sv">${user.totalGames}</div><div class="sl">Games</div></div>
            <div class="stat-card"><div class="sv">${winRate}%</div><div class="sl">Win Rate</div></div>
            <div class="stat-card"><div class="sv">${user.totalProfit.toFixed(1)}</div><div class="sl">Profit</div></div>
        </div>
        <div class="section-title mt-20"><span>📜</span> Game History</div>
        ${user.history.length === 0 ? '<p class="text-sm text-muted">No history yet.</p>' :
          user.history.slice(0,15).map(h => `
            <div class="history-item">
                <div class="hi-left">
                    <span class="hi-icon">${h.won ? '✅' : '❌'}</span>
                    <div><div class="hi-game">${h.game}</div><div class="hi-time">${h.time}</div></div>
                </div>
                <div class="hi-amount ${h.won ? 'win' : 'loss'}">${h.won ? '+' : ''}${h.profit.toFixed(2)}</div>
            </div>
          `).join('')}
    `;
}

// === GAME SCREEN ===
function openGame(id) {
    const game = gamesList.find(g => g.id === id);
    if (!game || game.coming) return;
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-title').textContent = game.name;
    updateBal();
    loadGameUI(id);
}

function closeGame() {
    document.getElementById('game-screen').classList.add('hidden');
    switchTab('home');
}

// === LANGUAGE ===
function showLanguageSelector() {
    openGame('language');
    document.getElementById('game-title').textContent = '🌐 Language';
    document.getElementById('game-body').innerHTML = `
        <div style="width:100%;max-width:360px;">
            <div class="payment-option" onclick="setLanguage('en');closeGame()"><div>🇬🇧</div><div><div class="po-name">English</div></div></div>
            <div class="payment-option" onclick="setLanguage('tr');closeGame()"><div>🇹🇷</div><div><div class="po-name">Türkçe</div></div></div>
            <div class="payment-option" onclick="setLanguage('ru');closeGame()"><div>🇷🇺</div><div><div class="po-name">Русский</div></div></div>
            <div class="payment-option" onclick="setLanguage('ar');closeGame()"><div>🇸🇦</div><div><div class="po-name">العربية</div></div></div>
            <div class="payment-option" onclick="setLanguage('es');closeGame()"><div>🇪🇸</div><div><div class="po-name">Español</div></div></div>
            <div class="payment-option" onclick="setLanguage('zh');closeGame()"><div>🇨🇳</div><div><div class="po-name">中文</div></div></div>
        </div>
    `;
    document.getElementById('game-screen').classList.remove('hidden');
}
