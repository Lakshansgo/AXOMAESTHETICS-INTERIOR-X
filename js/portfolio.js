document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------
    // Category Filtering
    // -------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    if (filterButtons.length > 0 && portfolioItems.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.getAttribute('data-filter');
                
                portfolioItems.forEach(item => {
                    const categories = item.getAttribute('data-category').split(' ');
                    
                    if (filter === 'all' || categories.includes(filter)) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 400); // Wait for transition fade
                    }
                });
            });
        });
    }

    // -------------------------------------
    // Project Modals (Open & Close)
    // -------------------------------------
    const items = document.querySelectorAll('.portfolio-item');
    const modals = document.querySelectorAll('.project-modal');
    const closeButtons = document.querySelectorAll('.modal-close');
    
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetModalId = item.getAttribute('href').substring(1);
            const targetModal = document.getElementById(targetModalId);
            
            if (targetModal) {
                targetModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Initialize Before/After slider inside this modal if present
                const sliderContainer = targetModal.querySelector('.ba-container');
                if (sliderContainer) {
                    initBeforeAfterSlider(sliderContainer);
                }
            }
        });
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('active'));
            document.body.style.overflow = '';
        });
    });
    
    // Close modal on escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => modal.classList.remove('active'));
            document.body.style.overflow = '';
        }
    });

    // -------------------------------------
    // Before & After Slider Logic
    // -------------------------------------
    const initBeforeAfterSlider = (container) => {
        const afterSide = container.querySelector('.ba-after');
        const afterImg = afterSide.querySelector('img');
        const handle = container.querySelector('.ba-slider-handle');
        
        let isDragging = false;
        
        // Dynamically size after image to match container width
        const resizeAfterImage = () => {
            afterImg.style.width = container.offsetWidth + 'px';
        };
        
        resizeAfterImage();
        window.addEventListener('resize', resizeAfterImage);
        
        const drag = (e) => {
            if (!isDragging) return;
            
            const rect = container.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let x = clientX - rect.left;
            
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;
            
            const percentage = (x / rect.width) * 100;
            afterSide.style.width = percentage + '%';
            handle.style.left = percentage + '%';
        };
        
        const startDrag = () => {
            isDragging = true;
        };
        
        const stopDrag = () => {
            isDragging = false;
        };
        
        handle.addEventListener('mousedown', startDrag);
        window.addEventListener('mouseup', stopDrag);
        
        handle.addEventListener('touchstart', startDrag);
        window.addEventListener('touchend', stopDrag);
        
        window.addEventListener('mousemove', drag);
        window.addEventListener('touchmove', drag);
    };

    // -------------------------------------
    // Photo Lightbox Logic
    // -------------------------------------
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <span class="lightbox-nav lightbox-prev">&#10094;</span>
        <div class="lightbox-content">
            <img src="" alt="Lightbox image">
        </div>
        <span class="lightbox-nav lightbox-next">&#10095;</span>
    `;
    document.body.appendChild(lightbox);
    
    const lightboxImg = lightbox.querySelector('.lightbox-content img');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');
    
    let currentGalleryImages = [];
    let currentImageIndex = 0;
    
    // Bind click events on gallery items inside modals
    document.querySelectorAll('.modal-gallery-item, .service-gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (!img) return;
            
            // Gather all images in this specific gallery
            const galleryGrid = item.closest('.modal-gallery-grid, .service-gallery-grid');
            const siblingItems = Array.from(galleryGrid.querySelectorAll('.modal-gallery-item img, .service-gallery-item img'));
            
            currentGalleryImages = siblingItems.map(sibling => sibling.getAttribute('src'));
            currentImageIndex = currentGalleryImages.indexOf(img.getAttribute('src'));
            
            openLightbox();
        });
    });
    
    const openLightbox = () => {
        lightboxImg.setAttribute('src', currentGalleryImages[currentImageIndex]);
        lightbox.classList.add('active');
    };
    
    const closeLightbox = () => {
        lightbox.classList.remove('active');
    };
    
    const showNextImage = () => {
        currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length;
        lightboxImg.setAttribute('src', currentGalleryImages[currentImageIndex]);
    };
    
    const showPrevImage = () => {
        currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
        lightboxImg.setAttribute('src', currentGalleryImages[currentImageIndex]);
    };
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', showNextImage);
    lightboxPrev.addEventListener('click', showPrevImage);
    
    // Close lightbox on clicking dark background
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation inside lightbox
    window.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPrevImage();
    });
});
