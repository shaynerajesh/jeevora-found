/* ============================================================
   JEEVORA FOUNDATION — script.js
   Vanilla JavaScript — Production Ready
   ============================================================ */

'use strict';

/* ---- Utility ---- */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   NAVBAR — scroll behaviour
   ============================================================ */
(function initNavbar() {
  const navbar = qs('#navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============================================================
   HAMBURGER MENU — mobile
   ============================================================ */
(function initHamburger() {
  const btn       = qs('.hamburger');
  const mobileNav = qs('.mobile-nav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    mobileNav.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click
  qsa('a', mobileNav).forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  mobileNav.addEventListener('click', (e) => {
    if (e.target === mobileNav) {
      btn.classList.remove('open');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
})();

/* ============================================================
   SCROLL REVEAL — Intersection Observer
   ============================================================ */
(function initScrollReveal() {
  const selectors = '.reveal, .reveal-left, .reveal-right';
  const elements  = qsa(selectors);
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -48px 0px',
  });

  elements.forEach(el => observer.observe(el));
})();

/* ============================================================
   COUNTER ANIMATION — impact stats
   ============================================================ */
(function initCounters() {
  const counters = qsa('[data-count]');
  if (!counters.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target   = parseFloat(el.dataset.count);
    const duration = 1800;
    const start    = performance.now();

    const step = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = easeOut(progress) * target;

      // Display with commas for thousands
      el.textContent = Math.floor(value).toLocaleString('en-IN');

      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('en-IN');
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ============================================================
   HERO BG — Ken Burns entrance
   ============================================================ */
(function initHeroBg() {
  const bg = qs('.hero-bg-image');
  if (!bg) return;

  // Trigger scale animation after slight delay
  setTimeout(() => bg.classList.add('loaded'), 100);
})();

/* ============================================================
   DONATION SECTION — amount selection
   ============================================================ */
(function initDonation() {
  const amountBtns  = qsa('.amount-btn');
  const customInput = qs('#custom-amount-input');
  let selectedAmount = 1000; // default

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount, 10);

      // Reflect in custom input
      if (customInput) customInput.value = '';
    });
  });

  if (customInput) {
    customInput.addEventListener('input', () => {
      const val = parseInt(customInput.value, 10);
      if (!isNaN(val) && val > 0) {
        amountBtns.forEach(b => b.classList.remove('active'));
        selectedAmount = val;
      }
    });
  }

  // Set first button as active by default
  if (amountBtns.length) amountBtns[0].classList.add('active');

  /* ---- Razorpay Integration ---- */
  const donateBtn = qs('#donate-btn');
  if (!donateBtn) return;

  donateBtn.addEventListener('click', () => {
    const inputVal = customInput ? parseInt(customInput.value, 10) : NaN;
    const amount   = (!isNaN(inputVal) && inputVal > 0) ? inputVal : selectedAmount;

    if (!amount || amount < 1) {
      alert('Please select or enter a valid donation amount.');
      return;
    }

    // Load Razorpay checkout dynamically if not already loaded
    if (typeof Razorpay === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => openRazorpay(amount);
      document.head.appendChild(script);
    } else {
      openRazorpay(amount);
    }
  });

  function openRazorpay(amount) {
    const options = {
      key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your actual Razorpay Key ID
      amount: amount * 100,         // Razorpay expects paise
      currency: 'INR',
      name: 'Jeevora Foundation',
      description: 'Supporting Education, Nourishment & Futures',
      image: 'images/jeevora-logo.svg',
      handler: function(response) {
        showSuccessMessage(response.razorpay_payment_id, amount);
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      notes: {
        purpose: 'Child Education & Welfare',
      },
      theme: {
        color: '#4ea076',
        backdrop_color: 'rgba(9,21,48,0.85)',
      },
      modal: {
        escape: true,
        animation: true,
      },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      alert('Unable to open payment gateway. Please try again.');
    }
  }

  function showSuccessMessage(paymentId, amount) {
    const donateCard = qs('.donate-card');
    if (!donateCard) return;

    donateCard.innerHTML = `
      <div style="text-align:center; padding: 20px 0;">
        <div style="
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(78,160,118,0.15);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
        ">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ea076" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style="
          font-family: 'DM Serif Display', serif;
          font-size: 30px;
          color: #ffffff;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        ">Thank you for your support.</h3>
        <p style="color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.7; max-width: 360px; margin: 0 auto 20px;">
          Your contribution of <strong style="color: #4ea076;">₹${amount.toLocaleString('en-IN')}</strong> will help a child step closer to their future.
        </p>
        <p style="font-size: 12px; color: rgba(255,255,255,0.3);">Payment ID: ${paymentId}</p>
      </div>
    `;
  }
})();

/* ============================================================
   SMOOTH SCROLL — anchor links
   ============================================================ */
(function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = qs(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      const navHeight = qs('#navbar')?.offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   PARALLAX — hero bg subtle effect
   ============================================================ */
(function initParallax() {
  const heroBg = qs('.hero-bg-image');
  if (!heroBg) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        // Subtle parallax — move slower than scroll
        if (scrollY < window.innerHeight) {
          heroBg.style.transform = `scale(1.05) translateY(${scrollY * 0.18}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ============================================================
   VOLUNTEER TAG — active state toggle
   ============================================================ */
(function initVolunteerTags() {
  const tags = qsa('.volunteer-tag');
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tags.forEach(t => t.style.cssText = '');
      tag.style.background = '#152f61';
      tag.style.color = '#ffffff';
      tag.style.borderColor = '#152f61';
    });
  });
})();

/* ============================================================
   LAZY IMAGE LOADING
   ============================================================ */
(function initLazyImages() {
  const images = qsa('img[data-src]');
  if (!images.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => observer.observe(img));
})();
