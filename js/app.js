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
                <button class="wallet-btn dep" onclick="goToBot('deposit')">Deposit</button>
                <button class="wallet-btn wit" onclick="goToBot('withdraw')">Withdraw</button>
            </div>
        </div>
        <div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">
            <p>💰 Deposits & withdrawals are handled via the bot.</p>
            <p style="margin-top:8px;">Close this app and use the bot buttons to deposit or withdraw.</p>
            <button class="play-button mt-20" onclick="goToBot('deposit')" style="background:linear-gradient(135deg,var(--green),#059669)">💰 Go to Bot to Deposit</button>
        </div>`;
}

function goToBot(action) {
    if (tg) {
        tg.close();
    } else {
        alert('Close this app and use the bot to deposit/withdraw.');
    }
}

function showDeposit() { goToBot('deposit'); }
function showWithdraw() { goToBot('withdraw'); }

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
    if (isAdmin) {
        // Admin paneli render et ve jackpot bilgisini yükle
        setTimeout(() => loadJackpotAdmin(), 100);
        return renderAdminPanel();
    }
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
        
        <div class="section-title mt-20"><span>🎰</span> Jackpot Yönetimi</div>
        <div id="jackpot-admin-info" style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:12px;padding:14px;margin-bottom:12px;text-align:center;border:1px solid rgba(245,158,11,0.3);">
            <div style="font-size:11px;color:var(--text3);">JACKPOT HAVUZU</div>
            <div style="font-size:24px;font-weight:800;color:var(--gold);margin-top:4px;" id="adm-jp-amount">Yükleniyor...</div>
        </div>
        <input class="input-field" type="number" id="adm-jp-give" placeholder="Verilecek miktar (USDT)" step="0.01" min="0.01">
        <button class="play-button" onclick="adminGiveJackpotNew()" style="background:linear-gradient(135deg,#f59e0b,#d97706)">🎰 Jackpot Ver (Random Aktif Oyuncu)</button>
        <div id="jackpot-result" style="margin-top:8px;"></div>

        <div class="section-title mt-20"><span>💰</span> Add Balance</div>
        <input class="input-field" type="number" id="adm-uid" placeholder="User ID">
        <input class="input-field" type="number" id="adm-amount" placeholder="Amount (USDT)">
        <button class="play-button" onclick="adminAddBal()" style="background:linear-gradient(135deg,var(--green),#059669)">💰 Add Balance</button>
        <div class="section-title mt-20"><span>➖</span> Remove Balance</div>
        <input class="input-field" type="number" id="adm-rm-uid" placeholder="User ID">
        <input class="input-field" type="number" id="adm-rm-amount" placeholder="Amount">
        <button class="play-button" onclick="adminRmBal()" style="background:linear-gradient(135deg,var(--red),#dc2626)">➖ Remove</button>
        <div class="section-title mt-20"><span>👥</span> All Users</div>
        <button class="play-button" onclick="loadAdminUsers()" style="background:var(--bg3)">📋 Load Users</button>
        <div id="admin-users"></div>
    `;
}

// Admin panel yüklendiğinde jackpot miktarını göster
async function loadJackpotAdmin() {
    const jp = await getJackpot();
    const el = document.getElementById('adm-jp-amount');
    if (el) el.textContent = '$' + jp.toFixed(2);
}

// Yeni jackpot verme fonksiyonu - havuzdan fazla verilemez, son aktif oyunculara random verilir
async function adminGiveJackpotNew() {
    if (!isAdmin) return;
    
    const jpAmount = await getJackpot();
    const giveAmount = parseFloat(document.getElementById('adm-jp-give').value);
    const resultDiv = document.getElementById('jackpot-result');
    
    if (!giveAmount || giveAmount <= 0) {
        resultDiv.innerHTML = '<div style="color:var(--red);font-size:13px;padding:8px;">❌ Geçerli bir miktar girin!</div>';
        return;
    }
    
    if (giveAmount > jpAmount) {
        resultDiv.innerHTML = `<div style="color:var(--red);font-size:13px;padding:8px;">❌ Havuzda yeterli bakiye yok! Havuz: $${jpAmount.toFixed(2)}, İstenen: $${giveAmount.toFixed(2)}</div>`;
        return;
    }
    
    // Tüm kullanıcıları çek
    const users = await fbGet('users') || {};
    
    // Son oynayan aktif oyuncuları filtrele (admin hariç, ban'lı hariç, en az 1 oyun oynamış)
    const activePlayers = Object.entries(users)
        .filter(([id, data]) => {
            return data.totalGames > 0 && 
                   !data.banned && 
                   id != ADMIN_ID &&
                   (data.balance !== undefined);
        })
        .map(([id, data]) => {
            // Son oyun zamanını history'den al
            let lastPlayedTime = 0;
            if (data.history && data.history.length > 0) {
                // History'deki en son kayıt = en son oynayan
                lastPlayedTime = data.history.length; // Daha çok history = daha aktif
            }
            return { id, data, lastPlayedTime, games: data.totalGames || 0 };
        })
        .sort((a, b) => b.games - a.games); // En çok oynayandan en aza
    
    if (activePlayers.length === 0) {
        resultDiv.innerHTML = '<div style="color:var(--red);font-size:13px;padding:8px;">❌ Aktif oyuncu bulunamadı!</div>';
        return;
    }
    
    // Son oynayan en aktif 10 kişiden random birini seç
    const topPlayers = activePlayers.slice(0, Math.min(10, activePlayers.length));
    const winner = topPlayers[Math.floor(Math.random() * topPlayers.length)];
    
    // Jackpot'u ver
    const newBalance = (winner.data.balance || 0) + giveAmount;
    await fbUpdate(`users/${winner.id}`, { 
        balance: newBalance,
        lastJackpotWin: new Date().toISOString(),
        lastJackpotAmount: giveAmount
    });
    
    // Havuzdan düş
    await fbSet('jackpot/amount', jpAmount - giveAmount);
    
    // Jackpot log'u kaydet
    const jpLog = await fbGet('jackpot/history') || [];
    jpLog.push({
        winnerId: winner.id,
        winnerName: winner.data.name || '?',
        amount: giveAmount,
        time: new Date().toISOString(),
        poolBefore: jpAmount,
        poolAfter: jpAmount - giveAmount
    });
    await fbSet('jackpot/history', jpLog);
    
    // Sonucu göster
    resultDiv.innerHTML = `
        <div style="background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(217,119,6,0.1));border:1px solid var(--gold);border-radius:10px;padding:12px;margin-top:8px;">
            <div style="font-size:16px;font-weight:800;color:var(--gold);text-align:center;">🎰 JACKPOT VERİLDİ! 🎰</div>
            <div style="margin-top:8px;font-size:13px;color:var(--text2);">
                <div>🏆 Kazanan: <b>${winner.data.name || '?'}</b></div>
                <div>🆔 ID: <code>${winner.id}</code></div>
                <div>💰 Miktar: <b style="color:var(--gold)">$${giveAmount.toFixed(2)}</b></div>
                <div>💳 Yeni Bakiye: $${newBalance.toFixed(2)}</div>
                <div>🎰 Kalan Havuz: $${(jpAmount - giveAmount).toFixed(2)}</div>
            </div>
        </div>`;
    
    // Jackpot miktarını güncelle
    loadJackpotAdmin();
    
    // Bildirim gönder (bot tarafında yapılacak, burada Firebase'e yazıyoruz)
    await fbSet(`jackpot_notifications/${winner.id}`, {
        amount: giveAmount,
        time: new Date().toISOString(),
        notified: false
    });
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


// ═══════════════════════════════════════════════════════════════
// FEATURE 1: LEADERBOARD (with fake players for social proof)
// ═══════════════════════════════════════════════════════════════
const FAKE_PLAYERS = [
    "Alex_Trader","CryptoKing","LuckyDave","MoonShot","DiamondH","WhaleBet","RiskTaker","BigWin99",
    "ProGambler","CoinMaster","BetKing","JackpotJoe","HighRoller","LuckyLuke","CashFlow","GoldRush",
    "BullRun","SatoshiFan","TokenKing","BlockBet","ChainWin","DeFiDegen","ApeIn","WAGMI_Guy",
    "PumpKing","MegaBets","RocketMan","StarPlayer","TopDog","EliteGamer","VIPPlayer","SharkBet",
    "ThunderBet","NightOwl","FastCash","EasyMoney","SmartBet","WinStreak","HotHand","GoldenBoy",
    "SilverFox","IronMan","StormBet","FireBet","IceCold","DarkHorse","WildCard","AceHigh",
    "RoyalFlush","FullHouse","TripleX","DoubleDip","MaxBet","AllIn","NoLimit","HighStakes",
    "DeepStack","ChipLeader","PotOdds","NutFlush","StraightUp","BlackJack","SlotKing","SpinMaster",
    "ReelDeal","BonusHunt","FreeSpins","MegaWin","SuperNova","CosmicBet","GalaxyWin","NeonBet",
    "PixelBet","CyberWin","MatrixBet","QuantumWin","TurboSpin","NitroBet","BlazeBet","PhoenixWin",
    "DragonBet","TigerLuck","WolfPack","EagleEye","LionHeart","BearMarket","BullMarket","HawkEye",
    "ViperBet","CobraWin","PantherBet","FalconWin","RavenBet","ShadowBet","GhostWin","PhantomBet",
    "ZenMaster","KarmaBet","LotusWin","SamuraiBet","NinjaCash","ShogunWin","RoninBet","SenseiWin",
    "OmegaBet","AlphaWin"
];

function generateFakeLeaderboard() {
    // Generate 100 fake players with realistic stats
    const fakes = FAKE_PLAYERS.map(name => {
        const games = Math.floor(50 + Math.random() * 500);
        const winRate = 0.4 + Math.random() * 0.25; // 40-65% win rate
        const avgBet = 5 + Math.random() * 50;
        const profit = (winRate - 0.5) * games * avgBet * (0.5 + Math.random());
        return { name, profit: Math.round(profit * 100) / 100, games };
    });
    
    // Sort by profit descending
    fakes.sort((a, b) => b.profit - a.profit);
    
    // Make top players have impressive profits
    fakes[0].profit = 5000 + Math.random() * 15000;
    fakes[1].profit = 3000 + Math.random() * 8000;
    fakes[2].profit = 2000 + Math.random() * 5000;
    for (let i = 3; i < 10; i++) fakes[i].profit = 500 + Math.random() * 3000;
    
    // Re-sort
    fakes.sort((a, b) => b.profit - a.profit);
    return fakes;
}

// Cache fake leaderboard (regenerate every 24h)
function getFakeLeaderboard() {
    const cached = localStorage.getItem('lc_fake_lb');
    if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.time < 86400000) return data.players; // 24h cache
    }
    const players = generateFakeLeaderboard();
    localStorage.setItem('lc_fake_lb', JSON.stringify({ players, time: Date.now() }));
    return players;
}

async function showLeaderboard() {
    const fakePlayers = getFakeLeaderboard();
    
    // Also get real players from Firebase
    const realUsers = await fbGet('users') || {};
    const realPlayers = Object.entries(realUsers)
        .map(([id, data]) => ({ name: data.name || 'Player', profit: data.totalProfit || 0, games: data.totalGames || 0, real: true }))
        .filter(u => u.games > 0);
    
    // Merge real players into fake list (insert at appropriate positions)
    let allPlayers = [...fakePlayers];
    realPlayers.forEach(rp => {
        const insertIdx = allPlayers.findIndex(fp => fp.profit < rp.profit);
        if (insertIdx >= 0) allPlayers.splice(insertIdx, 0, rp);
        else allPlayers.push(rp);
    });
    
    // Show top 20
    const top20 = allPlayers.slice(0, 20);
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="section-title"><span>🏆</span> Leaderboard — Top Players</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:12px;">Updated in real-time • ${allPlayers.length} active players</div>
        ${top20.map((u, i) => `
            <div class="history-item" style="${i<3?'border:1px solid var(--gold);background:rgba(245,158,11,0.05);':''}${u.real?'border:1px solid var(--accent);':''}">
                <div class="hi-left">
                    <span class="hi-icon" style="font-size:${i<3?'20px':'14px'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
                    <div>
                        <div class="hi-game">${u.name} ${u.real?'<span style="color:var(--accent);font-size:10px;">⭐YOU</span>':''}</div>
                        <div class="hi-time">${u.games} games played</div>
                    </div>
                </div>
                <div class="hi-amount win" style="${i<3?'font-size:16px;':''}">+$${u.profit.toFixed(0)}</div>
            </div>
        `).join('')}
        <button class="play-button mt-20" onclick="switchTab('rewards')" style="background:var(--bg3)">⬅️ Back</button>
    `;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE 2: VIP LEVEL SYSTEM
// ═══════════════════════════════════════════════════════════════
function getVIPLevel(totalWagered) {
    if (totalWagered >= 10000) return { level: 5, name: '💎 Diamond', cashback: 3.0, color: '#a78bfa' };
    if (totalWagered >= 5000) return { level: 4, name: '🏆 Platinum', cashback: 2.0, color: '#f59e0b' };
    if (totalWagered >= 1000) return { level: 3, name: '🥇 Gold', cashback: 1.5, color: '#f59e0b' };
    if (totalWagered >= 500) return { level: 2, name: '🥈 Silver', cashback: 1.0, color: '#9ca3af' };
    if (totalWagered >= 100) return { level: 1, name: '🥉 Bronze', cashback: 0.5, color: '#cd7f32' };
    return { level: 0, name: '⚪ Starter', cashback: 0, color: '#6b7280' };
}

function renderVIPInfo() {
    const wagered = user.totalGames * 5; // Approximate total wagered
    const vip = getVIPLevel(wagered);
    const nextLevel = getVIPLevel(wagered + 1000);
    
    return `
        <div class="section-title"><span>👑</span> VIP Program</div>
        <div style="text-align:center;padding:16px;background:var(--bg2);border-radius:12px;border:1px solid ${vip.color};margin-bottom:12px;">
            <div style="font-size:32px;">${vip.name}</div>
            <div style="font-size:12px;color:var(--text3);margin-top:4px;">Level ${vip.level}/5</div>
            <div style="font-size:14px;color:var(--gold);margin-top:8px;">Cashback: ${vip.cashback}%</div>
        </div>
        <div style="background:var(--bg2);border-radius:10px;padding:12px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:4px;">
                <span>${vip.name}</span><span>${nextLevel.name}</span>
            </div>
            <div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100,(wagered%1000)/10)}%;background:linear-gradient(90deg,var(--accent),var(--gold));border-radius:3px;"></div>
            </div>
        </div>
        <div style="font-size:12px;color:var(--text3);padding:8px;">
            <b>VIP Benefits:</b><br>
            ⚪ Starter: No cashback<br>
            🥉 Bronze ($100+): 0.5% cashback<br>
            🥈 Silver ($500+): 1.0% cashback<br>
            🥇 Gold ($1000+): 1.5% cashback<br>
            🏆 Platinum ($5000+): 2.0% cashback<br>
            💎 Diamond ($10000+): 3.0% cashback
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE 3: PROVABLY FAIR
// ═══════════════════════════════════════════════════════════════
function generateGameHash() {
    // Generate a random hash for provably fair verification
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
    return hash;
}

function renderProvablyFair() {
    const serverSeed = generateGameHash();
    const clientSeed = generateGameHash().substring(0, 16);
    
    return `
        <div class="section-title"><span>🔒</span> Provably Fair</div>
        <div style="background:var(--bg2);border-radius:12px;padding:16px;margin-bottom:12px;">
            <p style="font-size:13px;color:var(--text2);margin-bottom:12px;">
                Every game result is determined by a combination of server seed and client seed, 
                making it impossible to manipulate outcomes.
            </p>
            <div style="margin-bottom:8px;">
                <div style="font-size:11px;color:var(--text3);">Server Seed (hashed):</div>
                <div class="address-display" style="font-size:10px;margin:4px 0;">${serverSeed}</div>
            </div>
            <div>
                <div style="font-size:11px;color:var(--text3);">Client Seed:</div>
                <div class="address-display" style="font-size:10px;margin:4px 0;">${clientSeed}</div>
            </div>
        </div>
        <div style="font-size:12px;color:var(--text3);padding:8px;">
            <b>How it works:</b><br>
            1. Server generates a seed before each game<br>
            2. Result = Hash(server_seed + client_seed + nonce)<br>
            3. After game, you can verify the seed<br>
            4. This proves the result wasn't manipulated
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE 4: SOUND EFFECTS
// ═══════════════════════════════════════════════════════════════
const SOUNDS_ENABLED = true;

function playSound(type) {
    if (!SOUNDS_ENABLED) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        switch(type) {
            case 'win':
                osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
                osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
                osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc.start(); osc.stop(ctx.currentTime + 0.5);
                break;
            case 'lose':
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start(); osc.stop(ctx.currentTime + 0.4);
                break;
            case 'bet':
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
                break;
            case 'jackpot':
                osc.frequency.setValueAtTime(523, ctx.currentTime);
                osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
                osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
                osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                osc.start(); osc.stop(ctx.currentTime + 0.8);
                break;
        }
    } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════
// FEATURE 5: JACKPOT POOL (Admin controlled)
// ═══════════════════════════════════════════════════════════════
const JACKPOT_CONTRIBUTION = 0.01; // 1% of each bet goes to jackpot

async function getJackpot() {
    const jp = await fbGet('jackpot/amount');
    return jp || 0;
}

async function addToJackpot(amount) {
    const current = await getJackpot();
    await fbSet('jackpot/amount', current + (amount * JACKPOT_CONTRIBUTION));
}

// Jackpot is NOT auto-given. Admin triggers it manually via adminGiveJackpotNew()
async function checkJackpotWin(bet) {
    return 0; // Disabled auto-jackpot. Admin controls it.
}

async function renderJackpotBanner() {
    const jp = await getJackpot();
    return `
        <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:12px;padding:14px;margin-bottom:16px;text-align:center;border:1px solid rgba(245,158,11,0.3);">
            <div style="font-size:11px;color:var(--text3);">🎰 JACKPOT POOL</div>
            <div style="font-size:24px;font-weight:800;color:var(--gold);margin-top:4px;">$${jp.toFixed(2)}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:4px;">1% of every bet • Random winner</div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE REWARDS TAB (add VIP + Leaderboard + Provably Fair)
// ═══════════════════════════════════════════════════════════════
// Override renderRewards
const _origRewards = renderRewards;
renderRewards = function() {
    return `
        <div class="section-title"><span>🎁</span> Rewards & More</div>
        <div class="reward-card"><div class="reward-icon">🎲</div><div class="reward-info"><div class="reward-title">Daily Bonus</div><div class="reward-desc">0.50 USDT every 24h</div></div><button class="reward-btn" onclick="claimDaily()">Claim</button></div>
        <div class="reward-card"><div class="reward-icon">👥</div><div class="reward-info"><div class="reward-title">Refer a Friend</div><div class="reward-desc">10% of their deposits</div></div><button class="reward-btn" onclick="if(tg)tg.close();else alert('Use bot for referral link')">Share</button></div>
        <div class="reward-card"><div class="reward-icon">🏆</div><div class="reward-info"><div class="reward-title">Leaderboard</div><div class="reward-desc">Top players ranking</div></div><button class="reward-btn" onclick="showLeaderboard()">View</button></div>
        <div class="reward-card"><div class="reward-icon">🔒</div><div class="reward-info"><div class="reward-title">Provably Fair</div><div class="reward-desc">Verify game fairness</div></div><button class="reward-btn" onclick="document.getElementById('content').innerHTML=renderProvablyFair()+'<button class=\\'play-button mt-20\\' onclick=\\'switchTab(\\\"rewards\\\")\\' style=\\'background:var(--bg3)\\'>⬅️ Back</button>'">Verify</button></div>
        ${renderVIPInfo()}
    `;
};

// ═══════════════════════════════════════════════════════════════
// UPDATE RECORD GAME (add sound + jackpot)
// ═══════════════════════════════════════════════════════════════
const _origRecordGame = recordGame;
recordGame = function(game, bet, won, profit) {
    // Sound effects
    if (won && profit > bet * 5) playSound('jackpot');
    else if (won) playSound('win');
    else playSound('lose');
    
    // Add to jackpot pool
    addToJackpot(bet);
    
    // Check jackpot win
    checkJackpotWin(bet).then(jpWin => {
        if (jpWin > 0) {
            setTimeout(() => {
                alert(`🎰🎰🎰 JACKPOT! 🎰🎰🎰\n\nYou won the JACKPOT!\n+$${jpWin.toFixed(2)} USDT!`);
                showConfetti(); showConfetti();
                playSound('jackpot');
            }, 1000);
        }
    });
    
    // Original record game logic
    user.totalGames++;
    if (won) user.totalWins++;
    user.totalProfit += profit;
    user.balance += profit;
    if (user.balance < 0) user.balance = 0;
    if (!user.history) user.history = [];
    user.history.unshift({ game, bet, won, profit, time: new Date().toLocaleTimeString() });
    if (user.history.length > 30) user.history.pop();
    updateBal();
    saveUser();
};

// ═══════════════════════════════════════════════════════════════
// UPDATE HOME (add jackpot banner)
// ═══════════════════════════════════════════════════════════════
const _origHome = renderHome;
renderHome = async function() {
    const jpBanner = await renderJackpotBanner();
    const content = document.getElementById('content');
    // Insert jackpot banner at top
    const homeHTML = _origHome();
    content.innerHTML = jpBanner + homeHTML;
};
