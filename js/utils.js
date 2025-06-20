// js/utils.js - Utility Functions
class Utils {
    
    // Date Formatting
    static formatDate(dateString, format = CONFIG.DATE_FORMAT) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        return date.toLocaleDateString('id-ID', options);
    }
    
    static formatDateTime(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('id-ID', options);
    }
    
    static getTodayString() {
        return new Date().toISOString().split('T')[0];
    }
    
    static addDays(dateString, days) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }
    
    static getDaysDifference(date1, date2) {
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        const diffTime = Math.abs(secondDate - firstDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Currency Formatting
    static formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: CONFIG.CURRENCY,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    static parseCurrency(currencyString) {
        if (!currencyString) return 0;
        return parseInt(currencyString.replace(/[^\d]/g, '')) || 0;
    }
    
    // String Utilities
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    static titleCase(str) {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
    
    static truncate(str, maxLength = 50) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substr(0, maxLength) + '...';
    }
    
    static slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
    
    // Validation
    static validateEmail(email) {
        return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
    }
    
    static validatePhone(phone) {
        if (!phone) return false;
        const cleanPhone = phone.replace(/\s/g, '');
        return cleanPhone.length >= CONFIG.VALIDATION.PHONE_MIN_LENGTH && 
               cleanPhone.length <= CONFIG.VALIDATION.PHONE_MAX_LENGTH &&
               CONFIG.VALIDATION.PHONE_REGEX.test(cleanPhone);
    }
    
    static validateISBN(isbn) {
        if (!isbn) return false;
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        return cleanISBN.length === CONFIG.VALIDATION.ISBN_LENGTH && /^\d+$/.test(cleanISBN);
    }
    
    static validateRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }
    
    static validateMinLength(value, minLength) {
        return value && value.toString().length >= minLength;
    }
    
    static validateMaxLength(value, maxLength) {
        return !value || value.toString().length <= maxLength;
    }
    
    static validatePositiveNumber(value) {
        return !isNaN(value) && parseFloat(value) >= 0;
    }
    
    // Form Utilities
    static getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            // Handle multiple values for same key (checkboxes)
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    static populateForm(formElement, data) {
        for (const [key, value] of Object.entries(data)) {
            const field = formElement.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = field.value === value;
                } else {
                    field.value = value || '';
                }
            }
        }
    }
    
    static resetForm(formElement) {
        formElement.reset();
        
        // Clear any error states
        const errorElements = formElement.querySelectorAll('.error, .is-invalid');
        errorElements.forEach(el => {
            el.classList.remove('error', 'is-invalid');
        });
        
        // Reset custom validations
        const inputs = formElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('error', 'success');
            const errorMsg = input.parentNode.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });
    }
    
    static validateForm(formElement, rules = {}) {
        let isValid = true;
        const errors = {};
        
        // Clear previous errors
        this.clearFormErrors(formElement);
        
        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;
            
            const value = field.value.trim();
            
            // Required validation
            if (fieldRules.required && !this.validateRequired(value)) {
                errors[fieldName] = 'Field ini wajib diisi';
                isValid = false;
                continue;
            }
            
            // Skip other validations if field is empty and not required
            if (!value && !fieldRules.required) continue;
            
            // Email validation
            if (fieldRules.email && !this.validateEmail(value)) {
                errors[fieldName] = 'Format email tidak valid';
                isValid = false;
            }
            
            // Phone validation
            if (fieldRules.phone && !this.validatePhone(value)) {
                errors[fieldName] = 'Format nomor telepon tidak valid';
                isValid = false;
            }
            
            // Min length validation
            if (fieldRules.minLength && !this.validateMinLength(value, fieldRules.minLength)) {
                errors[fieldName] = `Minimal ${fieldRules.minLength} karakter`;
                isValid = false;
            }
            
            // Max length validation
            if (fieldRules.maxLength && !this.validateMaxLength(value, fieldRules.maxLength)) {
                errors[fieldName] = `Maksimal ${fieldRules.maxLength} karakter`;
                isValid = false;
            }
            
            // Positive number validation
            if (fieldRules.positiveNumber && !this.validatePositiveNumber(value)) {
                errors[fieldName] = 'Harus berupa angka positif';
                isValid = false;
            }
            
            // Custom validation
            if (fieldRules.custom && typeof fieldRules.custom === 'function') {
                const customResult = fieldRules.custom(value);
                if (customResult !== true) {
                    errors[fieldName] = customResult;
                    isValid = false;
                }
            }
        }
        
        // Display errors
        this.displayFormErrors(formElement, errors);
        
        return { isValid, errors };
    }
    
    static clearFormErrors(formElement) {
        const errorElements = formElement.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
        
        const fields = formElement.querySelectorAll('.error');
        fields.forEach(field => field.classList.remove('error'));
    }
    
    static displayFormErrors(formElement, errors) {
        for (const [fieldName, errorMessage] of Object.entries(errors)) {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('error');
                
                // Create error message element
                const errorEl = document.createElement('div');
                errorEl.className = 'error-message';
                errorEl.textContent = errorMessage;
                
                // Insert after the field
                field.parentNode.insertBefore(errorEl, field.nextSibling);
            }
        }
    }
    
    // DOM Utilities
    static createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }
    
    static createIcon(iconClass, title = '') {
        const icon = document.createElement('i');
        icon.className = iconClass;
        if (title) icon.title = title;
        return icon;
    }
    
    static createButton(text, className = 'btn', iconClass = '', onClick = null) {
        const button = document.createElement('button');
        button.className = className;
        button.type = 'button';
        
        if (iconClass) {
            const icon = this.createIcon(iconClass);
            button.appendChild(icon);
            if (text) button.appendChild(document.createTextNode(' ' + text));
        } else {
            button.textContent = text;
        }
        
        if (onClick) button.addEventListener('click', onClick);
        
        return button;
    }
    
    static createStatusBadge(status, statusConfig) {
        const badge = document.createElement('span');
        badge.className = 'status-badge';
        badge.textContent = status;
        
        const config = statusConfig.find(s => s.value === status);
        if (config && config.class) {
            badge.classList.add(config.class);
        }
        
        return badge;
    }
    
    // Array Utilities
    static sortByProperty(array, property, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (direction === 'desc') {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            } else {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            }
        });
    }
    
    static filterByProperty(array, property, value) {
        if (!value) return array;
        
        return array.filter(item => {
            const itemValue = item[property];
            if (typeof itemValue === 'string') {
                return itemValue.toLowerCase().includes(value.toLowerCase());
            }
            return itemValue === value;
        });
    }
    
    static groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            groups[key] = groups[key] || [];
            groups[key].push(item);
            return groups;
        }, {});
    }
    
    // Storage Utilities (for temporary data only)
    static setSessionData(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Session storage not available:', e);
        }
    }
    
    static getSessionData(key) {
        try {
            const data = sessionStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Session storage not available:', e);
            return null;
        }
    }
    
    static removeSessionData(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (e) {
            console.warn('Session storage not available:', e);
        }
    }
    
    // URL Utilities
    static getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    static setUrlParameter(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    }
    
    static removeUrlParameter(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.replaceState({}, '', url);
    }
    
    // Loading States
    static showLoading(element, message = CONFIG.MESSAGES.INFO.LOADING) {
        const loadingHtml = `
            <div class="loading">
                <i class="${CONFIG.ICONS.LOADING}"></i>
                ${message}
            </div>
        `;
        element.innerHTML = loadingHtml;
    }
    
    static showError(element, message = CONFIG.MESSAGES.ERROR.SERVER_ERROR) {
        const errorHtml = `
            <div class="error-state">
                <i class="${CONFIG.ICONS.ERROR}"></i>
                <p>${message}</p>
            </div>
        `;
        element.innerHTML = errorHtml;
    }
    
    static showEmpty(element, message = CONFIG.TABLE_SETTINGS.EMPTY_MESSAGE) {
        const emptyHtml = `
            <div class="empty-state">
                <i class="${CONFIG.ICONS.INFO}"></i>
                <p>${message}</p>
            </div>
        `;
        element.innerHTML = emptyHtml;
    }
    
    // Debounce function for search
    static debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }
    
    // Download data as file
    static downloadAsJSON(data, filename = 'data.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    static downloadAsCSV(data, filename = 'data.csv') {
        if (!data.length) return;
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Generate random ID
    static generateId(prefix = '', length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // Print function
    static printElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<link rel="stylesheet" href="css/style.css">');
        printWindow.document.write('</head><body>');
        printWindow.document.write(element.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
}

// Alert Manager Class
class AlertManager {
    static show(message, type = 'success', duration = CONFIG.ALERT_DURATION) {
        // Remove existing alerts
        this.removeAll();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 9999;
            max-width: 350px;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        `;
        
        // Add icon based on type
        const icons = {
            success: CONFIG.ICONS.SUCCESS,
            error: CONFIG.ICONS.ERROR,
            warning: CONFIG.ICONS.WARNING,
            info: CONFIG.ICONS.INFO
        };
        
        const icon = document.createElement('i');
        icon.className = icons[type] || icons.info;
        alertDiv.appendChild(icon);
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        alertDiv.appendChild(messageSpan);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            opacity: 0.7;
        `;
        closeBtn.onclick = () => this.remove(alertDiv);
        alertDiv.appendChild(closeBtn);
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => this.remove(alertDiv), duration);
        }
        
        return alertDiv;
    }
    
    static remove(alertDiv) {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }
    }
    
    static removeAll() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => this.remove(alert));
    }
    
    static success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    static warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    static info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Loading Manager Class
class LoadingManager {
    static overlay = null;
    
    static show(message = CONFIG.MESSAGES.INFO.LOADING) {
        this.hide(); // Remove existing overlay
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay show';
        this.overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="${CONFIG.ICONS.LOADING}"></i>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        document.body.style.overflow = 'hidden';
    }
    
    static hide() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
            document.body.style.overflow = '';
        }
    }
    
    static setMessage(message) {
        if (this.overlay) {
            const messageEl = this.overlay.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
    }
}

// Modal Manager Class
class ModalManager {
    static create(title, content, buttons = []) {
        // Remove existing modals
        this.removeAll();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideInUp 0.3s ease;
        `;
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.style.cssText = `
            padding: 20px 25px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.margin = '0';
        header.appendChild(titleEl);
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: #6c757d;
            padding: 5px;
        `;
        closeBtn.onclick = () => this.remove(overlay);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        body.style.padding = '25px';
        
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
        
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.style.cssText = `
            padding: 20px 25px;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = button.className || 'btn btn-secondary';
            btn.textContent = button.text;
            btn.onclick = () => {
                if (button.onClick) {
                    const result = button.onClick();
                    if (result !== false) {
                        this.remove(overlay);
                    }
                } else {
                    this.remove(overlay);
                }
            };
            footer.appendChild(btn);
        });
        
        modal.appendChild(header);
        modal.appendChild(body);
        if (buttons.length > 0) {
            modal.appendChild(footer);
        }
        
        overlay.appendChild(modal);
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.remove(overlay);
            }
        };
        
        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.remove(overlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        return { overlay, modal, body };
    }
    
    static remove(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                    document.body.style.overflow = '';
                }
            }, 300);
        }
    }
    
    static removeAll() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => this.remove(modal));
    }
    
    static confirm(title, message, onConfirm, onCancel) {
        return this.create(title, `<p>${message}</p>`, [
            {
                text: 'Batal',
                className: 'btn btn-secondary',
                onClick: onCancel
            },
            {
                text: 'Ya',
                className: 'btn btn-primary',
                onClick: onConfirm
            }
        ]);
    }
    
    static alert(title, message, onOk) {
        return this.create(title, `<p>${message}</p>`, [
            {
                text: 'OK',
                className: 'btn btn-primary',
                onClick: onOk
            }
        ]);
    }
}

// Storage Manager for cache
class CacheManager {
    static cache = new Map();
    static ttl = new Map();
    
    static set(key, data, ttlMinutes = 5) {
        this.cache.set(key, data);
        this.ttl.set(key, Date.now() + (ttlMinutes * 60 * 1000));
    }
    
    static get(key) {
        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.cache.delete(key);
            this.ttl.delete(key);
            return null;
        }
        return this.cache.get(key) || null;
    }
    
    static has(key) {
        return this.get(key) !== null;
    }
    
    static clear() {
        this.cache.clear();
        this.ttl.clear();
    }
    
    static delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
    }
}

// Performance Monitor
class PerformanceMonitor {
    static timers = new Map();
    
    static start(label) {
        this.timers.set(label, performance.now());
    }
    
    static end(label) {
        const start = this.timers.get(label);
        if (start) {
            const duration = performance.now() - start;
            this.timers.delete(label);
            
            if (CONFIG.DEBUG) {
                console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
            }
            
            return duration;
        }
        return null;
    }
    
    static measure(label, fn) {
        this.start(label);
        const result = fn();
        this.end(label);
        return result;
    }
    
    static async measureAsync(label, fn) {
        this.start(label);
        const result = await fn();
        this.end(label);
        return result;
    }
}

// Export utilities globally
window.Utils = Utils;
window.AlertManager = AlertManager;
window.LoadingManager = LoadingManager;
window.ModalManager = ModalManager;
window.CacheManager = CacheManager;
window.PerformanceMonitor = PerformanceMonitor;

// Add additional CSS for modals and animations
const additionalCSS = `
@keyframes slideInUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

.error-message {
    color: var(--danger-color);
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
    border-color: var(--danger-color);
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-group input.success,
.form-group select.success,
.form-group textarea.success {
    border-color: var(--success-color);
    box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
}

.empty-state, .error-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--gray-600);
}

.empty-state i, .error-state i {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.5;
}

.modal-overlay {
    backdrop-filter: blur(3px);
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Log utils loaded
if (CONFIG.DEBUG) {
    console.log('🔧 Utils loaded successfully');
}