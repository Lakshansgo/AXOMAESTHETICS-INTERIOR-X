document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------
    // Floating Labels & Focus States
    // -------------------------------------
    const formInputs = document.querySelectorAll('.form-input');
    
    const checkValue = (input) => {
        const group = input.closest('.form-group');
        if (group) {
            if (input.value.trim() !== '') {
                group.classList.add('has-value');
            } else {
                group.classList.remove('has-value');
            }
        }
    };
    
    formInputs.forEach(input => {
        // Run once on load for cached inputs
        checkValue(input);
        
        input.addEventListener('focus', () => {
            const group = input.closest('.form-group');
            if (group) group.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            const group = input.closest('.form-group');
            if (group) group.classList.remove('focused');
            checkValue(input);
            validateInput(input); // Instant validation on blur
        });
        
        input.addEventListener('input', () => {
            checkValue(input);
        });
    });

    // -------------------------------------
    // Query Parameter Parsing for Pre-selects
    // -------------------------------------
    const preselectService = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const service = urlParams.get('service');
        const selectEl = document.getElementById('project-type');
        
        if (service && selectEl) {
            // Find option matching parameter value
            for (let i = 0; i < selectEl.options.length; i++) {
                if (selectEl.options[i].value === service) {
                    selectEl.selectedIndex = i;
                    const group = selectEl.closest('.form-group');
                    if (group) group.classList.add('has-value');
                    break;
                }
            }
        }
    };
    preselectService();

    // -------------------------------------
    // Form Validation Rules
    // -------------------------------------
    const validateInput = (input) => {
        const group = input.closest('.form-group');
        if (!group) return true;
        
        const value = input.value.trim();
        const errorEl = group.querySelector('.error-message');
        const required = input.hasAttribute('required');
        
        let isValid = true;
        let errorMessage = '';
        
        if (required && value === '') {
            isValid = false;
            errorMessage = 'This field is required.';
        } else if (value !== '') {
            if (input.type === 'email' && !validateEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
            } else if (input.type === 'tel' && !validatePhone(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid 10-digit phone number.';
            }
        }
        
        if (!isValid) {
            group.classList.add('has-error');
            if (errorEl) errorEl.innerText = errorMessage;
        } else {
            group.classList.remove('has-error');
        }
        
        return isValid;
    };
    
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    const validatePhone = (phone) => {
        // Support Indian 10-digit mobile phone numbers with optional country prefix
        const re = /^(?:\+91|0)?[6-9]\d{9}$/;
        return re.test(phone.replace(/\s+/g, ''));
    };

    // -------------------------------------
    // Form Submissions (Secure API Integration)
    // -------------------------------------
    const contactForm = document.getElementById('contact-form');
    const consultationForm = document.getElementById('consultation-form');
    
    const handleFormSubmit = async (form, e) => {
        e.preventDefault();
        
        // 1. Duplicate submission lock check
        if (form.getAttribute('data-submitting') === 'true') {
            return;
        }

        // 2. LocalStorage rate limiter check (anti-bot / spam clicks)
        const formId = form.getAttribute('id');
        const lastSubmitTime = localStorage.getItem(`last_submit_${formId}`);
        const now = Date.now();
        if (lastSubmitTime && now - parseInt(lastSubmitTime, 10) < 10000) {
            alert('Submission received. Please wait a moment before sending another.');
            return;
        }
        
        const inputs = Array.from(form.querySelectorAll('.form-input'));
        let isFormValid = true;
        
        inputs.forEach(input => {
            const isInputValid = validateInput(input);
            if (!isInputValid) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            const firstError = form.querySelector('.has-error .form-input');
            if (firstError) firstError.focus();
            return;
        }

        // 3. Honeypot check (anti-bot trap)
        const honeypotInput = form.querySelector('input[name="honeypot"]');
        if (honeypotInput && honeypotInput.value.trim() !== '') {
            console.warn('Bot submission blocked.');
            // Trick bots by simulating a successful response
            form.style.display = 'none';
            const successPanel = form.closest('.form-card').querySelector('.success-panel');
            if (successPanel) successPanel.classList.add('active');
            return;
        }
        
        // Lock form inputs during transaction
        form.setAttribute('data-submitting', 'true');
        
        // Show premium loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Securing Connection...';
        submitBtn.style.pointerEvents = 'none';
        
        // Collect form data and sanitize text values against XSS
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (typeof value === 'string') {
                data[key] = value
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .trim();
            } else {
                data[key] = value;
            }
        });

        // Set submit timestamp
        localStorage.setItem(`last_submit_${formId}`, Date.now().toString());
        
        try {
            submitBtn.innerHTML = 'Transmitting...';
            
            // Post payload to Serverless Vercel API
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success: Hide Form and Show Success Panel
                form.style.display = 'none';
                const successPanel = form.closest('.form-card').querySelector('.success-panel');
                if (successPanel) {
                    successPanel.classList.add('active');
                    form.closest('.form-card').scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
                form.reset();
                formInputs.forEach(input => {
                    const group = input.closest('.form-group');
                    if (group) group.classList.remove('has-value');
                });
                
                // Clear any leftover errors
                const errorFeedback = form.querySelector('.form-error-feedback');
                if (errorFeedback) errorFeedback.innerText = '';
            } else {
                throw new Error(result.error || 'Transmission failed. Please try again.');
            }
        } catch (error) {
            console.error('Submission failed:', error.message);
            
            // Show inline feedback error block
            let errorFeedback = form.querySelector('.form-error-feedback');
            if (!errorFeedback) {
                errorFeedback = document.createElement('div');
                errorFeedback.className = 'form-error-feedback';
                errorFeedback.style.color = '#ff6b6b';
                errorFeedback.style.fontSize = '0.85rem';
                errorFeedback.style.marginTop = '15px';
                errorFeedback.style.textAlign = 'center';
                form.appendChild(errorFeedback);
            }
            errorFeedback.innerText = error.message;
        } finally {
            // Unlock inputs and restore CTA button
            form.removeAttribute('data-submitting');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.style.pointerEvents = 'auto';
        }
    };
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => handleFormSubmit(contactForm, e));
    }
    
    if (consultationForm) {
        consultationForm.addEventListener('submit', (e) => handleFormSubmit(consultationForm, e));
    }
});
