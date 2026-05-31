// ═══════════════════════════════════════════════════════════════
// LIBERTY CASINO - PREMIUM GAMES ENGINE (Canvas + Particles)
// Stake-quality animations and visual effects
// ═══════════════════════════════════════════════════════════════

// === PARTICLE SYSTEM ===
class Particle {
    constructor(x, y, color, speed, size, life) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.color = color;
        this.size = size || 3;
        this.life = life || 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.gravity = 0.1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        this.size *= 0.98;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() { this.particles = []; }
    emit(x, y, count, color, speed, size) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color || '#f59e0b', speed || 4, size || 3, 1));
        }
    }
    explode(x, y, count, colors) {
        const cols = colors || ['#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6'];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 4;
            const p = new Particle(x, y, cols[i % cols.length], 1, 2 + Math.random() * 3, 1);
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.gravity = 0.05;
            this.particles.push(p);
        }
    }
    update() { this.particles = this.particles.filter(p => { p.update(); return p.life > 0; }); }
    draw(ctx) { this.particles.forEach(p => p.draw(ctx)); }
}

// === GLOBAL CANVAS HELPERS ===
function createGameCanvas(container, id, width, height) {
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = width || 340;
    canvas.height = height || 220;
    canvas.style.cssText = 'width:100%;max-width:360px;border-radius:16px;background:#0a0e17;display:block;margin:0 auto;';
    container.appendChild(canvas);
    return canvas;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════
// CRASH — Canvas Graph with Real-time Line Drawing
// ═══════════════════════════════════════════════════════════════
let crashCanvas, crashCtx, crashAnim, crashParticles;
let crashData = { active: false, points: [], multi: 1, crashAt: 1, bet: 0, startTime: 0 };

function renderCrash(body) {
    body.innerHTML = `
        <div id="crash-container" style="width:100%;max-width:360px;margin:0 auto;"></div>
        <div style="text-align:center;margin:8px 0;">
            <div id="crash-multi-display" style="font-size:42px;font-weight:900;color:#10b981;text-shadow:0 0 20px rgba(16,185,129,0.5);transition:all 0.1s;">1.00x</div>
            <div style="font-size:11px;color:var(--text3);">Cash out before it crashes!</div>
        </div>
        ${betUI('crash')}
        <button class="play-button" id="crash-start" onclick="startCrashPremium()">🚀 LAUNCH</button>
        <button class="play-button hidden" id="crash-stop" onclick="stopCrashPremium()" style="background:linear-gradient(135deg,#10b981,#059669)">💰 CASH OUT — <span id="crash-cashout-amt">$0.00</span></button>
        <div id="crash-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const container = document.getElementById('crash-container');
    crashCanvas = createGameCanvas(container, 'crash-cv', 340, 200);
    crashCtx = crashCanvas.getContext('2d');
    crashParticles = new ParticleSystem();
    drawCrashIdle();
}

function drawCrashIdle() {
    const ctx = crashCtx;
    const w = crashCanvas.width, h = crashCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
        const x = (w / 8) * i;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    
    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px Inter';
    ctx.fillText('1.00x', 4, h - 4);
    ctx.fillText('2.00x', 4, h / 2);
    ctx.fillText('TIME', w - 30, h - 4);
}

function startCrashPremium() {
    const bet = getBet('crash'); if (!bet) return;
    const crashAt = 1 / (1 - Math.random() * (window.DYNAMIC_RTP || 0.96));
    
    crashData = { active: true, points: [], multi: 1, crashAt, bet, startTime: Date.now() };
    document.getElementById('crash-start').classList.add('hidden');
    document.getElementById('crash-stop').classList.remove('hidden');
    document.getElementById('crash-result').innerHTML = '';
    
    if (crashAnim) cancelAnimationFrame(crashAnim);
    animateCrash();
}

function animateCrash() {
    if (!crashData.active) return;
    
    const ctx = crashCtx;
    const w = crashCanvas.width, h = crashCanvas.height;
    const elapsed = (Date.now() - crashData.startTime) / 1000;
    
    // Increase multiplier
    crashData.multi = 1 + elapsed * 0.15 + (elapsed * elapsed * 0.02);
    
    // Store point
    crashData.points.push({ x: elapsed, y: crashData.multi });
    
    // Clear and draw background
    drawCrashIdle();
    
    // Draw curve
    if (crashData.points.length > 1) {
        const maxX = elapsed + 1;
        const maxY = Math.max(crashData.multi + 0.5, 2.5);
        
        // Glow effect
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 15;
        
        // Main line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        for (let i = 0; i < crashData.points.length; i++) {
            const px = (crashData.points[i].x / maxX) * (w - 20) + 10;
            const py = h - ((crashData.points[i].y - 1) / (maxY - 1)) * (h - 30) - 15;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Fill under curve
        const lastPx = (elapsed / maxX) * (w - 20) + 10;
        const lastPy = h - ((crashData.multi - 1) / (maxY - 1)) * (h - 30) - 15;
        ctx.lineTo(lastPx, h);
        ctx.lineTo(10, h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, lastPy, 0, h);
        grad.addColorStop(0, 'rgba(16,185,129,0.15)');
        grad.addColorStop(1, 'rgba(16,185,129,0)');
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Dot at end
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(lastPx, lastPy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Emit particles at tip
        if (Math.random() < 0.3) {
            crashParticles.emit(lastPx, lastPy, 1, '#10b981', 2, 2);
        }
    }
    
    // Draw particles
    crashParticles.update();
    crashParticles.draw(ctx);
    
    // Update display
    const display = document.getElementById('crash-multi-display');
    display.textContent = crashData.multi.toFixed(2) + 'x';
    document.getElementById('crash-cashout-amt').textContent = '$' + (crashData.bet * crashData.multi).toFixed(2);
    
    // Color transitions
    if (crashData.multi > 2) display.style.color = '#f59e0b';
    if (crashData.multi > 5) display.style.color = '#f97316';
    if (crashData.multi > 10) display.style.color = '#ec4899';
    if (crashData.multi > 20) display.style.color = '#a855f7';
    display.style.textShadow = `0 0 ${10 + crashData.multi * 2}px currentColor`;
    
    // Check crash
    if (crashData.multi >= crashData.crashAt) {
        crashData.active = false;
        crashExplode();
        return;
    }
    
    crashAnim = requestAnimationFrame(animateCrash);
}

function crashExplode() {
    const ctx = crashCtx;
    const w = crashCanvas.width, h = crashCanvas.height;
    
    // Explosion at last point
    const lastP = crashData.points[crashData.points.length - 1];
    const maxX = lastP.x + 1;
    const maxY = Math.max(crashData.multi + 0.5, 2.5);
    const ex = (lastP.x / maxX) * (w - 20) + 10;
    const ey = h - ((lastP.y - 1) / (maxY - 1)) * (h - 30) - 15;
    
    crashParticles.explode(ex, ey, 40, ['#ef4444', '#f97316', '#fbbf24', '#dc2626']);
    
    // Animate explosion
    let frames = 0;
    function explodeAnim() {
        drawCrashIdle();
        
        // Redraw line in red
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (let i = 0; i < crashData.points.length; i++) {
            const px = (crashData.points[i].x / maxX) * (w - 20) + 10;
            const py = h - ((crashData.points[i].y - 1) / (maxY - 1)) * (h - 30) - 15;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Draw "CRASHED" text
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED!', w / 2, h / 2 - 10);
        ctx.font = '14px Inter';
        ctx.fillText(crashData.crashAt.toFixed(2) + 'x', w / 2, h / 2 + 15);
        ctx.textAlign = 'left';
        
        crashParticles.update();
        crashParticles.draw(ctx);
        
        if (++frames < 60) requestAnimationFrame(explodeAnim);
    }
    explodeAnim();
    
    // UI updates
    const display = document.getElementById('crash-multi-display');
    display.textContent = '💥 ' + crashData.crashAt.toFixed(2) + 'x';
    display.style.color = '#ef4444';
    
    recordGame('Crash', crashData.bet, false, -crashData.bet);
    document.getElementById('crash-result').innerHTML = showLoseResult(crashData.bet);
    document.getElementById('crash-stop').classList.add('hidden');
    document.getElementById('crash-start').classList.remove('hidden');
    playSound('lose');
    
    // Reset after delay
    setTimeout(() => {
        display.textContent = '1.00x';
        display.style.color = '#10b981';
        display.style.textShadow = '0 0 20px rgba(16,185,129,0.5)';
        drawCrashIdle();
    }, 3000);
}

function stopCrashPremium() {
    if (!crashData.active) return;
    crashData.active = false;
    if (crashAnim) cancelAnimationFrame(crashAnim);
    
    const profit = crashData.bet * crashData.multi - crashData.bet;
    recordGame('Crash', crashData.bet, true, profit);
    
    // Success particles
    const w = crashCanvas.width, h = crashCanvas.height;
    crashParticles.explode(w / 2, h / 2, 30, ['#10b981', '#34d399', '#6ee7b7', '#fbbf24']);
    
    // Animate success
    let frames = 0;
    function successAnim() {
        const ctx = crashCtx;
        drawCrashIdle();
        
        // Green line
        const maxX = crashData.points[crashData.points.length-1].x + 1;
        const maxY = Math.max(crashData.multi + 0.5, 2.5);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < crashData.points.length; i++) {
            const px = (crashData.points[i].x / maxX) * (w - 20) + 10;
            const py = h - ((crashData.points[i].y - 1) / (maxY - 1)) * (h - 30) - 15;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // "CASHED OUT" text
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 20px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('CASHED OUT ✓', w / 2, h / 2 - 10);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('+$' + (crashData.bet * crashData.multi).toFixed(2), w / 2, h / 2 + 15);
        ctx.textAlign = 'left';
        
        crashParticles.update();
        crashParticles.draw(ctx);
        
        if (++frames < 40) requestAnimationFrame(successAnim);
    }
    successAnim();
    
    document.getElementById('crash-multi-display').textContent = crashData.multi.toFixed(2) + 'x ✓';
    document.getElementById('crash-result').innerHTML = showWinResult(crashData.bet * crashData.multi);
    document.getElementById('crash-stop').classList.add('hidden');
    document.getElementById('crash-start').classList.remove('hidden');
    showConfetti();
    playSound('win');
    
    setTimeout(() => {
        document.getElementById('crash-multi-display').textContent = '1.00x';
        document.getElementById('crash-multi-display').style.color = '#10b981';
        drawCrashIdle();
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// SLOTS — Premium 5-Reel Slot Machine with Canvas
// ═══════════════════════════════════════════════════════════════
let slotsCanvas, slotsCtx, slotsParticles;
const SLOT_SYMBOLS = ['🍒','🍋','🍊','🍇','⭐','💎','7️⃣','🔔','🍀'];
const SLOT_COLORS = { '🍒':'#ef4444', '🍋':'#fbbf24', '🍊':'#f97316', '🍇':'#8b5cf6', '⭐':'#fbbf24', '💎':'#06b6d4', '7️⃣':'#ef4444', '🔔':'#f59e0b', '🍀':'#10b981' };

function renderSlots(body) {
    body.innerHTML = `
        <div id="slots-container" style="width:100%;max-width:360px;margin:0 auto;position:relative;"></div>
        <div style="text-align:center;margin:8px 0;">
            <div id="slots-win-display" style="font-size:24px;font-weight:800;min-height:32px;color:var(--gold);"></div>
        </div>
        <div style="text-align:center;font-size:10px;color:var(--text3);margin-bottom:8px;">
            7️⃣7️⃣7️⃣=100x • 💎💎💎=50x • ⭐⭐⭐=20x • 3match=10x • 2match=2x
        </div>
        ${betUI('slots')}
        <button class="play-button" id="slots-btn" onclick="spinSlotsPremium()">🎰 SPIN</button>
        <div id="slots-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const container = document.getElementById('slots-container');
    slotsCanvas = createGameCanvas(container, 'slots-cv', 340, 180);
    slotsCtx = slotsCanvas.getContext('2d');
    slotsParticles = new ParticleSystem();
    drawSlotsIdle(['🍒','🍋','🍊','🍇','⭐']);
}

function drawSlotsIdle(symbols) {
    const ctx = slotsCtx;
    const w = slotsCanvas.width, h = slotsCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Machine background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1a1040');
    bg.addColorStop(0.5, '#0f0a2a');
    bg.addColorStop(1, '#1a1040');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    
    // Reel frames
    const reelW = 56, reelH = 70, gap = 8;
    const startX = (w - (reelW * 5 + gap * 4)) / 2;
    const startY = (h - reelH) / 2;
    
    for (let i = 0; i < 5; i++) {
        const x = startX + i * (reelW + gap);
        
        // Reel background
        const reelBg = ctx.createLinearGradient(x, startY, x, startY + reelH);
        reelBg.addColorStop(0, '#0a0a1a');
        reelBg.addColorStop(0.5, '#111827');
        reelBg.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = reelBg;
        drawRoundedRect(ctx, x, startY, reelW, reelH, 8);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'rgba(139,92,246,0.3)';
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, x, startY, reelW, reelH, 8);
        ctx.stroke();
        
        // Symbol
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbols[i] || '❓', x + reelW/2, startY + reelH/2);
    }
    
    // Win line
    ctx.strokeStyle = 'rgba(245,158,11,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX - 5, h/2);
    ctx.lineTo(startX + 5*(reelW+gap) - gap + 5, h/2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.textAlign = 'left';
}

function spinSlotsPremium() {
    const bet = getBet('slots'); if (!bet) return;
    document.getElementById('slots-btn').disabled = true;
    document.getElementById('slots-win-display').textContent = '';
    document.getElementById('slots-result').innerHTML = '';
    
    // Determine result
    const rand = Math.random();
    let result = [], mult = 0;
    if (rand < 0.003) { result = ['7️⃣','7️⃣','7️⃣','7️⃣','7️⃣']; mult = 100; }
    else if (rand < 0.008) { result = ['💎','💎','💎','💎','💎']; mult = 50; }
    else if (rand < 0.02) { result = ['⭐','⭐','⭐','⭐','⭐']; mult = 20; }
    else if (rand < 0.06) { const s = SLOT_SYMBOLS[Math.floor(Math.random()*7)]; result = [s,s,s, SLOT_SYMBOLS[Math.floor(Math.random()*9)], SLOT_SYMBOLS[Math.floor(Math.random()*9)]]; mult = 10; }
    else if (rand < 0.20) { const s = SLOT_SYMBOLS[Math.floor(Math.random()*9)]; let o; do{o=SLOT_SYMBOLS[Math.floor(Math.random()*9)]}while(o===s); result = [s,s,o,s, SLOT_SYMBOLS[Math.floor(Math.random()*9)]]; mult = 2; }
    else if (rand < 0.32) { const s = SLOT_SYMBOLS[Math.floor(Math.random()*9)]; let o; do{o=SLOT_SYMBOLS[Math.floor(Math.random()*9)]}while(o===s); result = [s,s,o, SLOT_SYMBOLS[Math.floor(Math.random()*9)], SLOT_SYMBOLS[Math.floor(Math.random()*9)]]; mult = 1.5; }
    else { result = []; for(let i=0;i<5;i++){let s;do{s=SLOT_SYMBOLS[Math.floor(Math.random()*9)]}while(result.filter(x=>x===s).length>=2);result.push(s);} mult = 0; }
    
    // Spinning animation
    let frame = 0;
    const totalFrames = 60;
    const reelStops = [20, 30, 40, 48, 55]; // Each reel stops at different time
    const currentSymbols = ['❓','❓','❓','❓','❓'];
    
    function spinFrame() {
        frame++;
        
        for (let i = 0; i < 5; i++) {
            if (frame < reelStops[i]) {
                currentSymbols[i] = SLOT_SYMBOLS[Math.floor(Math.random() * 9)];
            } else if (frame === reelStops[i]) {
                currentSymbols[i] = result[i];
                // Stop sound
                playSoundFX('sine', 600 + i * 100, 0.08, 0.15);
            }
        }
        
        drawSlotsIdle(currentSymbols);
        
        // Spinning blur effect on active reels
        const ctx = slotsCtx;
        const w = slotsCanvas.width, h = slotsCanvas.height;
        const reelW = 56, gap = 8;
        const startX = (w - (reelW * 5 + gap * 4)) / 2;
        const startY = (h - 70) / 2;
        
        for (let i = 0; i < 5; i++) {
            if (frame < reelStops[i]) {
                const x = startX + i * (reelW + gap);
                ctx.fillStyle = 'rgba(139,92,246,0.1)';
                drawRoundedRect(ctx, x, startY, reelW, 70, 8);
                ctx.fill();
            }
        }
        
        if (frame < totalFrames) {
            requestAnimationFrame(spinFrame);
        } else {
            // All stopped — check win
            slotsFinish(bet, mult, result);
        }
    }
    
    requestAnimationFrame(spinFrame);
}

function slotsFinish(bet, mult, result) {
    const ctx = slotsCtx;
    const w = slotsCanvas.width, h = slotsCanvas.height;
    
    if (mult > 0) {
        // Win animation — flash win line
        let flash = 0;
        function winFlash() {
            drawSlotsIdle(result);
            
            if (flash % 6 < 3) {
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 15;
                const reelW = 56, gap = 8;
                const startX = (w - (reelW * 5 + gap * 4)) / 2;
                ctx.beginPath();
                ctx.moveTo(startX - 5, h/2);
                ctx.lineTo(startX + 5*(reelW+gap) - gap + 5, h/2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            
            slotsParticles.update();
            slotsParticles.draw(ctx);
            
            if (++flash < 30) requestAnimationFrame(winFlash);
        }
        
        // Emit particles
        slotsParticles.explode(w/2, h/2, 25, ['#fbbf24','#10b981','#8b5cf6','#ef4444']);
        winFlash();
        
        recordGame('Slots', bet, true, bet * (mult - 1));
        document.getElementById('slots-win-display').textContent = `🎉 ${mult}x WIN!`;
        document.getElementById('slots-win-display').style.color = mult >= 20 ? '#ef4444' : '#fbbf24';
        document.getElementById('slots-result').innerHTML = showWinResult(bet * mult);
        if (mult >= 10) showConfetti();
        playSound('win');
        if (mult >= 50) playSound('jackpot');
    } else {
        recordGame('Slots', bet, false, -bet);
        document.getElementById('slots-result').innerHTML = showLoseResult(bet);
        playSound('lose');
    }
    
    setTimeout(() => { document.getElementById('slots-btn').disabled = false; }, 1500);
}

// ═══════════════════════════════════════════════════════════════
// MINES — Premium Grid with Hover Effects & Reveal Animations
// ═══════════════════════════════════════════════════════════════
let minesCanvas, minesCtx, minesParticles;
let minesData = { active: false, bet: 0, mines: [], revealed: [], multi: 1, mineCount: 5 };

function renderMines(body) {
    body.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:28px;font-weight:900;color:var(--gold);" id="mines-multi">1.00x</div>
            <div style="font-size:12px;color:var(--text3);">Profit: <span id="mines-profit" style="color:var(--green);">$0.00</span></div>
        </div>
        <div id="mines-container" style="width:100%;max-width:320px;margin:12px auto;"></div>
        <div style="text-align:center;margin:8px 0;font-size:12px;color:var(--text3);">
            Mines: <select id="m-count" style="background:var(--bg3);color:white;border:none;padding:4px 8px;border-radius:6px;">
                <option value="3">3</option><option value="5" selected>5</option><option value="10">10</option><option value="15">15</option><option value="20">20</option><option value="24">24</option>
            </select>
        </div>
        ${betUI('mines')}
        <button class="play-button" id="mines-start" onclick="startMinesPremium()">💣 START GAME</button>
        <button class="play-button hidden" id="mines-cash" onclick="cashMinesPremium()" style="background:linear-gradient(135deg,#10b981,#059669)">💰 CASH OUT — <span id="mines-cashamt">$0.00</span></button>
        <div id="mines-result" style="min-height:60px;margin-top:10px;"></div>`;
    
    const container = document.getElementById('mines-container');
    minesCanvas = createGameCanvas(container, 'mines-cv', 310, 310);
    minesCtx = minesCanvas.getContext('2d');
    minesParticles = new ParticleSystem();
    drawMinesGrid();
    
    // Click handler
    minesCanvas.onclick = (e) => {
        const rect = minesCanvas.getBoundingClientRect();
        const scaleX = minesCanvas.width / rect.width;
        const scaleY = minesCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        handleMineClick(x, y);
    };
}

function drawMinesGrid() {
    const ctx = minesCtx;
    const w = minesCanvas.width, h = minesCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);
    
    const cellSize = 56, gap = 4;
    const startX = (w - (cellSize * 5 + gap * 4)) / 2;
    const startY = (h - (cellSize * 5 + gap * 4)) / 2;
    
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const idx = row * 5 + col;
            const x = startX + col * (cellSize + gap);
            const y = startY + row * (cellSize + gap);
            
            if (minesData.revealed.includes(idx)) {
                if (minesData.mines.includes(idx)) {
                    // Bomb
                    const bombGrad = ctx.createRadialGradient(x+cellSize/2, y+cellSize/2, 0, x+cellSize/2, y+cellSize/2, cellSize/2);
                    bombGrad.addColorStop(0, 'rgba(239,68,68,0.3)');
                    bombGrad.addColorStop(1, 'rgba(239,68,68,0.05)');
                    ctx.fillStyle = bombGrad;
                    drawRoundedRect(ctx, x, y, cellSize, cellSize, 10);
                    ctx.fill();
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    drawRoundedRect(ctx, x, y, cellSize, cellSize, 10);
                    ctx.stroke();
                    ctx.font = '28px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💣', x + cellSize/2, y + cellSize/2);
                } else {
                    // Gem
                    const gemGrad = ctx.createRadialGradient(x+cellSize/2, y+cellSize/2, 0, x+cellSize/2, y+cellSize/2, cellSize/2);
                    gemGrad.addColorStop(0, 'rgba(16,185,129,0.3)');
                    gemGrad.addColorStop(1, 'rgba(16,185,129,0.05)');
                    ctx.fillStyle = gemGrad;
                    drawRoundedRect(ctx, x, y, cellSize, cellSize, 10);
                    ctx.fill();
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 2;
                    drawRoundedRect(ctx, x, y, cellSize, cellSize, 10);
                    ctx.stroke();
                    ctx.font = '28px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('💎', x + cellSize/2, y + cellSize/2);
                }
            } else {
                // Unrevealed
                const cellGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                cellGrad.addColorStop(0, '#1e293b');
                cellGrad.addColorStop(1, '#0f172a');
                ctx.fillStyle = cellGrad;
                drawRoundedRect(ctx, x, y, cellSize, cellSize, 10);
                ctx.fill();
                ctx.strokeStyle = 'rgba(139,92,246,0.2)';
                ctx.lineWidth = 1.5;
                drawRoundedRect(ctx, x, y, cellSize, cellSize, 10);
                ctx.stroke();
            }
        }
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    // Draw particles
    minesParticles.update();
    minesParticles.draw(ctx);
}

function startMinesPremium() {
    const bet = getBet('mines'); if (!bet) return;
    const mc = parseInt(document.getElementById('m-count').value);
    let mines = [];
    while (mines.length < mc) { const p = Math.floor(Math.random()*25); if (!mines.includes(p)) mines.push(p); }
    
    minesData = { active: true, bet, mines, revealed: [], multi: 1, mineCount: mc };
    document.getElementById('mines-start').classList.add('hidden');
    document.getElementById('mines-cash').classList.remove('hidden');
    document.getElementById('mines-result').innerHTML = '<div style="text-align:center;color:var(--text3);font-size:12px;">💎 Tap tiles to find gems! Avoid 💣</div>';
    document.getElementById('mines-multi').textContent = '1.00x';
    document.getElementById('mines-profit').textContent = '$0.00';
    drawMinesGrid();
}

function handleMineClick(x, y) {
    if (!minesData.active) return;
    
    const cellSize = 56, gap = 4;
    const w = minesCanvas.width, h = minesCanvas.height;
    const startX = (w - (cellSize * 5 + gap * 4)) / 2;
    const startY = (h - (cellSize * 5 + gap * 4)) / 2;
    
    const col = Math.floor((x - startX) / (cellSize + gap));
    const row = Math.floor((y - startY) / (cellSize + gap));
    
    if (col < 0 || col > 4 || row < 0 || row > 4) return;
    const idx = row * 5 + col;
    if (minesData.revealed.includes(idx)) return;
    
    minesData.revealed.push(idx);
    
    const cellX = startX + col * (cellSize + gap) + cellSize/2;
    const cellY = startY + row * (cellSize + gap) + cellSize/2;
    
    if (minesData.mines.includes(idx)) {
        // Hit bomb!
        minesData.active = false;
        minesParticles.explode(cellX, cellY, 20, ['#ef4444','#f97316','#fbbf24']);
        
        // Reveal all bombs
        minesData.mines.forEach(m => { if (!minesData.revealed.includes(m)) minesData.revealed.push(m); });
        drawMinesGrid();
        
        // Animate particles
        let f = 0;
        function bombAnim() { minesParticles.update(); drawMinesGrid(); minesParticles.draw(minesCtx); if(++f<30) requestAnimationFrame(bombAnim); }
        bombAnim();
        
        recordGame('Mines', minesData.bet, false, -minesData.bet);
        document.getElementById('mines-result').innerHTML = showLoseResult(minesData.bet);
        document.getElementById('mines-cash').classList.add('hidden');
        document.getElementById('mines-start').classList.remove('hidden');
        playSound('lose');
    } else {
        // Found gem!
        minesParticles.emit(cellX, cellY, 8, '#10b981', 3, 3);
        playGemSound();
        
        const safe = 25 - minesData.mineCount;
        const found = minesData.revealed.length;
        minesData.multi = 1;
        for (let k = 0; k < found; k++) { minesData.multi *= safe / (safe - k); }
        minesData.multi *= (window.DYNAMIC_RTP || 0.97);
        
        document.getElementById('mines-multi').textContent = minesData.multi.toFixed(2) + 'x';
        document.getElementById('mines-profit').textContent = '$' + (minesData.bet * minesData.multi - minesData.bet).toFixed(2);
        document.getElementById('mines-cashamt').textContent = '$' + (minesData.bet * minesData.multi).toFixed(2);
        
        drawMinesGrid();
        
        // Animate particles
        let f = 0;
        function gemAnim() { minesParticles.update(); drawMinesGrid(); minesParticles.draw(minesCtx); if(++f<15) requestAnimationFrame(gemAnim); }
        gemAnim();
        
        if (found >= safe) cashMinesPremium();
    }
}

function cashMinesPremium() {
    if (!minesData.active) return;
    minesData.active = false;
    
    const profit = minesData.bet * minesData.multi - minesData.bet;
    recordGame('Mines', minesData.bet, true, profit);
    
    // Reveal bombs
    minesData.mines.forEach(m => { if (!minesData.revealed.includes(m)) minesData.revealed.push(m); });
    
    // Success explosion
    minesParticles.explode(minesCanvas.width/2, minesCanvas.height/2, 30, ['#10b981','#34d399','#fbbf24']);
    drawMinesGrid();
    
    document.getElementById('mines-result').innerHTML = showWinResult(minesData.bet * minesData.multi);
    document.getElementById('mines-cash').classList.add('hidden');
    document.getElementById('mines-start').classList.remove('hidden');
    showConfetti();
    playSound('win');
}

// ═══════════════════════════════════════════════════════════════
// OVERRIDE: Replace old games with premium versions
// ═══════════════════════════════════════════════════════════════
const _origLoadGameUI2 = loadGameUI;
loadGameUI = function(id) {
    const body = document.getElementById('game-body');
    switch(id) {
        case 'crash': renderCrash(body); break;
        case 'slots': renderSlots(body); break;
        case 'mines': renderMines(body); break;
        default: _origLoadGameUI2(id); break;
    }
};

// ═══════════════════════════════════════════════════════════════
// ROULETTE — Canvas Spinning Wheel with Ball Physics
// ═══════════════════════════════════════════════════════════════
let rouletteCanvas, rouletteCtx, rouletteParticles;
let rouletteData = { spinning: false, angle: 0, ballAngle: 0, result: null };

const ROULETTE_NUMBERS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const ROULETTE_REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

function renderRoulette(body) {
    body.innerHTML = `
        <div id="roulette-container" style="width:100%;max-width:360px;margin:0 auto;position:relative;"></div>
        <div id="roul-result-display" style="text-align:center;font-size:28px;font-weight:900;min-height:36px;margin:8px 0;"></div>
        <div class="choice-row">
            <button class="choice-btn" id="r-red" onclick="roulChoice='red';document.querySelectorAll('[id^=r-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="background:rgba(229,57,53,0.2);border-color:#e53935;">
                <div style="width:20px;height:20px;background:#e53935;border-radius:50%;margin:0 auto 4px;"></div><div style="font-size:12px;font-weight:700;">RED 2x</div>
            </button>
            <button class="choice-btn" id="r-grn" onclick="roulChoice='green';document.querySelectorAll('[id^=r-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="background:rgba(67,160,71,0.2);border-color:#43a047;">
                <div style="width:20px;height:20px;background:#43a047;border-radius:50%;margin:0 auto 4px;"></div><div style="font-size:12px;font-weight:700;">GREEN 36x</div>
            </button>
            <button class="choice-btn" id="r-blk" onclick="roulChoice='black';document.querySelectorAll('[id^=r-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="background:rgba(33,33,33,0.4);border-color:#424242;">
                <div style="width:20px;height:20px;background:#212121;border-radius:50%;margin:0 auto 4px;border:1px solid #616161;"></div><div style="font-size:12px;font-weight:700;">BLACK 2x</div>
            </button>
        </div>
        ${betUI('roul')}
        <button class="play-button" id="roul-btn" onclick="spinRoulettePremium()">🎯 SPIN ROULETTE</button>
        <div id="roul-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const container = document.getElementById('roulette-container');
    rouletteCanvas = createGameCanvas(container, 'roul-cv', 300, 300);
    rouletteCtx = rouletteCanvas.getContext('2d');
    rouletteParticles = new ParticleSystem();
    drawRouletteWheel(0, -1);
}

function drawRouletteWheel(wheelAngle, ballPos) {
    const ctx = rouletteCtx;
    const w = rouletteCanvas.width, h = rouletteCanvas.height;
    const cx = w/2, cy = h/2, radius = 130;
    
    ctx.clearRect(0, 0, w, h);
    
    // Dark background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);
    
    // Outer ring glow
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Outer gold ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
    const goldGrad = ctx.createLinearGradient(cx-radius, cy-radius, cx+radius, cy+radius);
    goldGrad.addColorStop(0, '#f59e0b');
    goldGrad.addColorStop(0.5, '#fbbf24');
    goldGrad.addColorStop(1, '#d97706');
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 6;
    ctx.stroke();
    
    // Draw segments
    const segAngle = (Math.PI * 2) / 37;
    for (let i = 0; i < 37; i++) {
        const startA = wheelAngle + i * segAngle;
        const endA = startA + segAngle;
        const num = ROULETTE_NUMBERS[i];
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startA, endA);
        ctx.closePath();
        
        if (num === 0) ctx.fillStyle = '#43a047';
        else if (ROULETTE_REDS.includes(num)) ctx.fillStyle = '#c62828';
        else ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        
        // Segment border
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Number text
        const midA = startA + segAngle / 2;
        const tx = cx + Math.cos(midA) * (radius - 20);
        const ty = cy + Math.sin(midA) * (radius - 20);
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midA + Math.PI/2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(num.toString(), 0, 0);
        ctx.restore();
    }
    
    // Inner circle
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    innerGrad.addColorStop(0, '#2a2a4e');
    innerGrad.addColorStop(1, '#0f0a2a');
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Center logo
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIBERTY', cx, cy);
    
    // Ball
    if (ballPos >= 0) {
        const ballA = wheelAngle + ballPos * segAngle + segAngle/2;
        const ballR = radius - 10;
        const bx = cx + Math.cos(ballA) * ballR;
        const by = cy + Math.sin(ballA) * ballR;
        
        // Ball glow
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        const ballGrad = ctx.createRadialGradient(bx-2, by-2, 0, bx, by, 6);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(1, '#bdbdbd');
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 12);
    ctx.lineTo(cx - 8, cy - radius - 22);
    ctx.lineTo(cx + 8, cy - radius - 22);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    // Particles
    rouletteParticles.update();
    rouletteParticles.draw(ctx);
}

let roulChoice = null;

function spinRoulettePremium() {
    if (!roulChoice) return alert('Pick Red, Black, or Green!');
    const bet = getBet('roul'); if (!bet) return;
    document.getElementById('roul-btn').disabled = true;
    document.getElementById('roul-result-display').textContent = '';
    
    // Determine result
    const rand = Math.random();
    let resultIdx;
    if (rand < 0.027) resultIdx = 0; // Green (0)
    else resultIdx = 1 + Math.floor(Math.random() * 36);
    
    const resultNum = ROULETTE_NUMBERS[resultIdx];
    const isRed = ROULETTE_REDS.includes(resultNum);
    const resultColor = resultNum === 0 ? 'green' : isRed ? 'red' : 'black';
    
    // Spin animation
    let spinSpeed = 0.15;
    let currentAngle = 0;
    let ballIdx = Math.floor(Math.random() * 37);
    let frame = 0;
    const totalFrames = 180; // ~3 seconds at 60fps
    
    function spinFrame() {
        frame++;
        const progress = frame / totalFrames;
        
        // Decelerate
        spinSpeed = 0.15 * (1 - Math.pow(progress, 2));
        currentAngle += spinSpeed;
        
        // Ball moves opposite, slowing down
        if (frame < totalFrames * 0.7) {
            ballIdx = (ballIdx + 0.5) % 37;
        } else {
            // Ball settles on result
            const targetBall = resultIdx;
            const diff = targetBall - ballIdx;
            ballIdx += diff * 0.05;
        }
        
        drawRouletteWheel(currentAngle, Math.floor(ballIdx) % 37);
        
        if (frame < totalFrames) {
            requestAnimationFrame(spinFrame);
        } else {
            // Final result
            drawRouletteWheel(currentAngle, resultIdx);
            
            const won = roulChoice === resultColor;
            const mult = roulChoice === 'green' ? 36 : 2;
            const cx = rouletteCanvas.width/2, cy = rouletteCanvas.height/2;
            
            if (won) {
                rouletteParticles.explode(cx, cy, 30, resultColor === 'red' ? ['#ef4444','#fbbf24','#ff8a65'] : resultColor === 'green' ? ['#43a047','#66bb6a','#fbbf24'] : ['#9e9e9e','#fbbf24','#e0e0e0']);
                recordGame('Roulette', bet, true, bet * (mult - 1));
                document.getElementById('roul-result-display').innerHTML = `<span style="color:${resultColor==='red'?'#ef4444':resultColor==='green'?'#43a047':'#9e9e9e'}">${resultNum}</span>`;
                document.getElementById('roul-result').innerHTML = showWinResult(bet * mult);
                showConfetti();
                playSound(mult >= 36 ? 'jackpot' : 'win');
            } else {
                recordGame('Roulette', bet, false, -bet);
                document.getElementById('roul-result-display').innerHTML = `<span style="color:${resultColor==='red'?'#ef4444':resultColor==='green'?'#43a047':'#9e9e9e'}">${resultNum}</span>`;
                document.getElementById('roul-result').innerHTML = showLoseResult(bet);
                playSound('lose');
            }
            
            // Animate remaining particles
            let pf = 0;
            function particleAnim() { rouletteParticles.update(); drawRouletteWheel(currentAngle, resultIdx); rouletteParticles.draw(rouletteCtx); if(++pf<30) requestAnimationFrame(particleAnim); }
            particleAnim();
            
            setTimeout(() => { document.getElementById('roul-btn').disabled = false; }, 2000);
        }
    }
    
    requestAnimationFrame(spinFrame);
}

// ═══════════════════════════════════════════════════════════════
// PLINKO — Canvas Ball Drop with Physics
// ═══════════════════════════════════════════════════════════════
let plinkoCanvas, plinkoCtx, plinkoParticles;

function renderPlinko(body) {
    body.innerHTML = `
        <div id="plinko-container" style="width:100%;max-width:360px;margin:0 auto;"></div>
        <div style="text-align:center;margin:8px 0;">
            <div id="plinko-result-display" style="font-size:28px;font-weight:900;color:var(--gold);min-height:36px;"></div>
        </div>
        <div class="choice-row">
            <button class="choice-btn selected" id="pk-l" onclick="plinkoRisk='low';document.querySelectorAll('[id^=pk-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="border-color:#43a047;">🟢 Low</button>
            <button class="choice-btn" id="pk-m" onclick="plinkoRisk='med';document.querySelectorAll('[id^=pk-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="border-color:#f59e0b;">🟡 Medium</button>
            <button class="choice-btn" id="pk-h" onclick="plinkoRisk='high';document.querySelectorAll('[id^=pk-]').forEach(b=>b.classList.remove('selected'));this.classList.add('selected')" style="border-color:#e53935;">🔴 High</button>
        </div>
        ${betUI('plinko')}
        <button class="play-button" id="plinko-btn" onclick="dropPlinkoPremium()">⚪ DROP BALL</button>
        <div id="plinko-result" style="min-height:70px;margin-top:10px;"></div>`;
    
    const container = document.getElementById('plinko-container');
    plinkoCanvas = createGameCanvas(container, 'plinko-cv', 340, 280);
    plinkoCtx = plinkoCanvas.getContext('2d');
    plinkoParticles = new ParticleSystem();
    drawPlinkoBoard(-1);
}

let plinkoRisk = 'low';
const PLINKO_ROWS = 12;
const PLINKO_MULTS = {
    low: [1.5, 1.2, 1.1, 1.0, 0.7, 0.5, 0.3, 0.5, 0.7, 1.0, 1.1, 1.2, 1.5],
    med: [5, 3, 1.5, 1, 0.5, 0.3, 0.2, 0.3, 0.5, 1, 1.5, 3, 5],
    high: [50, 25, 10, 5, 2, 0.2, 0.1, 0.2, 2, 5, 10, 25, 50],
};

function drawPlinkoBoard(ballRow, ballCol, highlightSlot) {
    const ctx = plinkoCtx;
    const w = plinkoCanvas.width, h = plinkoCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    
    const startY = 20;
    const endY = h - 50;
    const rowH = (endY - startY) / PLINKO_ROWS;
    
    // Draw pegs
    for (let row = 0; row < PLINKO_ROWS; row++) {
        const pegsInRow = row + 3;
        const rowWidth = (pegsInRow - 1) * 24;
        const startX = (w - rowWidth) / 2;
        const y = startY + row * rowH;
        
        for (let col = 0; col < pegsInRow; col++) {
            const x = startX + col * 24;
            
            // Peg glow
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            const pegGrad = ctx.createRadialGradient(x-1, y-1, 0, x, y, 4);
            pegGrad.addColorStop(0, '#e0e0e0');
            pegGrad.addColorStop(1, '#616161');
            ctx.fillStyle = pegGrad;
            ctx.fill();
        }
    }
    
    // Draw multiplier slots at bottom
    const mults = PLINKO_MULTS[plinkoRisk];
    const slotCount = mults.length;
    const slotW = w / slotCount;
    
    for (let i = 0; i < slotCount; i++) {
        const x = i * slotW;
        const mult = mults[i];
        
        let color;
        if (mult >= 10) color = '#e53935';
        else if (mult >= 3) color = '#f59e0b';
        else if (mult >= 1) color = '#43a047';
        else color = '#455a64';
        
        const isHighlight = (highlightSlot === i);
        
        ctx.fillStyle = isHighlight ? color : `${color}44`;
        ctx.fillRect(x + 1, h - 40, slotW - 2, 36);
        
        if (isHighlight) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.fillRect(x + 1, h - 40, slotW - 2, 36);
            ctx.shadowBlur = 0;
        }
        
        ctx.strokeStyle = `${color}88`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, h - 40, slotW - 2, 36);
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${slotW > 28 ? 10 : 8}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(mult + 'x', x + slotW/2, h - 22);
    }
    
    // Draw ball
    if (ballRow >= 0 && ballRow < PLINKO_ROWS) {
        const pegsInRow = ballRow + 3;
        const rowWidth = (pegsInRow - 1) * 24;
        const startX = (w - rowWidth) / 2;
        const bx = startX + ballCol * 24;
        const by = startY + ballRow * rowH;
        
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        const ballGrad = ctx.createRadialGradient(bx-2, by-2, 0, bx, by, 7);
        ballGrad.addColorStop(0, '#fff9c4');
        ballGrad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = ballGrad;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    plinkoParticles.update();
    plinkoParticles.draw(ctx);
}

function dropPlinkoPremium() {
    const bet = getBet('plinko'); if (!bet) return;
    document.getElementById('plinko-btn').disabled = true;
    document.getElementById('plinko-result-display').textContent = '';
    document.getElementById('plinko-result').innerHTML = '';
    
    const mults = PLINKO_MULTS[plinkoRisk];
    
    // Simulate ball path
    let col = 0; // Start at center-ish
    const path = [];
    for (let row = 0; row < PLINKO_ROWS; row++) {
        path.push({ row, col: col + Math.floor((row + 3) / 2) });
        col += Math.random() < 0.5 ? 0 : 1;
    }
    
    // Final slot (weighted toward center for low risk)
    const weights = mults.map((_, i) => Math.exp(-Math.pow((i - mults.length/2) / (mults.length/4), 2)));
    const totalW = weights.reduce((a, b) => a + b);
    let r = Math.random() * totalW, slotIdx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { slotIdx = i; break; } }
    
    const mult = mults[slotIdx];
    
    // Animate ball dropping
    let frame = 0;
    const framesPerRow = 8;
    
    function dropFrame() {
        const currentRow = Math.floor(frame / framesPerRow);
        
        if (currentRow < PLINKO_ROWS) {
            const p = path[Math.min(currentRow, path.length - 1)];
            drawPlinkoBoard(p.row, p.col, -1);
            
            // Bounce sound
            if (frame % framesPerRow === 0) {
                playSoundFX('sine', 400 + currentRow * 50, 0.05, 0.1);
            }
            
            frame++;
            requestAnimationFrame(dropFrame);
        } else {
            // Ball reached bottom
            drawPlinkoBoard(-1, 0, slotIdx);
            
            const slotW = plinkoCanvas.width / mults.length;
            const px = slotIdx * slotW + slotW/2;
            const py = plinkoCanvas.height - 22;
            plinkoParticles.explode(px, py, 15, mult >= 3 ? ['#fbbf24','#f59e0b','#ff8f00'] : ['#43a047','#66bb6a']);
            
            // Animate particles
            let pf = 0;
            function pAnim() { plinkoParticles.update(); drawPlinkoBoard(-1, 0, slotIdx); plinkoParticles.draw(plinkoCtx); if(++pf<20) requestAnimationFrame(pAnim); }
            pAnim();
            
            document.getElementById('plinko-result-display').textContent = mult + 'x';
            
            const profit = bet * mult - bet;
            if (profit >= 0) {
                recordGame('Plinko', bet, true, profit);
                document.getElementById('plinko-result').innerHTML = showWinResult(bet * mult);
                if (mult >= 5) showConfetti();
                playSound('win');
            } else {
                recordGame('Plinko', bet, false, profit);
                document.getElementById('plinko-result').innerHTML = showLoseResult(-profit);
                playSound('lose');
            }
            
            setTimeout(() => { document.getElementById('plinko-btn').disabled = false; }, 1500);
        }
    }
    
    requestAnimationFrame(dropFrame);
}

// ═══════════════════════════════════════════════════════════════
// EXTEND OVERRIDE: Add Roulette and Plinko to premium
// ═══════════════════════════════════════════════════════════════
const _origLoadGameUI3 = loadGameUI;
loadGameUI = function(id) {
    const body = document.getElementById('game-body');
    switch(id) {
        case 'crash': renderCrash(body); break;
        case 'slots': renderSlots(body); break;
        case 'mines': renderMines(body); break;
        case 'roulette': renderRoulette(body); break;
        case 'plinko': renderPlinko(body); break;
        default: _origLoadGameUI3(id); break;
    }
};
