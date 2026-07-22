document.addEventListener('DOMContentLoaded', () => {
  // Scroll-reveal for key content blocks
  const targets = document.querySelectorAll(
    '.card, .testimonial, .service-block, .gallery-item, .section-head, .hero-media, .cta-band, .form-card'
  );
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el, i) => {
      el.classList.add('reveal', 'reveal-stagger');
      el.style.setProperty('--i', i % 6);
      io.observe(el);
    });

    // Safety net: if anything is missed (fast scroll, layout edge case,
    // or a crawler/screenshot tool that doesn't scroll), force everything
    // visible after a few seconds so content is never stuck hidden.
    setTimeout(() => {
      targets.forEach((el) => el.classList.add('is-visible'));
    }, 2500);
  } else {
    targets.forEach((el) => el.classList.add('is-visible'));
  }

  // Immersive mouse-parallax on the hero photo (desktop pointer only).
  // Supports either the classic card hero (.hero-media / .hero-photo) or
  // the full-bleed trust-hero background image (.trust-hero / .trust-hero-bg).
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  const heroMedia = document.querySelector('.hero-media');
  const heroPhoto = document.querySelector('.hero-photo');
  if (heroMedia && heroPhoto && finePointer && !reduceMotion) {
    heroMedia.addEventListener('mousemove', (e) => {
      const rect = heroMedia.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * 14;
      const rotateX = -py * 10;
      heroPhoto.style.transform =
        `rotate(2.5deg) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    heroMedia.addEventListener('mouseleave', () => {
      heroPhoto.style.transform = 'rotate(2.5deg)';
    });
  }

  const trustHero = document.querySelector('.trust-hero');
  const trustHeroBg = document.querySelector('.trust-hero-bg');
  if (trustHero && trustHeroBg && finePointer && !reduceMotion) {
    trustHero.addEventListener('mousemove', (e) => {
      const rect = trustHero.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const moveX = px * 18;
      const moveY = py * 14;
      trustHeroBg.style.transform = `scale(1.08) translate(${moveX}px, ${moveY}px)`;
    });
    trustHero.addEventListener('mouseleave', () => {
      trustHeroBg.style.transform = 'scale(1.08) translate(0, 0)';
    });
  }

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Header shadow on scroll
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // FAQ accordion — click a question to reveal/hide its answer.
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // Before/After slider — drag (mouse, touch, or keyboard via the native
  // range input) to reveal more/less of the "before" photo.
  document.querySelectorAll('.ba-slider').forEach((slider) => {
    const range = slider.querySelector('.ba-slider__range');
    const beforeWrap = slider.querySelector('.ba-slider__before-wrap');
    const divider = slider.querySelector('.ba-slider__divider');
    const handle = slider.querySelector('.ba-slider__handle');
    if (!range || !beforeWrap) return;
    const update = () => {
      const v = range.value;
      beforeWrap.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
      if (divider) divider.style.left = v + '%';
      if (handle) handle.style.left = v + '%';
    };
    range.addEventListener('input', update);
    update();
  });
});

// ---- Easter egg: late-night visitor toast -----------------------------
// Purely client-side and free to run — no API calls, no paid service.
// If someone's on the site late at night, give a small nod to it that
// ties into the "call anytime for emergencies" messaging.
(function () {
  var hour = new Date().getHours();
  var isLateNight = hour >= 23 || hour < 5;
  if (!isLateNight) return;

  var toast = document.createElement('div');
  toast.className = 'night-owl-toast';
  toast.innerHTML =
    '<span>Burning the midnight oil? So do we when it\'s an emergency — <a href="tel:8158002557">call anytime</a>.</span>' +
    '<button type="button" aria-label="Dismiss">&times;</button>';
  document.body.appendChild(toast);

  requestAnimationFrame(function () { toast.classList.add('is-visible'); });

  function hide() {
    toast.classList.remove('is-visible');
    setTimeout(function () { toast.remove(); }, 400);
  }
  toast.querySelector('button').addEventListener('click', hide);
  setTimeout(hide, 12000);
})();

// ---- Confetti burst — used as a small reward on form success ---------
// Also purely client-side (a few DOM nodes with a CSS animation) — no
// external library, no cost, nothing to pay for.
function launchConfetti() {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  var colors = ['#0091c9', '#29b6e8', '#005b82', '#f5a623', '#16222c'];
  var count = 70;
  for (var i = 0; i < count; i++) {
    var el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = (Math.random() * 100) + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    el.style.animationDelay = (Math.random() * 0.3) + 's';
    el.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
    document.body.appendChild(el);
    (function (node) {
      setTimeout(function () { node.remove(); }, 4200);
    })(el);
  }
}

// ---- AJAX-submit the Formspree quote/donation forms -------------------
// Intercepts submission so the page never has to navigate away to
// Formspree's own confirmation page — instead we show an inline success
// message and fire the confetti burst as a small reward moment. Falls
// back to a clear "please call/email us" message if the request fails
// (which it will until a real Formspree form ID replaces YOUR_FORM_ID).
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form').forEach(function (form) {
    var action = form.getAttribute('action') || '';
    if (action.indexOf('formspree.io') === -1) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      var originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }
      var existingError = form.querySelector('.form-error');
      if (existingError) existingError.remove();

      var data = new FormData(form);
      fetch(action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('Form submission failed');
        launchConfetti();
        var success = document.createElement('div');
        success.className = 'form-success';
        success.innerHTML =
          '<strong>Thanks — we\'ve got it!</strong>' +
          '<span>We\'ll be in touch within one business day.</span>';
        form.replaceWith(success);
      }).catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
        var errEl = document.createElement('p');
        errEl.className = 'form-error';
        errEl.innerHTML =
          'Something went wrong sending that — give us a call at ' +
          '<a href="tel:8158002557">(815) 800-2557</a> or email ' +
          '<a href="mailto:office@brandauhomeservices.com">office@brandauhomeservices.com</a> instead.';
        form.appendChild(errEl);
      });
    });
  });
});
