document.addEventListener('DOMContentLoaded', () => {

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    const isIndexPage =
        window.location.pathname.endsWith('/') ||
        window.location.pathname.endsWith('/index.html') ||
        (window.location.pathname.endsWith('.html') &&
            !window.location.pathname.includes('/sites/'));

    const getBasePath = () =>
        window.location.pathname.includes('/sites/') ? '../' : './';

    // === МУЗЫКА ===
    function initMusic() {
        const musicButton = document.querySelector('.button-music');
        let audio = null;

        if (!musicButton) return;

        const musicPlay = musicButton.querySelector('.music-play');
        const musicStop = musicButton.querySelector('.music-stop');

        if (musicPlay && musicStop) {
            musicPlay.style.opacity = '0';
            musicStop.style.opacity = '1';
        }

        musicButton.addEventListener('click', function () {
            this.classList.toggle('active');

            if (musicPlay && musicStop) {
                const active = this.classList.contains('active');
                musicPlay.style.opacity = active ? '1' : '0';
                musicStop.style.opacity = active ? '0' : '1';
            }

            if (this.classList.contains('active')) {
                if (!audio) {
                    audio = new Audio(getBasePath() + 'music/clowining.mp3');
                    audio.loop = true;
                    audio.volume = 0.1;
                }
                audio.play().catch(err => console.error(err));
            } else {
                audio?.pause();
            }
        });
    }

    // === FAQ ===
    function initSmoothFAQ() {
        document.querySelectorAll('.faq-answer').forEach(faqAnswer => {

            faqAnswer.querySelector('.faq-answer-button').addEventListener('click', e => {
                e.preventDefault();

                const isOpening = !faqAnswer.classList.contains('active');

                // Закрываем все открытые FAQ
                document.querySelectorAll('.faq-answer.active').forEach(openItem => {
                    if (openItem !== faqAnswer) {
                        closeFaq(openItem);
                    }
                });

                // Открываем или закрываем текущий FAQ
                if (isOpening) {
                    openFaq(faqAnswer);
                } else {
                    closeFaq(faqAnswer);
                }
            });

            function openFaq(faqAnswer) {
                const text = faqAnswer.querySelector('.faq-answer-text');
                const button = faqAnswer.querySelector('.faq-answer-button');

                faqAnswer.classList.add('active');
                button.setAttribute('aria-expanded', 'true');
                text.style.maxHeight = text.scrollHeight + 'px';
                text.style.opacity = '1';
            }

            function closeFaq(faqAnswer) {
                const text = faqAnswer.querySelector('.faq-answer-text');
                const button = faqAnswer.querySelector('.faq-answer-button');

                faqAnswer.classList.remove('active');
                button.setAttribute('aria-expanded', 'false');
                text.style.maxHeight = '0';
                text.style.opacity = '0';
            }
        });
    }

    // === КАРУСЕЛЬ С АДАПТИВНЫМИ КНОПКАМИ ===
    function initCarousel() {
        const carousel = document.getElementById('eventsCarousel');
        const wrapper = carousel ? carousel.closest('.carousel-wrapper') : null;
        const leftBtn = wrapper ? wrapper.querySelector('.carousel-btn.left') : null;
        const rightBtn = wrapper ? wrapper.querySelector('.carousel-btn.right') : null;

        if (!carousel || !wrapper || !leftBtn || !rightBtn) return;

        // Удаляем onclick из HTML, будем управлять через JS
        leftBtn.removeAttribute('onclick');
        rightBtn.removeAttribute('onclick');

        // Функция проверки, нужны ли кнопки
        function updateButtonsVisibility() {
            const canScroll = carousel.scrollWidth > carousel.clientWidth;

            if (canScroll) {
                leftBtn.style.opacity = '0.8';
                rightBtn.style.opacity = '0.8';
                leftBtn.style.visibility = 'visible';
                rightBtn.style.visibility = 'visible';
                leftBtn.style.pointerEvents = 'auto';
                rightBtn.style.pointerEvents = 'auto';
            } else {
                leftBtn.style.opacity = '0';
                rightBtn.style.opacity = '0';
                leftBtn.style.visibility = 'hidden';
                rightBtn.style.visibility = 'hidden';
                leftBtn.style.pointerEvents = 'none';
                rightBtn.style.pointerEvents = 'none';
            }

            // Обновляем состояние кнопок в зависимости от позиции скролла
            updateButtonStates();
        }

        // Функция обновления состояния кнопок (активные/неактивные)
        function updateButtonStates() {
            const scrollPosition = carousel.scrollLeft;
            const maxScroll = carousel.scrollWidth - carousel.clientWidth;

            // Скрываем левую кнопку, если в начале
            if (scrollPosition <= 10) {
                leftBtn.style.opacity = '0';
                leftBtn.style.pointerEvents = 'none';
            } else {
                if (carousel.scrollWidth > carousel.clientWidth) {
                    leftBtn.style.opacity = '0.8';
                    leftBtn.style.pointerEvents = 'auto';
                }
            }

            // Скрываем правую кнопку, если в конце
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

        // Функция прокрутки карусели
        function scrollCarousel(direction) {
            const card = carousel.querySelector('.ticket-card');
            if (!card) return;

            const cardWidth = card.offsetWidth;
            const gap = 32; // 2rem = 32px
            const scrollAmount = (cardWidth + gap) * direction;

            carousel.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });

            // Обновляем состояние кнопок после анимации
            setTimeout(updateButtonStates, 300);
        }

        // Инициализация
        function init() {
            // Проверяем видимость кнопок при загрузке
            setTimeout(updateButtonsVisibility, 100);

            // И при изменении размера окна
            window.addEventListener('resize', updateButtonsVisibility);

            // Следим за скроллом карусели
            carousel.addEventListener('scroll', updateButtonStates);

            // Вешаем обработчики на кнопки
            leftBtn.addEventListener('click', () => scrollCarousel(-1));
            rightBtn.addEventListener('click', () => scrollCarousel(1));
        }

        init();
    }

    // === СКРИМЕР (GIF) ===
    if (isIndexPage) {
        let scrollSequence = 0;
        let wasBottom = false, wasTop = false;
        let shown = false;

        window.addEventListener('scroll', () => {
            if (shown) return;

            const top = window.scrollY;
            const h = window.innerHeight;
            const dh = document.documentElement.scrollHeight;

            const atBottom = top + h >= dh - 50;
            const atTop = top <= 50;

            if (scrollSequence % 2 === 0 && atBottom && !wasBottom) {
                scrollSequence++;
                console.log(`Достигнут низ! Следующая цель: верх. Шаг: ${scrollSequence}`);
            }
            else if (scrollSequence % 2 === 1 && atTop && !wasTop) {
                scrollSequence++;
                console.log(`Достигнут верх! Следующая цель: низ. Шаг: ${scrollSequence}`);
            }

            wasBottom = atBottom;
            wasTop = atTop;

            if (!shown && scrollSequence >= 20) {
                shown = true;
                showScreamer();
            }
        });

        function showScreamer() {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.95);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
            `;

            const img = document.createElement('img');
            img.src = getBasePath() + 'images/foxy.gif';
            img.style.cssText = `
                max-width: 90vw;
                max-height: 90vh;
                display: block;
            `;

            overlay.appendChild(img);
            document.body.appendChild(overlay);

            const sound = new Audio(getBasePath() + 'music/foxy.mp3');
            sound.volume = 0.1;
            sound.play().catch(() => { });

            setTimeout(() => {
                sound.pause();
                sound.currentTime = 0;
                overlay.remove();
            }, 2000);
        }
    }

    async function loadEvents() {
        try {
            console.info("Загрузка мероприятий: Начало");

            const [eventsResponse, seatsResponse] = await Promise.all([
                fetch("/api/events"),
                fetch("/api/seats")
            ]);

            if (!eventsResponse.ok) throw new Error("Ошибка загрузки мероприятий");
            if (!seatsResponse.ok) throw new Error("Ошибка загрузки мест");

            const events = await eventsResponse.json();
            const seats = await seatsResponse.json();

            const carousel = document.getElementById("eventsCarousel");
            carousel.innerHTML = "";

            const seatsByEvent = {};
            seats.forEach(seat => {
                if (!seatsByEvent[seat.eventId]) seatsByEvent[seat.eventId] = [];
                seatsByEvent[seat.eventId].push(seat);
            });

            events.forEach(ev => {
                const eventSeats = seatsByEvent[ev.id] || [];

                // Ищем первое доступное место
                const availableSeat = eventSeats.find(seat => seat.available === true || seat.status === 'available');

                let price = "Нет свободных мест"; // Значение по умолчанию

                if (availableSeat && availableSeat.price) {
                    price = availableSeat.price + " руб.";
                }

                const card = document.createElement("a");
                card.href = `pages/event.html?id=${ev.id}`;
                card.className = "ticket-card";

                card.innerHTML = `
                <div class="ticket-image">
                    <img src="images/ticket.png" alt="${ev.title}">
                </div>
                <div class="ticket-info">
                    <h2>${ev.title}</h2>
                    <p class="ticket-desc">${ev.description}</p>
                    <p class="ticket-price">${price}</p>
                </div>
            `;

                carousel.appendChild(card);
            });

            requestAnimationFrame(() => initCarousel());
            console.info("Готово!");

        } catch (err) {
            console.error("Ошибка:", err);
        }
    }
    //async function eventgrid() {
    //    // вызываем только на странице event.html
    //    if (!window.location.pathname.includes("event.html")) return;

    //    const params = new urlsearchparams(window.location.search);
    //    const eventid = params.get("id");
    //    if (!eventid) return;

    //    const titleel = document.queryselector(".product-title");
    //    const descel = document.queryselector(".product-desc");
    //    const priceel = document.queryselector(".product-price");
    //    const qtycount = document.queryselector(".qty-count");
    //    const gridcontainer = document.queryselector(".choose-seat");

    //    let selectedseats = [];

    //    try {
    //        // загружаем событие и места
    //        const [eventres, seatsres] = await promise.all([
    //            fetch(`/api/events/${eventid}`),
    //            fetch(`/api/seats/event/${eventid}`)
    //        ]);

    //        if (!eventres.ok) throw new error("ошибка загрузки события");
    //        if (!seatsres.ok) throw new error("ошибка загрузки мест");

    //        const eventdata = await eventres.json();
    //        const seats = await seatsres.json();

    //        // устанавливаем заголовок и описание
    //        titleel.textcontent = eventdata.title;
    //        descel.textcontent = eventdata.description ?? "описание отсутствует";

    //        // настройки сетки
    //        gridcontainer.style.display = "grid";
    //        gridcontainer.style.gridtemplatecolumns = `repeat(${eventdata.xsize}, 32px)`;
    //        gridcontainer.style.gridtemplaterows = `repeat(${eventdata.ysize}, 32px)`;
    //        gridcontainer.style.gap = "6px";

    //        seats.foreach(seat => {
    //            const div = document.createelement("div");
    //            div.classlist.add("seat");

    //            div.dataset.id = seat.id;
    //            div.dataset.price = seat.price;

    //            // статусы
    //            if (seat.status === "free") div.classlist.add("free");      // зелёный
    //            if (seat.status === "pending") div.classlist.add("pending"); // жёлтый
    //            if (seat.status === "sold") div.classlist.add("sold");       // красный

    //            // координаты
    //            div.style.gridcolumn = seat.xpos;
    //            div.style.gridrow = seat.ypos;

    //            // выбор места
    //            if (seat.status === "free") {
    //                div.addeventlistener("click", () => {
    //                    div.classlist.toggle("selected");

    //                    if (div.classlist.contains("selected")) {
    //                        selectedseats.push(seat);
    //                    } else {
    //                        selectedseats = selectedseats.filter(s => s.id !== seat.id);
    //                    }

    //                    qtycount.textcontent = selectedseats.length;

    //                    const total = selectedseats.reduce((t, s) => t + s.price, 0);
    //                    priceel.textcontent = total + " руб.";
    //                });
    //            }

    //            gridcontainer.appendchild(div);
    //        });

    //    } catch (err) {
    //        console.error("ошибка загрузки:", err);
    //    }
    //}

    async function generateTable(id = 0) {
        // Запрос на получение эвента и выуживание от туда всех ЗАНЯТЫХ сидений
        const response = await fetch(`/api/events/${id}`);
        const event = await response.json();
        const seats = event.seats

        // Получение таблицы мест
        const table = document.getElementById('seats');
        table.innerHTML = ""

        // Создаём переменную в которую будет дополнять код по мере генерации
        var gen_string = "";
        var seat = undefined; // для места йоу

        // Тут мы проходим по всему прямоугольнику эвента
        // и если в местах эвента
        // при проходе клетки с (y/x) есть место с этими (y/x) то
        // подставляем туда данные места
        // если такого места нет то оно пустое
        for (var y = 0; y < event.ySize; y++) { // Создаём строку в таблице
            gen_string = `<tr>`
            for (var x = 0; x < event.xSize; x++) { // Создаём столбик в таблице
                gen_string += `<td>`;
                seat = seats.find(s => s.xPos === x && s.yPos === y); // Пытаемся найти место с текущим положением
                if (seat) { // Если нашли
                    gen_string += `<p style="color: red;">${seat.id}</p>`
                } else { // Если не нашли
                    gen_string += `<p style="color: green;">N</p>`
                }
                gen_string += `</td>`;
            }
            gen_string += `</tr>`;
            table.innerHTML += gen_string; // Добавляем эту строчку к таблице
            gen_string = ""; // И сбрасываем её
        }
    }






    // ИНИЦИАЛИЗАЦИЯ ВСЕХ ФУНКЦИЙ
    initMusic();
    initSmoothFAQ();

    if (isIndexPage) {
        loadEvents();
        setTimeout(initCarousel, 100);
    }
    if (window.location.pathname.includes("event.html")) {
        generateTable(2); // нужно как-то получать id event
    }

    


    console.log('Готово! Карусель с адаптивными кнопками инициализирована');

});