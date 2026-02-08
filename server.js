require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// 1. VERIFY TRANSACTION ENDPOINT
// This is called by the frontend after a successful Paystack Inline callback
app.post('/verify-payment', async (req, res) => {
    const { reference } = req.body;

    if (!reference) {
        return res.status(400).json({ success: false, message: "No reference provided" });
    }

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });

        const { status, data } = response.data;

        if (status && data.status === 'success') {
            // SUCCESS: Transaction is valid. 
            // Here you would typically:
            // 1. Mark the order as paid in your database
            // 2. Clear user session/cart (if not done on frontend)
            // 3. Trigger fulfilment/delivery workflow

            return res.json({
                success: true,
                message: "Payment verified successfully",
                data: data
            });
        }

        return res.status(400).json({ success: false, message: "Payment verification failed" });

    } catch (error) {
        console.error("Paystack Verification Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Internal server error during verification" });
    }
});

// 2. WEBHOOK ENDPOINT
// Paystack will send POST requests here for major events (e.g. charge.success)
// This ensures you get paid even if the user closes their browser
app.post('/webhook', (req, res) => {
    // Validate the event origin (security best practice)
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Invalid signature');
    }

    const event = req.body;
    console.log("Paystack Webhook Received:", event.event);

    if (event.event === 'charge.success') {
        // Handle successful payment
        const { reference, customer, amount } = event.data;
        console.log(`Payment confirmed for customer ${customer.email}. Ref: ${reference}, Amount: ${amount}`);

        // Update your order records here
    }

    // Always respond with 200 OK to Paystack
    res.sendStatus(200);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Centuryboy's Hub Server running on port ${PORT}`);
});
