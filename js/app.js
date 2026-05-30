// === LIBERTY CASINO - Premium App with Admin Panel ===
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// === CONFIG ===
const ADMIN_ID = '8885409517'; // Your Telegram ID (string)

// === USER DATA ===
const currentUserId = String(tg?.initDataUnsafe?.user?.id || 0);
const currentUserName = tg?.initDataUnsafe?.user?.first_name || 'Player';
const isAdmin = (currentUserId === ADMIN_ID);

// === DATABASE (localStorage based - shared across all users on same device) ===
// In production you'd use a backend, but for Mini App this works per-device
function loadAllUsers() {
    const data = localStorage.getItem('lc_allusers');
    return data ? JSON.parse(data) : {};
}
function saveAllUsers(users) {
    localStorage.setItem('lc_allusers', JSON.stringify(users));
}

// Get or create current user
function getUser(uid) {
    const users = loadAllUsers();
    if (!users[uid]) {
        users[uid] = {
            id: uid,
            name: currentUserName,
            balance: 0,
            totalGames: 0,
            totalWins: 0,
            totalProfit: 0,
            totalDeposited: 0,
            totalWithdrawn: 0,
            history: [],
            joined: new Date().toISOString(),
            banned: false,
        };
        saveAllUsers(users);
    }
    return users[uid];
}

function saveUser(uid, data) {
    const users = loadAllUsers();
    users[uid] = data;
    saveAllUsers(users);
}

// Current user
let user = getUser(currentUserId);

const ADDRESSES = {
    TRX: "TBywuYKGLtaEXLgiq7BMXBjryq7SrtxdFQ",
    USDT_TRC20: "TBywuYKGLtaEXLgiq7BMXBjryq7SrtxdFQ",
    USDT_SOL: "7ubBLrETVYw1KZAXzrmbHydUXiFNu9SF5JoaTq27Hpxi",
};

function save() {
    user.name = currentUserName;
    saveUser(currentUserId, user);
}

// === INIT ===
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        switchTab('home');
    }, 2800);
});

// === BALANCE ===
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

// === HOME ===
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
                <div class="hi-left"><span class="hi-icon">${h.won?'✅':'❌'}</span><div><div class="hi-game">${h.game}</div><div class="hi-time">${h.time}</div></div></div>
                <div class="hi-amount ${h.won?'win':'loss'}">${h.won?'+':''}${h.profit.toFixed(2)}</div>
            </div>`).join('')}
        ${isAdmin ? '<div class="mt-20"><button class="play-button" onclick="switchTab(\'profile\')" style="background:linear-gradient(135deg,#f59e0b,#d97706)">🔐 Admin Panel</button></div>' : ''}
    `;
}

// === GAMES ===
function renderGames() {
    return `
        <div class="section-title"><span>🎮</span> All Games</div>
        <div class="games-grid">
            ${gamesList.map(g => `
                <div class="game-card-grid ${g.coming?'coming':''}" onclick="${g.coming?'':`openGame('${g.id}')`}">
                    <div class="gc-icon">${g.icon}</div>
                    <div class="gc-name">${g.name}</div>
                    <div class="gc-mult">${g.mult}</div>
                </div>
            `).join('')}
        </div>
    `;
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
        </div>
        <div id="wallet-content"></div>
    `;
}
function showDeposit() {
    document.getElementById('wallet-content').innerHTML = `
        <div class="section-title"><span>💳</span> Select Method</div>
        <div class="payment-option" onclick="showAddr('TRX')"><div>💠</div><div><div class="po-name">TRX (Tron)</div><div class="po-network">Tron Network</div></div></div>
        <div class="payment-option" onclick="showAddr('USDT_TRC20')"><div>💵</div><div><div class="po-name">USDT</div><div class="po-network">TRC-20</div></div></div>
        <div class="payment-option" onclick="showAddr('USDT_SOL')"><div>🟣</div><div><div class="po-name">USDT</div><div class="po-network">Solana</div></div></div>
        <div id="addr-area"></div>
    `;
}
function showAddr(m) {
    document.getElementById('addr-area').innerHTML = `
        <div class="address-display">${ADDRESSES[m]}<button class="copy-btn" onclick="navigator.clipboard.writeText('${ADDRESSES[m]}');this.textContent='✓'">Copy</button></div>
        <p class="text-sm text-muted text-center">Send screenshot to @Liberty_Help after payment.<br>Min: 5 USDT • Credited in 5-30 min</p>
    `;
}
function showWithdraw() {
    document.getElementById('wallet-content').innerHTML = `
        <div class="section-title"><span>📤</span> Withdraw</div>
        <p class="text-sm text-muted">Send a message to @Liberty_Help with:</p>
        <p class="text-sm" style="margin:8px 0;">• Your ID: <code>${currentUserId}</code><br>• Amount<br>• Wallet address</p>
        <p class="text-sm text-muted">Min: 10 USDT • Processed 1-24h</p>
    `;
}

// === REWARDS ===
function renderRewards() {
    return `
        <div class="section-title"><span>🎁</span> Daily Rewards</div>
        <div class="reward-card"><div class="reward-icon">🎲</div><div class="reward-info"><div class="reward-title">Daily Bonus</div><div class="reward-desc">Claim 0.50 USDT every 24h</div></div><button class="reward-btn" onclick="claimDaily()">Claim</button></div>
        <div class="reward-card"><div class="reward-icon">👥</div><div class="reward-info"><div class="reward-title">Refer a Friend</div><div class="reward-desc">Get 10% of their deposits</div></div><button class="reward-btn" onclick="alert('Share bot link!')">Share</button></div>
        <div class="reward-card"><div class="reward-icon">🏆</div><div class="reward-info"><div class="reward-title">VIP Program</div><div class="reward-desc">Higher cashback for VIP</div></div><button class="reward-btn" onclick="alert('Play more to level up!')">Info</button></div>
    `;
}
function claimDaily() {
    const key = `lc_daily_${currentUserId}`;
    const last = localStorage.getItem(key);
    if (last && Date.now() - parseInt(last) < 86400000) { alert('Already claimed! Come back tomorrow.'); return; }
    user.balance += 0.50; save(); updateBal();
    localStorage.setItem(key, Date.now().toString());
    alert('🎉 +0.50 USDT claimed!');
}

// === PROFILE (Normal User) ===
function renderProfile() {
    // If admin, show admin panel
    if (isAdmin) return renderAdminPanel();
    
    const wr = user.totalGames > 0 ? ((user.totalWins/user.totalGames)*100).toFixed(1) : '0.0';
    return `
        <div class="profile-header">
            <div class="profile-avatar">🎮</div>
            <div class="profile-name">${user.name}</div>
            <div class="profile-id">ID: ${currentUserId} ${currentUserId === ADMIN_ID ? '(ADMIN)' : ''}</div>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="sv">${user.totalGames}</div><div class="sl">Games</div></div>
            <div class="stat-card"><div class="sv">${wr}%</div><div class="sl">Win Rate</div></div>
            <div class="stat-card"><div class="sv">${user.totalProfit.toFixed(1)}</div><div class="sl">Profit</div></div>
        </div>
        <div class="mt-20" style="text-align:center;">
            <button class="play-button" onclick="forceAdmin()" style="background:var(--bg3);font-size:12px;padding:10px;">🔐 Admin Access</button>
        </div>
    `;
}

function forceAdmin() {
    const pin = prompt('Enter Admin PIN:');
    if (pin === '8885') {
        document.getElementById('content').innerHTML = renderAdminPanel();
    } else {
        alert('❌ Wrong PIN');
    }
}

// === ADMIN PANEL (Only for ADMIN_ID) ===
function renderAdminPanel() {
    const users = loadAllUsers();
    const userList = Object.values(users);
    const totalBal = userList.reduce((s,u) => s + u.balance, 0);
    const totalDep = userList.reduce((s,u) => s + (u.totalDeposited||0), 0);
    const totalWit = userList.reduce((s,u) => s + (u.totalWithdrawn||0), 0);

    return `
        <div class="section-title"><span>🔐</span> ADMIN PANEL</div>
        <div class="stats-grid">
            <div class="stat-card"><div class="sv">${userList.length}</div><div class="sl">Users</div></div>
            <div class="stat-card"><div class="sv">${totalBal.toFixed(1)}</div><div class="sl">Balances</div></div>
            <div class="stat-card"><div class="sv">${(totalDep - totalWit - totalBal).toFixed(1)}</div><div class="sl">Profit</div></div>
        </div>

        <div class="section-title mt-20"><span>💰</span> Add Balance</div>
        <input class="input-field" type="number" id="adm-uid" placeholder="User ID">
        <input class="input-field" type="number" id="adm-amount" placeholder="Amount (USDT)">
        <button class="play-button" onclick="adminAddBal()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 Add Balance</button>

        <div class="section-title mt-20"><span>➖</span> Remove Balance</div>
        <input class="input-field" type="number" id="adm-rm-uid" placeholder="User ID">
        <input class="input-field" type="number" id="adm-rm-amount" placeholder="Amount (USDT)">
        <button class="play-button" onclick="adminRmBal()" style="background:linear-gradient(135deg,var(--red),#dc2626)">➖ Remove Balance</button>

        <div class="section-title mt-20"><span>👥</span> All Users</div>
        ${userList.length === 0 ? '<p class="text-sm text-muted">No users yet.</p>' :
          userList.map(u => `
            <div class="history-item">
                <div class="hi-left">
                    <span class="hi-icon">${u.banned?'🚫':'👤'}</span>
                    <div><div class="hi-game">${u.name||'?'} <small style="color:var(--text3)">${u.id}</small></div><div class="hi-time">Games: ${u.totalGames} | Dep: ${(u.totalDeposited||0).toFixed(1)}</div></div>
                </div>
                <div class="hi-amount win">${u.balance.toFixed(2)}</div>
            </div>
          `).join('')}

        <div class="section-title mt-20"><span>🚫</span> Ban/Unban</div>
        <input class="input-field" type="number" id="adm-ban-uid" placeholder="User ID">
        <div style="display:flex;gap:8px;">
            <button class="play-button" onclick="adminBan()" style="flex:1;background:var(--red)">🚫 Ban</button>
            <button class="play-button" onclick="adminUnban()" style="flex:1;background:var(--green)">✅ Unban</button>
        </div>
    `;
}

function adminAddBal() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-uid').value;
    const amount = parseFloat(document.getElementById('adm-amount').value);
    if (!uid || !amount) return alert('Fill both fields!');
    
    const users = loadAllUsers();
    if (!users[uid]) { users[uid] = { id: parseInt(uid), name: '?', balance: 0, totalGames: 0, totalWins: 0, totalProfit: 0, totalDeposited: 0, totalWithdrawn: 0, history: [], joined: new Date().toISOString(), banned: false }; }
    users[uid].balance += amount;
    users[uid].totalDeposited = (users[uid].totalDeposited || 0) + amount;
    saveAllUsers(users);
    
    // If it's current user, update live
    if (parseInt(uid) === currentUserId) { user = users[uid]; updateBal(); }
    
    alert(`✅ Added ${amount} USDT to user ${uid}\nNew balance: ${users[uid].balance.toFixed(2)}`);
    switchTab('profile'); // Refresh admin panel
}

function adminRmBal() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-rm-uid').value;
    const amount = parseFloat(document.getElementById('adm-rm-amount').value);
    if (!uid || !amount) return alert('Fill both fields!');
    
    const users = loadAllUsers();
    if (!users[uid]) return alert('User not found!');
    users[uid].balance -= amount;
    users[uid].totalWithdrawn = (users[uid].totalWithdrawn || 0) + amount;
    saveAllUsers(users);
    
    if (parseInt(uid) === currentUserId) { user = users[uid]; updateBal(); }
    
    alert(`✅ Removed ${amount} USDT from user ${uid}\nNew balance: ${users[uid].balance.toFixed(2)}`);
    switchTab('profile');
}

function adminBan() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-ban-uid').value;
    if (!uid) return alert('Enter User ID!');
    const users = loadAllUsers();
    if (!users[uid]) return alert('User not found!');
    users[uid].banned = true;
    saveAllUsers(users);
    alert(`🚫 User ${uid} banned.`);
    switchTab('profile');
}

function adminUnban() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-ban-uid').value;
    if (!uid) return alert('Enter User ID!');
    const users = loadAllUsers();
    if (!users[uid]) return alert('User not found!');
    users[uid].banned = false;
    saveAllUsers(users);
    alert(`✅ User ${uid} unbanned.`);
    switchTab('profile');
}

// === GAME SCREEN ===
function openGame(id) {
    if (user.banned) return alert('Your account is banned!');
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
            <div class="payment-option" onclick="setLang('en');closeGame()"><div>🇬🇧</div><div><div class="po-name">English</div></div></div>
            <div class="payment-option" onclick="setLang('tr');closeGame()"><div>🇹🇷</div><div><div class="po-name">Türkçe</div></div></div>
            <div class="payment-option" onclick="setLang('ru');closeGame()"><div>🇷🇺</div><div><div class="po-name">Русский</div></div></div>
            <div class="payment-option" onclick="setLang('ar');closeGame()"><div>🇸🇦</div><div><div class="po-name">العربية</div></div></div>
            <div class="payment-option" onclick="setLang('es');closeGame()"><div>🇪🇸</div><div><div class="po-name">Español</div></div></div>
            <div class="payment-option" onclick="setLang('zh');closeGame()"><div>🇨🇳</div><div><div class="po-name">中文</div></div></div>
        </div>
    `;
}
function setLang(l) { localStorage.setItem('lc_lang', l); }
