const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
const checkoutItemsContainer = document.getElementById('checkout-items');
const checkoutTotal = document.getElementById('checkout-total');
const paymentMethodSelect = document.getElementById('payment-method');
const paymentDetails = document.getElementById('payment-details');

// Configuração do Stripe
const stripe = Stripe('pk_test_51R7KurBeKqDI1qGkBnpBUTf56VmZkKG3m9NNOyKdx9UZNhnUcSEgZBUpXbW560TM6oTM5SaRkKjaXLxkGl3VKhfC00jx4cvDm1'); // Substitua pela sua chave pública
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

function updateCheckout() {
    checkoutItemsContainer.innerHTML = '';
    let total = 0;

    cartItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <span>${item.name} - Malha 100% Algodão Penteada 30.1</span>
            <span>R$ ${parseFloat(item.price).toFixed(2)}</span>
            <button class="remove-item" data-index="${index}">Remover</button>
        `;
        checkoutItemsContainer.appendChild(itemElement);
        total += parseFloat(item.price); // Soma os preços em reais
    });

    // Exibe o valor total somado de todas as peças
    checkoutTotal.textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Adicionar evento aos botões de remover
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            cartItems.splice(index, 1); // Remove o item pelo índice
            updateCheckout();
            alert('Item removido do carrinho!');
        });
    });

    return total * 100; // Retorna em centavos para as APIs
}

// Mostrar/esconder campos de pagamento
paymentMethodSelect.addEventListener('change', function() {
    const method = this.value;
    const cardElementDiv = document.getElementById('card-element');
    const pixQr = document.getElementById('pix-qr');
    const paypalButton = document.getElementById('paypal-button-container');

    paymentDetails.style.display = 'none';
    cardElementDiv.style.display = 'none';
    pixQr.style.display = 'none';
    paypalButton.style.display = 'none';

    if (method) {
        paymentDetails.style.display = 'block';
        if (method === 'credit-card') {
            cardElementDiv.style.display = 'block';
        } else if (method === 'pix') {
            pixQr.style.display = 'block';
        } else if (method === 'paypal') {
            paypalButton.style.display = 'block';
        }
    }
});

// Configuração do PayPal
paypal.Buttons({
    createOrder: function(data, actions) {
        const total = updateCheckout() / 100; // Converte de centavos para reais
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: total.toFixed(2),
                    currency_code: 'BRL'
                }
            }]
        });
    },
    onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
            alert('Pagamento PayPal confirmado! ID: ' + details.id);
            finalizeOrder();
        });
    }
}).render('#paypal-button-container');

// Processar o formulário
document.getElementById('checkout-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const paymentMethod = paymentMethodSelect.value;
    const total = updateCheckout(); // Em centavos

    if (!paymentMethod) {
        alert('Por favor, selecione um método de pagamento.');
        return;
    }

    if (cartItems.length === 0) {
        alert('O carrinho está vazio! Adicione itens antes de finalizar.');
        return;
    }

    if (paymentMethod === 'credit-card') {
        const { paymentIntent, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (error) {
            alert('Erro no pagamento: ' + error.message);
            return;
        }

        const response = await fetch('http://localhost:3000/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total, payment_method: paymentIntent.id })
        });
        const data = await response.json();

        if (data.clientSecret) {
            const confirmResult = await stripe.confirmCardPayment(data.clientSecret);
            if (confirmResult.error) {
                alert('Erro ao confirmar pagamento: ' + confirmResult.error.message);
            } else {
                alert('Pagamento com cartão confirmado!');
                finalizeOrder();
            }
        }

    } else if (paymentMethod === 'pix') {
        const response = await fetch('http://localhost:3000/create-pix-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total / 100 }) // Converte para reais
        });
        const data = await response.json();

        if (data.qrCode) {
            document.getElementById('pix-qr').innerHTML = `<img src="${data.qrCode}" alt="QR Code Pix"><p>Escaneie para pagar</p>`;
            alert('Escaneie o QR Code para pagar via Pix.');
            setTimeout(checkPixPayment, 5000, data.paymentId);
        } else {
            alert('Erro ao gerar Pix: ' + data.error);
        }

    } else if (paymentMethod === 'paypal') {
        // Processado pelo botão PayPal
        return;
    }
});

async function checkPixPayment(paymentId) {
    const response = await fetch(`http://localhost:3000/check-pix-payment/${paymentId}`);
    const data = await response.json();

    if (data.status === 'paid') {
        alert('Pagamento Pix confirmado!');
        finalizeOrder();
    } else {
        alert('Aguardando confirmação do Pix...');
        setTimeout(checkPixPayment, 5000, paymentId);
    }
}

function finalizeOrder() {
    alert('Pedido confirmado! Os fundos serão enviados à sua conta bancária.');
    localStorage.removeItem('cartItems');
    window.location.href = 'index.html#carrinho';
}

// Atualiza o checkout ao carregar a página
updateCheckout();