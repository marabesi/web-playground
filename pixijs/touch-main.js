// Initialize when PIXI is ready
function initializeApp() {
    if (typeof PIXI === 'undefined') {
        console.error('PIXI.js is not available');
        setTimeout(initializeApp, 100);
        return;
    }

    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        console.error('game-container element not found');
        return;
    }

    if (gameContainer.clientWidth === 0 || gameContainer.clientHeight === 0) {
        console.log('Container not ready, retrying...');
        setTimeout(initializeApp, 100);
        return;
    }

    try {
        // Initialize PIXI Application
        const app = new PIXI.Application({
            width: gameContainer.clientWidth,
            height: gameContainer.clientHeight,
            backgroundColor: 0x1a2a4e,
            antialias: true,
            resolution: window.devicePixelRatio || 1
        });

        const canvas = app.view;
        if (!canvas) {
            console.error('PIXI Application did not create a canvas');
            return;
        }

        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        gameContainer.innerHTML = '';
        gameContainer.appendChild(canvas);

        // Game state
        let objects = [];
        let touchedObject = null;
        let touchOffset = { x: 0, y: 0 };
        let frameCount = 0;
        let lastFpsUpdate = Date.now();

        // Colors palette
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7b731, 0x5f27cd, 0x00d2d3, 0xff9ff3, 0x54a0ff];

        function getRandomColor() {
            return colors[Math.floor(Math.random() * colors.length)];
        }

        function getRandomSize() {
            return Math.random() * 30 + 20;
        }

        // Create interactive circle
        function createCircle() {
            const size = getRandomSize();
            const circle = new PIXI.Graphics();
            circle.beginFill(getRandomColor());
            circle.drawCircle(0, 0, size);
            circle.endFill();

            // Position randomly
            circle.x = Math.random() * (app.screen.width - size * 2) + size;
            circle.y = Math.random() * (app.screen.height - size * 2) + size;

            circle.interactive = true;
            circle.cursor = 'grab';
            circle.size = size;
            circle.type = 'circle';

            // Store original position for animation
            circle.targetX = circle.x;
            circle.targetY = circle.y;
            circle.vx = 0;
            circle.vy = 0;

            app.stage.addChild(circle);
            objects.push(circle);
            updateObjectCount();

            return circle;
        }

        // Create interactive rectangle
        function createRectangle() {
            const width = getRandomSize() * 1.5;
            const height = getRandomSize();
            const rect = new PIXI.Graphics();
            rect.beginFill(getRandomColor());
            rect.drawRect(-width / 2, -height / 2, width, height);
            rect.endFill();

            rect.x = Math.random() * (app.screen.width - width) + width / 2;
            rect.y = Math.random() * (app.screen.height - height) + height / 2;

            rect.interactive = true;
            rect.cursor = 'grab';
            rect.width = width;
            rect.height = height;
            rect.type = 'rectangle';

            rect.targetX = rect.x;
            rect.targetY = rect.y;
            rect.vx = 0;
            rect.vy = 0;

            app.stage.addChild(rect);
            objects.push(rect);
            updateObjectCount();

            return rect;
        }

        // Update object counter
        function updateObjectCount() {
            document.getElementById('objectCount').textContent = objects.length;
        }

        // Handle touch start
        function handleTouchStart(e) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Find object at touch point
            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                const dx = obj.x - x;
                const dy = obj.y - y;
                let distance;

                if (obj.type === 'circle') {
                    distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < obj.size) {
                        touchedObject = obj;
                        touchOffset.x = dx;
                        touchOffset.y = dy;
                        obj.cursor = 'grabbing';
                        obj.alpha = 0.8;
                        break;
                    }
                } else if (obj.type === 'rectangle') {
                    if (Math.abs(dx) < obj.width / 2 && Math.abs(dy) < obj.height / 2) {
                        touchedObject = obj;
                        touchOffset.x = dx;
                        touchOffset.y = dy;
                        obj.cursor = 'grabbing';
                        obj.alpha = 0.8;
                        break;
                    }
                }
            }
        }

        // Handle touch move
        function handleTouchMove(e) {
            if (!touchedObject) return;
            e.preventDefault();

            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            touchedObject.targetX = x + touchOffset.x;
            touchedObject.targetY = y + touchOffset.y;
        }

        // Handle touch end
        function handleTouchEnd(e) {
            if (touchedObject) {
                touchedObject.cursor = 'grab';
                touchedObject.alpha = 1;
                touchedObject = null;
            }
        }

        // Mouse fallback (for testing on desktop)
        function handleMouseDown(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                const dx = obj.x - x;
                const dy = obj.y - y;
                let distance;

                if (obj.type === 'circle') {
                    distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < obj.size) {
                        touchedObject = obj;
                        touchOffset.x = dx;
                        touchOffset.y = dy;
                        obj.cursor = 'grabbing';
                        obj.alpha = 0.8;
                        break;
                    }
                } else if (obj.type === 'rectangle') {
                    if (Math.abs(dx) < obj.width / 2 && Math.abs(dy) < obj.height / 2) {
                        touchedObject = obj;
                        touchOffset.x = dx;
                        touchOffset.y = dy;
                        obj.cursor = 'grabbing';
                        obj.alpha = 0.8;
                        break;
                    }
                }
            }
        }

        function handleMouseMove(e) {
            if (!touchedObject) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            touchedObject.targetX = x + touchOffset.x;
            touchedObject.targetY = y + touchOffset.y;
        }

        function handleMouseUp(e) {
            if (touchedObject) {
                touchedObject.cursor = 'grab';
                touchedObject.alpha = 1;
                touchedObject = null;
            }
        }

        // Add event listeners
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        // Animation loop
        function animate() {
            frameCount++;

            // Update FPS
            const now = Date.now();
            if (now - lastFpsUpdate >= 1000) {
                document.getElementById('fps').textContent = frameCount;
                frameCount = 0;
                lastFpsUpdate = now;
            }

            // Update object positions with easing
            for (let i = 0; i < objects.length; i++) {
                const obj = objects[i];

                // Easing towards target position if not being touched
                if (obj !== touchedObject) {
                    const dx = obj.targetX - obj.x;
                    const dy = obj.targetY - obj.y;
                    obj.x += dx * 0.1;
                    obj.y += dy * 0.1;

                    // Subtle rotation
                    obj.rotation += 0.005;
                } else {
                    // Direct position when being dragged
                    obj.x = obj.targetX;
                    obj.y = obj.targetY;
                }

                // Keep within bounds
                if (obj.type === 'circle') {
                    const minX = obj.size;
                    const maxX = app.screen.width - obj.size;
                    const minY = obj.size;
                    const maxY = app.screen.height - obj.size;

                    obj.x = Math.max(minX, Math.min(maxX, obj.x));
                    obj.y = Math.max(minY, Math.min(maxY, obj.y));
                    obj.targetX = obj.x;
                    obj.targetY = obj.y;
                } else if (obj.type === 'rectangle') {
                    const minX = obj.width / 2;
                    const maxX = app.screen.width - obj.width / 2;
                    const minY = obj.height / 2;
                    const maxY = app.screen.height - obj.height / 2;

                    obj.x = Math.max(minX, Math.min(maxX, obj.x));
                    obj.y = Math.max(minY, Math.min(maxY, obj.y));
                    obj.targetX = obj.x;
                    obj.targetY = obj.y;
                }
            }
        }

        // Button handlers
        document.getElementById('addObject').addEventListener('click', () => {
            if (Math.random() > 0.5) {
                createCircle();
            } else {
                createRectangle();
            }
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            objects.forEach(obj => app.stage.removeChild(obj));
            objects = [];
            updateObjectCount();
        });

        // Create initial objects
        createCircle();
        createRectangle();
        createCircle();

        // Start animation loop
        app.ticker.add(animate);

        // Handle window/screen resize
        window.addEventListener('resize', () => {
            app.renderer.resize(gameContainer.clientWidth, gameContainer.clientHeight);
        });

        console.log('PIXI Touch application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize PIXI application:', error);
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
