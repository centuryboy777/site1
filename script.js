(function () {
  'use strict';

  function initTheme() {
    var root = document.documentElement;
    var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    function apply(matches) {
      root.setAttribute('data-theme', matches ? 'dark' : 'light');
    }
    if (mq) {
      apply(mq.matches);
      if (mq.addEventListener) {
        mq.addEventListener('change', function (e) { apply(e.matches); });
      } else if (mq.addListener) {
        mq.addListener(function (e) { apply(e.matches); });
      }
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }

  const ANIMATE_CLASS = 'visible';
  const STAGGER_MS = 80;

  function initAnimations() {
    var grids = document.querySelectorAll('.products-grid');
    if (!grids.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          if (el.classList.contains('products-grid')) {
            var cards = el.querySelectorAll('.product-card[data-animate]');
            cards.forEach(function (card) {
              var delay = parseInt(card.dataset.delay || 0, 10) * STAGGER_MS;
              setTimeout(function () {
                card.classList.add(ANIMATE_CLASS);
              }, delay);
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    grids.forEach(function (grid) { observer.observe(grid); });
  }

  function initCategoryTabs() {
    var tabs = document.querySelectorAll('.category-tab');
    var sections = document.querySelectorAll('.category-section');
    if (!tabs.length || !sections.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var category = tab.getAttribute('data-category');
        if (!category) return;

        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');

        sections.forEach(function (section) {
          if (section.id === 'category-' + category) {
            section.classList.add('is-visible');
          } else {
            section.classList.remove('is-visible');
          }
        });
      });
    });
  }

  var cart = [];

  function getCartCountEl() {
    return document.querySelector('.cart-count');
  }

  function getCartItemsEl() {
    return document.getElementById('cart-items');
  }

  function getCartTotalEl() {
    return document.getElementById('cart-total');
  }

  function getCheckoutEl() {
    return document.getElementById('cart-checkout');
  }

  function updateCartCount() {
    var el = getCartCountEl();
    if (!el) return;
    var total = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    el.textContent = total;
  }

  function renderCart() {
    var container = getCartItemsEl();
    var totalEl = getCartTotalEl();
    var checkoutEl = getCheckoutEl();
    if (!container) return;

    var totalGhc = 0;
    if (cart.length === 0) {
      container.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      if (totalEl) totalEl.textContent = 'GHC 0';
      if (checkoutEl) {
        checkoutEl.style.display = 'none';
        checkoutEl.href = '#';
      }
      return;
    }

    if (checkoutEl) {
      checkoutEl.style.display = 'block';
      var lines = cart.map(function (item) {
        return item.name + ' (' + item.qty + ') - GHC' + (item.price * item.qty);
      });
      var totalGhcCheckout = cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
      var text = "Hi Centuryboy! I'd like to order: " + lines.join(', ') + '. Total: GHC ' + totalGhcCheckout + '.';
      checkoutEl.href = 'https://wa.me/233540639091?text=' + encodeURIComponent(text);
    }

    container.innerHTML = cart.map(function (item, index) {
      totalGhc += item.price * item.qty;
      return (
        '<div class="cart-item" data-index="' + index + '">' +
        '<div class="cart-item-details">' +
        '<span class="cart-item-name">' + escapeHtml(item.name) + '</span>' +
        '<span class="cart-item-price">GHC ' + (item.price * item.qty) + '</span>' +
        '</div>' +
        '<div class="cart-item-actions">' +
        '<div class="cart-item-quantity">' +
        '<button type="button" class="qty-btn qty-minus" aria-label="Decrease quantity">-</button>' +
        '<span class="qty-val">' + item.qty + '</span>' +
        '<button type="button" class="qty-btn qty-plus" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<button type="button" class="cart-item-remove" aria-label="Remove">Remove</button>' +
        '</div>' +
        '</div>'
      );
    }).join('');

    if (totalEl) totalEl.textContent = 'GHC ' + totalGhc;

    // Attach listeners
    // Remove
    container.querySelectorAll('.cart-item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.cart-item');
        var index = parseInt(item.getAttribute('data-index'), 10);
        cart.splice(index, 1);
        renderCart();
        updateCartCount();
      });
    });

    // Decrease
    container.querySelectorAll('.qty-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var itemEl = btn.closest('.cart-item');
        var index = parseInt(itemEl.getAttribute('data-index'), 10);
        if (cart[index].qty > 1) {
          cart[index].qty--;
        } else {
          cart.splice(index, 1); // Remove if 1 -> 0
        }
        renderCart();
        updateCartCount();
      });
    });

    // Increase
    container.querySelectorAll('.qty-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var itemEl = btn.closest('.cart-item');
        var index = parseInt(itemEl.getAttribute('data-index'), 10);
        cart[index].qty++;
        renderCart();
        updateCartCount();
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function openCart() {
    var overlay = document.getElementById('cart-overlay');
    if (overlay) {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeCart() {
    var overlay = document.getElementById('cart-overlay');
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  function addToCart(name, price) {
    var num = parseInt(price, 10);
    if (!name || isNaN(num)) return;
    var existing = cart.find(function (item) { return item.name === name && item.price === num; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name: name, price: num, qty: 1 });
    }
    renderCart();
    updateCartCount();
    openCart();
  }

  function initCart() {
    var trigger = document.querySelector('.cart-trigger');
    var overlay = document.getElementById('cart-overlay');
    var closeBtn = document.querySelector('.cart-close');
    var checkoutEl = getCheckoutEl();

    if (trigger) trigger.addEventListener('click', openCart);
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeCart();
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target && e.target.classList.contains('product-add-cart')) {
        var card = e.target.closest('.product-card');
        if (!card) return;
        var nameEl = card.querySelector('.product-name');
        var priceEl = card.querySelector('.product-price');
        var name = nameEl ? nameEl.textContent.trim() : '';
        var priceStr = priceEl ? priceEl.textContent.replace(/[^0-9]/g, '') : '0';
        addToCart(name, priceStr);
      }
    });

    if (checkoutEl && cart.length === 0) {
      checkoutEl.addEventListener('click', function (e) {
        if (cart.length === 0) e.preventDefault();
      });
    }

    updateCartCount();
    renderCart();
  }

  function init() {
    initTheme();
    initAnimations();
    initCategoryTabs();
    initCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
