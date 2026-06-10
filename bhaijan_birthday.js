/* ══════════════════════════════════
   FIREWORKS ENGINE
══════════════════════════════════ */
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');
let particles_fw = [];
let activeBursts = 0;
let animFrame = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* ── Particle types ── */
class FWParticle {
  constructor(x, y, palette) {
    this.x = x; this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.radius = Math.random() * 2.8 + 1;
    const set = palette[Math.floor(Math.random() * palette.length)];
    this.color = set[Math.floor(Math.random() * set.length)];
    this.gravity = 0.15;
    this.decay = Math.random() * 0.013 + 0.009;
    this.twinkle = Math.random() < 0.25;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.97;
    this.alpha -= this.decay;
    if (this.twinkle) this.alpha += Math.sin(Date.now() * 0.025) * 0.012;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

class Sparkle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 7;
    this.vy = (Math.random() - 0.5) * 7;
    this.alpha = 1;
    this.size = Math.random() * 5 + 3;
    this.color = color;
    this.rot = Math.random() * Math.PI;
    this.gravity = 0.15;
    this.decay = 0.022;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
    this.rot += 0.1;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.size, 0); ctx.lineTo(this.size, 0);
    ctx.moveTo(0, -this.size); ctx.lineTo(0, this.size);
    ctx.stroke();
    ctx.restore();
  }
}

/* ── Core loop — ONE definition, no duplicates ── */
function runAnimation() {
  particles_fw = particles_fw.filter(p => p.alpha > 0);

  // True exit: no pending bursts AND all particles faded
  if (activeBursts === 0 && particles_fw.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animFrame = null;
    return;
  }

  // Trail effect
  ctx.fillStyle = 'rgba(7, 16, 28, 0.20)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles_fw.forEach(p => { p.update(); p.draw(); });

  animFrame = requestAnimationFrame(runAnimation);
}

function ensureLoopRunning() {
  if (!animFrame) animFrame = requestAnimationFrame(runAnimation);
}

/* ── Burst helpers ── */
const PALETTES = {
  fireworks: [
    ['#FFD700', '#FFA500', '#FF6347'],
    ['#00BFFF', '#1E90FF', '#87CEFA'],
    ['#FF69B4', '#FF1493', '#FFB6C1'],
    ['#DA70D6', '#BA55D3', '#EE82EE'],
    ['#C9A84C', '#E8C86A', '#F0EDE6'],
    ['#00FFFF', '#40E0D0', '#AFEEEE'],
    ['#7FFF00', '#32CD32', '#00FA9A'],
    ['#FF4500', '#FF6347', '#FFA07A'],
  ],
  hearts: [['#FF69B4', '#FF1493', '#FF6EB4', '#FFB6C1', '#FF0066']],
  fire: [['#FF4500', '#FF6347', '#FFD700', '#FFA500', '#FF8C00']],
  cry: [['#87CEFA', '#00BFFF', '#1E90FF', '#B0E0E6', '#FFFFFF']],
  strong: [['#C9A84C', '#E8C86A', '#FFD700', '#FFA500', '#FFFFFF']],
  crown: [['#C9A84C', '#FFD700', '#E8C86A', '#FF69B4', '#DA70D6']],
};

function spawnBurst(x, y, count, palette) {
  const pal = palette || PALETTES.fireworks;
  for (let i = 0; i < count; i++) {
    particles_fw.push(new FWParticle(x, y, pal));
  }
  // add sparkles using first colour of palette
  for (let i = 0; i < 6; i++) {
    particles_fw.push(new Sparkle(x, y, pal[0][0]));
  }
}

/* ── Emoji-shaped burst for reactions ── */
function spawnEmojiBurst(x, y, palette) {
  const count = 55;
  for (let i = 0; i < count; i++) {
    const p = new FWParticle(x, y, palette);
    p.radius = Math.random() * 4 + 2;
    particles_fw.push(p);
  }
}

/* ── launchFireworks — main fireworks (onload, celebrate) ── */
function launchFireworks(count = 5) {
  activeBursts++;
  ensureLoopRunning();
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const x = 80 + Math.random() * (canvas.width - 160);
      const y = 60 + Math.random() * (canvas.height * 0.55);
      spawnBurst(x, y, 100, PALETTES.fireworks);
    }, i * 300);
  }
  // deregister after all bursts of this sequence have fired + small buffer
  setTimeout(() => { activeBursts = Math.max(0, activeBursts - 1); }, count * 300 + 100);
}

/* ── reaction burst — 2-3 seconds, theme-coloured ── */
function reactionBurst(x, y, palette) {
  activeBursts++;
  ensureLoopRunning();
  // 3 quick pops spread over 600ms
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const rx = x + (Math.random() - 0.5) * 80;
      const ry = y + (Math.random() - 0.5) * 60;
      spawnEmojiBurst(rx, ry, palette);
    }, i * 200);
  }
  setTimeout(() => { activeBursts = Math.max(0, activeBursts - 1); }, 700);
}

/* ── Public API ── */
function burstFireworks() { launchFireworks(7); }

/* ── Auto-launch on load ── */
window.addEventListener('load', () => setTimeout(() => launchFireworks(5), 600));


/* ══════════════════════════════════
   COUNTDOWN
══════════════════════════════════ */
function updateCountdown() {
  const now = new Date();
  const birthday = new Date(now.getFullYear(), 5, 12);
  if (now > birthday) birthday.setFullYear(birthday.getFullYear() + 1);

  const today = now.getMonth() === 5 && now.getDate() === 12;
  if (today) {
    document.getElementById('countdown-grid').style.display = 'none';
    document.getElementById('bday-msg').style.display = 'block';
    launchFireworks(10);
    return;
  }

  const diff = birthday - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
  document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
  document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);


/* ══════════════════════════════════
   SCROLL FADE-IN
══════════════════════════════════ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up, .tl-item').forEach(el => observer.observe(el));


/* ══════════════════════════════════
   REACTION BAR
══════════════════════════════════ */
const REACTION_PALETTES = {
  '❤️': PALETTES.hearts,
  '🔥': PALETTES.fire,
  '😭': PALETTES.cry,
  '💪': PALETTES.strong,
  '👑': PALETTES.crown,
};

function react(btn, emoji) {
  const countEl = btn.querySelector('.react-count');
  if (btn.classList.contains('reacted')) {
    btn.classList.remove('reacted');
    countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
  } else {
    btn.classList.add('reacted');
    countEl.textContent = parseInt(countEl.textContent) + 1;
    const r = btn.getBoundingClientRect();
    const bx = r.left + r.width / 2;
    const by = r.top + r.height / 2;
    reactionBurst(bx, by, REACTION_PALETTES[emoji] || PALETTES.fireworks);
  }
}


/* ══════════════════════════════════
   FORMSPREE SUBMISSION
══════════════════════════════════ */
const wishForm = document.getElementById('wish-form');
if (wishForm) {
  wishForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const form = this;
    const btn = form.querySelector('.btn-primary');
    btn.textContent = 'Sending... 💛';
    btn.disabled = true;

    try {
      const resp = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      if (resp.ok) {
        form.style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
        launchFireworks(4);
      } else {
        btn.textContent = 'Try Again ❌';
        btn.disabled = false;
      }
    } catch {
      btn.textContent = 'Try Again ❌';
      btn.disabled = false;
    }
  });
}


/* ══════════════════════════════════
   MUSIC PLAYER
══════════════════════════════════ */
const MUSIC_SRC = 'birthdaySong.mp3';

let audioEl = null;
let musicOn = false;

function toggleMusic() {
  const btn = document.getElementById('music-toggle');

  if (!MUSIC_SRC) {
    btn.textContent = '🎵 Add a song first';
    setTimeout(() => { btn.textContent = musicOn ? '🎵 Pause' : '🎵 Play Music'; }, 2000);
    return;
  }

  if (!audioEl) {
    audioEl = new Audio(MUSIC_SRC);
    audioEl.loop = true;
    audioEl.volume = 0.7;
  }

  if (musicOn) {
    audioEl.pause();
    musicOn = false;
    btn.textContent = '🎵 Play Music';
  } else {
    audioEl.play().catch(() => {
      btn.textContent = '🎵 Tap again';
    });
    musicOn = true;
    btn.textContent = '🎵 Pause';
  }
}