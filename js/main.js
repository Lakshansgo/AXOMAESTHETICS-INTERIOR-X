document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------
    // Page Loader
    // -------------------------------------
    const loader = document.querySelector('.loader-overlay');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 800); // Give enough time for loading visual feedback
        });
        
        // Fallback if window load doesn't fire quickly
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 3000);
    }

    // -------------------------------------
    // Sticky Header Scroll Effect
    // -------------------------------------
    const header = document.querySelector('header');
    const backToTopBtn = document.querySelector('.back-to-top');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        if (backToTopBtn) {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on load to set initial state

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // -------------------------------------
    // Mobile Menu Toggle
    // -------------------------------------
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
            
            // Prevent scroll when menu is open
            if (navMenu.classList.contains('open')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu on nav link click
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('open');
                navMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // -------------------------------------
    // Scroll Reveal (Intersection Observer)
    // -------------------------------------
    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target); // Reveal once
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });
        
        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        // Fallback for older browsers
        revealElements.forEach(element => {
            element.classList.add('revealed');
        });
    }

    // -------------------------------------
    // Premium Page Transitions
    // -------------------------------------
    const transitionOverlay = document.querySelector('.page-transition-overlay');
    const transitionLinks = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="tel:"]):not([href^="mailto:"]):not([target="_blank"])');
    
    if (transitionOverlay && transitionLinks.length > 0) {
        transitionLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetUrl = link.getAttribute('href');
                // Don't transition if it is an empty or javascript href
                if (!targetUrl || targetUrl.startsWith('javascript:')) return;
                
                e.preventDefault();
                transitionOverlay.classList.add('active');
                
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 600); // Matches the transition duration in CSS
            });
        });
        
        // Ensure transition overlay slides out on page load/show
        window.addEventListener('pageshow', (event) => {
            // Check if page loaded from cache (e.g. back button)
            if (event.persisted) {
                transitionOverlay.classList.remove('active');
            }
        });
    }

    // -------------------------------------
    // Footer Newsletter Form Submission
    // -------------------------------------
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('.newsletter-input');
            const submitBtn = newsletterForm.querySelector('.newsletter-btn');
            const email = emailInput.value.trim();
            
            if (!email || !validateEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Show premium loading/success state
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = '...';
            submitBtn.style.pointerEvents = 'none';
            
            setTimeout(() => {
                submitBtn.innerText = 'SUBSCRIBED';
                emailInput.value = '';
                alert('Thank you for subscribing to our luxury design insights!');
                
                setTimeout(() => {
                    submitBtn.innerText = originalBtnText;
                    submitBtn.style.pointerEvents = 'auto';
                }, 3000);
            }, 1200);
        });
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Highlight Active Page in Nav Bar
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // -------------------------------------
    // Device-Aware Call Floating Button
    // -------------------------------------
    const floatCallBtn = document.querySelector('.float-call');
    if (floatCallBtn) {
        // Detect if desktop screen & non-touch user-agent
        const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) && (window.innerWidth > 1024);
        
        if (isDesktop) {
            // Create and append the luxury tooltip structure
            const tooltip = document.createElement('div');
            tooltip.className = 'call-tooltip';
            tooltip.id = 'call-tooltip';
            tooltip.innerHTML = `
                <div class="call-tooltip-header">
                    <span class="call-tooltip-title">Direct Line</span>
                    <button class="call-tooltip-close" aria-label="Close tooltip">&times;</button>
                </div>
                <div class="call-tooltip-number">+91 6900823198</div>
                <div class="call-tooltip-footer">
                    <button class="btn-copy-num" id="btn-copy-num">Copy Number</button>
                    <span class="call-tooltip-sub">Call from Mobile</span>
                </div>
            `;
            
            // Append tooltip to the parent container of the float button
            floatCallBtn.parentElement.appendChild(tooltip);
            
            // Intercept click on desktop
            floatCallBtn.addEventListener('click', (e) => {
                e.preventDefault();
                tooltip.classList.add('active');
            });
            
            // Close tooltip event
            const closeBtn = tooltip.querySelector('.call-tooltip-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tooltip.classList.remove('active');
                });
            }
            
            // Copy phone number event
            const copyBtn = tooltip.querySelector('#btn-copy-num');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText('+916900823198').then(() => {
                        const originalText = copyBtn.innerText;
                        copyBtn.innerText = 'COPIED';
                        copyBtn.style.backgroundColor = '#25D366';
                        copyBtn.style.borderColor = '#25D366';
                        copyBtn.style.color = '#fff';
                        
                        setTimeout(() => {
                            copyBtn.innerText = originalText;
                            copyBtn.style.backgroundColor = '';
                            copyBtn.style.borderColor = '';
                            copyBtn.style.color = '';
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
                });
            }
            
            // Close tooltip on clicking outside
            document.addEventListener('click', (e) => {
                if (!tooltip.contains(e.target) && e.target !== floatCallBtn) {
                    tooltip.classList.remove('active');
                }
            });
        }
    }
});
