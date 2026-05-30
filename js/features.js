// ═══════════════════════════════════════════════════════════════
// LIBERTY CASINO - ADVANCED FEATURES MODULE
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// FEATURE: DEPOSIT BONUS SYSTEM
// ═══════════════════════════════════════════════════════════════
const DEPOSIT_BONUSES = {
    first: { percent: 100, max: 100, label: '🎉 First Deposit: 100% Bonus (max $100)' },
    second: { percent: 50, max: 50, label: '🎊 Second Deposit: 50% Bonus (max $50)' },
    third: { percent: 25, max: 25, label: '🎈 Third Deposit: 25% Bonus (max $25)' },
};

async function checkDepositBonus(amount) {
    const bonusData = await fbGet(`bonuses/${currentUserId}`) || { deposits: 0, totalBonus: 0 };
    const depositNum = (bonusData.deposits || 0) + 1;
    
    let bonusPercent = 0, maxBonus = 0;
    if (depositNum === 1) { bonusPercent = 100; maxBonus = 100; }
    else if (depositNum === 2) { bonusPercent = 50; maxBonus = 50; }
    else if (depositNum === 3) { bonusPercent = 25; maxBonus = 25; }
    else { return 0; } // No bonus after 3rd deposit
    
    const bonus = Math.min(amount * bonusPercent / 100, maxBonus);
    
    // Save bonus info with wagering requirement
    await fbUpdate(`bonuses/${currentUserId}`, {
        deposits: depositNum,
        totalBonus: (bonusData.totalBonus || 0) + bonus,
        activeBonus: bonus,
        wageringRequired: bonus * 5, // 5x wagering requirement
        wageringDone: 0,
    });
    
    return bonus;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: WAGERING REQUIREMENT
// ═══════════════════════════════════════════════════════════════
async function getWageringStatus() {
    const data = await fbGet(`bonuses/${currentUserId}`);
    if (!data || !data.activeBonus) return null;
    return {
        bonus: data.activeBonus || 0,
        required: data.wageringRequired || 0,
        done: data.wageringDone || 0,
        remaining: Math.max(0, (data.wageringRequired || 0) - (data.wageringDone || 0)),
        canWithdraw: (data.wageringDone || 0) >= (data.wageringRequired || 0),
    };
}

async function addWagering(amount) {
    const data = await fbGet(`bonuses/${currentUserId}`);
    if (!data || !data.activeBonus) return;
    const newDone = (data.wageringDone || 0) + amount;
    await fbUpdate(`bonuses/${currentUserId}`, { wageringDone: newDone });
    if (newDone >= (data.wageringRequired || 0)) {
        await fbUpdate(`bonuses/${currentUserId}`, { activeBonus: 0 });
    }
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: LOGIN STREAK BONUS
// ═══════════════════════════════════════════════════════════════
const STREAK_REWARDS = [0.25, 0.50, 0.75, 1.00, 1.50, 2.00, 3.00]; // Day 1-7

async function claimStreak() {
    const streakData = await fbGet(`streaks/${currentUserId}`) || { day: 0, lastClaim: 0 };
    const now = Date.now();
    const lastClaim = streakData.lastClaim || 0;
    const hoursSince = (now - lastClaim) / 3600000;
    
    if (hoursSince < 20) {
        alert('⏰ Streak bonusunu zaten aldınız! Yarın tekrar gelin.');
        return;
    }
    
    // Check if streak is broken (more than 48h)
    let currentDay = streakData.day || 0;
    if (hoursSince > 48) {
        currentDay = 0; // Reset streak
    }
    
    const reward = STREAK_REWARDS[Math.min(currentDay, STREAK_REWARDS.length - 1)];
    currentDay++;
    
    // Save streak
    await fbSet(`streaks/${currentUserId}`, { day: currentDay, lastClaim: now });
    
    // Add balance
    user.balance += reward;
    await saveUser();
    updateBal();
    
    alert(`🔥 Streak Gün ${currentDay}!\n+$${reward.toFixed(2)} USDT\n\n${currentDay >= 7 ? '🏆 MAX STREAK! Her gün $3.00 alıyorsunuz!' : `Yarın: $${STREAK_REWARDS[Math.min(currentDay, STREAK_REWARDS.length-1)].toFixed(2)}`}`);
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: DAILY MISSIONS
// ═══════════════════════════════════════════════════════════════
function getTodayKey() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

async function getMissions() {
    const today = getTodayKey();
    let missions = await fbGet(`missions/${currentUserId}/${today}`);
    if (!missions) {
        // Generate daily missions
        missions = {
            play10: { title: '🎮 10 Oyun Oyna', desc: 'Herhangi 10 oyun oyna', target: 10, progress: 0, reward: 0.50, claimed: false },
            win5: { title: '🏆 5 Oyun Kazan', desc: '5 oyun kazan', target: 5, progress: 0, reward: 1.00, claimed: false },
            bet50: { title: '💰 $50 Bahis Yap', desc: 'Toplam $50 bahis yap', target: 50, progress: 0, reward: 1.50, claimed: false },
            crash3x: { title: '🚀 Crash 3x', desc: "Crash'te 3x+ cash out yap", target: 1, progress: 0, reward: 2.00, claimed: false },
            bigwin: { title: '🎰 Büyük Kazanç', desc: 'Tek oyunda $10+ kazan', target: 1, progress: 0, reward: 3.00, claimed: false },
        };
        await fbSet(`missions/${currentUserId}/${today}`, missions);
    }
    return missions;
}

function trackMissionProgress(game, bet, won, profit) {
    // This runs in background, don't await
    const today = getTodayKey();
    fbGet(`missions/${currentUserId}/${today}`).then(missions => {
        if (!missions) return;
        let updated = false;
        
        // play10
        if (missions.play10 && !missions.play10.claimed) {
            missions.play10.progress = (missions.play10.progress || 0) + 1;
            updated = true;
        }
        // win5
        if (won && missions.win5 && !missions.win5.claimed) {
            missions.win5.progress = (missions.win5.progress || 0) + 1;
            updated = true;
        }
        // bet50
        if (missions.bet50 && !missions.bet50.claimed) {
            missions.bet50.progress = (missions.bet50.progress || 0) + bet;
            updated = true;
        }
        // crash3x
        if (game === 'Crash' && won && profit >= bet * 2 && missions.crash3x && !missions.crash3x.claimed) {
            missions.crash3x.progress = 1;
            updated = true;
        }
        // bigwin
        if (won && profit >= 10 && missions.bigwin && !missions.bigwin.claimed) {
            missions.bigwin.progress = 1;
            updated = true;
        }
        
        if (updated) {
            fbSet(`missions/${currentUserId}/${today}`, missions);
        }
    });
    
    // Also track wagering
    addWagering(bet);
}

async function showMissions() {
    const missions = await getMissions();
    const content = document.getElementById('content');
    
    let html = `<div class="section-title"><span>🎯</span> Daily Missions</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:12px;">Resets daily at midnight UTC</div>`;
    
    for (const [key, m] of Object.entries(missions)) {
        const pct = Math.min(100, (m.progress / m.target) * 100);
        const done = m.progress >= m.target;
        html += `
            <div class="history-item" style="flex-direction:column;align-items:stretch;padding:12px;${done && !m.claimed ? 'border:1px solid var(--green);' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-weight:700;font-size:13px;">${m.title}</div>
                        <div style="font-size:11px;color:var(--text3);">${m.desc}</div>
                    </div>
                    <div style="text-align:right;">
                        ${m.claimed ? '<span style="color:var(--green);font-size:12px;">✅ Claimed</span>' : 
                          done ? `<button class="reward-btn" onclick="claimMission('${key}')">+$${m.reward.toFixed(2)}</button>` :
                          `<span style="color:var(--gold);font-size:12px;">$${m.reward.toFixed(2)}</span>`}
                    </div>
                </div>
                <div style="margin-top:6px;">
                    <div style="height:4px;background:var(--bg4);border-radius:2px;overflow:hidden;">
                        <div style="height:100%;width:${pct}%;background:${done?'var(--green)':'var(--accent)'};border-radius:2px;transition:width 0.3s;"></div>
                    </div>
                    <div style="font-size:10px;color:var(--text3);margin-top:2px;">${typeof m.progress === 'number' ? m.progress.toFixed(m.target >= 10 ? 0 : 1) : 0}/${m.target}</div>
                </div>
            </div>`;
    }
    
    html += `<button class="play-button mt-20" onclick="switchTab('rewards')" style="background:var(--bg3)">⬅️ Back</button>`;
    content.innerHTML = html;
}

async function claimMission(key) {
    const today = getTodayKey();
    const missions = await getMissions();
    const m = missions[key];
    if (!m || m.claimed || m.progress < m.target) return;
    
    m.claimed = true;
    await fbSet(`missions/${currentUserId}/${today}`, missions);
    
    user.balance += m.reward;
    await saveUser();
    updateBal();
    
    alert(`🎯 Mission Complete!\n+$${m.reward.toFixed(2)} USDT`);
    showMissions(); // Refresh
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: TOURNAMENT SYSTEM
// ═══════════════════════════════════════════════════════════════
async function showTournament() {
    // Get current week's tournament data
    const weekKey = getWeekKey();
    const tournamentData = await fbGet(`tournaments/${weekKey}`) || {};
    const allUsers = await fbGet('users') || {};
    
    // Build leaderboard from this week's profits
    let players = Object.entries(allUsers)
        .filter(([id, data]) => id != ADMIN_ID && (data.totalGames || 0) > 0)
        .map(([id, data]) => ({
            name: data.name || 'Player',
            profit: data.totalProfit || 0,
            games: data.totalGames || 0,
            isYou: id == currentUserId
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 20);
    
    // Add fake tournament players for social proof
    const fakeT = generateFakeTournamentPlayers();
    players = [...players, ...fakeT].sort((a, b) => b.profit - a.profit).slice(0, 20);
    
    const prizes = [50, 25, 10, 5, 5]; // Top 5 prizes
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="section-title"><span>🏆</span> Weekly Tournament</div>
        <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center;border:1px solid rgba(139,92,246,0.3);">
            <div style="font-size:11px;color:var(--text3);">PRIZE POOL</div>
            <div style="font-size:28px;font-weight:800;color:var(--accent);margin-top:4px;">$95 USDT</div>
            <div style="font-size:10px;color:var(--text3);margin-top:4px;">🥇$50 • 🥈$25 • 🥉$10 • 4th $5 • 5th $5</div>
            <div style="font-size:10px;color:var(--text3);margin-top:4px;">Ends: Sunday 23:59 UTC</div>
        </div>
        ${players.map((p, i) => `
            <div class="history-item" style="${i<3?'border:1px solid var(--gold);background:rgba(245,158,11,0.05);':''}${p.isYou?'border:1px solid var(--accent);':''}">
                <div class="hi-left">
                    <span class="hi-icon">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
                    <div>
                        <div class="hi-game">${p.name} ${p.isYou?'<span style="color:var(--accent);font-size:10px;">⭐YOU</span>':''}</div>
                        <div class="hi-time">${p.games} games</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div class="hi-amount win">+$${p.profit.toFixed(0)}</div>
                    ${i < 5 ? `<div style="font-size:10px;color:var(--gold);">Prize: $${prizes[i]}</div>` : ''}
                </div>
            </div>
        `).join('')}
        <button class="play-button mt-20" onclick="switchTab('rewards')" style="background:var(--bg3)">⬅️ Back</button>
    `;
}

function getWeekKey() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
    return `${now.getFullYear()}_W${week}`;
}

function generateFakeTournamentPlayers() {
    const names = FAKE_PLAYERS.slice(0, 15);
    return names.map(name => ({
        name,
        profit: Math.floor(50 + Math.random() * 500),
        games: Math.floor(20 + Math.random() * 200),
        isYou: false
    }));
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: FREE SPIN WHEEL (Daily)
// ═══════════════════════════════════════════════════════════════
async function freeSpinWheel() {
    const lastSpin = await fbGet(`freespin/${currentUserId}`);
    if (lastSpin && Date.now() - lastSpin < 86400000) {
        alert('⏰ Günlük ücretsiz çarkınızı zaten kullandınız! Yarın tekrar gelin.');
        return;
    }
    
    // Open game screen with free spin
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-title').textContent = '🎡 Free Spin';
    
    const prizes = [0.10, 0.25, 0.50, 0, 0.75, 0.10, 0, 1.00, 0.25, 0, 0.50, 2.00, 0, 0.10, 5.00, 0];
    const labels = prizes.map(p => p > 0 ? `$${p.toFixed(2)}` : '💀');
    
    document.getElementById('game-body').innerHTML = `
        <div style="text-align:center;padding:20px 0;">
            <div style="font-size:48px;margin-bottom:12px;" id="fs-icon">🎡</div>
            <div style="font-size:11px;color:var(--text3);">Günde 1 kez ücretsiz çevirin!</div>
            <div id="fs-result" style="font-size:28px;font-weight:800;color:var(--gold);min-height:40px;margin-top:12px;"></div>
        </div>
        <button class="play-button" id="fs-btn" onclick="doFreeSpin()">🎡 ÜCRETSİZ ÇEVİR</button>
        <div style="margin-top:12px;font-size:11px;color:var(--text3);text-align:center;">
            Ödüller: $0.10 • $0.25 • $0.50 • $0.75 • $1.00 • $2.00 • $5.00
        </div>`;
}

async function doFreeSpin() {
    document.getElementById('fs-btn').disabled = true;
    const icon = document.getElementById('fs-icon');
    const prizes = [0.10, 0.25, 0.50, 0, 0.75, 0.10, 0, 1.00, 0.25, 0, 0.50, 2.00, 0, 0.10, 5.00, 0];
    
    // Weighted random (lower prizes more likely)
    const weights = [15, 12, 8, 20, 5, 15, 20, 3, 12, 20, 8, 1, 20, 15, 0.5, 20];
    const totalW = weights.reduce((a, b) => a + b);
    let r = Math.random() * totalW, idx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
    
    const prize = prizes[idx];
    
    // Spin animation
    let count = 0;
    const emojis = ['🎡', '💫', '⭐', '🌟', '✨', '🎯'];
    const anim = setInterval(() => {
        icon.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        icon.style.transform = `rotate(${count * 30}deg)`;
        if (++count > 20) {
            clearInterval(anim);
            icon.style.transform = 'rotate(0)';
            
            if (prize > 0) {
                icon.textContent = '🎉';
                document.getElementById('fs-result').innerHTML = `<span style="color:var(--green)">+$${prize.toFixed(2)} USDT!</span>`;
                user.balance += prize;
                saveUser();
                updateBal();
                showConfetti();
                playSound('win');
            } else {
                icon.textContent = '💀';
                document.getElementById('fs-result').innerHTML = `<span style="color:var(--red)">Boş geldi! Yarın tekrar dene.</span>`;
                playSound('lose');
            }
            
            // Save spin time
            fbSet(`freespin/${currentUserId}`, Date.now());
            
            setTimeout(() => {
                document.getElementById('fs-btn').disabled = false;
                document.getElementById('fs-btn').textContent = '✅ Tamamlandı';
                document.getElementById('fs-btn').onclick = () => closeGame();
            }, 1000);
        }
    }, 80);
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: RAIN/AIRDROP SYSTEM (Admin triggers via Firebase)
// ═══════════════════════════════════════════════════════════════
async function checkRainNotification() {
    const rain = await fbGet(`rain_notifications/${currentUserId}`);
    if (rain && !rain.seen) {
        user.balance += rain.amount;
        await saveUser();
        updateBal();
        await fbUpdate(`rain_notifications/${currentUserId}`, { seen: true });
        setTimeout(() => {
            alert(`🌧️ RAIN BONUS!\n\nAdmin airdrop yaptı!\n+$${rain.amount.toFixed(2)} USDT`);
            showConfetti();
        }, 1000);
    }
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: WITHDRAW LIMIT & WAGERING CHECK
// ═══════════════════════════════════════════════════════════════
const MIN_WITHDRAW = 20; // Minimum $20 to withdraw

async function canWithdraw() {
    const wagering = await getWageringStatus();
    if (wagering && !wagering.canWithdraw) {
        return { allowed: false, reason: `Wagering requirement: $${wagering.done.toFixed(0)}/$${wagering.required.toFixed(0)} tamamlandı. Çekim için ${wagering.remaining.toFixed(0)} daha bahis yapmalısınız.` };
    }
    if (user.balance < MIN_WITHDRAW) {
        return { allowed: false, reason: `Minimum çekim: $${MIN_WITHDRAW}. Bakiyeniz: $${user.balance.toFixed(2)}` };
    }
    return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: SOUND TOGGLE
// ═══════════════════════════════════════════════════════════════
let soundEnabled = localStorage.getItem('lc_sound') !== 'off';

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('lc_sound', soundEnabled ? 'on' : 'off');
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
}

// Override playSound to respect toggle
const _origPlaySound = typeof playSound !== 'undefined' ? playSound : null;
if (_origPlaySound) {
    // Will be handled by checking soundEnabled in the main playSound
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: ENHANCED ADMIN PANEL - (Moved to app.js renderAdminPanel)
// Admin extended features are now integrated into the main admin panel
// ═══════════════════════════════════════════════════════════════

// Admin stats, broadcast, ban, rain, RTP, tournament functions are now in app.js

// ═══════════════════════════════════════════════════════════════
// FEATURE: DYNAMIC RTP (Load from Firebase)
// ═══════════════════════════════════════════════════════════════
async function loadDynamicRTP() {
    const customRTP = await fbGet('settings/rtp');
    if (customRTP && customRTP > 0.8 && customRTP < 1) {
        window.DYNAMIC_RTP = customRTP;
        if (typeof applyDynamicRTP === 'function') {
            applyDynamicRTP(customRTP);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: NOTIFICATIONS CHECK ON LOAD
// ═══════════════════════════════════════════════════════════════
async function checkAllNotifications() {
    // Check rain
    await checkRainNotification();
    
    // Check tournament prize
    const tourNotif = await fbGet(`tournament_notifications/${currentUserId}`);
    if (tourNotif && !tourNotif.seen) {
        user.balance += tourNotif.amount;
        await saveUser();
        updateBal();
        await fbUpdate(`tournament_notifications/${currentUserId}`, { seen: true });
        setTimeout(() => {
            alert(`🏆 TURNUVA ÖDÜLÜNÜz!\n\n+$${tourNotif.amount.toFixed(2)} USDT kazandınız!`);
            showConfetti();
        }, 1500);
    }
    
    // Check jackpot notification
    const jpNotif = await fbGet(`jackpot_notifications/${currentUserId}`);
    if (jpNotif && !jpNotif.notified) {
        await fbUpdate(`jackpot_notifications/${currentUserId}`, { notified: true });
        setTimeout(() => {
            alert(`🎰🎰🎰 JACKPOT KAZANDINIZ!\n\n+$${jpNotif.amount.toFixed(2)} USDT!\n\nTebrikler!`);
            showConfetti(); showConfetti();
            playSound('jackpot');
        }, 2000);
    }
}

// ═══════════════════════════════════════════════════════════════
// OVERRIDE: WALLET TAB (add wagering info + min withdraw)
// ═══════════════════════════════════════════════════════════════
const _origWallet = typeof renderWallet !== 'undefined' ? renderWallet : null;

function renderWalletEnhanced() {
    return `
        <div class="wallet-hero">
            <div class="wallet-label">Total Balance</div>
            <div class="wallet-amount">${user.balance.toFixed(2)} <span class="currency">USDT</span></div>
            <div class="wallet-actions">
                <button class="wallet-btn dep" onclick="goToBot('deposit')">Deposit</button>
                <button class="wallet-btn wit" onclick="checkWithdrawEligibility()">Withdraw</button>
            </div>
        </div>
        <div id="wagering-info" style="padding:12px;"></div>
        <div style="text-align:center;padding:12px;color:var(--text3);font-size:12px;">
            <p>💰 Min çekim: $${MIN_WITHDRAW} • Deposits & withdrawals via bot</p>
            <p style="margin-top:4px;">🎁 İlk yatırıma %100 bonus!</p>
        </div>
        <div style="padding:0 16px;">
            <div style="background:var(--bg2);border-radius:10px;padding:12px;margin-bottom:8px;">
                <div style="font-size:13px;font-weight:700;margin-bottom:8px;">🎁 Deposit Bonusları</div>
                <div style="font-size:11px;color:var(--text3);">
                    1. Yatırım: <b style="color:var(--green)">%100 Bonus</b> (max $100)<br>
                    2. Yatırım: <b style="color:var(--gold)">%50 Bonus</b> (max $50)<br>
                    3. Yatırım: <b style="color:var(--accent)">%25 Bonus</b> (max $25)<br>
                    <span style="font-size:10px;">* Bonus 5x wagering gerektirir</span>
                </div>
            </div>
        </div>
        <button class="play-button mt-20" onclick="goToBot('deposit')" style="background:linear-gradient(135deg,var(--green),#059669);margin:0 16px;">💰 Bot'a Git - Yatır</button>
    `;
}

async function checkWithdrawEligibility() {
    const result = await canWithdraw();
    if (!result.allowed) {
        alert(`❌ Çekim yapılamıyor!\n\n${result.reason}`);
        return;
    }
    goToBot('withdraw');
}

async function loadWageringInfo() {
    const container = document.getElementById('wagering-info');
    if (!container) return;
    
    const wagering = await getWageringStatus();
    if (wagering && wagering.remaining > 0) {
        const pct = Math.min(100, (wagering.done / wagering.required) * 100);
        container.innerHTML = `
            <div style="background:var(--bg2);border-radius:10px;padding:12px;border:1px solid rgba(245,158,11,0.3);">
                <div style="font-size:12px;font-weight:700;color:var(--gold);margin-bottom:6px;">⚠️ Wagering Requirement</div>
                <div style="font-size:11px;color:var(--text3);margin-bottom:6px;">Bonus çekmek için $${wagering.required.toFixed(0)} bahis yapmalısınız</div>
                <div style="height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gold),var(--green));border-radius:3px;"></div>
                </div>
                <div style="font-size:10px;color:var(--text3);margin-top:4px;">$${wagering.done.toFixed(0)} / $${wagering.required.toFixed(0)} (${pct.toFixed(0)}%)</div>
            </div>`;
    } else {
        container.innerHTML = '';
    }
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: FAKE LIVE CHAT (Social Proof in Crash game)
// ═══════════════════════════════════════════════════════════════
const FAKE_CHAT_MESSAGES = [
    "LFG 🚀🚀🚀", "cashed out at 3x 💰", "HODL!", "easy money 😎", 
    "lets gooo", "rekt 💀", "nice one!", "to the moon 🌙",
    "gg", "again!", "wow big win", "unlucky 😢", "next one for sure",
    "5x incoming", "paper hands 📄", "diamond hands 💎", "all in!",
    "scared money dont make money", "yolo", "ez clap", "oof",
    "massive W", "L", "risky but worth it", "shouldve cashed out"
];

function generateFakeChat(count = 5) {
    const msgs = [];
    for (let i = 0; i < count; i++) {
        const name = FAKE_PLAYERS[Math.floor(Math.random() * FAKE_PLAYERS.length)];
        const msg = FAKE_CHAT_MESSAGES[Math.floor(Math.random() * FAKE_CHAT_MESSAGES.length)];
        msgs.push({ name, msg, time: `${Math.floor(Math.random() * 60)}s ago` });
    }
    return msgs;
}

function renderLiveChat() {
    const msgs = generateFakeChat(8);
    return `
        <div style="background:var(--bg2);border-radius:10px;padding:8px;margin-top:12px;max-height:150px;overflow-y:auto;">
            <div style="font-size:10px;color:var(--text3);margin-bottom:4px;">💬 Live Chat</div>
            ${msgs.map(m => `
                <div style="font-size:11px;padding:2px 0;border-bottom:1px solid var(--bg4);">
                    <span style="color:var(--accent);font-weight:600;">${m.name}:</span>
                    <span style="color:var(--text2);">${m.msg}</span>
                    <span style="color:var(--text3);font-size:9px;float:right;">${m.time}</span>
                </div>
            `).join('')}
        </div>`;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE: THEME TOGGLE
// ═══════════════════════════════════════════════════════════════
let currentTheme = localStorage.getItem('lc_theme') || 'dark';

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'neon' : currentTheme === 'neon' ? 'gold' : 'dark';
    localStorage.setItem('lc_theme', currentTheme);
    applyTheme();
}

function applyTheme() {
    const root = document.documentElement;
    switch(currentTheme) {
        case 'neon':
            root.style.setProperty('--accent', '#00ff88');
            root.style.setProperty('--gold', '#00ffcc');
            root.style.setProperty('--bg1', '#0a0a1a');
            root.style.setProperty('--bg2', '#111128');
            break;
        case 'gold':
            root.style.setProperty('--accent', '#f59e0b');
            root.style.setProperty('--gold', '#fbbf24');
            root.style.setProperty('--bg1', '#1a1000');
            root.style.setProperty('--bg2', '#2a1a00');
            break;
        default: // dark (reset to defaults)
            root.style.setProperty('--accent', '#8b5cf6');
            root.style.setProperty('--gold', '#f59e0b');
            root.style.setProperty('--bg1', '#0f0f1a');
            root.style.setProperty('--bg2', '#1a1a2e');
            break;
    }
}

// Apply theme on load
applyTheme();

// ═══════════════════════════════════════════════════════════════
// INTEGRATION: Override switchTab to include new features
// ═══════════════════════════════════════════════════════════════
const _origSwitchTab = switchTab;
switchTab = function(tab) {
    _origSwitchTab(tab);
    
    // Post-render hooks
    if (tab === 'wallet') {
        setTimeout(() => loadWageringInfo(), 100);
    }
    if (tab === 'home') {
        setTimeout(() => checkAllNotifications(), 500);
    }
};

// Override renderWallet
const __walletOrig = renderWallet;
renderWallet = renderWalletEnhanced;

// Override renderProfile to add extended user profile (admin panel stays in app.js)
const _origRenderProfile = renderProfile;
renderProfile = function() {
    if (isAdmin) {
        setTimeout(() => {
            loadAdminQuickStats();
            loadJackpotAdmin();
        }, 100);
        return renderAdminPanel();
    }
    const wr = user.totalGames > 0 ? ((user.totalWins/user.totalGames)*100).toFixed(1) : '0.0';
    const wagered = user.totalWagered || user.totalGames * 5;
    const vip = getVIPLevel(wagered);
    return `
        <div class="profile-header">
            <div class="profile-avatar">🎮</div>
            <div class="profile-name">${user.name}</div>
            <div class="profile-id">ID: ${currentUserId}</div>
            <div style="margin-top:4px;font-size:12px;color:${vip.color};">${vip.name}</div>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="sv">${user.totalGames}</div><div class="sl">Games</div></div>
            <div class="stat-card"><div class="sv">${wr}%</div><div class="sl">Win Rate</div></div>
            <div class="stat-card"><div class="sv">${user.totalProfit.toFixed(1)}</div><div class="sl">Profit</div></div>
            <div class="stat-card"><div class="sv">${(user.totalWagered || 0).toFixed(0)}</div><div class="sl">Wagered</div></div>
        </div>
        <div style="padding:12px;">
            <div style="display:flex;gap:8px;">
                <button class="play-button" onclick="toggleSound()" style="flex:1;background:var(--bg3);" id="sound-toggle">${soundEnabled ? '🔊 Ses Açık' : '🔇 Ses Kapalı'}</button>
                <button class="play-button" onclick="toggleTheme()" style="flex:1;background:var(--bg3);">🎨 Tema</button>
            </div>
        </div>
        <div style="padding:0 12px;">
            <div class="section-title"><span>📜</span> Son Oyunlar</div>
            ${!user.history?.length ? '<p class="text-sm text-muted">Henüz oyun yok.</p>' :
              user.history.slice(0,10).map(h => `
                <div class="history-item">
                    <div class="hi-left"><span class="hi-icon">${h.won?'✅':'❌'}</span><div><div class="hi-game">${h.game}</div><div class="hi-time">${h.time}</div></div></div>
                    <div class="hi-amount ${h.won?'win':'loss'}">${h.won?'+':''}${h.profit.toFixed(2)}</div>
                </div>`).join('')}
        </div>`;
};

// ═══════════════════════════════════════════════════════════════
// INTEGRATION: Override playSound to respect toggle
// ═══════════════════════════════════════════════════════════════
const __origPlaySound2 = playSound;
playSound = function(type) {
    if (!soundEnabled) return;
    __origPlaySound2(type);
};

// ═══════════════════════════════════════════════════════════════
// INTEGRATION: Load dynamic RTP on startup
// ═══════════════════════════════════════════════════════════════
loadDynamicRTP();

// ═══════════════════════════════════════════════════════════════
// INTEGRATION: Check notifications on load
// ═══════════════════════════════════════════════════════════════
setTimeout(() => checkAllNotifications(), 3500);
