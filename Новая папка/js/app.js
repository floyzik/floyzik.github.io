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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initSmoothFAQ);

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

            if (!shown && scrollSequence >= 10) {
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
            sound.play().catch(() => {});

            setTimeout(() => {
                sound.pause();
                sound.currentTime = 0;
                overlay.remove();
            }, 2000);
        }
    }


    // ИНИЦИАЛИЗАЦИЯ
    initMusic();
    initSmoothFAQ();

    console.log('Готово! GIF-скример работает');


});