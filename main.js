document.addEventListener('DOMContentLoaded', function () {

  function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }

  // Register loader close handlers immediately so the load event is never missed.
  window.addEventListener('load', () => {
    setTimeout(hideLoader, 1500);
  });

  // Fail-safe: hide loader even if some resource delays or blocks load.
  setTimeout(hideLoader, 5000);

  function initTeamAutoScroll() {
    const teamGrid = document.getElementById('team-grid');
    if (!teamGrid || teamGrid.dataset.autoScrollInit === '1') return;

    teamGrid.dataset.autoScrollInit = '1';

    let rafId = null;
    let lastTs = 0;
    let paused = false;
    const speedPxPerMs = 0.085;

    function step(ts) {
      if (!lastTs) lastTs = ts;
      const delta = ts - lastTs;
      lastTs = ts;

      const maxScroll = Math.max(0, teamGrid.scrollWidth - teamGrid.clientWidth);
      if (!paused && maxScroll > 0) {
        teamGrid.scrollLeft += speedPxPerMs * delta;
        if (teamGrid.scrollLeft >= maxScroll - 1) {
          teamGrid.scrollLeft = 0;
        }
      }

      rafId = requestAnimationFrame(step);
    }

    function pauseScroll() {
      paused = true;
    }

    function resumeScroll() {
      paused = false;
      lastTs = 0;
    }

    teamGrid.addEventListener('mouseenter', pauseScroll);
    teamGrid.addEventListener('mouseleave', resumeScroll);
    teamGrid.addEventListener('touchstart', pauseScroll, { passive: true });
    teamGrid.addEventListener('touchend', resumeScroll, { passive: true });
    teamGrid.addEventListener('focusin', pauseScroll);
    teamGrid.addEventListener('focusout', resumeScroll);

    window.addEventListener('beforeunload', () => {
      if (rafId) cancelAnimationFrame(rafId);
    });

    rafId = requestAnimationFrame(step);
  }

  // Load JSON-managed site content so users can update text/cards from a single file.
  async function loadContentData() {
    try {
      const response = await fetch('./Assets/data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data || typeof data !== 'object') return;

      const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el && typeof value === 'string' && value.trim()) el.textContent = value;
      };

      const setHtml = (id, value) => {
        const el = document.getElementById(id);
        if (el && typeof value === 'string' && value.trim()) el.innerHTML = value;
      };

      const heroData = data.hero;
      if (heroData) {
        setHtml('hero-label', heroData.labelHtml);
        setHtml('hero-title', heroData.titleHtml);
        setText('hero-desc', heroData.description);
        setHtml('hero-primary-btn', `${heroData.primaryButtonText || 'Get Started'} <i class="fas fa-arrow-right"></i>`);
        setText('hero-secondary-btn', heroData.secondaryButtonText);
      }

      const aboutData = data.aboutUs;
      const aboutTitle = document.getElementById('about-title');
      if (aboutTitle && aboutData && typeof aboutData.titleHtml === 'string' && aboutData.titleHtml.trim()) {
        aboutTitle.innerHTML = aboutData.titleHtml;
      }

      const aboutContent = document.getElementById('about-content');
      if (aboutContent && aboutData && Array.isArray(aboutData.paragraphs)) {
        aboutContent.innerHTML = '';
        aboutData.paragraphs.forEach((paragraph) => {
          if (typeof paragraph !== 'string' || !paragraph.trim()) return;
          const p = document.createElement('p');
          p.textContent = paragraph;
          aboutContent.appendChild(p);
        });
      }

      const servicesData = data.services;
      if (servicesData) {
        setText('services-label', servicesData.label);
        setHtml('services-title', servicesData.titleHtml);
        setText('services-subtitle', servicesData.subtitle);

        const servicesGrid = document.getElementById('services-grid');
        if (servicesGrid && Array.isArray(servicesData.cards)) {
          servicesGrid.innerHTML = '';
          servicesData.cards.forEach((card, index) => {
            if (!card || typeof card !== 'object') return;
            const cardEl = document.createElement('div');
            const colorClass = card.colorClass || `card-color-${index + 1}`;
            const soloClass = card.solo ? ' card-solo' : '';
            cardEl.className = `expertise-card ${colorClass}${soloClass}`;
            cardEl.innerHTML = `
              <div class="expertise-top">
                <div class="expertise-icon"><i class="${card.icon || 'fas fa-cogs'}"></i></div>
              </div>
              <h3>${card.title || ''}</h3>
              <p>${card.description || ''}</p>
              <a href="${card.href || '#contact'}" class="read-more">${card.readMoreText || 'Read More'} <i class="fas fa-angle-double-right"></i></a>
            `;
            servicesGrid.appendChild(cardEl);
          });
        }
      }

      const teamData = data.team;
      if (teamData) {
        setText('team-label', teamData.label);
        setHtml('team-title', teamData.titleHtml);
        setText('team-subtitle', teamData.subtitle);

        const teamGrid = document.getElementById('team-grid');
        if (teamGrid && Array.isArray(teamData.members)) {
          teamGrid.innerHTML = '';
          teamData.members.forEach((member) => {
            if (!member || typeof member !== 'object') return;
            const theme = member.theme === 'orange' ? 'orange' : 'teal';
            const isLegal = Boolean(member.isLegalCard);
            const card = document.createElement('div');
            card.className = `leader-card leader-card-${theme}${isLegal ? ' leader-card-legal' : ''}`;

            const socials = Array.isArray(member.socials)
              ? member.socials.map((social) => `
                  <a href="${social.href || '#'}" class="leader-social-btn lsb-${theme}" title="${social.title || ''}"${social.targetBlank ? ' target="_blank"' : ''}>
                    <i class="${social.icon || 'fas fa-link'}"></i>
                  </a>`).join('')
              : '';

            card.innerHTML = `
              <div class="leader-accent-bar"></div>
              ${member.image ? `<div class="leader-photo-wrap"><img src="${member.image}" alt="${member.name || 'Leader'}" class="leader-photo"></div>` : ''}
              <div class="leader-info">
                <h3 class="leader-name">${member.name || ''}</h3>
                <p class="leader-title">${member.title || ''}</p>
                <div class="leader-divider"></div>
                ${member.email ? `
                <div class="leader-email-row">
                  <span class="leader-email-icon ${theme}-icon"><i class="fas fa-envelope"></i></span>
                  <a href="mailto:${member.email}" class="leader-email-text">${member.email}</a>
                </div>` : ''}
                <div class="leader-socials">${socials}</div>
              </div>
            `;

            teamGrid.appendChild(card);
          });

          initTeamAutoScroll();
        }
      }

      const footerData = data.footer;
      if (footerData) {
        setText('footer-vision-title', footerData.visionTitle);
        setText('footer-vision-text', footerData.visionText);
        setText('footer-contact-label', footerData.contactLabel);

        const footerContactEmail = document.getElementById('footer-contact-email');
        if (footerContactEmail && typeof footerData.contactEmail === 'string' && footerData.contactEmail.trim()) {
          footerContactEmail.textContent = footerData.contactEmail;
          footerContactEmail.href = `mailto:${footerData.contactEmail}`;
        }

        setText('footer-mission-title', footerData.missionTitle);
        setText('footer-mission-text', footerData.missionText);
        setText('footer-follow-title', footerData.followTitle);
        setText('footer-address-title', footerData.addressTitle);
        setHtml('footer-address-text', footerData.addressHtml);
        setHtml('footer-copyright', footerData.copyrightHtml);

        const footerMissionList = document.getElementById('footer-mission-list');
        if (footerMissionList && Array.isArray(footerData.missionContacts)) {
          footerMissionList.innerHTML = '';
          footerData.missionContacts.forEach((item) => {
            const a = document.createElement('a');
            a.className = 'mission-contact-item';
            a.href = item.href || '#';
            if (item.targetBlank) a.target = '_blank';
            a.innerHTML = `<i class="${item.icon || 'fas fa-link'}"></i><span>${item.text || ''}</span>`;
            footerMissionList.appendChild(a);
          });
        }

        const footerSocials = document.getElementById('footer-socials');
        if (footerSocials && Array.isArray(footerData.socialLinks)) {
          footerSocials.innerHTML = '';
          footerData.socialLinks.forEach((item) => {
            const a = document.createElement('a');
            a.className = 'social-btn';
            a.href = item.href || '#';
            if (item.targetBlank) a.target = '_blank';
            a.innerHTML = `<i class="${item.icon || 'fas fa-link'}"></i>`;
            footerSocials.appendChild(a);
          });
        }

        const footerBottomLinks = document.getElementById('footer-bottom-links');
        if (footerBottomLinks && Array.isArray(footerData.bottomLinks)) {
          footerBottomLinks.innerHTML = '';
          footerData.bottomLinks.forEach((item, index) => {
            const link = document.createElement('a');
            link.href = item.href || '#';
            link.textContent = item.label || '';
            footerBottomLinks.appendChild(link);
            if (index < footerData.bottomLinks.length - 1) {
              const sep = document.createElement('span');
              sep.textContent = '|';
              footerBottomLinks.appendChild(sep);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Unable to load content from Assets/data.json', error);
    }
  }

  loadContentData();
  setTimeout(initTeamAutoScroll, 600);

  // ============================================================
  // 1. LOADER
  // ============================================================
  // Loader handlers are set at the top of this file.

  // ============================================================
  // 2. PARTICLES ANIMATION
  // ============================================================
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

  // ============================================================
  // 3. SCROLL PROGRESS BAR
  // ============================================================
  const prog = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    if (!prog) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (window.pageYOffset / h * 100) + '%';
  }, { passive: true });

  // ============================================================
  // 4. NAVBAR — scroll class + hide/show on direction
  // ============================================================
  const navbar = document.getElementById('navbar');
  let lastScrollY = 0;
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    const current = window.pageYOffset;
    navbar.classList.toggle('scrolled', current > 60);
    // Hide navbar when scrolling down quickly, show on scroll up
    if (current > lastScrollY + 8 && current > 200) {
      navbar.style.transform = 'translateY(-100%)';
    } else if (current < lastScrollY - 4 || current < 80) {
      navbar.style.transform = 'translateY(0)';
    }
    lastScrollY = current;
  }, { passive: true });

  // ============================================================
  // 5. MOBILE MENU — with hamburger → X animation + ESC to close
  // ============================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu   = document.getElementById('mobileMenu');

  function openMobileMenu() {
    mobileMenu.classList.add('active');
    mobileMenuBtn.classList.add('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuBtn.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.addEventListener('click', () =>
      mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu()
    );
    mobileMenu.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', closeMobileMenu)
    );
  }

  // Hamburger → X CSS injection
  const hamburgerStyle = document.createElement('style');
  hamburgerStyle.textContent = `
    .mobile-menu-btn.open span:nth-child(1) {
      transform: translateY(7.5px) rotate(45deg);
    }
    .mobile-menu-btn.open span:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }
    .mobile-menu-btn.open span:nth-child(3) {
      transform: translateY(-7.5px) rotate(-45deg);
    }
    .mobile-menu-btn span {
      transition: transform 0.3s ease, opacity 0.2s ease;
    }
    .desktop-nav a::after {
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  document.head.appendChild(hamburgerStyle);

  // ============================================================
  // 6. KEYBOARD ACCESSIBILITY — ESC closes overlays
  // ============================================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeSearch();
    }
  });

  // ============================================================
  // 7. SMOOTH SCROLL
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) window.scrollTo({ top: target.offsetTop - 78, behavior: 'smooth' });
    });
  });

  // ============================================================
  // 8. FADE-IN OBSERVER
  // ============================================================
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Stagger children in grids
  document.querySelectorAll('.expertise-grid, .contact-cards, .leadership-grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.classList.add('fade-in');
      child.style.transitionDelay = (i * 0.09) + 's';
      observer.observe(child);
    });
  });

  // ============================================================
  // 9. ANIMATED COUNTERS
  // ============================================================
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

  // ============================================================
  // 10. BACK TO TOP — with magnetic hover effect
  // ============================================================
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.pageYOffset > 350);
    }, { passive: true });

    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Magnetic effect
    backToTop.addEventListener('mousemove', (e) => {
      const rect = backToTop.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.35;
      const dy = (e.clientY - cy) * 0.35;
      backToTop.style.transform = `translateY(-4px) translate(${dx}px, ${dy}px)`;
    });
    backToTop.addEventListener('mouseleave', () => {
      backToTop.style.transform = '';
    });
  }

  // ============================================================
  // 11. CARD TILT MICRO-INTERACTION (improved — smooth reset)
  // ============================================================
  document.querySelectorAll('.expertise-card, .contact-info-card, .leader-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
      card.style.transform = `translateY(-8px) rotateX(${-y}deg) rotateY(${x}deg) scale(1.02)`;
      card.style.transition = 'transform 0.08s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
  });

  // ============================================================
  // 12. ACTIVE NAV HIGHLIGHT
  // ============================================================
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.desktop-nav a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.pageYOffset >= s.offsetTop - 130) current = s.getAttribute('id');
    });
    navLinks.forEach(a => {
      a.style.color = a.getAttribute('href') === '#' + current ? 'var(--cyan)' : '';
    });
  }, { passive: true });

  // ============================================================
  // 13. TYPED TEXT EFFECT — Hero headline cycling phrases
  // ============================================================
  const typedEl = document.querySelector('.hero-title em');
  if (typedEl) {
    const phrases = ['smart software', 'innovation', 'digital growth', 'your future'];
    let phraseIndex = 0;
    let charIndex   = 0;
    let deleting    = false;
    let pauseTimer  = null;

    // Inject cursor style
    const typedStyle = document.createElement('style');
    typedStyle.textContent = `
      .hero-title em::after {
        content: '|';
        animation: blink 0.75s step-end infinite;
        font-style: normal;
        color: var(--cyan, #06b6d4);
        margin-left: 2px;
      }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    `;
    document.head.appendChild(typedStyle);

    function type() {
      const phrase = phrases[phraseIndex];
      if (deleting) {
        typedEl.textContent = phrase.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typedEl.textContent = phrase.substring(0, charIndex + 1);
        charIndex++;
      }

      let delay = deleting ? 55 : 95;

      if (!deleting && charIndex === phrase.length) {
        delay = 1800; // pause at full word
        deleting = true;
      } else if (deleting && charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = 400;
      }

      pauseTimer = setTimeout(type, delay);
    }

    // Start after a short delay so the page settles
    setTimeout(type, 2200);
  }

  // ============================================================
  // 14. PARALLAX — Hero blobs follow mouse
  // ============================================================
  const heroSection = document.querySelector('.hero');
  const blob1 = document.querySelector('.hero-blob-1');
  const blob2 = document.querySelector('.hero-blob-2');

  if (heroSection && blob1 && blob2) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width  - 0.5; // –0.5 to 0.5
      const ny = (e.clientY - rect.top)  / rect.height - 0.5;
      blob1.style.transform = `translate(${nx * 28}px, ${ny * 22}px)`;
      blob2.style.transform = `translate(${nx * -22}px, ${ny * 18}px)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      blob1.style.transform = '';
      blob2.style.transform = '';
    });

    // Add smooth transition to blobs via CSS
    const blobStyle = document.createElement('style');
    blobStyle.textContent = `
      .hero-blob-1, .hero-blob-2 {
        transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
    `;
    document.head.appendChild(blobStyle);
  }

  // ============================================================
  // 15. SCROLL PARALLAX — subtle vertical on hero SVG
  // ============================================================
  const heroSvg = document.querySelector('.hero-svg');
  if (heroSvg) {
    window.addEventListener('scroll', () => {
      const offset = window.pageYOffset * 0.18;
      heroSvg.style.transform = `translateY(${offset}px)`;
    }, { passive: true });
  }

  // ============================================================
  // 16. RIPPLE EFFECT — on all CTA buttons
  // ============================================================
  function createRipple(e, btn) {
    const existing = btn.querySelector('.ripple-wave');
    if (existing) existing.remove();

    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();

    circle.className = 'ripple-wave';
    circle.style.cssText = `
      position: absolute;
      border-radius: 50%;
      width: ${diameter}px;
      height: ${diameter}px;
      left: ${e.clientX - rect.left - diameter / 2}px;
      top: ${e.clientY - rect.top - diameter / 2}px;
      background: rgba(255,255,255,0.28);
      transform: scale(0);
      animation: rippleAnim 0.55s linear;
      pointer-events: none;
    `;
    btn.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
  }

  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    .btn-primary, .btn-ghost, .read-more { position: relative; overflow: hidden; }
    @keyframes rippleAnim {
      to { transform: scale(2.8); opacity: 0; }
    }
  `;
  document.head.appendChild(rippleStyle);

  document.querySelectorAll('.btn-primary, .btn-ghost, .read-more').forEach(btn => {
    btn.addEventListener('click', (e) => createRipple(e, btn));
  });

  // ============================================================
  // 17. SEARCH OVERLAY
  // ============================================================
  const searchOverlay = document.createElement('div');
  searchOverlay.id = 'search-overlay';
  searchOverlay.innerHTML = `
    <div class="search-box">
      <button class="search-close" id="searchClose" aria-label="Close search">
        <i class="fas fa-times"></i>
      </button>
      <input type="text" id="searchInput" placeholder="Search services, pages…" autocomplete="off" aria-label="Search">
      <div class="search-results" id="searchResults"></div>
    </div>
  `;
  document.body.appendChild(searchOverlay);

  // Search overlay styles
  const searchStyle = document.createElement('style');
  searchStyle.textContent = `
    #search-overlay {
      position: fixed; inset: 0;
      background: rgba(4, 15, 45, 0.92);
      backdrop-filter: blur(12px);
      z-index: 9998;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 12vh;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    #search-overlay.open {
      opacity: 1;
      visibility: visible;
    }
    .search-box {
      position: relative;
      width: min(620px, 90vw);
      background: #0c1a3a;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 16px;
      padding: 28px 32px 24px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      transform: translateY(-20px);
      transition: transform 0.3s ease;
    }
    #search-overlay.open .search-box { transform: translateY(0); }
    .search-close {
      position: absolute;
      top: 14px; right: 16px;
      background: none; border: none;
      color: rgba(255,255,255,0.5);
      font-size: 1.1rem;
      cursor: pointer;
      padding: 6px;
      transition: color 0.2s;
    }
    .search-close:hover { color: #fff; }
    #searchInput {
      width: 100%;
      background: none;
      border: none;
      border-bottom: 2px solid rgba(59,130,246,0.4);
      color: #fff;
      font-size: 1.35rem;
      font-family: 'DM Sans', sans-serif;
      padding: 10px 0;
      outline: none;
      caret-color: var(--cyan, #06b6d4);
      transition: border-color 0.2s;
    }
    #searchInput:focus { border-color: var(--cyan, #06b6d4); }
    #searchInput::placeholder { color: rgba(255,255,255,0.3); }
    .search-results {
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .search-result-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 10px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-size: 0.95rem;
      font-family: 'DM Sans', sans-serif;
      transition: background 0.2s, color 0.2s;
      cursor: pointer;
    }
    .search-result-item:hover, .search-result-item.focused {
      background: rgba(59,130,246,0.18);
      color: #fff;
    }
    .search-result-item i {
      color: var(--cyan, #06b6d4);
      width: 18px;
      text-align: center;
    }
    .search-hint {
      font-size: 0.78rem;
      color: rgba(255,255,255,0.28);
      margin-top: 14px;
      text-align: right;
      font-family: 'DM Sans', sans-serif;
    }
  `;
  document.head.appendChild(searchStyle);

  // Search data — built from the page's sections
  const searchData = [
    { label: 'Home',             href: '#home',     icon: 'fas fa-house' },
    { label: 'About Us',         href: '#about',    icon: 'fas fa-info-circle' },
    { label: 'Services',         href: '#services', icon: 'fas fa-cogs' },
    { label: 'Team / Leadership',href: '#team',     icon: 'fas fa-users' },
    { label: 'Contact',          href: '#contact',  icon: 'fas fa-envelope' },
    { label: 'Cloud Solutions',  href: '#services', icon: 'fas fa-cloud' },
    { label: 'Cyber Security',   href: '#services', icon: 'fas fa-shield-alt' },
    { label: 'ERP as a Managed Service', href: '#services', icon: 'fas fa-desktop' },
    { label: 'Software Development',     href: '#services', icon: 'fas fa-code' },
    { label: 'Managed Services',         href: '#services', icon: 'fas fa-server' },
    { label: 'Digital Transformation',   href: '#services', icon: 'fas fa-chart-line' },
  ];

  const searchInput   = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  let focusedIdx = -1;

  function renderResults(query) {
    searchResults.innerHTML = '';
    focusedIdx = -1;
    if (!query.trim()) return;
    const matches = searchData.filter(d =>
      d.label.toLowerCase().includes(query.toLowerCase())
    );
    if (!matches.length) {
      searchResults.innerHTML = `<p style="color:rgba(255,255,255,0.35);font-size:0.9rem;padding:8px 14px;font-family:'DM Sans',sans-serif;">No results found.</p>`;
      return;
    }
    matches.forEach(item => {
      const el = document.createElement('a');
      el.className = 'search-result-item';
      el.href = item.href;
      el.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
      el.addEventListener('click', closeSearch);
      searchResults.appendChild(el);
    });
    const hint = document.createElement('p');
    hint.className = 'search-hint';
    hint.textContent = '↑ ↓ navigate · Enter to go · Esc to close';
    searchResults.appendChild(hint);
  }

  // Keyboard navigation inside search
  searchInput && searchInput.addEventListener('keydown', (e) => {
    const items = searchResults.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIdx = Math.min(focusedIdx + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIdx = Math.max(focusedIdx - 1, 0);
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      items[focusedIdx] && items[focusedIdx].click();
      return;
    }
    items.forEach((el, i) => el.classList.toggle('focused', i === focusedIdx));
    items[focusedIdx] && items[focusedIdx].scrollIntoView({ block: 'nearest' });
  });

  searchInput && searchInput.addEventListener('input', () => renderResults(searchInput.value));

  function openSearch() {
    searchOverlay.classList.add('open');
    setTimeout(() => searchInput && searchInput.focus(), 80);
  }

  function closeSearch() {
    searchOverlay.classList.remove('open');
    if (searchInput) { searchInput.value = ''; searchResults.innerHTML = ''; }
  }

  // Hook search button
  const navSearchBtn = document.querySelector('.nav-search-btn');
  navSearchBtn && navSearchBtn.addEventListener('click', openSearch);

  document.getElementById('searchClose') && document.getElementById('searchClose').addEventListener('click', closeSearch);

  // Close on backdrop click
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  // ============================================================
  // 18. DARK MODE TOGGLE
  // ============================================================
  const darkStyle = document.createElement('style');
  darkStyle.textContent = `
    body.dark-mode {
      --bg: #060e1f;
      --white: #0d1b35;
      --blue-pale: #0a1630;
      --text-dark: #e2e8f0;
      --text-mid: #94a3b8;
      --text-light: #64748b;
      background: #060e1f;
    }
    body.dark-mode .expertise-card,
    body.dark-mode .leader-card,
    body.dark-mode .contact-info-card {
      background: #0d1b35 !important;
      border-color: rgba(59,130,246,0.2) !important;
    }
    body.dark-mode .about-section {
      background: #060e1f !important;
    }
    body.dark-mode .services-section,
    body.dark-mode .team-section {
      background: #070f22 !important;
    }
    #dark-toggle {
      position: fixed;
      bottom: 82px;
      right: 24px;
      width: 46px;
      height: 46px;
      background: linear-gradient(135deg, #1e3a8a, #0ea5e9);
      color: white;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      cursor: pointer;
      z-index: 900;
      box-shadow: 0 4px 16px rgba(26, 79, 216, 0.35);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
    }
    #dark-toggle:hover {
      transform: translateY(-4px) rotate(15deg);
      box-shadow: 0 8px 24px rgba(26, 79, 216, 0.5);
    }
  `;
  document.head.appendChild(darkStyle);

  const darkToggle = document.createElement('button');
  darkToggle.id = 'dark-toggle';
  darkToggle.setAttribute('aria-label', 'Toggle dark mode');
  darkToggle.innerHTML = '<i class="fas fa-moon"></i>';
  document.body.appendChild(darkToggle);

  // Persist preference
  const savedTheme = localStorage.getItem('cdtTheme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    darkToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('cdtTheme', isDark ? 'dark' : 'light');
  });

  // ============================================================
  // 19. LAZY LOAD IMAGES with fade-in
  // ============================================================
  const lazyStyle = document.createElement('style');
  lazyStyle.textContent = `
    img[data-src] { opacity: 0; transition: opacity 0.5s ease; }
    img.lazy-loaded { opacity: 1; }
  `;
  document.head.appendChild(lazyStyle);

  const imgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.addEventListener('load', () => img.classList.add('lazy-loaded'), { once: true });
          imgObserver.unobserve(img);
        }
      }
    });
  }, { rootMargin: '100px' });

  document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));

  // ============================================================
  // 20. CURSOR SPOTLIGHT (desktop only)
  // ============================================================
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const spotlight = document.createElement('div');
    spotlight.id = 'cursor-spotlight';
    document.body.appendChild(spotlight);

    const spotStyle = document.createElement('style');
    spotStyle.textContent = `
      #cursor-spotlight {
        position: fixed;
        width: 340px;
        height: 340px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 0;
        background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        transition: opacity 0.4s ease;
        opacity: 0;
      }
    `;
    document.head.appendChild(spotStyle);

    document.addEventListener('mousemove', (e) => {
      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top  = e.clientY + 'px';
      spotlight.style.opacity = '1';
    });
    document.addEventListener('mouseleave', () => {
      spotlight.style.opacity = '0';
    });
  }

  // ============================================================
  // 21. SECTION ENTRANCE — hero content stagger
  // ============================================================
  const heroRight = document.querySelector('.hero-right');
  if (heroRight) {
    const heroStyle = document.createElement('style');
    heroStyle.textContent = `
      .hero-right > * {
        opacity: 0;
        transform: translateY(22px);
        animation: heroEntrance 0.7s ease forwards;
      }
      .hero-right > *:nth-child(1) { animation-delay: 1.6s; }
      .hero-right > *:nth-child(2) { animation-delay: 1.75s; }
      .hero-right > *:nth-child(3) { animation-delay: 1.9s; }
      .hero-right > *:nth-child(4) { animation-delay: 2.05s; }
      @keyframes heroEntrance {
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(heroStyle);
  }

});