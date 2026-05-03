// Wait for PIXI to be available and DOM to load
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

    // Ensure container has dimensions
    if (gameContainer.clientWidth === 0 || gameContainer.clientHeight === 0) {
        console.log('Container not ready, retrying...');
        setTimeout(initializeApp, 100);
        return;
    }

    try {
        // Initialize PIXI application
        const app = new PIXI.Application({
            width: Math.max(gameContainer.clientWidth, 800),
            height: Math.max(gameContainer.clientHeight, 400),
            backgroundColor: 0x1a1a2e,
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
        gameContainer.innerHTML = '';
        gameContainer.appendChild(canvas);

        // Store interactive objects
        let objects = [];
        let isDragging = false;
        let draggedObject = null;
        let lastMousePos = { x: 0, y: 0 };

        // Performance tracking
        let frameCount = 0;
        let lastFpsUpdate = Date.now();
        let currentFps = 60;

        // Helper function to generate random color
        function getRandomColor() {
            return Math.floor(Math.random() * 16777215);
        }

        // Helper function to generate random position
        function getRandomPosition() {
            return {
                x: Math.random() * (app.screen.width - 50) + 25,
                y: Math.random() * (app.screen.height - 50) + 25
            };
        }

        // Create interactive circle
        function createCircle(x, y) {
            const radius = Math.random() * 20 + 10;
            const circle = new PIXI.Graphics();
            circle.beginFill(getRandomColor());
            circle.drawCircle(0, 0, radius);
            circle.endFill();
            circle.x = x;
            circle.y = y;
            circle.interactive = true;
            circle.buttonMode = true;
            
            // Add velocity for animation
            circle.vx = (Math.random() - 0.5) * 4;
            circle.vy = (Math.random() - 0.5) * 4;
            circle.radius = radius;
            circle.type = 'circle';
            
            // Mouse events
            circle.on('mousedown', onObjectMouseDown);
            circle.on('mouseup', onObjectMouseUp);
            circle.on('mousemove', onObjectMouseMove);
            circle.on('mouseout', onObjectMouseUp);
            
            app.stage.addChild(circle);
            objects.push(circle);
            updateObjectCount();
            
            return circle;
        }

        // Create interactive rectangle
        function createRectangle(x, y) {
            const width = Math.random() * 40 + 30;
            const height = Math.random() * 40 + 30;
            const rect = new PIXI.Graphics();
            rect.beginFill(getRandomColor());
            rect.drawRect(0, 0, width, height);
            rect.endFill();
            rect.x = x - width / 2;
            rect.y = y - height / 2;
            rect.interactive = true;
            rect.buttonMode = true;
            
            // Add velocity for animation
            rect.vx = (Math.random() - 0.5) * 3;
            rect.vy = (Math.random() - 0.5) * 3;
            rect.width = width;
            rect.height = height;
            rect.type = 'rectangle';
            
            // Mouse events
            rect.on('mousedown', onObjectMouseDown);
            rect.on('mouseup', onObjectMouseUp);
            rect.on('mousemove', onObjectMouseMove);
            rect.on('mouseout', onObjectMouseUp);
            
            app.stage.addChild(rect);
            objects.push(rect);
            updateObjectCount();
            
            return rect;
        }

        // Mouse event handlers
        function onObjectMouseDown(event) {
            isDragging = true;
            draggedObject = event.target;
            lastMousePos = event.data.global;
        }

        function onObjectMouseUp() {
            isDragging = false;
            draggedObject = null;
        }

        function onObjectMouseMove(event) {
            if (!isDragging || !draggedObject) return;
            
            const currentPos = event.data.global;
            draggedObject.x += currentPos.x - lastMousePos.x;
            draggedObject.y += currentPos.y - lastMousePos.y;
            lastMousePos = currentPos;
        }

        // Update object counter
        function updateObjectCount() {
            document.getElementById('objectCount').textContent = objects.length;
        }

        // Animation loop
        function animate() {
            frameCount++;
            
            // Update FPS every second
            const now = Date.now();
            if (now - lastFpsUpdate >= 1000) {
                currentFps = frameCount;
                document.getElementById('fps').textContent = currentFps;
                frameCount = 0;
                lastFpsUpdate = now;
            }
            
            // Update objects
            for (let i = 0; i < objects.length; i++) {
                const obj = objects[i];
                
                // Skip if being dragged
                if (obj === draggedObject) continue;
                
                // Apply movement
                obj.x += obj.vx;
                obj.y += obj.vy;
                
                // Bounce off walls
                if (obj.type === 'circle') {
                    if (obj.x - obj.radius < 0 || obj.x + obj.radius > app.screen.width) {
                        obj.vx *= -1;
                        obj.x = Math.max(obj.radius, Math.min(app.screen.width - obj.radius, obj.x));
                    }
                    if (obj.y - obj.radius < 0 || obj.y + obj.radius > app.screen.height) {
                        obj.vy *= -1;
                        obj.y = Math.max(obj.radius, Math.min(app.screen.height - obj.radius, obj.y));
                    }
                } else if (obj.type === 'rectangle') {
                    if (obj.x < 0 || obj.x + obj.width > app.screen.width) {
                        obj.vx *= -1;
                        obj.x = Math.max(0, Math.min(app.screen.width - obj.width, obj.x));
                    }
                    if (obj.y < 0 || obj.y + obj.height > app.screen.height) {
                        obj.vy *= -1;
                        obj.y = Math.max(0, Math.min(app.screen.height - obj.height, obj.y));
                    }
                }
                
                // Add subtle rotation
                obj.rotation += 0.01;
            }
        }

        // Global keyboard handler
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                // Randomize all colors
                objects.forEach(obj => {
                    obj.clear();
                    obj.beginFill(getRandomColor());
                    if (obj.type === 'circle') {
                        obj.drawCircle(0, 0, obj.radius);
                    } else if (obj.type === 'rectangle') {
                        obj.drawRect(0, 0, obj.width, obj.height);
                    }
                    obj.endFill();
                });
            }
        });

        // Button handlers
        document.getElementById('addCircle').addEventListener('click', () => {
            const pos = getRandomPosition();
            createCircle(pos.x, pos.y);
        });

        document.getElementById('addRectangle').addEventListener('click', () => {
            const pos = getRandomPosition();
            createRectangle(pos.x, pos.y);
        });

        document.getElementById('clearCanvas').addEventListener('click', () => {
            objects.forEach(obj => app.stage.removeChild(obj));
            objects = [];
            updateObjectCount();
        });

        // Initial shapes
        createCircle(200, 150);
        createRectangle(400, 200);
        createCircle(600, 250);

        // Start animation loop
        app.ticker.add(animate);

        // Handle window resize
        window.addEventListener('resize', () => {
            app.renderer.resize(window.innerWidth - 30, window.innerHeight - 250);
        });

        console.log('PIXI application initialized successfully');
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
