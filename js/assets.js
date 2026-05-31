// ═══════════════════════════════════════════════════════════════
// LIBERTY CASINO - SVG GAME ASSETS
// Professional vector icons replacing emojis
// ═══════════════════════════════════════════════════════════════

const SVG_ASSETS = {
    // === SLOT SYMBOLS (gradient-filled professional icons) ===
    cherry: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ch1" cx="40%" cy="35%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#c0392b"/></radialGradient></defs><path d="M32 8c-4 0-8 4-10 10" stroke="#2d5016" stroke-width="3" fill="none"/><path d="M32 8c4 0 10 6 12 12" stroke="#2d5016" stroke-width="3" fill="none"/><circle cx="22" cy="42" r="14" fill="url(#ch1)"/><circle cx="42" cy="40" r="14" fill="url(#ch1)"/><ellipse cx="18" cy="36" rx="4" ry="6" fill="rgba(255,255,255,0.3)"/><ellipse cx="38" cy="34" rx="4" ry="6" fill="rgba(255,255,255,0.3)"/><path d="M28 10c-2-4 0-8 4-8s6 4 4 8" fill="#27ae60"/></svg>`,
    
    lemon: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="lm1" cx="35%" cy="35%"><stop offset="0%" stop-color="#fff176"/><stop offset="100%" stop-color="#f9a825"/></radialGradient></defs><ellipse cx="32" cy="34" rx="22" ry="20" fill="url(#lm1)"/><ellipse cx="26" cy="28" rx="6" ry="8" fill="rgba(255,255,255,0.25)"/><path d="M32 14c2-4 6-6 8-4" stroke="#f9a825" stroke-width="2" fill="none"/></svg>`,
    
    grape: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="gr1" cx="35%" cy="30%"><stop offset="0%" stop-color="#ce93d8"/><stop offset="100%" stop-color="#6a1b9a"/></radialGradient></defs><circle cx="26" cy="30" r="8" fill="url(#gr1)"/><circle cx="38" cy="30" r="8" fill="url(#gr1)"/><circle cx="32" cy="42" r="8" fill="url(#gr1)"/><circle cx="22" cy="42" r="8" fill="url(#gr1)"/><circle cx="42" cy="42" r="8" fill="url(#gr1)"/><circle cx="32" cy="54" r="8" fill="url(#gr1)"/><path d="M32 12v10" stroke="#2d5016" stroke-width="3"/><path d="M28 12c0-4 8-4 8 0" fill="#27ae60"/></svg>`,
    
    seven: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sv1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff5252"/><stop offset="100%" stop-color="#b71c1c"/></linearGradient></defs><path d="M18 12h28l-16 44h-8l14-36H18z" fill="url(#sv1)" stroke="#ffcdd2" stroke-width="2"/><path d="M20 14h24l-2 4H22z" fill="rgba(255,255,255,0.3)"/></svg>`,
    
    diamond: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dm1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4fc3f7"/><stop offset="50%" stop-color="#0288d1"/><stop offset="100%" stop-color="#01579b"/></linearGradient></defs><path d="M32 6L52 24L32 58L12 24Z" fill="url(#dm1)"/><path d="M32 6L42 24H22Z" fill="rgba(255,255,255,0.3)"/><path d="M22 24L32 58L12 24Z" fill="rgba(0,0,0,0.1)"/></svg>`,
    
    star: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd54f"/><stop offset="100%" stop-color="#ff8f00"/></linearGradient></defs><path d="M32 4l8 18h20l-16 12 6 20-18-12-18 12 6-20L4 22h20z" fill="url(#st1)"/><path d="M32 4l4 9-4 3-4-3z" fill="rgba(255,255,255,0.4)"/></svg>`,
    
    bell: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bl1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ffd54f"/><stop offset="100%" stop-color="#f57f17"/></linearGradient></defs><path d="M32 8c-12 0-18 10-18 24 0 4 2 8 6 10h24c4-2 6-6 6-10 0-14-6-24-18-24z" fill="url(#bl1)"/><rect x="28" y="4" width="8" height="8" rx="4" fill="#f57f17"/><ellipse cx="32" cy="52" rx="6" ry="5" fill="#f57f17"/><path d="M20 32c0-8 4-16 12-16" stroke="rgba(255,255,255,0.3)" stroke-width="3" fill="none"/></svg>`,
    
    bar: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="br1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#90a4ae"/><stop offset="100%" stop-color="#37474f"/></linearGradient></defs><rect x="8" y="20" width="48" height="24" rx="4" fill="url(#br1)" stroke="#cfd8dc" stroke-width="2"/><text x="32" y="37" text-anchor="middle" font-size="14" font-weight="900" fill="white" font-family="Arial">BAR</text></svg>`,
    
    wild: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wl1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ab47bc"/><stop offset="50%" stop-color="#7b1fa2"/><stop offset="100%" stop-color="#4a148c"/></linearGradient></defs><rect x="6" y="14" width="52" height="36" rx="8" fill="url(#wl1)" stroke="#ce93d8" stroke-width="2"/><text x="32" y="38" text-anchor="middle" font-size="16" font-weight="900" fill="#ffd54f" font-family="Arial">WILD</text></svg>`,

    // === CARD SUITS ===
    spade: `<svg viewBox="0 0 32 32"><path d="M16 4C12 10 4 14 4 20c0 4 3 7 7 7 2 0 4-1 5-3v4h-4v2h8v-2h-4v-4c1 2 3 3 5 3 4 0 7-3 7-7 0-6-8-10-12-16z" fill="currentColor"/></svg>`,
    heart: `<svg viewBox="0 0 32 32"><path d="M16 28C12 24 4 18 4 12c0-4 3-7 7-7 3 0 5 2 5 2s2-2 5-2c4 0 7 3 7 7 0 6-8 12-12 16z" fill="#ef4444"/></svg>`,
    club: `<svg viewBox="0 0 32 32"><path d="M16 4c-3 0-6 3-6 6 0 2 1 4 3 5-2-1-4 0-5 2-2 3 0 7 4 7 2 0 3-1 4-2v4h-4v2h8v-2h-4v-4c1 1 2 2 4 2 4 0 6-4 4-7-1-2-3-3-5-2 2-1 3-3 3-5 0-3-3-6-6-6z" fill="currentColor"/></svg>`,
    diamondSuit: `<svg viewBox="0 0 32 32"><path d="M16 2L28 16L16 30L4 16Z" fill="#ef4444"/></svg>`,

    // === GAME ICONS ===
    bomb: `<svg viewBox="0 0 64 64"><defs><radialGradient id="bm1" cx="35%" cy="30%"><stop offset="0%" stop-color="#546e7a"/><stop offset="100%" stop-color="#1a1a2e"/></radialGradient></defs><circle cx="30" cy="38" r="20" fill="url(#bm1)"/><rect x="34" y="10" width="4" height="14" rx="2" fill="#795548"/><path d="M36 10c0-4 4-6 8-4" stroke="#ff9800" stroke-width="2" fill="none"/><circle cx="44" cy="6" r="4" fill="#ff5722" opacity="0.8"/><circle cx="44" cy="6" r="2" fill="#ffeb3b"/><ellipse cx="22" cy="30" rx="5" ry="7" fill="rgba(255,255,255,0.15)"/></svg>`,
    
    gem: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gm1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#69f0ae"/><stop offset="50%" stop-color="#00c853"/><stop offset="100%" stop-color="#1b5e20"/></linearGradient></defs><path d="M20 20h24l-4-10H24z" fill="#a5d6a7"/><path d="M20 20l12 30 12-30z" fill="url(#gm1)"/><path d="M20 20l12 30L16 20z" fill="rgba(0,0,0,0.15)"/><path d="M24 10l8 10 8-10" stroke="rgba(255,255,255,0.4)" stroke-width="1" fill="none"/></svg>`,
    
    rocket: `<svg viewBox="0 0 64 64"><defs><linearGradient id="rk1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e0e0e0"/><stop offset="100%" stop-color="#757575"/></linearGradient></defs><path d="M32 4c-6 8-10 20-10 32h20c0-12-4-24-10-32z" fill="url(#rk1)"/><path d="M22 36l-6 12h8z" fill="#f44336"/><path d="M42 36l6 12h-8z" fill="#f44336"/><circle cx="32" cy="24" r="5" fill="#42a5f5"/><circle cx="32" cy="24" r="3" fill="#1565c0"/><path d="M28 48h8l-1 10h-6z" fill="#ff9800"/><path d="M30 48h4l-0.5 8h-3z" fill="#ffeb3b"/></svg>`,
    
    plane: `<svg viewBox="0 0 64 64"><defs><linearGradient id="pl1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#e0e0e0"/><stop offset="100%" stop-color="#9e9e9e"/></linearGradient></defs><path d="M8 32l20-4v-16l4-4 4 4v16l20 4-4 8H32v12l-4 4-4-4V40H12z" fill="url(#pl1)"/><path d="M28 12l4-4 4 4v16h-8z" fill="#42a5f5"/><path d="M12 32l16-3v6z" fill="rgba(0,0,0,0.1)"/></svg>`,

    // === ROULETTE ===
    rouletteRed: '#e53935',
    rouletteBlack: '#212121',
    rouletteGreen: '#43a047',
};

// Convert SVG string to drawable image
const svgImageCache = {};

function getSVGImage(key, size) {
    const cacheKey = `${key}_${size}`;
    if (svgImageCache[cacheKey]) return svgImageCache[cacheKey];
    
    const svg = SVG_ASSETS[key];
    if (!svg) return null;
    
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(blob);
    img.width = size;
    img.height = size;
    svgImageCache[cacheKey] = img;
    return img;
}

// Preload all SVG assets
function preloadAssets() {
    const keys = ['cherry','lemon','grape','seven','diamond','star','bell','bar','wild','bomb','gem','rocket','plane'];
    keys.forEach(k => {
        getSVGImage(k, 48);
        getSVGImage(k, 32);
    });
}

// Call preload on page load
setTimeout(preloadAssets, 1000);

// Slot symbol mapping for premium slots
const PREMIUM_SLOT_SYMBOLS = [
    { key: 'cherry', name: 'Cherry', mult: 2, color: '#ef4444' },
    { key: 'lemon', name: 'Lemon', mult: 3, color: '#fbbf24' },
    { key: 'grape', name: 'Grape', mult: 4, color: '#8b5cf6' },
    { key: 'bell', name: 'Bell', mult: 5, color: '#f59e0b' },
    { key: 'bar', name: 'Bar', mult: 8, color: '#90a4ae' },
    { key: 'star', name: 'Star', mult: 15, color: '#ff8f00' },
    { key: 'diamond', name: 'Diamond', mult: 25, color: '#0288d1' },
    { key: 'seven', name: 'Seven', mult: 50, color: '#ef4444' },
    { key: 'wild', name: 'Wild', mult: 100, color: '#7b1fa2' },
];
