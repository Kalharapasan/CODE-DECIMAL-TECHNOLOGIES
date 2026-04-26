document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================
  // LOADER
  // ============================================
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
    }, 1500);
  });

   // ============================================
  // PARTICLES ANIMATION
  // ============================================
  const particlesContainer = document.getElementById('particles');
  if (particlesContainer) {
    for (let i = 0; i < 60; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particlesContainer.appendChild(particle);
    }
  }

  /* ===== SCROLL PROGRESS BAR ===== */
  const prog = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    if (!prog) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (window.pageYOffset / h * 100) + '%';
  }, { passive: true });

  /* ===== NAVBAR ===== */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.pageYOffset > 60);
  }, { passive: true });

  /* ===== MOBILE MENU ===== */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('active'));
    mobileMenu.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => mobileMenu.classList.remove('active'))
    );
  }

  /* ===== SMOOTH SCROLL ===== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) window.scrollTo({ top: target.offsetTop - 78, behavior: 'smooth' });
    });
  });

  /* ===== FADE-IN OBSERVER ===== */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  /* ===== STAGGER CHILDREN ===== */
  document.querySelectorAll('.expertise-grid, .contact-cards').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.classList.add('fade-in');
      child.style.transitionDelay = (i * 0.08) + 's';
      observer.observe(child);
    });
  });

  /* ===== ANIMATED COUNTERS ===== */
  function animateCounter(el, target, duration = 1800) {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) {
    const statsObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('strong[data-target]').forEach(el => {
            animateCounter(el, parseInt(el.getAttribute('data-target')));
          });
          statsObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statsObs.observe(statsSection);
  }

  /* ===== BACK TO TOP ===== */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.pageYOffset > 350);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ===== CARD TILT MICRO-INTERACTION ===== */
  document.querySelectorAll('.expertise-card, .contact-info-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      card.style.transform = `translateY(-8px) rotateX(${-y}deg) rotateY(${x}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ===== ACTIVE NAV HIGHLIGHT ===== */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.pageYOffset >= s.offsetTop - 120) current = s.getAttribute('id');
    });
    navLinks.forEach(a => {
      a.style.color = a.getAttribute('href') === '#' + current ? 'var(--cyan)' : '';
    });
  }, { passive: true });

});
