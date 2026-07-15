document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------
    // Testimonials Slider
    // -------------------------------------
    const track = document.querySelector('.testimonial-track');
    const slides = Array.from(document.querySelectorAll('.testimonial-slide'));
    const nextBtn = document.getElementById('test-next');
    const prevBtn = document.getElementById('test-prev');

    if (track && slides.length > 0) {
        let currentIndex = 0;

        const updateSlider = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        };

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % slides.length;
                updateSlider();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                updateSlider();
            });
        }

        // Optional: Auto-slide every 7 seconds
        let autoSlideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlider();
        }, 7000);

        // Pause auto-sliding on manual controls interaction
        const resetInterval = () => {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % slides.length;
                updateSlider();
            }, 7000);
        };

        if (nextBtn) nextBtn.addEventListener('click', resetInterval);
        if (prevBtn) prevBtn.addEventListener('click', resetInterval);
    }
});
