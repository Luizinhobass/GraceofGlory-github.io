// Smooth scroll para os links do menu
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const section = document.querySelector(this.getAttribute('href'));
        section.scrollIntoView({ behavior: 'smooth' });
    });
});

// Simulação de envio de formulário de contato
document.querySelector('.contato form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Mensagem enviada com sucesso!');
    this.reset();
});

// Funcionalidade do carrinho
const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');

function updateCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cartItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <span>${item.name} - Malha 100% Algodão Penteada 30.1</span>
            <span>R$ ${parseFloat(item.price).toFixed(2)}</span>
            <button class="remove-item" data-index="${index}">Remover</button>
        `;
        cartItemsContainer.appendChild(itemElement);
        total += parseFloat(item.price); // Soma os preços em reais
    });

    // Exibe o valor total somado de todas as peças
    cartTotal.textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Adicionar evento aos botões de remover
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            cartItems.splice(index, 1); // Remove o item pelo índice
            updateCart();
            alert('Item removido do carrinho!');
        });
    });
}

document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', function() {
        const name = this.getAttribute('data-name');
        const price = this.getAttribute('data-price');
        cartItems.push({ name, price });
        updateCart();
        alert(`${name} adicionado ao carrinho!`);
    });
});

checkoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (cartItems.length === 0) {
        alert('O carrinho está vazio!');
        return;
    }
    window.location.href = 'checkout.html';
});

clearCartBtn.addEventListener('click', function() {
    if (cartItems.length === 0) {
        alert('O carrinho já está vazio!');
        return;
    }
    cartItems.length = 0; // Limpa o array
    updateCart();
    alert('Carrinho limpo!');
});

// Atualiza o carrinho ao carregar a página
updateCart();