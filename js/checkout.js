document.addEventListener('DOMContentLoaded', () => {

    const cart = JSON.parse(localStorage.getItem('cb_cart')) || [];
    const container = document.getElementById('order-items');
    const headerTotalEl = document.getElementById('header-total');
    const footerTotalEl = document.getElementById('footer-total');
    const payBtn = document.getElementById('pay-btn');
    const emailInput = document.getElementById('email'); // Added
    const phoneInput = document.getElementById('phone');
    const providerSelect = document.getElementById('provider');
    const successOverlay = document.getElementById('success-overlay');
    const orderIdEl = document.getElementById('order-id'); // Added
    const trackWaBtn = document.getElementById('track-wa-btn'); // Added

    // Render Logic
    function renderCheckout() {
        if (cart.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Your cart is empty.</p><a href="index.html" style="color:var(--accent); text-decoration:none; font-weight:600;">Browse Products</a></div>';
            updateTotals(0);
            payBtn.disabled = true;
            payBtn.style.opacity = '0.5';
            return;
        }

        let total = 0;
        container.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;
            // Fallback image if no visual provided in cart data (assuming standard path structure or generic)
            // Note: In a real app we'd store the image URL in the cart item.
            // For now, using a placeholder if we can't deduce it, or just a generic icon.
            const imgUrl = 'assets/mopodzz.jpg'; // Default generic fallback

            return `
                <div class="product-card">
                    <div class="product-info">
                        <h3 class="product-name">${escapeHtml(item.name)}</h3>
                        <div class="product-meta">Qty: ${item.qty}</div>
                    </div>
                    <div class="product-price">GHS ${itemTotal.toLocaleString()}</div>
                </div>
            `;
        }).join('');

        updateTotals(total);
    }

    function updateTotals(amount) {
        const formatted = `GHS ${amount.toLocaleString()}`;
        headerTotalEl.textContent = formatted;
        footerTotalEl.textContent = formatted;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function generateOrderId() {
        return 'CB' + Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    }

    // Input Validation
    phoneInput.addEventListener('input', (e) => {
        // Allow only numbers
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Paystack Integration Logic
    function payWithPaystack(totalAmount, email) {
        // PAYSTACK_PUBLIC_KEY should be replaced with your actual key in production
        // For security, you could fetch this from your backend as well
        const publicKey = 'pk_test_340f2710e369ba356c6579f07516206c31f315c7';

        const handler = PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: totalAmount * 100, // Paystack expects amount in Kobo/Pesewas
            currency: 'GHS',
            ref: '' + Math.floor((Math.random() * 1000000000) + 1), // Generate unique ref
            callback: function (response) {
                // SUCCESSFUL PAYMENT
                verifyOnBackend(response.reference);
            },
            onClose: function () {
                // USER CLOSED MODAL
                payBtn.innerHTML = 'Secure Payment with Paystack';
                payBtn.disabled = false;
                alert('Transaction cancelled.');
            },
            metadata: {
                custom_fields: [
                    {
                        display_name: "Mobile Number",
                        variable_name: "mobile_number",
                        value: phoneInput.value
                    },
                    {
                        display_name: "Cart Details",
                        variable_name: "cart_details",
                        value: cart.map(i => `${i.qty}x ${i.name}`).join(', ')
                    }
                ]
            }
        });

        handler.openIframe();
    }

    async function verifyOnBackend(reference) {
        payBtn.innerHTML = 'Finalizing Order...';

        try {
            // Replace localhost:5000 with your actual production URL
            const response = await fetch('http://localhost:5000/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference })
            });

            const result = await response.json();

            if (result.success) {
                // ORDER PAID & VERIFIED
                const orderId = generateOrderId();
                orderIdEl.textContent = '#' + orderId;
                successOverlay.classList.remove('hidden');

                // Build WhatsApp Message
                const itemsText = cart.map(i => `• ${i.name} (${i.qty})`).join('%0A');
                const totalText = headerTotalEl.textContent;
                const waMessage = `Hi Centuryboy's Hub!%0A%0A*ORDER PAID: ${orderId}*%0A%0A*Items:*%0A${itemsText}%0A%0A*Total:* ${totalText}%0A%0A*Paystack Ref:* ${reference}%0A%0APlease proceed with my delivery tracking. Thanks!`;

                trackWaBtn.href = `https://wa.me/233540639091?text=${waMessage}`;
                localStorage.removeItem('cb_cart');
            } else {
                throw new Error(result.message || 'Verification failed');
            }

        } catch (error) {
            console.error("Verification error:", error);
            alert("Payment successful but order verification failed. Please contact support with reference: " + reference);
            payBtn.innerHTML = 'Retry Verification';
            payBtn.disabled = false;
        }
    }

    // Handle Pay Button
    payBtn.addEventListener('click', () => {
        if (cart.length === 0) return;

        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const totalAmountStr = headerTotalEl.textContent.replace('GHS ', '').replace(',', '');
        const totalAmount = parseFloat(totalAmountStr);

        // Validation
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            emailInput.focus();
            return;
        }

        if (phone.length < 9) {
            alert('Please enter a valid 10-digit mobile number.');
            phoneInput.focus();
            return;
        }

        payBtn.innerHTML = 'Initializing Secure Shield...';
        payBtn.disabled = true;

        payWithPaystack(totalAmount, email);
    });

    renderCheckout();
});
