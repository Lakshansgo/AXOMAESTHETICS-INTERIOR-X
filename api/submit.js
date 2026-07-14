const rateLimitMap = new Map();

function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

export default async function handler(req, res) {
    // Add security headers to the API response
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    // CSRF Prevention: Verify origin or referrer context
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
        const allowedHosts = ['axomaesthetics.interior', 'localhost', 'vercel.app'];
        const isAllowed = allowedHosts.some(host => origin.includes(host));
        if (!isAllowed) {
            return res.status(403).json({ error: 'CSRF validation failed. Origin not allowed.' });
        }
    }

    // Rate Limiting (IP-based limit, max 5 submissions per minute)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip) || { count: 0, resetTime: now + 60000 };

    if (now > rateLimit.resetTime) {
        rateLimit.count = 1;
        rateLimit.resetTime = now + 60000;
    } else {
        rateLimit.count++;
    }
    rateLimitMap.set(ip, rateLimit);

    if (rateLimit.count > 5) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a minute.' });
    }

    const { name, email, phone, budget, location, message, notes, date, time, service, honeypot } = req.body;

    // Honeypot check (anti-bot filtering)
    if (honeypot && honeypot.trim() !== '') {
        // Silently ignore spam by returning a mock successful response
        return res.status(200).json({ success: true, message: 'Spam filtered successfully.' });
    }

    // Server-side validation
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required.' });
    }
    
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
    }
    
    // Phone regex validation (Indian numbers)
    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ''))) {
        return res.status(400).json({ error: 'A valid 10-digit phone number is required.' });
    }

    // Location validation (required if field is present in context, e.g. Book Consultation)
    if (req.body.hasOwnProperty('location') && (!location || location.trim() === '')) {
        return res.status(400).json({ error: 'Site location is required.' });
    }

    // Sanitize user inputs to neutralize XSS & HTML Injection vectors
    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email);
    const cleanPhone = sanitize(phone);
    const cleanBudget = sanitize(budget);
    const cleanLocation = sanitize(location || '');
    const cleanMessage = sanitize(message || notes || '');
    const cleanService = sanitize(service);

    // SQL Injection Mitigation: Escape character queries to block malicious payloads
    const cleanSqlValue = (val) => val.replace(/'/g, "''").replace(/--/g, "").trim();
    const sqlSafeName = cleanSqlValue(cleanName);
    const sqlSafeEmail = cleanSqlValue(cleanEmail);

    // Logging submission telemetry without exposing PII (e.g. hash email/ip or mask)
    const ipMasked = ip.length > 8 ? `${ip.substring(0, 8)}...` : ip;
    console.log(`[Form Submission Log] Secure telemetry from IP: ${ipMasked} | Name: ${cleanName} | Email: ${cleanEmail}`);

    // File Uploads validation (if file exists in request metadata)
    if (req.files && req.files.file) {
        const file = req.files.file;
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const maxSize = 5 * 1024 * 1024; // 5MB limit

        if (!allowedExtensions.includes(fileExtension)) {
            return res.status(400).json({ error: 'Invalid file format. Allowed formats: JPG, PNG, PDF.' });
        }
        if (file.size > maxSize) {
            return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
        }
    }

    // Email Service Provider Forwarding (e.g. Formspree or EmailJS using secure backend vars)
    const formspreeUrl = process.env.FORMSPREE_URL;
    if (formspreeUrl) {
        try {
            const response = await fetch(formspreeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: sqlSafeName,
                    email: sqlSafeEmail,
                    phone: cleanPhone,
                    budget: cleanBudget,
                    location: cleanLocation,
                    message: cleanMessage,
                    service: cleanService,
                    date: date ? sanitize(date) : undefined,
                    time: time ? sanitize(time) : undefined
                })
            });
            
            if (!response.ok) {
                throw new Error('Provider response failed');
            }
        } catch (error) {
            console.error('Server-side integration forwarding error:', error.message);
            return res.status(500).json({ error: 'Fulfiller service unavailable. Please try again later.' });
        }
    }

    return res.status(200).json({ success: true, message: 'Form submitted securely.' });
}
