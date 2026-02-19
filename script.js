/* =============================================
   PERSONAL WEBSITE — ANIMATIONS & INTERACTIVITY
   ============================================= */

// ── PARTICLE CANVAS ──────────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }

    reset(init = false) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.6 + 0.2);
      this.r  = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.life  = 0;
      this.maxLife = Math.random() * 200 + 100;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset();
    }

    draw() {
      const progress = this.life / this.maxLife;
      const fade = progress < 0.1 ? progress / 0.1
                 : progress > 0.8 ? 1 - (progress - 0.8) / 0.2
                 : 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(192, 112, 56, ${this.alpha * fade})`;
      ctx.fill();
    }
  }

  // Connection lines
  function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(192, 112, 56, ${(1 - dist / maxDist) * 0.1})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(tick);
  }

  resize();
  for (let i = 0; i < 80; i++) particles.push(new Particle());
  tick();
  window.addEventListener('resize', resize);

  // Mouse interaction
  let mouse = { x: -1000, y: -1000 };
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    // Repel nearby particles
    particles.forEach(p => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 80) {
        p.vx += (dx / d) * 0.5;
        p.vy += (dy / d) * 0.5;
      }
    });
  });
})();

// ── TYPEWRITER EFFECT ─────────────────────────────────────────────────────────
(function typewriter() {
  const el = document.getElementById('roleText');
  if (!el) return;
  const roles = [
    'Landscape Photographer',
    'Portrait & Wedding Photographer',
    'Fine Art Print Maker',
    'Idaho Native & Explorer',
  ];
  let roleIdx = 0, charIdx = 0, deleting = false;

  function type() {
    const current = roles[roleIdx];
    if (!deleting) {
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        setTimeout(() => { deleting = true; type(); }, 2000);
        return;
      }
    } else {
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        roleIdx  = (roleIdx + 1) % roles.length;
      }
    }
    setTimeout(type, deleting ? 40 : 80);
  }

  setTimeout(type, 1000);
})();

// ── NAVBAR SCROLL EFFECT ──────────────────────────────────────────────────────
(function navScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

// ── BURGER MENU ───────────────────────────────────────────────────────────────
(function burgerMenu() {
  const burger = document.getElementById('burger');
  const links  = document.querySelector('.nav__links');
  if (!burger || !links) return;

  burger.addEventListener('click', () => {
    const open = links.style.display === 'flex';
    links.style.display = open ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '72px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(10,10,15,0.97)';
    links.style.padding = '20px 2.5rem';
    links.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
    links.style.backdropFilter = 'blur(20px)';
    if (!open) {
      links.style.animation = 'fadeInDown 0.3s ease both';
    }
  });

  // Close menu on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => { links.style.display = 'none'; });
  });
})();

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
(function scrollReveal() {
  const items = document.querySelectorAll('.scroll-reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), +delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  items.forEach(el => observer.observe(el));
})();

// ── SKILL BAR ANIMATION ───────────────────────────────────────────────────────
(function skillBars() {
  const bars = document.querySelectorAll('.skill-bar__fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = bar.dataset.width + '%';
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });

  bars.forEach(b => observer.observe(b));
})();

// ── COUNTER ANIMATION ─────────────────────────────────────────────────────────
(function counters() {
  const nums = document.querySelectorAll('.stat__number');
  if (!nums.length) return;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = +el.dataset.target;
      const start  = performance.now();
      const dur    = 1500;

      function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / dur, 1);
        el.textContent = Math.round(easeOut(progress) * target);
        if (progress < 1) requestAnimationFrame(animate);
        else el.textContent = target;
      }

      requestAnimationFrame(animate);
      observer.unobserve(el);
    });
  }, { threshold: 0.7 });

  nums.forEach(n => observer.observe(n));
})();

// ── CONTACT FORM ──────────────────────────────────────────────────────────────
(function contactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn  = form.querySelector('button[type="submit"]');
    const span = btn.querySelector('span');
    const orig = span.textContent;

    // Loading state
    btn.disabled = true;
    span.textContent = 'Sending…';
    btn.style.opacity = '0.7';

    setTimeout(() => {
      span.textContent = 'Message Sent! ✓';
      btn.style.opacity = '1';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

      setTimeout(() => {
        span.textContent = orig;
        btn.disabled = false;
        btn.style.background = '';
        form.reset();
      }, 3000);
    }, 1200);
  });
})();

// ── SMOOTH ANCHOR SCROLL ──────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── CURSOR GLOW EFFECT ────────────────────────────────────────────────────────
(function cursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip touch devices

  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9999;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(192,112,56,0.07) 0%, transparent 70%);
    border-radius: 50%; transform: translate(-50%, -50%);
    transition: left 0.12s ease, top 0.12s ease;
    will-change: left, top;
  `;
  document.body.appendChild(glow);

  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
})();

// ── CARD TILT EFFECT ─────────────────────────────────────────────────────────
(function cardTilt() {
  const cards = document.querySelectorAll('.project-card, .skill-card');
  if (!cards.length || window.matchMedia('(pointer: coarse)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(800px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => card.style.transition = '', 500);
    });
  });
})();

// ── PORTFOLIO FILTER ──────────────────────────────────────────────────────────
(function portfolioFilter() {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.photo-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });
})();

// ── SECTION ACTIVE HIGHLIGHT ──────────────────────────────────────────────────
(function activeNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__links a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.nav__links a[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();
