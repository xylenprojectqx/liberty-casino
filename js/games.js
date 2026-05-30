// === LIBERTY CASINO - 10 Games ===
const EDGE = 0.05; // 5% house edge

const gamesList = [
    { id: 'coinflip', name: 'Coin Flip', icon: '🪙', mult: '1.9x', coming: false },
    { id: 'dice', name: 'Dice', icon: '🎲', mult: '1.9x', coming: false },
    { id: 'slots', name: 'Slots', icon: '🎰', mult: 'up to 50x', coming: false },
    { id: 'mines', name: 'Mines', icon: '💣', mult: 'up to 25x', coming: false },
    { id: 'hilo', name: 'Hi-Lo', icon: '📈', mult: 'up to 10x', coming: false },
    { id: 'plinko', name: 'Plinko', icon: '⚪', mult: 'up to 16x', coming: false },
    { id: 'crash', name: 'Crash', icon: '🚀', mult: 'up to 100x', coming: false },
    { id: 'wheel', name: 'Wheel', icon: '🎡', mult: 'up to 50x', coming: false },
    { id: 'keno', name: 'Keno', icon: '🔢', mult: 'up to 40x', coming: false },
    { id: 'roulette', name: 'Roulette', icon: '🔴', mult: 'up to 36x', coming: false },
    { id: 'blackjack', name: 'Blackjack', icon: '🃏', mult: '2x', coming: true },
    { id: 'baccarat', name: 'Baccarat', icon: '💎', mult: '2x', coming: true },
];

function loadGameUI(id) {
    const body = document.getElementById('game-body');
    switch(id) {
        case 'coinflip': body.innerHTML = coinflipUI(); break;
        case 'dice': body.innerHTML = diceUI(); break;
        case 'slots': body.innerHTML = slotsUI(); break;
        case 'mines': body.innerHTML = minesUI(); initMines(); break;
        case 'hilo': body.innerHTML = hiloUI(); break;
        case 'plinko': body.innerHTML = plinkoUI(); break;
        case 'crash': body.innerHTML = crashUI(); break;
        case 'wheel': body.innerHTML = wheelUI(); break;
        case 'keno': body.innerHTML = kenoUI(); initKeno(); break;
        case 'roulette': body.innerHTML = rouletteUI(); break;
    }
}

function betHTML(id) {
    return `<div class="bet-container">
        <div class="bet-label">Bet Amount (USDT)</div>
        <div class="bet-input-wrap">
            <input type="number" id="${id}-bet" value="1" min="0.1" step="0.1">
            <div class="bet-quick">
                <button onclick="document.getElementById('${id}-bet').value='1'">1</button>
                <button onclick="document.getElementById('${id}-bet').value='5'">5</button>
                <button onclick="document.getElementById('${id}-bet').value='10'">10</button>
                <button onclick="document.getElementById('${id}-bet').value=(user.balance/2).toFixed(2)">½</button>
                <button onclick="document.getElementById('${id}-bet').value=user.balance.toFixed(2)">All</button>
            </div>
        </div>
    </div>`;
}

function getBet(id) {
    const v = parseFloat(document.getElementById(`${id}-bet`).value);
    if (!v || v <= 0) { alert('Enter valid bet!'); return null; }
    if (v > user.balance) { alert('Insufficient balance!'); return null; }
    user.balance -= v; save(); updateBal();
    return v;
}

function winChance() { return 0.5 - EDGE / 2; }

// ========== COIN FLIP ==========
function coinflipUI() {
    return `${betHTML('cf')}
        <div class="choice-row"><button class="choice-btn" id="cf-h" onclick="this.classList.add('selected');document.getElementById('cf-t').classList.remove('selected')">👑 Heads</button><button class="choice-btn" id="cf-t" onclick="this.classList.add('selected');document.getElementById('cf-h').classList.remove('selected')">🦅 Tails</button></div>
        <div class="result-area" id="cf-res">🪙</div>
        <button class="play-button" onclick="playCF()">FLIP!</button>
        <div id="cf-msg" class="mt-12 text-center"></div>`;
}
function playCF() {
    const choice = document.getElementById('cf-h').classList.contains('selected') ? 'h' : document.getElementById('cf-t').classList.contains('selected') ? 't' : null;
    if (!choice) return alert('Pick Heads or Tails!');
    const bet = getBet('cf'); if (!bet) return;
    const won = Math.random() < winChance();
    const res = document.getElementById('cf-res');
    res.style.animation = 'pulse 0.2s infinite';
    setTimeout(() => {
        res.style.animation = '';
        res.textContent = won ? (choice === 'h' ? '👑' : '🦅') : (choice === 'h' ? '🦅' : '👑');
        if (won) { recordGame('Coin Flip', bet, true, bet*0.9); document.getElementById('cf-msg').innerHTML = `<div class="win-popup">+${(bet*1.9).toFixed(2)} USDT 🎉</div>`; }
        else { recordGame('Coin Flip', bet, false, -bet); document.getElementById('cf-msg').innerHTML = `<div class="lose-popup">-${bet.toFixed(2)} USDT</div>`; }
    }, 800);
}

// ========== DICE ==========
function diceUI() {
    return `${betHTML('dice')}
        <div class="choice-row"><button class="choice-btn" id="d-o" onclick="this.classList.add('selected');document.getElementById('d-u').classList.remove('selected')">⬆️ Over 3.5</button><button class="choice-btn" id="d-u" onclick="this.classList.add('selected');document.getElementById('d-o').classList.remove('selected')">⬇️ Under 3.5</button></div>
        <div class="result-area" id="dice-res">🎲</div>
        <button class="play-button" onclick="playDice()">ROLL!</button>
        <div id="dice-msg" class="mt-12 text-center"></div>`;
}
function playDice() {
    const over = document.getElementById('d-o').classList.contains('selected');
    const under = document.getElementById('d-u').classList.contains('selected');
    if (!over && !under) return alert('Pick Over or Under!');
    const bet = getBet('dice'); if (!bet) return;
    const won = Math.random() < winChance();
    const emojis = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const res = document.getElementById('dice-res');
    let c = 0;
    const anim = setInterval(() => { res.textContent = emojis[Math.floor(Math.random()*6)]; if(++c>12){clearInterval(anim);
        const roll = won ? (over ? Math.floor(Math.random()*3)+4 : Math.floor(Math.random()*3)+1) : (over ? Math.floor(Math.random()*3)+1 : Math.floor(Math.random()*3)+4);
        res.textContent = emojis[roll-1];
        if(won){recordGame('Dice',bet,true,bet*0.9);document.getElementById('dice-msg').innerHTML=`<div class="win-popup">🎲 ${roll}! +${(bet*1.9).toFixed(2)} USDT</div>`;}
        else{recordGame('Dice',bet,false,-bet);document.getElementById('dice-msg').innerHTML=`<div class="lose-popup">🎲 ${roll}! -${bet.toFixed(2)} USDT</div>`;}
    }},80);
}

// ========== SLOTS ==========
function slotsUI() {
    return `${betHTML('slots')}
        <div class="slots-display"><div class="slot-reel" id="s1">🍒</div><div class="slot-reel" id="s2">🍋</div><div class="slot-reel" id="s3">🍊</div></div>
        <button class="play-button" onclick="playSlots()">SPIN!</button>
        <div id="slots-msg" class="mt-12 text-center"></div>`;
}
function playSlots() {
    const bet = getBet('slots'); if (!bet) return;
    const syms = ['🍒','🍋','🍊','🍇','💎','7️⃣','⭐'];
    const reels = ['s1','s2','s3'];
    reels.forEach(r => document.getElementById(r).classList.add('spinning'));
    let c=0; const anim=setInterval(()=>{reels.forEach(r=>document.getElementById(r).textContent=syms[Math.floor(Math.random()*7)]);if(++c>20){clearInterval(anim);reels.forEach(r=>document.getElementById(r).classList.remove('spinning'));
        const rand=Math.random(); let r1,r2,r3;
        if(rand<0.01){r1=r2=r3='7️⃣';}  // 1% jackpot 50x
        else if(rand<0.03){r1=r2=r3=syms[Math.floor(Math.random()*6)];} // 2% triple 10x
        else if(rand<0.15){r1=r2=syms[Math.floor(Math.random()*7)];do{r3=syms[Math.floor(Math.random()*7)];}while(r3===r1);} // 12% double 2x
        else{r1=syms[Math.floor(Math.random()*7)];do{r2=syms[Math.floor(Math.random()*7)];}while(r2===r1);do{r3=syms[Math.floor(Math.random()*7)];}while(r3===r1||r3===r2);}
        document.getElementById('s1').textContent=r1;document.getElementById('s2').textContent=r2;document.getElementById('s3').textContent=r3;
        if(r1===r2&&r2===r3&&r1==='7️⃣'){recordGame('Slots',bet,true,bet*49);document.getElementById('slots-msg').innerHTML=`<div class="win-popup">🎰 MEGA JACKPOT! +${(bet*50).toFixed(2)}</div>`;}
        else if(r1===r2&&r2===r3){recordGame('Slots',bet,true,bet*9);document.getElementById('slots-msg').innerHTML=`<div class="win-popup">🎰 TRIPLE! +${(bet*10).toFixed(2)}</div>`;}
        else if(r1===r2||r2===r3||r1===r3){recordGame('Slots',bet,true,bet);document.getElementById('slots-msg').innerHTML=`<div class="win-popup">✨ Double! +${(bet*2).toFixed(2)}</div>`;}
        else{recordGame('Slots',bet,false,-bet);document.getElementById('slots-msg').innerHTML=`<div class="lose-popup">No match -${bet.toFixed(2)}</div>`;}
    }},70);
}

// ========== MINES ==========
function minesUI() {
    return `${betHTML('mines')}
        <div class="multi-display"><div class="multi-value" id="m-multi">1.00x</div><div class="multi-label">Current Multiplier</div></div>
        <div class="mines-board" id="m-board"></div>
        <button class="play-button" id="m-start" onclick="startMines()">START</button>
        <button class="play-button hidden" id="m-cash" onclick="cashMines()" style="background:linear-gradient(135deg,var(--green),#059669)">CASH OUT</button>
        <div id="mines-msg" class="mt-12 text-center"></div>`;
}
let mState = {};
function initMines() {
    const board = document.getElementById('m-board');
    board.innerHTML = '';
    for(let i=0;i<25;i++){const c=document.createElement('div');c.className='mine-cell';c.textContent='';c.onclick=()=>revealMine(i);c.id=`mc-${i}`;board.appendChild(c);}
}
function startMines() {
    const bet = getBet('mines'); if (!bet) return;
    mState = { bet, mines: [], revealed: [], multi: 1, active: true };
    while(mState.mines.length<5){const p=Math.floor(Math.random()*25);if(!mState.mines.includes(p))mState.mines.push(p);}
    document.getElementById('m-start').classList.add('hidden');
    document.getElementById('m-cash').classList.remove('hidden');
    document.getElementById('mines-msg').innerHTML='<span class="text-muted">Tap tiles to find 💎</span>';
    initMines();
}
function revealMine(i) {
    if(!mState.active||mState.revealed.includes(i))return;
    mState.revealed.push(i);
    const cell=document.getElementById(`mc-${i}`);
    if(mState.mines.includes(i)){cell.textContent='💣';cell.className='mine-cell revealed-mine';mState.active=false;
        mState.mines.forEach(p=>{document.getElementById(`mc-${p}`).textContent='💣';document.getElementById(`mc-${p}`).className='mine-cell revealed-mine';});
        recordGame('Mines',mState.bet,false,-mState.bet);document.getElementById('mines-msg').innerHTML=`<div class="lose-popup">💣 BOOM! -${mState.bet.toFixed(2)}</div>`;
        document.getElementById('m-cash').classList.add('hidden');document.getElementById('m-start').classList.remove('hidden');
    } else {cell.textContent='💎';cell.className='mine-cell revealed-gem';mState.multi*=1.2;document.getElementById('m-multi').textContent=mState.multi.toFixed(2)+'x';}
}
function cashMines() {
    if(!mState.active)return;mState.active=false;
    const profit=mState.bet*mState.multi-mState.bet;
    recordGame('Mines',mState.bet,true,profit);
    document.getElementById('mines-msg').innerHTML=`<div class="win-popup">💎 +${(mState.bet*mState.multi).toFixed(2)} (${mState.multi.toFixed(2)}x)</div>`;
    mState.mines.forEach(p=>{document.getElementById(`mc-${p}`).textContent='💣';document.getElementById(`mc-${p}`).className='mine-cell revealed-mine';});
    document.getElementById('m-cash').classList.add('hidden');document.getElementById('m-start').classList.remove('hidden');
}

// ========== HI-LO ==========
function hiloUI(){return `${betHTML('hilo')}<div class="result-area" id="hilo-card" style="font-size:64px">🂠</div><div class="choice-row"><button class="choice-btn" onclick="playHilo('hi')">⬆️ Higher</button><button class="choice-btn" onclick="playHilo('lo')">⬇️ Lower</button></div><div id="hilo-msg" class="mt-12 text-center"></div>`;}
function playHilo(choice){const bet=getBet('hilo');if(!bet)return;const cards=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];const v1=Math.floor(Math.random()*13);const v2=Math.floor(Math.random()*13);const won=(choice==='hi'&&v2>v1)||(choice==='lo'&&v2<v1);const display=document.getElementById('hilo-card');display.textContent=`${cards[v2]}♠️`;
if(won){recordGame('Hi-Lo',bet,true,bet*0.9);document.getElementById('hilo-msg').innerHTML=`<div class="win-popup">${cards[v1]}→${cards[v2]} +${(bet*1.9).toFixed(2)}</div>`;}
else{recordGame('Hi-Lo',bet,false,-bet);document.getElementById('hilo-msg').innerHTML=`<div class="lose-popup">${cards[v1]}→${cards[v2]} -${bet.toFixed(2)}</div>`;}}

// ========== PLINKO ==========
function plinkoUI(){return `${betHTML('plinko')}<div class="result-area" id="plinko-res" style="font-size:32px">⚪ Drop the ball!</div><button class="play-button" onclick="playPlinko()">DROP!</button><div id="plinko-msg" class="mt-12 text-center"></div>`;}
function playPlinko(){const bet=getBet('plinko');if(!bet)return;const mults=[0.2,0.5,1,1.5,2,3,5,8,16,8,5,3,2,1.5,1,0.5,0.2];const weights=[8,7,6,5,4,3,2,1,0.5,1,2,3,4,5,6,7,8];const total=weights.reduce((a,b)=>a+b);let r=Math.random()*total,idx=0;for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0){idx=i;break;}}
const mult=mults[idx];const profit=bet*mult-bet;const res=document.getElementById('plinko-res');res.textContent='⚪ ...';
setTimeout(()=>{res.textContent=`${mult}x`;if(profit>=0){recordGame('Plinko',bet,true,profit);document.getElementById('plinko-msg').innerHTML=`<div class="win-popup">${mult}x! +${(bet*mult).toFixed(2)}</div>`;}
else{recordGame('Plinko',bet,false,profit);document.getElementById('plinko-msg').innerHTML=`<div class="lose-popup">${mult}x -${(-profit).toFixed(2)}</div>`;}},1000);}

// ========== CRASH ==========
function crashUI(){return `${betHTML('crash')}<div class="multi-display"><div class="multi-value" id="crash-m">1.00x</div><div class="multi-label">Multiplier</div></div><button class="play-button" id="crash-go" onclick="playCrash()">START</button><button class="play-button hidden" id="crash-stop" onclick="stopCrash()" style="background:linear-gradient(135deg,var(--green),#059669)">CASH OUT</button><div id="crash-msg" class="mt-12 text-center"></div>`;}
let crashState={};
function playCrash(){const bet=getBet('crash');if(!bet)return;crashState={bet,multi:1,active:true,crashed:false};const crashAt=1+Math.random()*10*(Math.random()<0.3?0.5:1);
document.getElementById('crash-go').classList.add('hidden');document.getElementById('crash-stop').classList.remove('hidden');document.getElementById('crash-msg').innerHTML='';
const tick=setInterval(()=>{if(!crashState.active){clearInterval(tick);return;}crashState.multi+=0.05;document.getElementById('crash-m').textContent=crashState.multi.toFixed(2)+'x';
if(crashState.multi>=crashAt){clearInterval(tick);crashState.active=false;crashState.crashed=true;document.getElementById('crash-m').textContent='💥';recordGame('Crash',bet,false,-bet);document.getElementById('crash-msg').innerHTML=`<div class="lose-popup">Crashed at ${crashAt.toFixed(2)}x! -${bet.toFixed(2)}</div>`;document.getElementById('crash-stop').classList.add('hidden');document.getElementById('crash-go').classList.remove('hidden');}},100);}
function stopCrash(){if(!crashState.active)return;crashState.active=false;const profit=crashState.bet*crashState.multi-crashState.bet;recordGame('Crash',crashState.bet,true,profit);document.getElementById('crash-msg').innerHTML=`<div class="win-popup">Cashed at ${crashState.multi.toFixed(2)}x! +${(crashState.bet*crashState.multi).toFixed(2)}</div>`;document.getElementById('crash-stop').classList.add('hidden');document.getElementById('crash-go').classList.remove('hidden');}

// ========== WHEEL ==========
function wheelUI(){return `${betHTML('wheel')}<div class="result-area" id="wheel-res" style="font-size:48px">🎡</div><button class="play-button" onclick="playWheel()">SPIN!</button><div id="wheel-msg" class="mt-12 text-center"></div>`;}
function playWheel(){const bet=getBet('wheel');if(!bet)return;const segments=[{m:0,e:'💀'},{m:1.5,e:'🟢'},{m:2,e:'🔵'},{m:0,e:'💀'},{m:3,e:'🟡'},{m:1.5,e:'🟢'},{m:0,e:'💀'},{m:5,e:'🟠'},{m:1.5,e:'🟢'},{m:0,e:'💀'},{m:2,e:'🔵'},{m:10,e:'🔴'},{m:0,e:'💀'},{m:1.5,e:'🟢'},{m:50,e:'💎'},{m:0,e:'💀'}];
const res=document.getElementById('wheel-res');let c=0;const spd=setInterval(()=>{res.textContent=segments[Math.floor(Math.random()*segments.length)].e;if(++c>25){clearInterval(spd);
const idx=Math.floor(Math.random()*segments.length);const seg=segments[idx];res.textContent=seg.e;
if(seg.m>0){const profit=bet*seg.m-bet;recordGame('Wheel',bet,true,profit);document.getElementById('wheel-msg').innerHTML=`<div class="win-popup">${seg.m}x! +${(bet*seg.m).toFixed(2)}</div>`;}
else{recordGame('Wheel',bet,false,-bet);document.getElementById('wheel-msg').innerHTML=`<div class="lose-popup">💀 -${bet.toFixed(2)}</div>`;}}},80);}

// ========== KENO ==========
function kenoUI(){return `${betHTML('keno')}<div id="keno-board" style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-width:320px;margin:12px auto;"></div><button class="play-button" onclick="playKeno()">DRAW!</button><div id="keno-msg" class="mt-12 text-center"></div>`;}
let kenoSelected=[];
function initKeno(){const board=document.getElementById('keno-board');board.innerHTML='';kenoSelected=[];for(let i=1;i<=40;i++){const c=document.createElement('div');c.style.cssText='padding:8px;background:var(--bg2);border-radius:6px;text-align:center;font-size:12px;font-weight:700;cursor:pointer;border:1px solid var(--bg4);';c.textContent=i;c.onclick=()=>{if(kenoSelected.includes(i)){kenoSelected=kenoSelected.filter(x=>x!==i);c.style.borderColor='var(--bg4)';c.style.background='var(--bg2)';}else if(kenoSelected.length<10){kenoSelected.push(i);c.style.borderColor='var(--accent)';c.style.background='rgba(139,92,246,0.2)';}};board.appendChild(c);}}
function playKeno(){if(kenoSelected.length<3)return alert('Pick at least 3 numbers!');const bet=getBet('keno');if(!bet)return;let drawn=[];while(drawn.length<10){const n=Math.floor(Math.random()*40)+1;if(!drawn.includes(n))drawn.push(n);}
const hits=kenoSelected.filter(n=>drawn.includes(n)).length;const mults={0:0,1:0,2:1,3:2,4:5,5:10,6:20,7:30,8:40,9:50,10:100};const mult=mults[hits]||0;
if(mult>0){const profit=bet*mult-bet;recordGame('Keno',bet,true,profit);document.getElementById('keno-msg').innerHTML=`<div class="win-popup">${hits} hits! ${mult}x +${(bet*mult).toFixed(2)}</div>`;}
else{recordGame('Keno',bet,false,-bet);document.getElementById('keno-msg').innerHTML=`<div class="lose-popup">${hits} hits. -${bet.toFixed(2)}</div>`;}}

// ========== ROULETTE ==========
function rouletteUI(){return `${betHTML('roul')}<div class="result-area" id="roul-res" style="font-size:48px">🔴</div><div class="choice-row"><button class="choice-btn" id="r-red" onclick="this.classList.add('selected');document.getElementById('r-blk').classList.remove('selected');document.getElementById('r-grn').classList.remove('selected')">🔴 Red</button><button class="choice-btn" id="r-blk" onclick="this.classList.add('selected');document.getElementById('r-red').classList.remove('selected');document.getElementById('r-grn').classList.remove('selected')">⚫ Black</button><button class="choice-btn" id="r-grn" onclick="this.classList.add('selected');document.getElementById('r-red').classList.remove('selected');document.getElementById('r-blk').classList.remove('selected')">🟢 Green (36x)</button></div><button class="play-button" onclick="playRoul()">SPIN!</button><div id="roul-msg" class="mt-12 text-center"></div>`;}
function playRoul(){const red=document.getElementById('r-red').classList.contains('selected');const blk=document.getElementById('r-blk').classList.contains('selected');const grn=document.getElementById('r-grn').classList.contains('selected');if(!red&&!blk&&!grn)return alert('Pick a color!');
const bet=getBet('roul');if(!bet)return;const res=document.getElementById('roul-res');let c=0;const colors=['🔴','⚫','🔴','⚫','🟢','🔴','⚫','🔴','⚫','🔴','⚫'];
const anim=setInterval(()=>{res.textContent=colors[Math.floor(Math.random()*colors.length)];if(++c>20){clearInterval(anim);
const rand=Math.random();let result;if(rand<0.027)result='green';else if(rand<0.514)result='red';else result='black';
res.textContent=result==='green'?'🟢':result==='red'?'🔴':'⚫';
const won=(red&&result==='red')||(blk&&result==='black')||(grn&&result==='green');
if(won){const mult=grn?35:0.9;const profit=bet*mult;recordGame('Roulette',bet,true,profit);document.getElementById('roul-msg').innerHTML=`<div class="win-popup">${result.toUpperCase()}! +${(bet*(grn?36:1.9)).toFixed(2)}</div>`;}
else{recordGame('Roulette',bet,false,-bet);document.getElementById('roul-msg').innerHTML=`<div class="lose-popup">${result.toUpperCase()}! -${bet.toFixed(2)}</div>`;}}},70);}
