// ═══════════════════════════════════════════════════════════════
// GAME ROUTER — Single override for all premium games
// This file MUST be loaded LAST
// ═══════════════════════════════════════════════════════════════

// Store the base loadGameUI (from games2.js which has all games)
const _baseLoadGameUI = loadGameUI;

// Master router — routes to premium Canvas versions where available
loadGameUI = function(id) {
    const body = document.getElementById('game-body');
    
    switch(id) {
        // Premium Canvas games
        case 'crash':
            if (typeof renderCrash === 'function') { renderCrash(body); return; }
            break;
        case 'slots':
            if (typeof renderSlots === 'function' && typeof slotsCanvas !== 'undefined') { renderSlots(body); return; }
            break;
        case 'mines':
            if (typeof renderMines === 'function' && typeof minesCanvas !== 'undefined') { renderMines(body); return; }
            break;
        case 'roulette':
            if (typeof renderRouletteReal === 'function') { renderRouletteReal(body); return; }
            break;
        case 'plinko':
            if (typeof renderPlinko === 'function' && typeof plinkoCanvas !== 'undefined') { renderPlinko(body); return; }
            break;
        case 'blackjack':
            if (typeof renderBlackjackReal === 'function') { renderBlackjackReal(body); return; }
            break;
        case 'aviator':
            if (typeof renderAviatorReal === 'function') { renderAviatorReal(body); return; }
            break;
        case 'coinflip':
            if (typeof renderCoinFlipReal === 'function') { renderCoinFlipReal(body); return; }
            break;
    }
    
    // Fallback to base (games.js + games2.js)
    _baseLoadGameUI(id);
};
