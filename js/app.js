document.addEventListener('DOMContentLoaded', () => {
    const detectApiBase = () => {
        if (window.__API_BASE__) return window.__API_BASE__.replace(/\/$/, '');
        if (location.protocol === 'file:') return 'http://localhost:25565';
        return `${location.protocol}//${location.host}`;
    };
    const API_BASE = detectApiBase();
    const apiUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/')) return `${API_BASE}${path}`;
        return `${API_BASE}/${path}`;
    };
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const fmtPrice = (num) => `${Number(num).toFixed(2)} руб.`;
    const throttle = (fn, wait = 100) => {
        let last = 0;
        return (...args) => {
            const now = Date.now();
            if (now - last >= wait) {
                last = now;
                fn(...args);
            }
        };
    };
    // Убрали getBasePath - будем использовать простые относительные пути
    let selectedSeats = [];
    let eventsCache = null;
    const carouselEl = $('#eventsCarousel');
    const musicButton = $('.button-music');
    const cartBtnGlobal = $('.cart-btn');
    function initMusic() {
        if (!musicButton) return;
        const musicPlay = musicButton.querySelector('.music-play');
        const musicStop = musicButton.querySelector('.music-stop');
        let audio = null;
        if (musicPlay && musicStop) {
            musicPlay.style.opacity = '0';
            musicStop.style.opacity = '1';
        }
        musicButton.addEventListener('click', function () {
            this.classList.toggle('active');
            const active = this.classList.contains('active');
            if (musicPlay && musicStop) {
                musicPlay.style.opacity = active ? '1' : '0';
                musicStop.style.opacity = active ? '0' : '1';
            }
            if (active) {
                if (!audio) {
                    audio = new Audio(apiUrl('/music/clowining.mp3'));
                    audio.loop = true;
                    audio.volume = 0.1;
                }
                audio.play().catch(err => console.error('audio play error', err));
            } else {
                audio?.pause();
            }
        });
    }
    function initSmoothFAQ() {
        $$('.faq-answer').forEach(faqAnswer => {
            const button = faqAnswer.querySelector('.faq-answer-button');
            const text = faqAnswer.querySelector('.faq-answer-text');
            if (!button || !text) return;
            text.style.maxHeight = faqAnswer.classList.contains('active') ? text.scrollHeight + 'px' : '0';
            text.style.opacity = faqAnswer.classList.contains('active') ? '1' : '0';
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpening = !faqAnswer.classList.contains('active');
                $$('.faq-answer.active').forEach(openItem => {
                    if (openItem !== faqAnswer) {
                        openItem.classList.remove('active');
                        const t = openItem.querySelector('.faq-answer-text');
                        const b = openItem.querySelector('.faq-answer-button');
                        if (b) b.setAttribute('aria-expanded', 'false');
                        if (t) {
                            t.style.maxHeight = '0';
                            t.style.opacity = '0';
                        }
                    }
                });
                if (isOpening) {
                    faqAnswer.classList.add('active');
                    button.setAttribute('aria-expanded', 'true');
                    text.style.maxHeight = text.scrollHeight + 'px';
                    text.style.opacity = '1';
                } else {
                    faqAnswer.classList.remove('active');
                    button.setAttribute('aria-expanded', 'false');
                    text.style.maxHeight = '0';
                    text.style.opacity = '0';
                }
            });
        });
    }
    function initCarousel() {
        const carousel = carouselEl;
        if (!carousel) return;
        const wrapper = carousel.closest('.carousel-wrapper');
        const leftBtn = wrapper ? wrapper.querySelector('.carousel-btn.left') : null;
        const rightBtn = wrapper ? wrapper.querySelector('.carousel-btn.right') : null;
        if (!wrapper || !leftBtn || !rightBtn) return;
        leftBtn.removeAttribute('onclick');
        rightBtn.removeAttribute('onclick');
        function updateButtonsVisibility() {
            const canScroll = carousel.scrollWidth > carousel.clientWidth + 4;
            if (canScroll) {
                leftBtn.style.visibility = 'visible';
                rightBtn.style.visibility = 'visible';
                leftBtn.style.pointerEvents = 'auto';
                rightBtn.style.pointerEvents = 'auto';
                leftBtn.style.opacity = '0.8';
                rightBtn.style.opacity = '0.8';
            } else {
                leftBtn.style.visibility = 'hidden';
                rightBtn.style.visibility = 'hidden';
                leftBtn.style.pointerEvents = 'none';
                rightBtn.style.pointerEvents = 'none';
                leftBtn.style.opacity = '0';
                rightBtn.style.opacity = '0';
            }
            updateButtonStates();
        }
        function updateButtonStates() {
            const scrollPosition = carousel.scrollLeft;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;
            if (scrollPosition <= 10) {
                leftBtn.style.opacity = '0';
                leftBtn.style.pointerEvents = 'none';
            } else {
                if (carousel.scrollWidth > carousel.clientWidth) {
                    leftBtn.style.opacity = '0.8';
                    leftBtn.style.pointerEvents = 'auto';
                }
            }
            if (scrollPosition >= maxScroll - 10) {
                rightBtn.style.opacity = '0';
                rightBtn.style.pointerEvents = 'none';
            } else {
                if (carousel.scrollWidth > carousel.clientWidth) {
                    rightBtn.style.opacity = '0.8';
                    rightBtn.style.pointerEvents = 'auto';
                }
            }
        }
        function scrollCarousel(direction) {
            const card = carousel.querySelector('.ticket-card');
            if (!card) return;
            const cardWidth = card.offsetWidth;
            const gap = 32;
            const scrollAmount = (cardWidth + gap) * direction;
            carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(updateButtonStates, 350);
        }
        const onResize = throttle(updateButtonsVisibility, 150);
        window.addEventListener('resize', onResize);
        carousel.addEventListener('scroll', throttle(updateButtonStates, 100));
        leftBtn.addEventListener('click', () => scrollCarousel(-1));
        rightBtn.addEventListener('click', () => scrollCarousel(1));
        requestAnimationFrame(updateButtonsVisibility);
    }
    async function fetchJson(url, opts = {}) {
        try {
            const res = await fetch(apiUrl(url), opts);
            if (!res.ok) {
                const txt = await res.text().catch(() => null);
                const err = new Error(txt || `HTTP ${res.status}`);
                err.status = res.status;
                throw err;
            }
            const txt = await res.text();
            if (!txt) return null;
            return JSON.parse(txt);
        } catch (err) {
            console.error('fetchJson error', url, err);
            throw err;
        }
    }
    async function ensureAllSeatsExist(event) {
        if (!event) return event;
        event.seats = Array.isArray(event.seats) ? event.seats : [];
        const exists = new Set(event.seats.map(s => `${s.xPos}-${s.yPos}`));
        const promises = [];
        for (let y = 1; y <= (event.ySize || 0); y++) {
            for (let x = 1; x <= (event.xSize || 0); x++) {
                const key = `${x}-${y}`;
                if (!exists.has(key)) {
                    promises.push(fetch(apiUrl('/api/seats/create'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ eventId: event.id, xPos: x, yPos: y, price: 800 })
                    }).then(r => r.ok ? r.json().catch(() => null) : null));
                }
            }
        }
        if (promises.length === 0) return event;
        const created = await Promise.all(promises);
        created.filter(Boolean).forEach(s => event.seats.push(s));
        return event;
    }
    async function loadEvents(force = false) {
        if (eventsCache && !force) {
            renderEvents(eventsCache);
            return eventsCache;
        }

        if (!carouselEl) return null;

        carouselEl.innerHTML = `<div class="loading" style="padding:40px;text-align:center">Загрузка мероприятий…</div>`;

        try {
            const events = await fetchJson('/api/events');
            const seats = await fetchJson('/api/seats');

            eventsCache = Array.isArray(events) ? events : [];

            // Группируем места по eventId
            const seatsByEvent = {};
            if (Array.isArray(seats)) {
                seats.forEach(s => {
                    if (!seatsByEvent[s.eventId]) seatsByEvent[s.eventId] = [];
                    seatsByEvent[s.eventId].push(s);
                });
            }

            // Обработка мероприятий
            eventsCache = eventsCache.map(ev => {
                const evSeats = seatsByEvent[ev.id] || [];
                const freeSeats = evSeats.filter(s =>
                    ['free', 'available'].includes((s.status || '').toLowerCase())
                );

                const hasGeneratedSeats = evSeats.length > 0;
                const hasPotentialSeats = evSeats.length === 0 && (ev.xSize || 0) > 0 && (ev.ySize || 0) > 0;

                let cheapestPrice = null;
                let hasFreeSeats = false;

                if (freeSeats.length > 0) {
                    // обычные свободные места
                    cheapestPrice = Math.min(...freeSeats.map(s => Number(s.price || 0)));
                    hasFreeSeats = true;

                } else if (hasPotentialSeats) {
                    // НОВОЕ мероприятие → потенциальные места → показываем базовую цену
                    cheapestPrice = 800;
                    hasFreeSeats = true;

                } else {
                    // места есть, но они ВСЕ заняты → пишем, что нет мест
                    cheapestPrice = null;
                    hasFreeSeats = false;
                }

                return {
                    ...ev,
                    cheapestPrice,
                    hasFreeSeats
                };
            });


            // ❗ Убираем фильтр, чтобы показывать мероприятия без мест
            // .filter(ev => ev.hasFreeSeats) — УДАЛЕНО

            renderEvents(eventsCache);
            return eventsCache;

        } catch (err) {
            console.error('loadEvents failed', err);
            carouselEl.innerHTML = `<div style="text-align:center;padding:40px;color:#666">
            Ошибка загрузки мероприятий.<br>
            <small>${escapeHtml(err.message || 'Сервер не отвечает')}</small>
        </div>`;
            return null;
        }
    }
    function formatEventDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Пример: "11.12.2025 19:00"
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    function renderEvents(events) {
        const carousel = carouselEl;
        if (!carousel) return;
        carousel.innerHTML = '';
        if (!events || events.length === 0) {
            carousel.innerHTML = `<div style="text-align:center;padding:40px;color:#666">Мероприятий не найдено</div>`;
            return;
        }

        events.forEach(ev => {
            const priceText = ev.cheapestPrice != null ? `${Number(ev.cheapestPrice).toFixed(2)} руб.` : 'Нет свободных мест';
            const card = document.createElement('a');
            card.className = 'ticket-card';
            card.href = `pages/event.html?id=${encodeURIComponent(ev.id)}`;

            const imgSrc = ev.imageUrl
                ? apiUrl(ev.imageUrl)
                : '/images/ticket.png';

            // Форматируем дату
            const dateText = ev.dateStart ? formatEventDate(ev.dateStart) : '';

            card.innerHTML = `
            <div class="ticket-image">
                <img src="${imgSrc}" alt="${escapeHtml(ev.title || 'Мероприятие')}">
            </div>
            <div class="ticket-info">
                <h2>${escapeHtml(ev.title || '')}</h2>
                <p class="ticket-desc">${escapeHtml(ev.description || '')}</p>
                ${dateText ? `<p class="ticket-date">📅 ${escapeHtml(dateText)}</p>` : ''}
                <p class="ticket-price">${priceText}</p>
            </div>`;
            carousel.appendChild(card);
        });

        requestAnimationFrame(() => initCarousel());
    }
    function getRussianPlural(number) {
        number = Math.abs(number);
        if (number % 10 === 1 && number % 100 !== 11) return 'о';
        if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'а';
        return '';
    }
    function updateCounters() {
        const qtyElement = $('.qty-count');
        const priceElement = $('.product-price');
        const cartBtn = $('.cart-btn');
        const totalCount = selectedSeats.length;
        const totalPrice = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
        if (qtyElement) qtyElement.textContent = `${totalCount} мест${getRussianPlural(totalCount)}`;
        if (priceElement) priceElement.textContent = fmtPrice(totalPrice);
        if (cartBtn) {
            const cartSpan = cartBtn.querySelector('div') || cartBtn;
            cartSpan.innerHTML = selectedSeats.length > 0 ? `В КОРЗИНУ (${totalCount})` : 'В КОРЗИНУ';
        }
    }
    function handleSeatClick(seatId, x, y, price, seatElement, existsInDb = true) {
        const isSelected = seatElement.classList.contains('selected');
        if (isSelected) {
            seatElement.classList.remove('selected');
            selectedSeats = selectedSeats.filter(seat => seat.id !== seatId);
        } else {
            const status = (seatElement.dataset.status || '').toLowerCase();
            if (status === 'pending' || status === 'sold') {
                alert(status === 'pending' ? 'Это место забронировано' : 'Это место уже продано');
                return;
            }
            seatElement.classList.add('selected');
            selectedSeats.push({ id: seatId, x: x, y: y, price: Number(price || 0), element: seatElement, existsInDb: existsInDb });
        }
        updateCounters();
    }
    async function createSeatIfNotExists(eventId, x, y) {
        try {
            const payload = { eventId: Number(eventId), xPos: Number(x), yPos: Number(y), price: 800 };
            const created = await fetchJson('/api/seats/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            return created;
        } catch (err) {
            console.error('createSeatIfNotExists error', err);
            return null;
        }
    }
    async function updateSeatsStatus(eventId) {
        try {
            const event = await fetchJson(`/api/events/${eventId}`);
            if (!event) return;
            const seats = event.seats || [];
            seats.forEach(seat => {
                const seatElement = document.getElementById(`seat-${seat.id}`);
                if (seatElement) {
                    const oldStatus = (seatElement.dataset.status || '').toLowerCase();
                    const newStatus = (seat.status || '').toString().toLowerCase();
                    if (oldStatus !== newStatus) {
                        seatElement.dataset.status = newStatus;
                        seatElement.className = `seat ${newStatus}`;
                        if (seatElement.classList.contains('selected') && (newStatus === 'pending' || newStatus === 'sold')) {
                            seatElement.classList.remove('selected');
                            selectedSeats = selectedSeats.filter(s => s.id !== seat.id);
                            updateCounters();
                        }
                    }
                }
            });
        } catch (err) {
            console.error('updateSeatsStatus error', err);
        }
    }
    async function generateTable(id = 0) {
        // Очищаем оба массива: существующие и потенциальные места
        selectedSeats = [];
        selectedPotentialSeats = []; // Добавим новый массив для потенциальных мест
        updateCounters();

        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id') || id;
        if (!eventId) {
            console.error('ID события не найден в URL');
            return;
        }
        window.currentEventId = eventId;

        const table = document.getElementById('seats');
        if (!table) {
            console.error("Элемент с ID 'seats' не найден");
            return;
        }

        table.innerHTML = `<tr><td colspan="100" style="padding:20px;text-align:center">Загрузка мест…</td></tr>`;
        try {
            let event = await fetchJson(`/api/events/${eventId}`);
            if (!event) {
                table.innerHTML = `<tr><td colspan="100" style="padding:20px;text-align:center;color:#666">Событие не найдено</td></tr>`;
                return;
            }

            const seats = Array.isArray(event.seats) ? event.seats : [];
            const titleElement = $('.product-title');
            const descElement = $('.product-desc');
            const dateElement = $('.product-date'); // Добавьте этот элемент в HTML

            if (titleElement) titleElement.textContent = event.title || 'Название мероприятия';
            if (descElement) descElement.textContent = event.description || '';

            // Добавляем отображение даты
            if (dateElement && event.dateStart) {
                const formattedDate = formatEventDate(event.dateStart);
                if (formattedDate) {
                    dateElement.textContent = `📅 ${formattedDate}`;
                    dateElement.style.display = 'block';
                }
            }

            const xSize = Number(event.xSize || 10);
            const ySize = Number(event.ySize || 10);

            let headerHTML = `<tr><th style="padding: 5px; width: 40px;"></th>`;
            for (let x = 1; x <= xSize; x++) headerHTML += `<th style="padding: 5px; text-align: center; width: 40px;">${x}</th>`;
            headerHTML += `</tr>`;
            table.innerHTML = headerHTML;

            for (let y = 1; y <= ySize; y++) {
                let rowHTML = `<tr><th style="padding: 5px; text-align: center;">${y}</th>`;
                for (let x = 1; x <= xSize; x++) {
                    const seat = seats.find(s => Number(s.xPos) === x && Number(s.yPos) === y);
                    if (seat) {
                        const status = (seat.status || '').toString().toLowerCase();
                        let seatClass = 'seat';
                        let cursor = 'default';

                        if (status === 'free' || status === 'available') {
                            seatClass += ' free';
                            cursor = 'pointer';
                        }
                        else if (status === 'pending') {
                            seatClass += ' pending';
                            cursor = 'not-allowed';
                        }
                        else if (status === 'sold') {
                            seatClass += ' sold';
                            cursor = 'not-allowed';
                        }
                        else {
                            seatClass += ' pending';
                            cursor = 'not-allowed';
                        }

                        rowHTML += `<td style="padding:2px">
                            <div class="${seatClass}" id="seat-${seat.id}" 
                                 data-id="${seat.id}" data-x="${x}" data-y="${y}" 
                                 data-price="${seat.price}" data-status="${status}" 
                                 data-exists="true" style="cursor:${cursor}">
                                ${x}-${y}
                            </div>
                        </td>`;
                    } else {
                        // Потенциальное место (еще не создано в БД)
                        rowHTML += `<td style="padding:2px">
                            <div class="seat potential-free" id="potential-seat-${x}-${y}" 
                                 data-x="${x}" data-y="${y}" data-exists="false" 
                                 style="cursor:pointer;background:#4CAF50;color:white;text-align:center;border:2px dashed white;">
                                ${x}-${y}
                            </div>
                        </td>`;
                    }
                }
                rowHTML += `</tr>`;
                table.innerHTML += rowHTML;
            }

            const allSeats = table.querySelectorAll('.seat, .potential-free');
            allSeats.forEach(seatElement => {
                const exists = seatElement.dataset.exists === 'true';
                if (exists) {
                    const status = (seatElement.dataset.status || '').toLowerCase();
                    if (status === 'free' || status === 'available') {
                        seatElement.addEventListener('click', function () {
                            const seatId = Number(this.dataset.id);
                            const x = Number(this.dataset.x);
                            const y = Number(this.dataset.y);
                            const price = Number(this.dataset.price || 0);
                            handleSeatClick(seatId, x, y, price, this, true);
                        });
                    } else {
                        seatElement.addEventListener('click', function () {
                            const status = (this.dataset.status || '').toLowerCase();
                            if (status === 'pending') alert('Это место забронировано другим пользователем');
                            else if (status === 'sold') alert('Это место уже продано');
                        });
                    }
                } else {
                    seatElement.addEventListener('click', async function () {
                        const x = Number(this.dataset.x);
                        const y = Number(this.dataset.y);
                        const prevHtml = this.innerHTML;
                        this.innerHTML = '<span style="font-size:8px">⏳</span>';
                        this.style.cursor = 'wait';
                        const created = await createSeatIfNotExists(window.currentEventId, x, y);
                        if (created && created.id) {
                            this.id = `seat-${created.id}`;
                            this.dataset.id = created.id;
                            this.dataset.price = created.price;
                            this.dataset.status = 'free';
                            this.dataset.exists = 'true';
                            this.className = 'seat free';
                            this.innerHTML = `${x}-${y}`;
                            this.style.cursor = 'pointer';
                            handleSeatClick(created.id, x, y, created.price, this, true);
                        } else {
                            this.innerHTML = prevHtml;
                            this.style.cursor = 'pointer';
                            alert('Не удалось создать место. Попробуйте еще раз.');
                        }
                    });
                }
            });
            updateCounters();
        } catch (err) {
            console.error('generateTable error', err);
            table.innerHTML = `<tr><td colspan="100" style="padding:20px;color:red">Ошибка загрузки мест: ${escapeHtml(err.message || String(err))}</td></tr>`;
        }
    }
    function addToCart() {
        if (selectedSeats.length === 0) { alert('Выберите хотя бы одно место!'); return; }
        const eventTitle = (document.querySelector('.product-title')?.textContent) || 'Билет';
        const eventId = new URLSearchParams(window.location.search).get('id') || window.currentEventId;
        const cartData = {
            eventId,
            eventTitle,
            eventImageUrl: event.imageUrl || null,   // ← ДОБАВЛЕНО
            seats: selectedSeats.map(seat => ({
                id: seat.id,
                row: seat.y,
                seat: seat.x,
                price: seat.price,
                position: `${seat.y}-${seat.x}`,
                existsInDb: seat.existsInDb
            })),
            totalPrice: selectedSeats.reduce((s, seat) => s + (seat.price || 0), 0),
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('cart', JSON.stringify(cartData));
        // Прямой путь к cart.html
        window.location.href = 'cart.html';
    }
    function loadCart() {
        const cartData = safeJsonParse(localStorage.getItem('cart')) || null;
        const cartProducts = $('.cart-products');
        const cartTitle = $('.cart-title a');
        const cartTotal = document.querySelector('.cart-total h1:last-child');
        if (!cartData || !Array.isArray(cartData.seats) || cartData.seats.length === 0) {
            if (cartProducts) cartProducts.innerHTML = '<p style="text-align:center;padding:20px">Корзина пуста</p>';
            if (cartTitle) cartTitle.textContent = ' 0 шт.';
            if (cartTotal) cartTotal.textContent = '0 ₽';
            return;
        }
        if (cartTitle) cartTitle.textContent = ` ${cartData.seats.length} шт.`;
        if (cartTotal) cartTotal.textContent = `${Number(cartData.totalPrice || 0)} ₽`;
        if (cartProducts) {
            cartProducts.innerHTML = '';
            cartData.seats.forEach((seat, index) => {
                // Прямой путь к изображению
                const ticketHTML = `
                <div class="cart-ticket-card">
                    <div class="cart-ticket-image">
                        <img src="/images/ticket.png" alt="Билет" width="250" height="auto">
                    </div>
                    <div class="cart-info-container-container">
                        <div class="cart-info-container-left">
                            <div class="cart-ticket-info">
                                <h2>${escapeHtml(cartData.eventTitle)}</h2>
                                <p class="cart-ticket-desc">Билет на представление</p>
                            </div>
                            <div class="cart-ticket-info">
                                <div class="cart-pos">
                                    Ряд - ${escapeHtml(String(seat.row))}
                                </div>
                                <div class="cart-pos">
                                    Место - ${escapeHtml(String(seat.seat))}
                                </div>
                            </div>
                            <div class="cart-ticket-info">
                                <button class="cart-cancel-btn" data-index="${index}"><svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 20 20" fill="none"><line x1="2" y1="2" x2="18" y2="18" stroke="black" stroke-width="2" stroke-linecap="round"></line><line x1="18" y1="2" x2="2" y2="18" stroke="black" stroke-width="2" stroke-linecap="round"></line></svg></button>
                            </div>
                       </div>
                       <div class="cart-ticket-info" style="align-items:flex-end">
                        ${Number(seat.price || 0)} ₽</div>
                       </div></div>`;
                cartProducts.innerHTML += ticketHTML;
            });
            cartProducts.querySelectorAll('.cart-cancel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = Number(btn.dataset.index);
                    removeFromCart(idx);
                });
            });
        }
    }
    window.removeFromCart = function (index) {
        const cartData = safeJsonParse(localStorage.getItem('cart'));
        if (!cartData || !Array.isArray(cartData.seats)) return;
        cartData.seats.splice(index, 1);
        cartData.totalPrice = cartData.seats.reduce((sum, s) => sum + Number(s.price || 0), 0);
        localStorage.setItem('cart', JSON.stringify(cartData));
        location.reload();
    };
    function checkout() {
        const overlay = $('#checkout-overlay');
        const closeBtn = $('.checkout-close');
        const submitBtn = $('#checkout-submit');
        const errBox = $('#checkout-error');
        const inpName = $('#checkout-fullname');
        const inpEmail = $('#checkout-email');
        const inpPhone = $('#checkout-phone');
        const cartData = safeJsonParse(localStorage.getItem('cart'));
        if (!cartData || !cartData.seats || cartData.seats.length === 0) {
            alert("Корзина пуста!");
            return;
        }
        errBox.textContent = "";
        inpName.value = "";
        inpEmail.value = "";
        inpPhone.value = "";
        overlay.classList.remove("hidden");
        requestAnimationFrame(() => overlay.classList.add("visible"));
        closeBtn.onclick = () => {
            overlay.classList.remove("visible");
            setTimeout(() => overlay.classList.add("hidden"), 300);
        };
        function validate() {
            if (inpName.value.trim().length < 5) return "Введите корректное ФИО (мин. 5 символов)";
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inpEmail.value)) return "Введите корректный email";
            if (!/^\+?\d[\d\s\-]{7,}$/.test(inpPhone.value)) return "Введите корректный телефон";
            return null;
        }
        submitBtn.onclick = () => {
            const error = validate();
            if (error) { errBox.textContent = error; return; }
            const orderDto = { FullName: inpName.value.trim(), Email: inpEmail.value.trim(), Phone: inpPhone.value.trim(), TotalAmount: cartData.totalPrice, PaymentMethod: "SBP", Seats: cartData.seats.map(s => s.id) };
            fetch(apiUrl('/api/orders'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderDto) })
                .then(res => res.ok ? res.json() : res.text().then(t => Promise.reject(t)))
                .then(order => {
                    return fetch(apiUrl(`/api/orders/pay/${order.id}`), { method: 'POST', headers: { 'Content-Type': 'application/json' } }).then(r => r.ok ? r.json().then(p => ({ order, p })) : Promise.reject("Ошибка оплаты"));
                })
                .then(({ order }) => {
                    overlay.classList.remove("visible");
                    setTimeout(() => overlay.classList.add("hidden"), 300);
                    alert(`Заказ #${order.id} успешно оплачен!`);
                    localStorage.removeItem('cart');
                    window.location.href = "/index.html";
                })
                .catch(err => { errBox.textContent = typeof err === "string" ? err : "Ошибка оформления заказа"; });
        };
    }
    function isIndexPage() {
        const filename = window.location.pathname.split('/').pop();
        return filename === '' || filename === 'index.html';
    }
    function isEventPage() { return window.location.pathname.includes('event.html'); }
    function isCartPage() { return window.location.pathname.includes('cart.html'); }
    function safeJsonParse(text) { try { return JSON.parse(text); } catch { return null; } }
    function escapeHtml(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
    function initScreamer() {
        let scrollSequence = 0; let wasBottom = false, wasTop = false; let shown = false;
        window.addEventListener('scroll', () => {
            if (shown) return;
            const top = window.scrollY || window.pageYOffset;
            const h = window.innerHeight;
            const dh = document.documentElement.scrollHeight;
            const atBottom = top + h >= dh - 50;
            const atTop = top <= 50;
            if (scrollSequence % 2 === 0 && atBottom && !wasBottom) scrollSequence++;
            else if (scrollSequence % 2 === 1 && atTop && !wasTop) scrollSequence++;
            wasBottom = atBottom; wasTop = atTop;
            if (!shown && scrollSequence >= 20) { shown = true; showScreamer(); }
        });
        function showScreamer() {
            const overlay = document.createElement('div');
            overlay.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 9999; display:flex;justify-content:center;align-items:center;flex-direction:column;`;
            const img = document.createElement('img');
            // Прямой путь к изображению
            img.src = 'images/foxy.gif';
            img.style.maxWidth = '90vw'; img.style.maxHeight = '90vh';
            overlay.appendChild(img); document.body.appendChild(overlay);
            // Прямой путь к музыке
            const sound = new Audio('music/foxy.mp3'); sound.volume = 0.1; sound.play().catch(() => { });
            setTimeout(() => { sound.pause(); sound.currentTime = 0; overlay.remove(); }, 2000);
        }
    }
    console.log('app.js initialization. API_BASE=', API_BASE);
    initMusic(); initSmoothFAQ();
    if (isIndexPage()) { loadEvents(); initScreamer(); }
    if (isEventPage()) {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        if (eventId) {
            setTimeout(() => {
                generateTable(eventId);
                const cartBtn = $('.cart-btn');
                if (cartBtn) cartBtn.addEventListener('click', (e) => { e.preventDefault(); addToCart(); });
                setInterval(() => updateSeatsStatus(eventId), 10000);
            }, 80);
        } else { console.warn('ID события не найден в URL'); }
    }
    if (isCartPage()) {
        loadCart();
        const orderBtn = $('.order-btn');
        if (orderBtn) orderBtn.addEventListener('click', checkout);
    }
    console.log('Инициализация завершена');
});