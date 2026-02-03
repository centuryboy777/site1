(function () {
  'use strict';

  const ANIMATE_CLASS = 'visible';
  const STAGGER_MS = 80;

  function initAnimations() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.classList.contains('products-grid')) {
            const cards = el.querySelectorAll('.product-card[data-animate]');
            cards.forEach(function (card) {
              const delay = parseInt(card.dataset.delay || 0, 10) * STAGGER_MS;
              setTimeout(function () {
                card.classList.add(ANIMATE_CLASS);
              }, delay);
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(productsGrid);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }
})();
