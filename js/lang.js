// === Language Support (simplified for Mini App) ===
let currentLang = localStorage.getItem('lc_lang') || 'en';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lc_lang', lang);
    // Reload to apply
    closeGame();
    switchTab('home');
}
