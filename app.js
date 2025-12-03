// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service.js')
        .then(registrado => console.log('Se instaló correctamente...', registrado))
        .catch(error => console.log('Falló la instalación...', error));
}

const articlesContainer = document.getElementById('articles-container');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalPrice = document.getElementById('modal-price');
const closeButton = document.querySelector('.close-button');
const buyButton = document.getElementById('buy-button');
const notificationsBtn = document.getElementById('notifications-btn');

let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
let offerTimeouts = [];

function clearOfferNotifications() {
    offerTimeouts.forEach(id => clearTimeout(id));
    offerTimeouts = [];
}

function scheduleOfferNotifications() {
    clearOfferNotifications();

    if (Notification.permission !== 'granted' || !notificationsEnabled) {
        console.log('No se programaron ofertas: permiso NO concedido o recibir ofertas desactivado.');
        return;
    }

    navigator.serviceWorker.ready.then(registration => {
        for (let i = 0; i < 3; i++) {
            const timeoutId = setTimeout(() => {
                registration.showNotification('Ofertas', {
                    body: `Oferta especial ${i + 1}: ¡No te la pierdas!`,
                    tag: `oferta-${i}-${Date.now()}`,
                    icon: './assets/images/store.png'
                });
            }, 7000 + i * 3000);

            offerTimeouts.push(timeoutId);
        }

        console.log('Programadas 3 notificaciones de ofertas (inician en 7s).');
    });
}

function updateNotificationButton() {
    if (Notification.permission === 'denied') {
        notificationsBtn.textContent = 'Recibir ofertas bloqueadas';
        notificationsBtn.disabled = true;
        notificationsEnabled = false;
        localStorage.setItem('notificationsEnabled', 'false');
    } else if (notificationsEnabled) {
        notificationsBtn.textContent = 'Desactivar recibir ofertas';
    } else {
        notificationsBtn.textContent = 'Activar recibir ofertas';
    }
}

notificationsBtn.addEventListener('click', () => {
    if (Notification.permission === 'denied') {
        return;
    }

    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificationsEnabled = true;
                localStorage.setItem('notificationsEnabled', 'true');
                // Programar envío de ofertas al activarse y conceder permiso
                scheduleOfferNotifications();
            }
            updateNotificationButton();
        });
    } else {
        notificationsEnabled = !notificationsEnabled;
        localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
        updateNotificationButton();
        if (notificationsEnabled) {
            // Si el usuario activó las notificaciones y ya hay permiso, programar ofertas
            if (Notification.permission === 'granted') {
                scheduleOfferNotifications();
            }
        } else {
            // Si desactiva, cancelar cualquier programación pendiente
            clearOfferNotifications();
        }
    }
});


async function getArticles() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        const articles = await response.json();
        displayArticles(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
    }
}

function displayArticles(articles) {
    articles.forEach(article => {
        const articleCard = document.createElement('div');
        articleCard.classList.add('article-card');

        const articleImage = document.createElement('img');
        articleImage.src = article.image;
        articleImage.alt = article.title;

        const articleTitle = document.createElement('h2');
        articleTitle.textContent = article.title;

        const articlePrice = document.createElement('p');
        articlePrice.textContent = `$${article.price}`;

        articleCard.appendChild(articleImage);
        articleCard.appendChild(articleTitle);
        articleCard.appendChild(articlePrice);

        articleCard.addEventListener('click', () => {
            openModal(article);
        });

        articlesContainer.appendChild(articleCard);
    });
}

function openModal(article) {
    modalImage.src = article.image;
    modalTitle.textContent = article.title;
    modalDescription.textContent = article.description;
    modalPrice.textContent = `$${article.price}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

closeButton.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target == modal) {
        closeModal();
    }
});

// Close modal with Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
    }
});

buyButton.addEventListener('click', () => {
    console.log('Compra realizada.');
    closeModal();
});

getArticles();
updateNotificationButton();