const express = require('express');
const stripe = require('stripe')('sk_test_51R7KurBeKqDI1qGkspFFrNABlOfOQb7pHYxPTbGToOtRljU2gZTcv4JzpR0HzDvZhQ9bCMfJJ6KHzdLAJ4ZIkJ0e00h9FlWpYE'); // Sua chave secreta
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

app.post('/create-payment-intent', async (req, res) => {
    const { amount, payment_method } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'brl',
            payment_method,
            confirmation_method: 'manual',
            confirm: true,
            return_url: 'http://localhost:3000'
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});