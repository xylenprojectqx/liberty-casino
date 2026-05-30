// === LIBERTY CASINO - Firebase Realtime Database ===
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// === FIREBASE CONFIG ===
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCIf6r-1FGUoI_BP2S8s0Rw2J_JzRCdLnY",
    authDomain: "liberty-casino-59c11.firebaseapp.com",
    databaseURL: "https://liberty-casino-59c11-default-rtdb.firebaseio.com",
    projectId: "liberty-casino-59c11",
    storageBucket: "liberty-casino-59c11.firebasestorage.app",
    messagingSenderId: "902499904549",
    appId: "1:902499904549:web:67cc88ee9aae221a42a3cc"
};

// === CONFIG ===
const ADMIN_ID = 8885409517;
const currentUserId = tg?.initDataUnsafe?.user?.id || 0;
const currentUserName = tg?.initDataUnsafe?.user?.first_name || 'Player';
const isAdmin = (currentUserId == ADMIN_ID);

// === FIREBASE INIT ===
let db = null;
let user = { balance: 0, totalGames: 0, totalWins: 0, totalProfit: 0, totalDeposited: 0, totalWithdrawn: 0, history: [], name: currentUserName, banned: false };

const ADDRESSES = {
    TRX: "TBywuYKGLtaEXLgiq7BMXBjryq7SrtxdFQ",
    USDT_TRC20: "TBywuYKGLtaEXLgiq7BMXBjryq7SrtxdFQ",
    USDT_SOL: "7ubBLrETVYw1KZAXzrmbHydUXiFNu9SF5JoaTq27Hpxi",
};

// Firebase REST API helpers
const DB_URL = FIREBASE_CONFIG.databaseURL;

async function fbGet(path) {
    try {
        const r = await fetch(`${DB_URL}/${path}.json`);
        return await r.json();
    } catch(e) { console.error('FB GET error:', e); return null; }
}

async function fbSet(path, data) {
    try {
        const r = await fetch(`${DB_URL}/${path}.json`, { 
            method: 'PUT', 
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        return r.ok;
    } catch(e) { console.error('FB SET error:', e); return false; }
}

async function fbUpdate(path, data) {
    try {
        const r = await fetch(`${DB_URL}/${path}.json`, { 
            method: 'PATCH', 
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        return r.ok;
    } catch(e) { console.error('FB UPDATE error:', e); return false; }
}

// === LOAD USER FROM FIREBASE ===
async function loadUser() {
    if (!currentUserId) return;
    const data = await fbGet(`users/${currentUserId}`);
    if (data) {
        user = { ...user, ...data };
    } else {
        // New user - create in Firebase
        user.name = currentUserName;
        user.joined = new Date().toISOString();
        await fbSet(`users/${currentUserId}`, user);
    }
    updateBal();
}

async function saveUser() {
    if (!currentUserId) return;
    user.name = currentUserName;
    const url = `${DB_URL}/users/${currentUserId}.json`;
    const body = JSON.stringify(user);
    
    // Use sendBeacon as fallback (works even when page is closing)
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
    }
    
    // Also try fetch
    try {
        await fetch(url, { method: 'PUT', body: body, headers: { 'Content-Type': 'application/json' } });
    } catch(e) { console.error('Save error:', e); }
}

// === INIT ===
window.addEventListener('load', () => {
    setTimeout(async () => {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        await loadUser();
        switchTab('home');
    }, 2800);
});

// Save when page closes
window.addEventListener('beforeunload', () => { saveUser(); });
window.addEventListener('pagehide', () => { saveUser(); });

// === BALANCE ===
function updateBal() {
    const el = document.getElementById('balance');
    if (el) el.textContent = user.balance.toFixed(2);
    const gb = document.getElementById('game-bal');
    if (gb) gb.textContent = user.balance.toFixed(2);
}

// === RECORD GAME ===
function recordGame(game, bet, won, profit) {
    user.totalGames++;
    if (won) user.totalWins++;
    user.totalProfit += profit;
    user.balance += profit;
    if (user.balance < 0) user.balance = 0;
    if (!user.history) user.history = [];
    user.history.unshift({ game, bet, won, profit, time: new Date().toLocaleTimeString() });
    if (user.history.length > 30) user.history.pop();
    updateBal();
    // Save to Firebase in background (don't await)
    saveUser();
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

// === HOME ===
function renderHome() {
    return `
        <div class="hero-banner">
            <div class="hero-title">🎰 Welcome to Liberty Casino</div>
            <div class="hero-sub">Play, Win, Withdraw. Provably Fair.</div>
            <button class="hero-btn" onclick="switchTab('games')">Play Now →</button>
        </div>
        <div class="section-title"><span>🔥</span> Popular Games</div>
        <div class="games-row">
            ${gamesList.slice(0,6).map(g => `
                <div class="game-card" onclick="openGame('${g.id}')">
                    <div class="gc-icon">${g.icon}</div>
                    <div class="gc-name">${g.name}</div>
                    <div class="gc-mult">${g.mult}</div>
                </div>`).join('')}
        </div>
        <div class="section-title mt-20"><span>⚡</span> Recent</div>
        ${!user.history?.length ? '<p class="text-sm text-muted">No games yet.</p>' :
          user.history.slice(0,5).map(h => `
            <div class="history-item">
                <div class="hi-left"><span class="hi-icon">${h.won?'✅':'❌'}</span><div><div class="hi-game">${h.game}</div><div class="hi-time">${h.time}</div></div></div>
                <div class="hi-amount ${h.won?'win':'loss'}">${h.won?'+':''}${h.profit.toFixed(2)}</div>
            </div>`).join('')}
        ${isAdmin ? '<div class="mt-20"><button class="play-button" onclick="switchTab(\'profile\')" style="background:linear-gradient(135deg,#f59e0b,#d97706)">🔐 Admin Panel</button></div>' : ''}
    `;
}

// === GAMES ===
function renderGames() {
    return `<div class="section-title"><span>🎮</span> All Games</div>
        <div class="games-grid">${gamesList.map(g => `
            <div class="game-card-grid ${g.coming?'coming':''}" onclick="${g.coming?'':`openGame('${g.id}')`}">
                <div class="gc-icon">${g.icon}</div><div class="gc-name">${g.name}</div><div class="gc-mult">${g.mult}</div>
            </div>`).join('')}</div>`;
}

// === WALLET ===
function renderWallet() {
    return `
        <div class="wallet-hero">
            <div class="wallet-label">Total Balance</div>
            <div class="wallet-amount">${user.balance.toFixed(2)} <span class="currency">USDT</span></div>
            <div class="wallet-actions">
                <button class="wallet-btn dep" onclick="showDeposit()">Deposit</button>
                <button class="wallet-btn wit" onclick="showWithdraw()">Withdraw</button>
            </div>
        </div><div id="wallet-content"></div>`;
}
function showDeposit() {
    document.getElementById('wallet-content').innerHTML = `
        <div class="section-title"><span>💳</span> Select Method</div>
        <div class="payment-option" onclick="showAddr('TRX')"><div>💠</div><div><div class="po-name">TRX (Tron)</div><div class="po-network">Tron Network</div></div></div>
        <div class="payment-option" onclick="showAddr('USDT_TRC20')"><div>💵</div><div><div class="po-name">USDT</div><div class="po-network">TRC-20</div></div></div>
        <div class="payment-option" onclick="showAddr('USDT_SOL')"><div>🟣</div><div><div class="po-name">USDT</div><div class="po-network">Solana</div></div></div>
        <div id="addr-area"></div>`;
}
function showAddr(m) {
    document.getElementById('addr-area').innerHTML = `
        <div class="address-display">${ADDRESSES[m]}<button class="copy-btn" onclick="navigator.clipboard.writeText('${ADDRESSES[m]}');this.textContent='✓'">Copy</button></div>
        <p class="text-sm text-muted text-center">Send screenshot to @Liberty_Help<br>Min: 5 USDT • Credited 5-30 min</p>`;
}
function showWithdraw() {
    document.getElementById('wallet-content').innerHTML = `
        <div class="section-title"><span>📤</span> Withdraw</div>
        <p class="text-sm text-muted">Message @Liberty_Help with:</p>
        <p class="text-sm" style="margin:8px 0;">• ID: <code>${currentUserId}</code><br>• Amount<br>• Wallet address</p>
        <p class="text-sm text-muted">Min: 10 USDT • 1-24h</p>`;
}

// === REWARDS ===
function renderRewards() {
    return `
        <div class="section-title"><span>🎁</span> Rewards</div>
        <div class="reward-card"><div class="reward-icon">🎲</div><div class="reward-info"><div class="reward-title">Daily Bonus</div><div class="reward-desc">0.50 USDT every 24h</div></div><button class="reward-btn" onclick="claimDaily()">Claim</button></div>
        <div class="reward-card"><div class="reward-icon">👥</div><div class="reward-info"><div class="reward-title">Refer a Friend</div><div class="reward-desc">10% of deposits</div></div><button class="reward-btn" onclick="alert('Share bot link!')">Share</button></div>`;
}
async function claimDaily() {
    const lastClaim = await fbGet(`daily/${currentUserId}`);
    if (lastClaim && Date.now() - lastClaim < 86400000) { alert('Already claimed! Come back tomorrow.'); return; }
    user.balance += 0.50;
    await saveUser();
    await fbSet(`daily/${currentUserId}`, Date.now());
    updateBal();
    alert('🎉 +0.50 USDT claimed!');
}

// === PROFILE / ADMIN ===
function renderProfile() {
    if (isAdmin) return renderAdminPanel();
    const wr = user.totalGames > 0 ? ((user.totalWins/user.totalGames)*100).toFixed(1) : '0.0';
    return `
        <div class="profile-header"><div class="profile-avatar">🎮</div><div class="profile-name">${user.name}</div><div class="profile-id">ID: ${currentUserId}</div></div>
        <div class="stats-grid">
            <div class="stat-card"><div class="sv">${user.totalGames}</div><div class="sl">Games</div></div>
            <div class="stat-card"><div class="sv">${wr}%</div><div class="sl">Win Rate</div></div>
            <div class="stat-card"><div class="sv">${user.totalProfit.toFixed(1)}</div><div class="sl">Profit</div></div>
        </div>`;
}

function renderAdminPanel() {
    return `
        <div class="section-title"><span>🔐</span> ADMIN PANEL</div>
        <div class="section-title mt-20"><span>💰</span> Add Balance</div>
        <input class="input-field" type="number" id="adm-uid" placeholder="User ID">
        <input class="input-field" type="number" id="adm-amount" placeholder="Amount (USDT)">
        <button class="play-button" onclick="adminAddBal()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 Add Balance</button>
        <div class="section-title mt-20"><span>➖</span> Remove Balance</div>
        <input class="input-field" type="number" id="adm-rm-uid" placeholder="User ID">
        <input class="input-field" type="number" id="adm-rm-amount" placeholder="Amount">
        <button class="play-button" onclick="adminRmBal()" style="background:linear-gradient(135deg,var(--red),#dc2626)">➖ Remove</button>
        <div class="section-title mt-20"><span>👥</span> All Users</div>
        <button class="play-button" onclick="loadAdminUsers()" style="background:var(--bg3)">� Load Users</button>
        <div id="admin-users"></div>
    `;
}

async function adminAddBal() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-uid').value;
    const amount = parseFloat(document.getElementById('adm-amount').value);
    if (!uid || !amount) return alert('Fill both fields!');
    
    let userData = await fbGet(`users/${uid}`);
    if (!userData) { userData = { balance: 0, totalGames: 0, totalWins: 0, totalProfit: 0, totalDeposited: 0, totalWithdrawn: 0, history: [], name: '?', joined: new Date().toISOString(), banned: false }; }
    userData.balance = (userData.balance || 0) + amount;
    userData.totalDeposited = (userData.totalDeposited || 0) + amount;
    await fbSet(`users/${uid}`, userData);
    
    alert(`✅ Added ${amount} USDT to ${uid}\nNew balance: ${userData.balance.toFixed(2)}`);
    if (uid == currentUserId) { user = userData; updateBal(); }
}

async function adminRmBal() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-rm-uid').value;
    const amount = parseFloat(document.getElementById('adm-rm-amount').value);
    if (!uid || !amount) return alert('Fill both fields!');
    
    let userData = await fbGet(`users/${uid}`);
    if (!userData) return alert('User not found!');
    userData.balance = Math.max(0, (userData.balance || 0) - amount);
    userData.totalWithdrawn = (userData.totalWithdrawn || 0) + amount;
    await fbSet(`users/${uid}`, userData);
    
    alert(`✅ Removed ${amount} from ${uid}\nNew balance: ${userData.balance.toFixed(2)}`);
    if (uid == currentUserId) { user = userData; updateBal(); }
}

async function loadAdminUsers() {
    if (!isAdmin) return;
    const users = await fbGet('users');
    const container = document.getElementById('admin-users');
    if (!users) { container.innerHTML = '<p class="text-sm text-muted">No users.</p>'; return; }
    
    let html = '';
    for (const [uid, data] of Object.entries(users)) {
        html += `<div class="history-item">
            <div class="hi-left"><span class="hi-icon">${data.banned?'🚫':'👤'}</span>
            <div><div class="hi-game">${data.name||'?'} <small style="color:var(--text3)">${uid}</small></div>
            <div class="hi-time">Games: ${data.totalGames||0} | Dep: ${(data.totalDeposited||0).toFixed(1)}</div></div></div>
            <div class="hi-amount win">${(data.balance||0).toFixed(2)}</div></div>`;
    }
    container.innerHTML = html || '<p class="text-sm text-muted">No users.</p>';
}

// === GAME SCREEN ===
function openGame(id) {
    if (user.banned) return alert('Account banned!');
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
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-title').textContent = '🌐 Language';
    document.getElementById('game-body').innerHTML = `
        <div style="width:100%;max-width:360px;">
            <div class="payment-option" onclick="closeGame()"><div>🇬🇧</div><div><div class="po-name">English</div></div></div>
            <div class="payment-option" onclick="closeGame()"><div>🇹🇷</div><div><div class="po-name">Türkçe</div></div></div>
            <div class="payment-option" onclick="closeGame()"><div>🇷🇺</div><div><div class="po-name">Русский</div></div></div>
            <div class="payment-option" onclick="closeGame()"><div>🇸🇦</div><div><div class="po-name">العربية</div></div></div>
            <div class="payment-option" onclick="closeGame()"><div>🇪🇸</div><div><div class="po-name">Español</div></div></div>
            <div class="payment-option" onclick="closeGame()"><div>🇨🇳</div><div><div class="po-name">中文</div></div></div>
        </div>`;
}
