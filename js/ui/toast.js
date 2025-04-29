export function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found!');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    // Allow HTML in message, but sanitize later if necessary
    toast.innerHTML = `<span class="toast-message">${message}</span>`; 

    container.appendChild(toast);
    
    // Trigger fade in
    setTimeout(() => toast.classList.add('show'), 10); 

    // Auto dismiss
    const dismissTimeout = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);

    // Allow manual dismiss on click
    toast.addEventListener('click', () => {
        clearTimeout(dismissTimeout);
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, { once: true }); // Remove click listener after first click
}

// Dependencies:
// - document.getElementById, document.createElement
// - setTimeout, clearTimeout 