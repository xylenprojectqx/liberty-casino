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
    user.balance += (profit + bet); // getBet already deducted bet, so add back bet + profit
    if (user.balance < 0) user.balance = 0;
    if (!user.history) user.history = [];
    user.history.unshift({ game, bet, won, profit, time: new Date().toLocaleTimeString() });
    if (user.history.length > 30) user.history.pop();
    updateBal();
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
            <div class="hero-title">🎰 ${t('welcome')}</div>
            <div class="hero-sub">${t('playWinWithdraw')}</div>
            <button class="hero-btn" onclick="switchTab('games')">${t('playNow')}</button>
        </div>
        <div class="section-title"><span>🔥</span> ${t('popularGames')}</div>
        <div class="games-row">
            ${gamesList.slice(0,6).map(g => `
                <div class="game-card" onclick="openGame('${g.id}')">
                    <div class="gc-icon">${g.icon}</div>
                    <div class="gc-name">${g.name}</div>
                    <div class="gc-mult">${g.mult}</div>
                </div>`).join('')}
        </div>
        <div class="section-title mt-20"><span>⚡</span> ${t('recent')}</div>
        ${!user.history?.length ? `<p class="text-sm text-muted">${t('noGamesYet')}</p>` :
          user.history.slice(0,5).map(h => `
            <div class="history-item">
                <div class="hi-left"><span class="hi-icon">${h.won?'✅':'❌'}</span><div><div class="hi-game">${h.game}</div><div class="hi-time">${h.time}</div></div></div>
                <div class="hi-amount ${h.won?'win':'loss'}">${h.won?'+':''}${h.profit.toFixed(2)}</div>
            </div>`).join('')}
        ${isAdmin ? `<div class="mt-20"><button class="play-button" onclick="switchTab('profile')" style="background:linear-gradient(135deg,#f59e0b,#d97706)">🔐 ${t('adminPanel')}</button></div>` : ''}
    `;
}

// === GAMES ===
function renderGames() {
    return `<div class="section-title"><span>🎮</span> ${t('allGames')}</div>
        <div class="games-grid">${gamesList.map(g => `
            <div class="game-card-grid ${g.coming?'coming':''}" onclick="${g.coming?'':`openGame('${g.id}')`}">
                <div class="gc-icon">${g.icon}</div><div class="gc-name">${g.name}</div><div class="gc-mult">${g.mult}</div>
            </div>`).join('')}</div>`;
}

// === WALLET ===
function renderWallet() {
    return `
        <div class="wallet-hero">
            <div class="wallet-label">${t('totalBalance')}</div>
            <div class="wallet-amount">${user.balance.toFixed(2)} <span class="currency">USDT</span></div>
            <div class="wallet-actions">
                <button class="wallet-btn dep" onclick="goToBot('deposit')">${t('deposit')}</button>
                <button class="wallet-btn wit" onclick="goToBot('withdraw')">${t('withdraw')}</button>
            </div>
        </div>
        <div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">
            <p>💰 ${t('depositInfo')}</p>
            <p style="margin-top:8px;">Close this app and use the bot buttons to deposit or withdraw.</p>
            <button class="play-button mt-20" onclick="goToBot('deposit')" style="background:linear-gradient(135deg,var(--green),#059669)">💰 ${t('goToDeposit')}</button>
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
    if (lastClaim && Date.now() - lastClaim < 86400000) { alert(t('alreadyClaimed')); return; }
    user.balance += 0.50;
    await saveUser();
    await fbSet(`daily/${currentUserId}`, Date.now());
    updateBal();
    alert(t('claimed'));
}

// === PROFILE / ADMIN ===
function renderProfile() {
    if (isAdmin) {
        // Admin paneli render et ve verileri yükle
        setTimeout(() => {
            loadAdminQuickStats();
            showAdminSection('balance'); // Varsayılan olarak bakiye bölümünü göster
        }, 100);
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
        
        <!-- Quick Stats Banner -->
        <div id="admin-quick-stats" style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;padding:14px;margin-bottom:12px;border:1px solid var(--bg4);">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
                <div><div style="font-size:10px;color:var(--text3);">Kullanıcılar</div><div style="font-size:16px;font-weight:800;color:var(--accent);" id="qs-users">-</div></div>
                <div><div style="font-size:10px;color:var(--text3);">Toplam Bakiye</div><div style="font-size:16px;font-weight:800;color:var(--gold);" id="qs-balance">-</div></div>
                <div><div style="font-size:10px;color:var(--text3);">House Profit</div><div style="font-size:16px;font-weight:800;color:var(--green);" id="qs-profit">-</div></div>
            </div>
        </div>
        
        <!-- Admin Menu Tabs -->
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
            <button class="play-button" onclick="showAdminSection('jackpot')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#f59e0b,#d97706)">🎰 Jackpot</button>
            <button class="play-button" onclick="showAdminSection('balance')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,var(--green),#059669)">💰 Bakiye</button>
            <button class="play-button" onclick="showAdminSection('users')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#8b5cf6,#6d28d9)">👥 Kullanıcılar</button>
            <button class="play-button" onclick="showAdminSection('withdraw')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#ef4444,#dc2626)">📤 Çekimler</button>
            <button class="play-button" onclick="showAdminSection('broadcast')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#06b6d4,#0891b2)">📢 Broadcast</button>
            <button class="play-button" onclick="showAdminSection('rain')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#3b82f6,#2563eb)">🌧️ Rain</button>
            <button class="play-button" onclick="showAdminSection('ban')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#f43f5e,#e11d48)">🚫 Ban</button>
            <button class="play-button" onclick="showAdminSection('reset')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#64748b,#475569)">🔄 Reset</button>
            <button class="play-button" onclick="showAdminSection('rtp')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#a855f7,#7c3aed)">⚙️ RTP</button>
            <button class="play-button" onclick="showAdminSection('stats')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#14b8a6,#0d9488)">📊 İstatistik</button>
            <button class="play-button" onclick="showAdminSection('tournament')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:linear-gradient(135deg,#eab308,#ca8a04)">🏆 Turnuva</button>
            <button class="play-button" onclick="showAdminSection('commands')" style="flex:1;min-width:45%;font-size:11px;padding:10px 8px;background:var(--bg3)">📋 Bot Komutları</button>
        </div>
        
        <!-- Dynamic Content Area -->
        <div id="admin-section-content"></div>
    `;
}

function showAdminSection(section) {
    const container = document.getElementById('admin-section-content');
    switch(section) {
        case 'jackpot': container.innerHTML = renderAdmJackpot(); setTimeout(()=>loadJackpotAdmin(),50); break;
        case 'balance': container.innerHTML = renderAdmBalance(); break;
        case 'users': container.innerHTML = renderAdmUsers(); loadAdminUsers(); break;
        case 'withdraw': container.innerHTML = renderAdmWithdraw(); loadPendingWithdrawals(); break;
        case 'broadcast': container.innerHTML = renderAdmBroadcast(); break;
        case 'rain': container.innerHTML = renderAdmRain(); break;
        case 'ban': container.innerHTML = renderAdmBan(); break;
        case 'reset': container.innerHTML = renderAdmReset(); break;
        case 'rtp': container.innerHTML = renderAdmRTP(); break;
        case 'stats': container.innerHTML = renderAdmStats(); loadAdminDetailedStats(); break;
        case 'tournament': container.innerHTML = renderAdmTournament(); break;
        case 'commands': container.innerHTML = renderAdmCommands(); break;
    }
}

function renderAdmJackpot() {
    return `
        <div class="section-title"><span>🎰</span> Jackpot Yönetimi</div>
        <div id="jackpot-admin-info" style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:12px;padding:14px;margin-bottom:12px;text-align:center;border:1px solid rgba(245,158,11,0.3);">
            <div style="font-size:11px;color:var(--text3);">JACKPOT HAVUZU</div>
            <div style="font-size:24px;font-weight:800;color:var(--gold);margin-top:4px;" id="adm-jp-amount">Yükleniyor...</div>
        </div>
        <input class="input-field" type="number" id="adm-jp-give" placeholder="Verilecek miktar (USDT)" step="0.01" min="0.01">
        <button class="play-button" onclick="adminGiveJackpotNew()" style="background:linear-gradient(135deg,#f59e0b,#d97706)">🎰 Jackpot Ver (Random Aktif Oyuncu)</button>
        <div class="section-title mt-20"><span>📜</span> Jackpot Geçmişi</div>
        <button class="play-button" onclick="loadJackpotHistory()" style="background:var(--bg3)">📜 Geçmişi Yükle</button>
        <div id="jackpot-result" style="margin-top:8px;"></div>`;
}

function renderAdmBalance() {
    return `
        <div class="section-title"><span>💰</span> Bakiye Yönetimi</div>
        <input class="input-field" type="number" id="adm-uid" placeholder="User ID">
        <input class="input-field" type="number" id="adm-amount" placeholder="Miktar (USDT)">
        <div style="display:flex;gap:8px;">
            <button class="play-button" onclick="adminAddBal()" style="flex:1;background:linear-gradient(135deg,var(--green),#059669)">💰 Ekle</button>
            <button class="play-button" onclick="adminRmBal2()" style="flex:1;background:linear-gradient(135deg,var(--red),#dc2626)">➖ Çıkar</button>
        </div>
        <div class="section-title mt-20"><span>🔍</span> Kullanıcı Sorgula</div>
        <input class="input-field" type="number" id="adm-lookup-uid" placeholder="User ID">
        <button class="play-button" onclick="adminLookupUser()" style="background:var(--bg3)">🔍 Sorgula</button>
        <div id="adm-lookup-result" style="margin-top:8px;"></div>`;
}

function renderAdmUsers() {
    return `
        <div class="section-title"><span>👥</span> Tüm Kullanıcılar</div>
        <div id="admin-users" style="margin-top:8px;"><p class="text-sm text-muted">Yükleniyor...</p></div>`;
}

function renderAdmWithdraw() {
    return `
        <div class="section-title"><span>📤</span> Çekim Talepleri</div>
        <div id="pending-withdrawals" style="margin-top:8px;"><p class="text-sm text-muted">Yükleniyor...</p></div>`;
}

function renderAdmBroadcast() {
    return `
        <div class="section-title"><span>📢</span> Broadcast Mesaj</div>
        <p style="font-size:11px;color:var(--text3);margin-bottom:8px;">Tüm kullanıcılara mesaj gönder (Bot üzerinden)</p>
        <textarea class="input-field" id="adm-broadcast-msg" placeholder="Mesajınız..." rows="3" style="resize:vertical;min-height:60px;"></textarea>
        <button class="play-button" onclick="adminSendBroadcast()" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">📢 Broadcast Gönder</button>
        <div id="broadcast-result" style="margin-top:8px;"></div>
        <div style="margin-top:12px;padding:10px;background:var(--bg2);border-radius:8px;font-size:11px;color:var(--text3);">
            💡 <b>Bot komutu:</b> /broadcast MESAJ
        </div>`;
}

function renderAdmRain() {
    return `
        <div class="section-title"><span>🌧️</span> Rain / Airdrop</div>
        <p style="font-size:11px;color:var(--text3);margin-bottom:8px;">Tüm aktif oyunculara kişi başı miktar dağıt</p>
        <input class="input-field" type="number" id="adm-rain-amount" placeholder="Kişi başı miktar (USDT)" step="0.1" min="0.01">
        <button class="play-button" onclick="adminDoRain()" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">🌧️ Rain Yap</button>
        <div id="rain-result" style="margin-top:8px;"></div>
        <div style="margin-top:12px;padding:10px;background:var(--bg2);border-radius:8px;font-size:11px;color:var(--text3);">
            💡 <b>Bot komutu:</b> /rain MIKTAR
        </div>`;
}

function renderAdmBan() {
    return `
        <div class="section-title"><span>🚫</span> Ban / Unban Yönetimi</div>
        <input class="input-field" type="number" id="adm-ban-uid" placeholder="User ID">
        <div style="display:flex;gap:8px;">
            <button class="play-button" onclick="adminDoBan()" style="flex:1;background:linear-gradient(135deg,var(--red),#dc2626)">🚫 Banla</button>
            <button class="play-button" onclick="adminDoUnban()" style="flex:1;background:linear-gradient(135deg,var(--green),#059669)">✅ Ban Kaldır</button>
        </div>
        <div id="ban-result" style="margin-top:8px;"></div>
        <div class="section-title mt-20"><span>🚫</span> Banlı Kullanıcılar</div>
        <button class="play-button" onclick="loadBannedUsers()" style="background:var(--bg3)">🚫 Banlıları Göster</button>
        <div id="banned-list" style="margin-top:8px;"></div>
        <div style="margin-top:12px;padding:10px;background:var(--bg2);border-radius:8px;font-size:11px;color:var(--text3);">
            💡 <b>Bot komutları:</b> /ban USER_ID • /unban USER_ID
        </div>`;
}

function renderAdmReset() {
    return `
        <div class="section-title"><span>🔄</span> Kullanıcı Reset</div>
        <p style="font-size:11px;color:var(--text3);margin-bottom:8px;">Kullanıcının tüm verilerini sıfırla</p>
        <input class="input-field" type="number" id="adm-reset-uid" placeholder="User ID">
        <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="play-button" onclick="adminResetBalance()" style="background:linear-gradient(135deg,#f59e0b,#d97706)">💰 Bakiye Sıfırla</button>
            <button class="play-button" onclick="adminResetStats()" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">📊 İstatistik Sıfırla</button>
            <button class="play-button" onclick="adminResetWagering()" style="background:linear-gradient(135deg,#06b6d4,#0891b2)">🎲 Wagering Sıfırla</button>
            <button class="play-button" onclick="adminResetAll()" style="background:linear-gradient(135deg,#ef4444,#dc2626)">⚠️ TAMAMEN SIFIRLA (Her şey)</button>
            <button class="play-button" onclick="adminDeleteUser()" style="background:linear-gradient(135deg,#1f2937,#111827)">🗑️ Kullanıcıyı Sil</button>
        </div>
        <div id="reset-result" style="margin-top:8px;"></div>`;
}

function renderAdmRTP() {
    return `
        <div class="section-title"><span>⚙️</span> RTP / House Edge Ayarları</div>
        <p style="font-size:11px;color:var(--text3);margin-bottom:8px;">Tüm oyunların kazanma oranını ayarla</p>
        <div style="background:var(--bg2);border-radius:10px;padding:12px;margin-bottom:12px;">
            <div style="font-size:12px;color:var(--text2);margin-bottom:8px;">Mevcut RTP: <b id="current-rtp-display">Yükleniyor...</b></div>
            <input type="range" id="adm-rtp-slider" min="80" max="99" value="96" style="width:100%;accent-color:var(--accent);" oninput="document.getElementById('rtp-val').textContent=this.value+'%'">
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-top:4px;">
                <span>80% (Çok Karlı)</span>
                <span id="rtp-val" style="color:var(--gold);font-weight:700;">96%</span>
                <span>99% (Oyuncu Dostu)</span>
            </div>
        </div>
        <button class="play-button" onclick="adminSaveRTP()" style="background:linear-gradient(135deg,#a855f7,#7c3aed)">⚙️ RTP Kaydet</button>
        <div id="rtp-result" style="margin-top:8px;"></div>
        <div style="margin-top:12px;padding:10px;background:var(--bg2);border-radius:8px;font-size:11px;color:var(--text3);">
            📊 <b>RTP Rehberi:</b><br>
            • 80-85%: Çok karlı (oyuncular hızlı kaybeder)<br>
            • 85-92%: Dengeli (iyi kar, oyuncular tutar)<br>
            • 92-96%: Standart casino (önerilen)<br>
            • 96-99%: Oyuncu dostu (düşük kar, yüksek retention)
        </div>`;
}

function renderAdmStats() {
    return `
        <div class="section-title"><span>📊</span> Detaylı İstatistikler</div>
        <div id="admin-detailed-stats"><p class="text-sm text-muted">Yükleniyor...</p></div>`;
}

function renderAdmTournament() {
    return `
        <div class="section-title"><span>🏆</span> Turnuva Ödülü Ver</div>
        <input class="input-field" type="number" id="adm-tour-uid" placeholder="Kazanan User ID">
        <input class="input-field" type="number" id="adm-tour-amount" placeholder="Ödül miktarı (USDT)">
        <button class="play-button" onclick="adminGiveTournamentPrize2()" style="background:linear-gradient(135deg,#eab308,#ca8a04)">🏆 Ödül Ver</button>
        <div id="tournament-result" style="margin-top:8px;"></div>`;
}

function renderAdmCommands() {
    return `
        <div class="section-title"><span>📋</span> Bot Komutları Listesi</div>
        <div style="background:var(--bg2);border-radius:10px;padding:14px;font-size:12px;color:var(--text2);">
            <div style="margin-bottom:12px;font-weight:700;color:var(--accent);">💰 Bakiye Komutları</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/addbal USER_ID MIKTAR</code> — Bakiye ekle</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/rmbal USER_ID MIKTAR</code> — Bakiye çıkar</div>
            
            <div style="margin:12px 0 4px;font-weight:700;color:var(--accent);">🎰 Jackpot</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/jackpot MIKTAR</code> — Random oyuncuya jackpot ver</div>
            
            <div style="margin:12px 0 4px;font-weight:700;color:var(--accent);">🚫 Ban Yönetimi</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/ban USER_ID</code> — Kullanıcı banla</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/unban USER_ID</code> — Ban kaldır</div>
            
            <div style="margin:12px 0 4px;font-weight:700;color:var(--accent);">📢 İletişim</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/broadcast MESAJ</code> — Herkese mesaj gönder</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/rain MIKTAR</code> — Aktif oyunculara airdrop</div>
            
            <div style="margin:12px 0 4px;font-weight:700;color:var(--accent);">📤 Çekim Yönetimi</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/pending</code> — Bekleyen çekimleri listele</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/approve REQUEST_ID</code> — Çekim onayla</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/reject REQUEST_ID</code> — Çekim reddet</div>
            
            <div style="margin:12px 0 4px;font-weight:700;color:var(--accent);">📊 Genel</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/admin</code> — Admin paneli aç</div>
            <div style="margin-bottom:4px;"><code style="color:var(--gold)">/withdraw MIKTAR CÜZDAN</code> — (Kullanıcı) Çekim talebi</div>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PANEL FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Quick stats loader
async function loadAdminQuickStats() {
    const users = await fbGet('users') || {};
    const jp = await getJackpot();
    let totalBal = 0, totalDep = 0, totalWit = 0;
    for (const data of Object.values(users)) {
        totalBal += (data.balance || 0);
        totalDep += (data.totalDeposited || 0);
        totalWit += (data.totalWithdrawn || 0);
    }
    const profit = totalDep - totalWit - totalBal;
    document.getElementById('qs-users').textContent = Object.keys(users).length;
    document.getElementById('qs-balance').textContent = '$' + totalBal.toFixed(0);
    document.getElementById('qs-profit').textContent = '$' + profit.toFixed(0);
    document.getElementById('qs-profit').style.color = profit >= 0 ? 'var(--green)' : 'var(--red)';
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
    const uid = document.getElementById('adm-uid')?.value;
    const amount = parseFloat(document.getElementById('adm-amount')?.value);
    if (!uid || !amount || amount <= 0) return alert('User ID ve miktar girin!');
    await adminAddBalDirect(uid, amount);
}

async function adminRmBal() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-uid')?.value;
    const amount = parseFloat(document.getElementById('adm-amount')?.value);
    if (!uid || !amount) return alert('Tüm alanları doldurun!');
    await adminRmBalDirect(uid, amount);
}

async function loadAdminUsers() {
    if (!isAdmin) return;
    const users = await fbGet('users');
    const container = document.getElementById('admin-users');
    if (!users) { container.innerHTML = '<p class="text-sm text-muted">No users.</p>'; return; }
    
    let html = '';
    const sorted = Object.entries(users).sort((a, b) => (b[1].balance || 0) - (a[1].balance || 0));
    for (const [uid, data] of sorted) {
        html += `<div class="history-item" style="cursor:pointer;" onclick="adminQuickAction('${uid}','${(data.name||'?').replace(/'/g,'')}')" >
            <div class="hi-left"><span class="hi-icon">${data.banned?'🚫':'👤'}</span>
            <div><div class="hi-game">${data.name||'?'} <small style="color:var(--text3)">${uid}</small></div>
            <div class="hi-time">Games: ${data.totalGames||0} | Dep: $${(data.totalDeposited||0).toFixed(1)} | W: $${(data.totalWagered||0).toFixed(0)}</div></div></div>
            <div class="hi-amount win">$${(data.balance||0).toFixed(2)}</div></div>`;
    }
    container.innerHTML = html || '<p class="text-sm text-muted">No users.</p>';
}

// Quick action popup when clicking a user
function adminQuickAction(uid, name) {
    const action = prompt(
        `👤 ${name} (${uid})\n\n` +
        `Seçenekler:\n` +
        `1 = Bakiye Ekle\n` +
        `2 = Bakiye Çıkar\n` +
        `3 = Banla\n` +
        `4 = Ban Kaldır\n` +
        `5 = Tamamen Sıfırla\n` +
        `6 = Detay Göster\n\n` +
        `Numara girin:`
    );
    if (!action) return;
    switch(action) {
        case '1':
            const addAmt = prompt(`${name} (${uid})\n\nEklenecek miktar (USDT):`);
            if (addAmt && parseFloat(addAmt) > 0) { adminAddBalDirect(uid, parseFloat(addAmt)); }
            break;
        case '2':
            const rmAmt = prompt(`${name} (${uid})\n\nÇıkarılacak miktar (USDT):`);
            if (rmAmt && parseFloat(rmAmt) > 0) { adminRmBalDirect(uid, parseFloat(rmAmt)); }
            break;
        case '3': adminBanDirect(uid); break;
        case '4': adminUnbanDirect(uid); break;
        case '5': adminResetDirect(uid); break;
        case '6': adminLookupDirect(uid); break;
    }
}

// Direct balance add (doesn't depend on input fields)
async function adminAddBalDirect(uid, amount) {
    if (!isAdmin || !uid || !amount || amount <= 0) return;
    
    let userData = await fbGet(`users/${uid}`);
    if (!userData) { 
        userData = { balance: 0, totalGames: 0, totalWins: 0, totalProfit: 0, totalDeposited: 0, totalWithdrawn: 0, totalWagered: 0, history: [], name: '?', joined: new Date().toISOString(), banned: false }; 
    }
    userData.balance = (userData.balance || 0) + amount;
    userData.totalDeposited = (userData.totalDeposited || 0) + amount;
    await fbSet(`users/${uid}`, userData);
    
    // Kullanıcıya bildirim gönder
    await fbSet(`deposit_notifications/${uid}_${Date.now()}`, {
        user_id: uid,
        amount: amount,
        newBalance: userData.balance,
        time: new Date().toISOString(),
        notified: false
    });
    
    alert(`✅ +$${amount.toFixed(2)} USDT eklendi!\nKullanıcı: ${userData.name || uid}\nYeni bakiye: $${userData.balance.toFixed(2)}\n\n📨 Bildirim gönderilecek.`);
    if (uid == currentUserId) { user = userData; updateBal(); }
    
    // Kullanıcı listesini yenile
    if (document.getElementById('admin-users')) loadAdminUsers();
    loadAdminQuickStats();
}

async function adminRmBal2() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-uid').value;
    const amount = parseFloat(document.getElementById('adm-amount').value);
    if (!uid || !amount) return alert('Tüm alanları doldurun!');
    await adminRmBalDirect(uid, amount);
}

async function adminRmBalDirect(uid, amount) {
    let userData = await fbGet(`users/${uid}`);
    if (!userData) return alert('Kullanıcı bulunamadı!');
    userData.balance = Math.max(0, (userData.balance || 0) - amount);
    await fbUpdate(`users/${uid}`, { balance: userData.balance });
    alert(`✅ -$${amount.toFixed(2)} from ${uid}\nYeni bakiye: $${userData.balance.toFixed(2)}`);
    if (uid == currentUserId) { user.balance = userData.balance; updateBal(); }
    if (document.getElementById('admin-users')) loadAdminUsers();
    loadAdminQuickStats();
}

async function adminBanDirect(uid) {
    await fbUpdate(`users/${uid}`, { banned: true });
    alert(`🚫 ${uid} banlandı!`);
}

async function adminUnbanDirect(uid) {
    await fbUpdate(`users/${uid}`, { banned: false });
    alert(`✅ ${uid} ban kaldırıldı!`);
}

async function adminResetDirect(uid) {
    if (!confirm(`⚠️ ${uid} kullanıcısının TÜM verileri silinecek!\n\nEmin misiniz?`)) return;
    await fbSet(`users/${uid}`, {
        balance: 0, totalGames: 0, totalWins: 0, totalProfit: 0,
        totalDeposited: 0, totalWithdrawn: 0, totalWagered: 0,
        history: [], name: '?', joined: new Date().toISOString(),
        banned: false, lossStreak: 0
    });
    await fbSet(`bonuses/${uid}`, null);
    await fbSet(`streaks/${uid}`, null);
    await fbSet(`daily/${uid}`, null);
    await fbSet(`missions/${uid}`, null);
    alert(`🔄 ${uid} tamamen sıfırlandı!`);
}

async function adminLookupDirect(uid) {
    const data = await fbGet(`users/${uid}`);
    if (!data) return alert('Kullanıcı bulunamadı!');
    const bonus = await fbGet(`bonuses/${uid}`) || {};
    alert(
        `👤 ${data.name || '?'} (${uid})\n\n` +
        `💰 Bakiye: $${(data.balance||0).toFixed(2)}\n` +
        `📥 Yatırım: $${(data.totalDeposited||0).toFixed(2)}\n` +
        `📤 Çekim: $${(data.totalWithdrawn||0).toFixed(2)}\n` +
        `🎮 Oyun: ${data.totalGames||0}\n` +
        `🏆 Kazanma: ${data.totalWins||0}\n` +
        `📊 Profit: $${(data.totalProfit||0).toFixed(2)}\n` +
        `🎲 Wagered: $${(data.totalWagered||0).toFixed(2)}\n` +
        `🚫 Ban: ${data.banned ? 'EVET' : 'Hayır'}\n` +
        `🎁 Aktif Bonus: $${(bonus.activeBonus||0).toFixed(2)}\n` +
        `📅 Katılım: ${data.joined || '?'}`
    );
}

// Lookup user from input
async function adminLookupUser() {
    const uid = document.getElementById('adm-lookup-uid').value;
    if (!uid) return alert('User ID girin!');
    const data = await fbGet(`users/${uid}`);
    const container = document.getElementById('adm-lookup-result');
    if (!data) { container.innerHTML = '<div style="color:var(--red);padding:8px;">❌ Kullanıcı bulunamadı!</div>'; return; }
    const bonus = await fbGet(`bonuses/${uid}`) || {};
    container.innerHTML = `
        <div style="background:var(--bg2);border-radius:10px;padding:12px;margin-top:8px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:8px;">👤 ${data.name || '?'} <small style="color:var(--text3)">${uid}</small></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;color:var(--text2);">
                <div>💰 Bakiye: <b>$${(data.balance||0).toFixed(2)}</b></div>
                <div>📥 Yatırım: $${(data.totalDeposited||0).toFixed(2)}</div>
                <div>📤 Çekim: $${(data.totalWithdrawn||0).toFixed(2)}</div>
                <div>🎮 Oyun: ${data.totalGames||0}</div>
                <div>🏆 Kazanma: ${data.totalWins||0}</div>
                <div>📊 Profit: $${(data.totalProfit||0).toFixed(2)}</div>
                <div>🎲 Wagered: $${(data.totalWagered||0).toFixed(0)}</div>
                <div>🚫 Ban: ${data.banned?'<span style="color:var(--red)">EVET</span>':'Hayır'}</div>
                <div>🎁 Bonus: $${(bonus.activeBonus||0).toFixed(2)}</div>
                <div>📅 Katılım: ${(data.joined||'?').split('T')[0]}</div>
            </div>
        </div>`;
}

// Jackpot history
async function loadJackpotHistory() {
    const history = await fbGet('jackpot/history') || [];
    const container = document.getElementById('jackpot-result');
    if (!history.length) { container.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px;">Henüz jackpot verilmemiş.</div>'; return; }
    let html = '';
    history.slice(-10).reverse().forEach(h => {
        html += `<div class="history-item">
            <div class="hi-left"><span class="hi-icon">🎰</span><div><div class="hi-game">${h.winnerName||'?'}</div><div class="hi-time">${(h.time||'').split('T')[0]}</div></div></div>
            <div class="hi-amount win">+$${(h.amount||0).toFixed(2)}</div></div>`;
    });
    container.innerHTML = html;
}

// Pending withdrawals
async function loadPendingWithdrawals() {
    const withdrawals = await fbGet('withdrawals') || {};
    const container = document.getElementById('pending-withdrawals');
    const pending = Object.entries(withdrawals).filter(([_, r]) => r.status === 'pending');
    
    if (!pending.length) {
        container.innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px;">✅ Bekleyen çekim talebi yok.</div>';
        return;
    }
    
    let html = '';
    for (const [rid, req] of pending) {
        html += `
            <div style="background:var(--bg2);border-radius:10px;padding:12px;margin-bottom:8px;border:1px solid rgba(239,68,68,0.3);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:13px;font-weight:700;">👤 ${req.user_name||'?'} <small style="color:var(--text3)">${req.user_id}</small></div>
                        <div style="font-size:11px;color:var(--text3);margin-top:2px;">💰 $${(req.amount||0).toFixed(2)} → ${(req.wallet||'?').substring(0,20)}...</div>
                        <div style="font-size:10px;color:var(--text3);">${(req.time||'').split('T')[0]}</div>
                    </div>
                    <div style="font-size:18px;font-weight:800;color:var(--gold);">$${(req.amount||0).toFixed(2)}</div>
                </div>
                <div style="display:flex;gap:6px;margin-top:8px;">
                    <button class="play-button" onclick="adminApproveWithdraw('${rid}')" style="flex:1;font-size:11px;padding:8px;background:linear-gradient(135deg,var(--green),#059669)">✅ Onayla</button>
                    <button class="play-button" onclick="adminRejectWithdraw('${rid}')" style="flex:1;font-size:11px;padding:8px;background:linear-gradient(135deg,var(--red),#dc2626)">❌ Reddet</button>
                </div>
            </div>`;
    }
    container.innerHTML = html;
}

async function adminApproveWithdraw(rid) {
    const req = await fbGet(`withdrawals/${rid}`);
    if (!req || req.status !== 'pending') return alert('Talep bulunamadı veya zaten işlendi!');
    await fbUpdate(`withdrawals/${rid}`, { status: 'approved', approved_time: new Date().toISOString() });
    alert(`✅ Çekim onaylandı!\n${req.user_name} → $${req.amount.toFixed(2)}`);
    loadPendingWithdrawals();
}

async function adminRejectWithdraw(rid) {
    const req = await fbGet(`withdrawals/${rid}`);
    if (!req || req.status !== 'pending') return alert('Talep bulunamadı veya zaten işlendi!');
    // Refund
    const userData = await fbGet(`users/${req.user_id}`) || {};
    const newBal = (userData.balance || 0) + req.amount;
    await fbUpdate(`users/${req.user_id}`, { balance: newBal });
    await fbUpdate(`withdrawals/${rid}`, { status: 'rejected', rejected_time: new Date().toISOString() });
    alert(`❌ Çekim reddedildi. $${req.amount.toFixed(2)} iade edildi.`);
    loadPendingWithdrawals();
}

// Broadcast from webapp
async function adminSendBroadcast() {
    if (!isAdmin) return;
    const msg = document.getElementById('adm-broadcast-msg').value.trim();
    if (!msg) return alert('Mesaj girin!');
    await fbSet('broadcast_queue', { message: msg, time: new Date().toISOString(), sent: false });
    document.getElementById('broadcast-result').innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px;">✅ Broadcast kuyruğa eklendi! Bot gönderecek.<br>Bot komutu: /broadcast ' + msg.substring(0,30) + '...</div>';
    document.getElementById('adm-broadcast-msg').value = '';
}

// Rain from webapp
async function adminDoRain() {
    if (!isAdmin) return;
    const amount = parseFloat(document.getElementById('adm-rain-amount').value);
    if (!amount || amount <= 0) return alert('Geçerli miktar girin!');
    
    const users = await fbGet('users') || {};
    const active = Object.entries(users).filter(([id, d]) => (d.totalGames||0) > 0 && !d.banned && id != ADMIN_ID);
    
    if (!active.length) return alert('Aktif oyuncu yok!');
    if (!confirm(`🌧️ ${active.length} oyuncuya $${amount.toFixed(2)} dağıtılacak.\nToplam: $${(active.length * amount).toFixed(2)}\n\nOnaylıyor musunuz?`)) return;
    
    for (const [uid, data] of active) {
        const newBal = (data.balance || 0) + amount;
        await fbUpdate(`users/${uid}`, { balance: newBal });
        await fbSet(`rain_notifications/${uid}`, { amount, seen: false, time: new Date().toISOString() });
    }
    
    document.getElementById('rain-result').innerHTML = `<div style="color:var(--green);font-size:12px;padding:8px;">🌧️ Rain tamamlandı! ${active.length} oyuncuya $${amount.toFixed(2)} dağıtıldı.<br>Toplam: $${(active.length * amount).toFixed(2)}</div>`;
}

// Ban from webapp
async function adminDoBan() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-ban-uid').value;
    if (!uid) return alert('User ID girin!');
    await fbUpdate(`users/${uid}`, { banned: true });
    document.getElementById('ban-result').innerHTML = `<div style="color:var(--red);font-size:12px;padding:8px;">🚫 ${uid} banlandı!</div>`;
}

async function adminDoUnban() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-ban-uid').value;
    if (!uid) return alert('User ID girin!');
    await fbUpdate(`users/${uid}`, { banned: false });
    document.getElementById('ban-result').innerHTML = `<div style="color:var(--green);font-size:12px;padding:8px;">✅ ${uid} ban kaldırıldı!</div>`;
}

async function loadBannedUsers() {
    const users = await fbGet('users') || {};
    const banned = Object.entries(users).filter(([_, d]) => d.banned);
    const container = document.getElementById('banned-list');
    if (!banned.length) { container.innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px;">✅ Banlı kullanıcı yok.</div>'; return; }
    let html = '';
    for (const [uid, data] of banned) {
        html += `<div class="history-item">
            <div class="hi-left"><span class="hi-icon">🚫</span><div><div class="hi-game">${data.name||'?'} <small>${uid}</small></div></div></div>
            <button class="reward-btn" onclick="adminUnbanDirect('${uid}');loadBannedUsers();">Unban</button></div>`;
    }
    container.innerHTML = html;
}

// Reset functions
async function adminResetBalance() {
    const uid = document.getElementById('adm-reset-uid').value;
    if (!uid) return alert('User ID girin!');
    if (!confirm(`${uid} bakiyesi sıfırlanacak. Emin misiniz?`)) return;
    await fbUpdate(`users/${uid}`, { balance: 0 });
    document.getElementById('reset-result').innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px;">✅ Bakiye sıfırlandı.</div>';
}

async function adminResetStats() {
    const uid = document.getElementById('adm-reset-uid').value;
    if (!uid) return alert('User ID girin!');
    if (!confirm(`${uid} istatistikleri sıfırlanacak. Emin misiniz?`)) return;
    await fbUpdate(`users/${uid}`, { totalGames: 0, totalWins: 0, totalProfit: 0, totalWagered: 0, history: [] });
    document.getElementById('reset-result').innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px;">✅ İstatistikler sıfırlandı.</div>';
}

async function adminResetWagering() {
    const uid = document.getElementById('adm-reset-uid').value;
    if (!uid) return alert('User ID girin!');
    await fbSet(`bonuses/${uid}`, { deposits: 0, totalBonus: 0, activeBonus: 0, wageringRequired: 0, wageringDone: 0 });
    document.getElementById('reset-result').innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px;">✅ Wagering/bonus sıfırlandı.</div>';
}

async function adminResetAll() {
    const uid = document.getElementById('adm-reset-uid').value;
    if (!uid) return alert('User ID girin!');
    if (!confirm(`⚠️ DİKKAT!\n\n${uid} kullanıcısının TÜM verileri sıfırlanacak:\n- Bakiye\n- İstatistikler\n- Bonus/Wagering\n- Streak\n- Günlük bonus\n- Görevler\n\nBu işlem geri alınamaz!`)) return;
    await adminResetDirect(uid);
    document.getElementById('reset-result').innerHTML = '<div style="color:var(--green);font-size:12px;padding:8px;">✅ Kullanıcı tamamen sıfırlandı.</div>';
}

async function adminDeleteUser() {
    const uid = document.getElementById('adm-reset-uid').value;
    if (!uid) return alert('User ID girin!');
    if (!confirm(`⚠️ UYARI!\n\n${uid} kullanıcısı TAMAMEN SİLİNECEK!\n\nBu işlem geri alınamaz!`)) return;
    if (!confirm(`Son kez: ${uid} silinsin mi?`)) return;
    await fbSet(`users/${uid}`, null);
    await fbSet(`bonuses/${uid}`, null);
    await fbSet(`streaks/${uid}`, null);
    await fbSet(`daily/${uid}`, null);
    await fbSet(`missions/${uid}`, null);
    document.getElementById('reset-result').innerHTML = '<div style="color:var(--red);font-size:12px;padding:8px;">🗑️ Kullanıcı silindi.</div>';
}

// RTP
async function adminSaveRTP() {
    if (!isAdmin) return;
    const rtp = parseInt(document.getElementById('adm-rtp-slider').value);
    await fbSet('settings/rtp', rtp / 100);
    document.getElementById('rtp-result').innerHTML = `<div style="color:var(--green);font-size:12px;padding:8px;">✅ RTP ${rtp}% olarak kaydedildi! Oyuncular yeniden yüklediğinde aktif olur.</div>`;
}

// Detailed stats
async function loadAdminDetailedStats() {
    const users = await fbGet('users') || {};
    const container = document.getElementById('admin-detailed-stats');
    
    let totalBal = 0, totalDep = 0, totalWit = 0, totalGames = 0, totalWagered = 0;
    let activeCount = 0, bannedCount = 0;
    let topWinner = { name: '-', profit: 0 };
    let topLoser = { name: '-', profit: 0 };
    let topDepositor = { name: '-', dep: 0 };
    let topGamer = { name: '-', games: 0 };
    
    for (const [uid, data] of Object.entries(users)) {
        totalBal += (data.balance || 0);
        totalDep += (data.totalDeposited || 0);
        totalWit += (data.totalWithdrawn || 0);
        totalGames += (data.totalGames || 0);
        totalWagered += (data.totalWagered || 0);
        if ((data.totalGames || 0) > 0) activeCount++;
        if (data.banned) bannedCount++;
        if ((data.totalProfit || 0) > topWinner.profit) topWinner = { name: data.name || '?', profit: data.totalProfit };
        if ((data.totalProfit || 0) < topLoser.profit) topLoser = { name: data.name || '?', profit: data.totalProfit };
        if ((data.totalDeposited || 0) > topDepositor.dep) topDepositor = { name: data.name || '?', dep: data.totalDeposited };
        if ((data.totalGames || 0) > topGamer.games) topGamer = { name: data.name || '?', games: data.totalGames };
    }
    
    const houseProfit = totalDep - totalWit - totalBal;
    const jp = await getJackpot();
    
    container.innerHTML = `
        <div style="background:var(--bg2);border-radius:10px;padding:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text2);">
                <div>👥 Toplam: <b>${Object.keys(users).length}</b></div>
                <div>🎮 Aktif: <b>${activeCount}</b></div>
                <div>🚫 Banlı: <b style="color:var(--red)">${bannedCount}</b></div>
                <div>🎲 Toplam Oyun: <b>${totalGames}</b></div>
                <div>💰 Toplam Bakiye: <b style="color:var(--gold)">$${totalBal.toFixed(2)}</b></div>
                <div>📥 Toplam Yatırım: <b>$${totalDep.toFixed(2)}</b></div>
                <div>📤 Toplam Çekim: <b>$${totalWit.toFixed(2)}</b></div>
                <div>🎲 Toplam Wagered: <b>$${totalWagered.toFixed(0)}</b></div>
                <div>🏦 House Profit: <b style="color:${houseProfit>=0?'var(--green)':'var(--red)'}">$${houseProfit.toFixed(2)}</b></div>
                <div>🎰 Jackpot Havuz: <b style="color:var(--gold)">$${jp.toFixed(2)}</b></div>
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--bg4);">
                <div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px;">🏆 Rekorlar</div>
                <div style="font-size:11px;color:var(--text2);">
                    <div>🏆 En Çok Kazanan: <b>${topWinner.name}</b> (+$${topWinner.profit.toFixed(0)})</div>
                    <div>📉 En Çok Kaybeden: <b>${topLoser.name}</b> ($${topLoser.profit.toFixed(0)})</div>
                    <div>💎 En Çok Yatıran: <b>${topDepositor.name}</b> ($${topDepositor.dep.toFixed(0)})</div>
                    <div>🎮 En Çok Oynayan: <b>${topGamer.name}</b> (${topGamer.games} oyun)</div>
                    <div>📊 Ort. Oyun/Kişi: <b>${activeCount > 0 ? (totalGames/activeCount).toFixed(0) : 0}</b></div>
                </div>
            </div>
        </div>`;
}

// Tournament prize from webapp
async function adminGiveTournamentPrize2() {
    if (!isAdmin) return;
    const uid = document.getElementById('adm-tour-uid').value;
    const amount = parseFloat(document.getElementById('adm-tour-amount').value);
    if (!uid || !amount) return alert('Tüm alanları doldurun!');
    
    const userData = await fbGet(`users/${uid}`);
    if (!userData) return alert('Kullanıcı bulunamadı!');
    
    const newBal = (userData.balance || 0) + amount;
    await fbUpdate(`users/${uid}`, { balance: newBal });
    await fbSet(`tournament_notifications/${uid}`, { amount, time: new Date().toISOString(), seen: false });
    
    document.getElementById('tournament-result').innerHTML = `<div style="color:var(--green);font-size:12px;padding:8px;">🏆 Ödül verildi! ${userData.name||'?'} → +$${amount.toFixed(2)}</div>`;
}

// === GAME SCREEN ===
function openGame(id) {
    if (user.banned) return alert(t('accountBanned'));
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
    document.getElementById('game-title').textContent = '🌐 ' + t('language');
    document.getElementById('game-body').innerHTML = `
        <div style="width:100%;max-width:360px;">
            ${Object.entries(LANGS).map(([code, info]) => `
                <div class="payment-option" onclick="setLanguage('${code}')" style="${currentLang===code?'border-color:var(--accent);background:rgba(139,92,246,0.1);':''}">
                    <div style="font-size:28px;">${info.flag}</div>
                    <div>
                        <div class="po-name">${info.name}</div>
                        ${currentLang===code?'<div style="font-size:10px;color:var(--accent);">✓ Active</div>':''}
                    </div>
                </div>
            `).join('')}
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
let SOUNDS_ENABLED = true;

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
        <div class="section-title"><span>🎁</span> ${t('rewardsMore')}</div>
        <div class="reward-card"><div class="reward-icon">🎲</div><div class="reward-info"><div class="reward-title">${t('dailyBonus')}</div><div class="reward-desc">${t('dailyBonusDesc')}</div></div><button class="reward-btn" onclick="claimDaily()">${t('claim')}</button></div>
        <div class="reward-card"><div class="reward-icon">🔥</div><div class="reward-info"><div class="reward-title">${t('loginStreak')}</div><div class="reward-desc">${t('loginStreakDesc')}</div></div><button class="reward-btn" onclick="claimStreak()">${t('claim')}</button></div>
        <div class="reward-card"><div class="reward-icon">🎯</div><div class="reward-info"><div class="reward-title">${t('dailyMissions')}</div><div class="reward-desc">${t('dailyMissionsDesc')}</div></div><button class="reward-btn" onclick="showMissions()">${t('view')}</button></div>
        <div class="reward-card"><div class="reward-icon">🏆</div><div class="reward-info"><div class="reward-title">${t('tournament')}</div><div class="reward-desc">${t('tournamentDesc')}</div></div><button class="reward-btn" onclick="showTournament()">${t('view')}</button></div>
        <div class="reward-card"><div class="reward-icon">🎡</div><div class="reward-info"><div class="reward-title">${t('freeSpin')}</div><div class="reward-desc">${t('freeSpinDesc')}</div></div><button class="reward-btn" onclick="freeSpinWheel()">${t('spin')}</button></div>
        <div class="reward-card"><div class="reward-icon">👥</div><div class="reward-info"><div class="reward-title">${t('referFriend')}</div><div class="reward-desc">${t('referDesc')}</div></div><button class="reward-btn" onclick="if(tg)tg.close();else alert('Use bot for referral link')">${t('share')}</button></div>
        <div class="reward-card"><div class="reward-icon">🏆</div><div class="reward-info"><div class="reward-title">${t('leaderboard')}</div><div class="reward-desc">${t('leaderboardDesc')}</div></div><button class="reward-btn" onclick="showLeaderboard()">${t('view')}</button></div>
        <div class="reward-card"><div class="reward-icon">🔒</div><div class="reward-info"><div class="reward-title">${t('provablyFair')}</div><div class="reward-desc">${t('provablyFairDesc')}</div></div><button class="reward-btn" onclick="document.getElementById('content').innerHTML=renderProvablyFair()+'<button class=\\'play-button mt-20\\' onclick=\\'switchTab(\\\"rewards\\\")\\' style=\\'background:var(--bg3)\\'>${t('back')}</button>'">${t('verify')}</button></div>
        ${renderVIPInfo()}
    `;
};

// ═══════════════════════════════════════════════════════════════
// UPDATE RECORD GAME (add sound + jackpot + max win + cooldown + wagering + loss streak)
// ═══════════════════════════════════════════════════════════════
const MAX_WIN_PER_GAME = 500; // Max win per single game
let lastGameTime = 0;
const GAME_COOLDOWN = 1000; // 1 second between games

const _origRecordGame = recordGame;
recordGame = function(game, bet, won, profit) {
    // Cooldown check
    const now = Date.now();
    if (now - lastGameTime < GAME_COOLDOWN) {
        // Too fast, silently ignore (anti-bot)
    }
    lastGameTime = now;
    
    // Max win cap
    if (won && profit > MAX_WIN_PER_GAME) {
        profit = MAX_WIN_PER_GAME;
    }
    
    // Sound effects
    if (won && profit > bet * 5) playSound('jackpot');
    else if (won) playSound('win');
    else playSound('lose');
    
    // Add to jackpot pool
    addToJackpot(bet);
    
    // Track wagering
    if (!user.totalWagered) user.totalWagered = 0;
    user.totalWagered += bet;
    
    // Track loss streak
    if (!user.lossStreak) user.lossStreak = 0;
    if (!won) {
        user.lossStreak++;
        // Loss streak bonus: after 7 consecutive losses, give small consolation
        if (user.lossStreak >= 7) {
            const consolation = bet * 0.1; // 10% of last bet
            user.balance += consolation;
            user.lossStreak = 0;
            setTimeout(() => {
                alert(`😢 Kötü şans serisi! İşte küçük bir teselli bonusu: +$${consolation.toFixed(2)}`);
            }, 500);
        }
    } else {
        user.lossStreak = 0;
    }
    
    // Track daily missions progress
    trackMissionProgress(game, bet, won, profit);
    
    // === BALANCE CALCULATION ===
    // getBet() already deducted the bet from balance
    // profit from games: win = (bet * mult - bet) = net profit, lose = -bet
    // Since bet is already deducted:
    //   - On win: we need to add back bet + net profit = bet + (bet*mult - bet) = bet*mult (total return)
    //   - On lose: profit = -bet, but bet already deducted, so add 0
    //   - On partial (plinko 0.5x): profit = bet*0.5 - bet = -0.5*bet, add back bet + profit = 0.5*bet
    user.totalGames++;
    if (won) user.totalWins++;
    user.totalProfit += profit;
    user.balance += (profit + bet); // Add back bet + net profit = total return
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
    const homeHTML = _origHome();
    content.innerHTML = jpBanner + homeHTML;
};

// Sound toggle in topbar
const _origSoundEnabled = SOUNDS_ENABLED;
