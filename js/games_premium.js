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
