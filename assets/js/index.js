import PlinkoGame from './PlinkoGame.js';
import { updateSizesBasedOnRows } from './config.js';
import { DevPanel } from './DevPanel.js';
import { LogoAnimationManager } from './LogoAnimationManager.js';
import './preventZoom.js';


window.addEventListener('load', () => {
    console.debug('🌐 Page fully loaded, initializing game');

    // Apply URL settings before initialization
    DevPanel.applyURLSettings();
    updateSizesBasedOnRows();

    
    const game = new PlinkoGame('plinko-game');
    
    // Make game globally available for logo animation callbacks
    window.game = game;

    // Initialize dev panel in development mode
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
        new DevPanel(game);
    }

    // Initialize and start logo animation
    const logoAnimationManager = new LogoAnimationManager();
    logoAnimationManager.initialize();
    
    // Make logo animation manager globally available
    window.logoAnimationManager = logoAnimationManager;
    
    // Start logo animation after a short delay
    setTimeout(() => {
        logoAnimationManager.startIntroAnimation();
    }, 200);

    
    document.addEventListener('click', (event) => {
        const controls = document.querySelector('.controls-container');
        if (controls && !controls.contains(event.target)) {
            controls.style.opacity = '0.4';
            setTimeout(() => {
                controls.style.opacity = '0.8';
            }, 2000);
        }
    });

    
    window.addEventListener('resize', () => {
        updateSizesBasedOnRows();
    });

    console.debug('✅ Game created after full load');
});
