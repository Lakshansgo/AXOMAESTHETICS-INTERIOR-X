document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------
    // Modal Open & Close Logic
    // -------------------------------------
    const detailButtons = document.querySelectorAll('.btn-card-secondary');
    const modals = document.querySelectorAll('.service-modal');
    const closeButtons = document.querySelectorAll('.modal-close');
    
    const openModal = (modalId) => {
        const actualId = modalId.startsWith('modal-') ? modalId : `modal-${modalId}`;
        const targetModal = document.getElementById(actualId);
        if (targetModal) {
            targetModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };
    
    const closeAllModals = () => {
        modals.forEach(modal => modal.classList.remove('active'));
        document.body.style.overflow = '';
    };
    
    // Bind click events to "View Details" buttons
    detailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-target');
            if (targetId) {
                e.preventDefault();
                openModal(targetId);
                // Update URL hash without jumping page scroll
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
    
    // Bind click events to close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
            // Remove hash from URL
            history.pushState(null, null, ' ');
        });
    });
    
    // Close modal on escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            history.pushState(null, null, ' ');
        }
    });

    // Handle deep-linking from hash (scroll to card section)
    const handleHash = () => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetCard = document.getElementById(hash);
            if (targetCard) {
                setTimeout(() => {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300); // Small timeout to ensure transition loading completes
            }
        }
    };
    
    window.addEventListener('hashchange', handleHash);
    handleHash(); // Run once on page load

    // -------------------------------------
    // Highlight active section on scroll
    // -------------------------------------
    const observerOptions = {
        root: null,
        rootMargin: '-30% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                if (id) {
                    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                            // Scroll mobile horizontal nav to active item
                            if (window.innerWidth <= 1024) {
                                const list = document.querySelector('.sidebar-nav-list');
                                const activeLink = link;
                                if (list && activeLink) {
                                    list.scrollTo({
                                        left: activeLink.offsetLeft - 20,
                                        behavior: 'smooth'
                                    });
                                }
                            }
                        }
                    });
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.services-main-grid .service-card').forEach(card => {
        observer.observe(card);
    });

    // -------------------------------------
    // FAQ Accordion Logic inside Modals
    // -------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Toggle active state
                item.classList.toggle('active');
                
                if (!isActive) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = null;
                }
            });
        }
    });
});
