// ═══════════════════════════════════════════════════════════════
// LIBERTY CASINO - FULL MULTI-LANGUAGE SYSTEM
// Supports: EN, TR, RU, AR, ES, CN
// ═══════════════════════════════════════════════════════════════

let currentLang = localStorage.getItem('lc_lang') || 'en';

const LANGS = {
    en: { flag: '🇬🇧', name: 'English' },
    tr: { flag: '🇹🇷', name: 'Türkçe' },
    ru: { flag: '🇷🇺', name: 'Русский' },
    ar: { flag: '🇸🇦', name: 'العربية' },
    es: { flag: '🇪🇸', name: 'Español' },
    cn: { flag: '🇨🇳', name: '中文' }
};

const T = {
    // === NAVIGATION ===
    home: { en:'Home', tr:'Ana Sayfa', ru:'Главная', ar:'الرئيسية', es:'Inicio', cn:'首页' },
    games: { en:'Games', tr:'Oyunlar', ru:'Игры', ar:'ألعاب', es:'Juegos', cn:'游戏' },
    wallet: { en:'Wallet', tr:'Cüzdan', ru:'Кошелёк', ar:'المحفظة', es:'Billetera', cn:'钱包' },
    rewards: { en:'Rewards', tr:'Ödüller', ru:'Награды', ar:'المكافآت', es:'Premios', cn:'奖励' },
    profile: { en:'Profile', tr:'Profil', ru:'Профиль', ar:'الملف', es:'Perfil', cn:'个人' },

    // === HOME ===
    welcome: { en:'Welcome to Liberty Casino', tr:'Liberty Casino\'ya Hoşgeldiniz', ru:'Добро пожаловать в Liberty Casino', ar:'مرحباً في Liberty Casino', es:'Bienvenido a Liberty Casino', cn:'欢迎来到Liberty Casino' },
    playWinWithdraw: { en:'Play, Win, Withdraw. Provably Fair.', tr:'Oyna, Kazan, Çek. Kanıtlanabilir Adil.', ru:'Играй, Выигрывай, Выводи. Доказуемо честно.', ar:'العب، اربح، اسحب. عادل بشكل مثبت.', es:'Juega, Gana, Retira. Demostrablemente justo.', cn:'玩、赢、提现。可证明公平。' },
    playNow: { en:'Play Now →', tr:'Hemen Oyna →', ru:'Играть →', ar:'العب الآن ←', es:'Jugar Ahora →', cn:'立即游戏 →' },
    popularGames: { en:'Popular Games', tr:'Popüler Oyunlar', ru:'Популярные', ar:'ألعاب شائعة', es:'Juegos Populares', cn:'热门游戏' },
    recent: { en:'Recent', tr:'Son Oyunlar', ru:'Недавние', ar:'الأخيرة', es:'Recientes', cn:'最近' },
    noGamesYet: { en:'No games yet.', tr:'Henüz oyun yok.', ru:'Пока нет игр.', ar:'لا توجد ألعاب بعد.', es:'Sin juegos aún.', cn:'暂无游戏。' },
    adminPanel: { en:'Admin Panel', tr:'Admin Paneli', ru:'Админ панель', ar:'لوحة الإدارة', es:'Panel Admin', cn:'管理面板' },

    // === GAMES ===
    allGames: { en:'All Games', tr:'Tüm Oyunlar', ru:'Все игры', ar:'جميع الألعاب', es:'Todos los Juegos', cn:'所有游戏' },
    betAmount: { en:'BET AMOUNT', tr:'BAHİS MİKTARI', ru:'СУММА СТАВКИ', ar:'مبلغ الرهان', es:'MONTO APUESTA', cn:'下注金额' },
    minMax: { en:'Min $1 • Max $500', tr:'Min $1 • Maks $500', ru:'Мин $1 • Макс $500', ar:'الحد الأدنى $1 • الحد الأقصى $500', es:'Mín $1 • Máx $500', cn:'最低$1 • 最高$500' },
    insufficientBal: { en:'Insufficient balance!', tr:'Yetersiz bakiye!', ru:'Недостаточно средств!', ar:'رصيد غير كافٍ!', es:'¡Saldo insuficiente!', cn:'余额不足！' },
    noBalance: { en:'No balance! Please deposit.', tr:'Bakiye yok! Lütfen yatırın.', ru:'Нет баланса! Пополните.', ar:'لا يوجد رصيد! يرجى الإيداع.', es:'¡Sin saldo! Deposite.', cn:'没有余额！请充值。' },

    // === WALLET ===
    totalBalance: { en:'Total Balance', tr:'Toplam Bakiye', ru:'Общий баланс', ar:'الرصيد الإجمالي', es:'Saldo Total', cn:'总余额' },
    deposit: { en:'Deposit', tr:'Yatır', ru:'Пополнить', ar:'إيداع', es:'Depositar', cn:'充值' },
    withdraw: { en:'Withdraw', tr:'Çek', ru:'Вывести', ar:'سحب', es:'Retirar', cn:'提现' },
    depositInfo: { en:'Deposits & withdrawals are handled via the bot.', tr:'Yatırma ve çekme işlemleri bot üzerinden yapılır.', ru:'Депозиты и выводы через бота.', ar:'الإيداعات والسحوبات عبر البوت.', es:'Depósitos y retiros se manejan via bot.', cn:'充值和提现通过机器人处理。' },
    goToDeposit: { en:'Go to Bot to Deposit', tr:'Yatırmak için Bot\'a Git', ru:'Перейти к боту', ar:'اذهب للبوت للإيداع', es:'Ir al Bot para Depositar', cn:'去机器人充值' },
    minWithdraw: { en:'Min withdrawal: $20', tr:'Min çekim: $20', ru:'Мин. вывод: $20', ar:'الحد الأدنى للسحب: $20', es:'Retiro mínimo: $20', cn:'最低提现：$20' },
    firstDepBonus: { en:'100% bonus on first deposit!', tr:'İlk yatırıma %100 bonus!', ru:'100% бонус на первый депозит!', ar:'مكافأة 100% على أول إيداع!', es:'¡100% bono en primer depósito!', cn:'首充100%奖金！' },
    depositBonuses: { en:'Deposit Bonuses', tr:'Yatırım Bonusları', ru:'Бонусы на депозит', ar:'مكافآت الإيداع', es:'Bonos de Depósito', cn:'充值奖金' },

    // === REWARDS ===
    rewardsMore: { en:'Rewards & More', tr:'Ödüller & Daha Fazlası', ru:'Награды и другое', ar:'المكافآت والمزيد', es:'Premios y Más', cn:'奖励与更多' },
    dailyBonus: { en:'Daily Bonus', tr:'Günlük Bonus', ru:'Ежедневный бонус', ar:'مكافأة يومية', es:'Bono Diario', cn:'每日奖金' },
    dailyBonusDesc: { en:'0.50 USDT every 24h', tr:'Her 24 saatte 0.50 USDT', ru:'0.50 USDT каждые 24ч', ar:'0.50 USDT كل 24 ساعة', es:'0.50 USDT cada 24h', cn:'每24小时0.50 USDT' },
    claim: { en:'Claim', tr:'Al', ru:'Забрать', ar:'استلام', es:'Reclamar', cn:'领取' },
    loginStreak: { en:'Login Streak', tr:'Giriş Serisi', ru:'Серия входов', ar:'سلسلة الدخول', es:'Racha de Login', cn:'登录连续' },
    loginStreakDesc: { en:'Daily login rewards', tr:'Günlük giriş ödülleri', ru:'Ежедневные награды', ar:'مكافآت الدخول اليومي', es:'Recompensas diarias', cn:'每日登录奖励' },
    dailyMissions: { en:'Daily Missions', tr:'Günlük Görevler', ru:'Ежедневные задания', ar:'المهام اليومية', es:'Misiones Diarias', cn:'每日任务' },
    dailyMissionsDesc: { en:'Complete tasks for rewards', tr:'Görevleri tamamla, ödül kazan', ru:'Выполняйте задания', ar:'أكمل المهام للمكافآت', es:'Completa tareas', cn:'完成任务获奖励' },
    tournament: { en:'Tournament', tr:'Turnuva', ru:'Турнир', ar:'البطولة', es:'Torneo', cn:'锦标赛' },
    tournamentDesc: { en:'Weekly prize pool', tr:'Haftalık ödül havuzu', ru:'Еженедельный приз', ar:'جائزة أسبوعية', es:'Premio semanal', cn:'每周奖池' },
    freeSpin: { en:'Free Spin', tr:'Ücretsiz Çevir', ru:'Бесплатный спин', ar:'دورة مجانية', es:'Giro Gratis', cn:'免费旋转' },
    freeSpinDesc: { en:'1 free spin daily', tr:'Günde 1 ücretsiz çevirme', ru:'1 бесплатный спин в день', ar:'دورة مجانية يومياً', es:'1 giro gratis diario', cn:'每日1次免费旋转' },
    referFriend: { en:'Refer a Friend', tr:'Arkadaş Davet Et', ru:'Пригласи друга', ar:'ادعُ صديقاً', es:'Invita un Amigo', cn:'邀请好友' },
    referDesc: { en:'10% of their deposits', tr:'Yatırımlarının %10\'u', ru:'10% от их депозитов', ar:'10% من إيداعاتهم', es:'10% de sus depósitos', cn:'他们充值的10%' },
    leaderboard: { en:'Leaderboard', tr:'Sıralama', ru:'Рейтинг', ar:'لوحة المتصدرين', es:'Clasificación', cn:'排行榜' },
    leaderboardDesc: { en:'Top players ranking', tr:'En iyi oyuncu sıralaması', ru:'Рейтинг лучших', ar:'ترتيب أفضل اللاعبين', es:'Ranking de jugadores', cn:'顶级玩家排名' },
    provablyFair: { en:'Provably Fair', tr:'Kanıtlanabilir Adil', ru:'Доказуемо честно', ar:'عادل بشكل مثبت', es:'Demostrablemente Justo', cn:'可证明公平' },
    provablyFairDesc: { en:'Verify game fairness', tr:'Oyun adaletini doğrula', ru:'Проверь честность', ar:'تحقق من عدالة اللعبة', es:'Verifica la equidad', cn:'验证游戏公平性' },
    view: { en:'View', tr:'Göster', ru:'Смотреть', ar:'عرض', es:'Ver', cn:'查看' },
    spin: { en:'Spin', tr:'Çevir', ru:'Крутить', ar:'دوران', es:'Girar', cn:'旋转' },
    share: { en:'Share', tr:'Paylaş', ru:'Поделиться', ar:'مشاركة', es:'Compartir', cn:'分享' },
    verify: { en:'Verify', tr:'Doğrula', ru:'Проверить', ar:'تحقق', es:'Verificar', cn:'验证' },

    // === PROFILE ===
    gamesPlayed: { en:'Games', tr:'Oyunlar', ru:'Игры', ar:'ألعاب', es:'Juegos', cn:'游戏' },
    winRate: { en:'Win Rate', tr:'Kazanma', ru:'Винрейт', ar:'نسبة الفوز', es:'% Victoria', cn:'胜率' },
    profit: { en:'Profit', tr:'Kâr', ru:'Прибыль', ar:'الربح', es:'Ganancia', cn:'利润' },
    wagered: { en:'Wagered', tr:'Bahis', ru:'Поставлено', ar:'المراهنات', es:'Apostado', cn:'已下注' },
    soundOn: { en:'🔊 Sound On', tr:'🔊 Ses Açık', ru:'🔊 Звук Вкл', ar:'🔊 الصوت مفعل', es:'🔊 Sonido On', cn:'🔊 声音开' },
    soundOff: { en:'🔇 Sound Off', tr:'🔇 Ses Kapalı', ru:'🔇 Звук Выкл', ar:'🔇 الصوت مغلق', es:'🔇 Sonido Off', cn:'🔇 声音关' },
    theme: { en:'🎨 Theme', tr:'🎨 Tema', ru:'🎨 Тема', ar:'🎨 السمة', es:'🎨 Tema', cn:'🎨 主题' },
    recentGames: { en:'Recent Games', tr:'Son Oyunlar', ru:'Недавние игры', ar:'الألعاب الأخيرة', es:'Juegos Recientes', cn:'最近游戏' },

    // === GAME COMMON ===
    youWin: { en:'🎉 YOU WIN!', tr:'🎉 KAZANDINIZ!', ru:'🎉 ПОБЕДА!', ar:'🎉 فزت!', es:'🎉 ¡GANASTE!', cn:'🎉 你赢了！' },
    betterLuck: { en:'Better luck next time', tr:'Bir dahaki sefere', ru:'Повезёт в следующий раз', ar:'حظاً أفضل في المرة القادمة', es:'Mejor suerte la próxima', cn:'下次好运' },
    cashOut: { en:'CASH OUT', tr:'ÇEK', ru:'ЗАБРАТЬ', ar:'سحب', es:'COBRAR', cn:'兑现' },

    // === JACKPOT ===
    jackpotPool: { en:'JACKPOT POOL', tr:'JACKPOT HAVUZU', ru:'ДЖЕКПОТ', ar:'مجموع الجائزة', es:'POZO JACKPOT', cn:'奖池' },
    jackpotInfo: { en:'1% of every bet • Random winner', tr:'Her bahisten %1 • Rastgele kazanan', ru:'1% от каждой ставки • Случайный победитель', ar:'1% من كل رهان • فائز عشوائي', es:'1% de cada apuesta • Ganador aleatorio', cn:'每注1% • 随机赢家' },

    // === MISC ===
    back: { en:'⬅️ Back', tr:'⬅️ Geri', ru:'⬅️ Назад', ar:'⬅️ رجوع', es:'⬅️ Volver', cn:'⬅️ 返回' },
    alreadyClaimed: { en:'Already claimed! Come back tomorrow.', tr:'Zaten aldınız! Yarın tekrar gelin.', ru:'Уже получено! Приходите завтра.', ar:'تم الاستلام! عد غداً.', es:'¡Ya reclamado! Vuelve mañana.', cn:'已领取！明天再来。' },
    claimed: { en:'🎉 +0.50 USDT claimed!', tr:'🎉 +0.50 USDT alındı!', ru:'🎉 +0.50 USDT получено!', ar:'🎉 +0.50 USDT تم الاستلام!', es:'🎉 +0.50 USDT reclamado!', cn:'🎉 +0.50 USDT已领取！' },
    accountBanned: { en:'Account banned!', tr:'Hesap banlandı!', ru:'Аккаунт заблокирован!', ar:'الحساب محظور!', es:'¡Cuenta baneada!', cn:'账号已封禁！' },
    language: { en:'Language', tr:'Dil', ru:'Язык', ar:'اللغة', es:'Idioma', cn:'语言' },
};

// Get translated text
function t(key) {
    if (T[key] && T[key][currentLang]) return T[key][currentLang];
    if (T[key] && T[key]['en']) return T[key]['en'];
    return key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lc_lang', lang);
    closeGame();
    // Re-render current tab
    applyLanguageToNav();
    switchTab('home');
}

function applyLanguageToNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const labels = ['home','games','wallet','rewards','profile'];
    navItems.forEach((item, i) => {
        const label = item.querySelector('.nav-label');
        if (label && labels[i]) label.textContent = t(labels[i]);
    });
}

// Apply on load
window.addEventListener('load', () => {
    setTimeout(() => applyLanguageToNav(), 3000);
});
