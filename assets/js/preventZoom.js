// Prevent zoom and double tap functionality

document.addEventListener('DOMContentLoaded', function() {
    // Prevent double tap zoom on all elements
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Prevent pinch zoom
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchmove', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // Prevent zoom with keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && 
            (event.key === '+' || event.key === '-' || event.key === '0')) {
            event.preventDefault();
        }
    });

    // Prevent wheel zoom
    document.addEventListener('wheel', function(event) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
        }
    }, { passive: false });

    // Prevent context menu on long press
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    // Additional protection for iOS Safari
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', function(event) {
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('gestureend', function(event) {
        event.preventDefault();
    }, { passive: false });
});