export class LogoAnimationManager {
    constructor() {
        this.isAnimated = false;
        this.logoContainers = [];
        this.introCleared = false;
        this.isLayersFlashing = false;
    }

    initialize() {
        // Find all logo containers
        const mainLogo = document.querySelector('.logo-plinko-main');
        const pyramidLogo = document.querySelector('.logo-plinko-piramid');
        
        if (mainLogo) this.logoContainers.push(mainLogo);
        if (pyramidLogo) this.logoContainers.push(pyramidLogo);
        
        console.debug('LogoAnimationManager: Found', this.logoContainers.length, 'logo containers');
    }

    startIntroAnimation() {
        if (this.isAnimated) return;
        
        console.debug('LogoAnimationManager: Starting intro animation');
        this.isAnimated = true;
        
        this.logoContainers.forEach(container => {
            this.animateContainer(container);
        });
        
        // Animate bet button as part of the sequence
        this.animateBetButton();
    }

    animateContainer(container) {
        // Get all layers in this container
        const layer6 = container.querySelector('[id*="logo-layer-6"]') || container.querySelector('[id*="logo-layer-pyramid-6"]');
        const layer5 = container.querySelector('[id*="logo-layer-5"]') || container.querySelector('[id*="logo-layer-pyramid-5"]');
        const layer4 = container.querySelector('[id*="logo-layer-4"]') || container.querySelector('[id*="logo-layer-pyramid-4"]');
        const layer3 = container.querySelector('[id*="logo-layer-3"]') || container.querySelector('[id*="logo-layer-pyramid-3"]');
        const layer2 = container.querySelector('[id*="logo-layer-2"]') || container.querySelector('[id*="logo-layer-pyramid-2"]');
        const layer1 = container.querySelector('[id*="logo-layer-1"]') || container.querySelector('[id*="logo-layer-pyramid-1"]');
        const ball = container.querySelector('[id*="logo-ball"]');
        const path = container.querySelector('[id*="logo-path"]');

        // Apply animation classes in sequence (6 to 1)
        if (layer6) layer6.classList.add('logo-layer-appear-6');
        if (layer5) layer5.classList.add('logo-layer-appear-5');
        if (layer4) layer4.classList.add('logo-layer-appear-4');
        if (layer3) layer3.classList.add('logo-layer-appear-3');
        if (layer2) layer2.classList.add('logo-layer-appear-2');
        if (layer1) layer1.classList.add('logo-layer-appear-1');
        
        // Ball drops after layers
        if (ball) ball.classList.add('logo-ball-drop');
        
        // Path fades in last
        if (path) path.classList.add('logo-path-fade');
    }

    animateBetButton() {
        const betButton = document.getElementById('bet-button');
        const betButtonHand = document.getElementById('bet-button-hand');
        if (betButton) {
            betButtonHand.classList.add('show');
            betButton.classList.add('bet-button-appear');
            
            // Listen for button animation end to enable it
            const onAnimationEnd = (event) => {
                if (event.animationName === 'logoScaleAppear') {
                    console.debug('LogoAnimationManager: Bet button animation ended, enabling button');
                    betButton.removeEventListener('animationend', onAnimationEnd);
                    this.clearIntroAnimations();
                }
            };
            betButton.addEventListener('animationend', onAnimationEnd);
            
            // Fallback timer
            setTimeout(() => {
                betButton.removeEventListener('animationend', onAnimationEnd);
                this.clearIntroAnimations();
            }, 2000);
        }
    }


    clearIntroAnimations() {
        if (this.introCleared) {
            return; // Already cleared
        }
        
        console.debug('LogoAnimationManager: Clearing intro animations to prevent conflicts');
        this.introCleared = true;
        
        // Clear bet button animation
        const betButton = document.getElementById('bet-button');
        if (betButton) {
            betButton.classList.remove('bet-button-appear');
            betButton.style.opacity = '1';
            betButton.style.transform = 'scale(1)';
        }
        
        // Notify UI that intro animation is complete
        if (window.game && window.game.uiManager) {
            window.game.uiManager.setupBetButton();
        }
        
        this.logoContainers.forEach(container => {
            const layers = container.querySelectorAll('.logo-layer');
            layers.forEach(layer => {
                // Remove intro animation classes but keep final styles (except path)
                if (!layer.id.includes('logo-path')) {
                    layer.classList.remove(
                        'logo-layer-appear-1',
                        'logo-layer-appear-2', 
                        'logo-layer-appear-3',
                        'logo-layer-appear-4',
                        'logo-layer-appear-5',
                        'logo-layer-appear-6',
                        'logo-ball-drop'
                    );
                    
                    // Ensure final styles are applied
                    if (layer.id.includes('logo-ball')) {
                        layer.style.opacity = '1';
                        layer.style.transform = 'translateY(0px)';
                    } else {
                        layer.style.opacity = '1';
                        layer.style.transform = 'scale(1)';
                    }
                }
            });
        });
    }

    resetAnimation() {
        console.debug('LogoAnimationManager: Resetting animation');
        this.isAnimated = false;
        this.introCleared = false;
        this.isLayersFlashing = false;
        
        // Reset bet button
        const betButton = document.getElementById('bet-button');
        if (betButton) {
            betButton.classList.remove('bet-button-appear');
        }
        
        this.logoContainers.forEach(container => {
            const layers = container.querySelectorAll('.logo-layer');
            layers.forEach(layer => {
                // Remove all animation classes
                layer.classList.remove(
                    'logo-layer-appear-1',
                    'logo-layer-appear-2', 
                    'logo-layer-appear-3',
                    'logo-layer-appear-4',
                    'logo-layer-appear-5',
                    'logo-layer-appear-6',
                    'logo-ball-drop',
                    'logo-path-fade',
                    'logo-layers-flash-1',
                    'logo-layers-flash-2',
                    'logo-layers-flash-3',
                    'logo-layers-flash-4',
                    'logo-layers-flash-5',
                    'logo-layers-flash-6'
                );
            });
        });
    }

    // Utility method to trigger animation on demand
    triggerAnimation() {
        this.resetAnimation();
        setTimeout(() => {
            this.startIntroAnimation();
        }, 100);
    }

    // Method to flash logo ball when game ball hits a peg
    flashBall() {
        // Only flash if intro animation has completed
        if (!this.isAnimated) {
            return;
        }
        
        this.logoContainers.forEach(container => {
            const ball = container.querySelector('[id*="logo-ball"]');
            if (ball) {
                // Remove class if it exists to restart animation
                ball.classList.remove('logo-ball-flash');
                
                // Force reflow to ensure class removal is processed
                ball.offsetHeight;
                
                // Add flash animation class
                ball.classList.add('logo-ball-flash');
                
                // Remove class after animation completes
                setTimeout(() => {
                    ball.classList.remove('logo-ball-flash');
                }, 200);
            }
        });
        
        console.debug('LogoAnimationManager: Ball flash triggered');
    }

    // Method to flash logo layers sequentially when ball hits bin
    flashLayers() {
        // Only flash if intro animation has completed and not already flashing
        if (!this.isAnimated || this.isLayersFlashing) {
            console.debug('LogoAnimationManager: Layers flash blocked - intro not ready or already flashing');
            return;
        }
        
        this.isLayersFlashing = true;
        
        this.logoContainers.forEach(container => {
            // Flash layers 1 to 6 sequentially
            for (let i = 1; i <= 6; i++) {
                const layer = container.querySelector(`[id*="logo-layer-${i}"]`);
                if (layer) {
                    // Remove existing flash classes
                    layer.classList.remove(
                        'logo-layers-flash-1',
                        'logo-layers-flash-2',
                        'logo-layers-flash-3',
                        'logo-layers-flash-4',
                        'logo-layers-flash-5',
                        'logo-layers-flash-6'
                    );
                    
                    // Force reflow
                    layer.offsetHeight;
                    
                    // Add flash class for this layer
                    layer.classList.add(`logo-layers-flash-${i}`);
                }
            }
        });
        
        // Remove all flash classes after animation completes (total ~0.48s)
        setTimeout(() => {
            this.logoContainers.forEach(container => {
                for (let i = 1; i <= 6; i++) {
                    const layer = container.querySelector(`[id*="logo-layer-${i}"]`);
                    if (layer) {
                        layer.classList.remove(`logo-layers-flash-${i}`);
                    }
                }
            });
            this.isLayersFlashing = false;
        }, 500);
        
        console.debug('LogoAnimationManager: Layers flash triggered');
    }
}