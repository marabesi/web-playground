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
        let sprites = [];
        let touchedSprite = null;
        let touchOffset = { x: 0, y: 0 };
        let frameCount = 0;
        let lastFpsUpdate = Date.now();
        let rotationEnabled = true;

        // Colors palette
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7b731, 0x5f27cd, 0x00d2d3, 0xff9ff3, 0x54a0ff];

        function getRandomColor() {
            return colors[Math.floor(Math.random() * colors.length)];
        }

        function getRandomSize() {
            return Math.random() * 25 + 30;
        }

        // Create sprite texture with pattern
        function createSpriteTexture(size, color) {
            const graphics = new PIXI.Graphics();

            // Draw outer circle
            graphics.beginFill(color);
            graphics.drawCircle(size / 2, size / 2, size / 2);
            graphics.endFill();

            // Draw inner circle for contrast
            graphics.beginFill(0xffffff);
            graphics.drawCircle(size / 2, size / 2, size / 3);
            graphics.endFill();

            // Draw outer ring
            graphics.lineStyle(2, 0xffffff);
            graphics.drawCircle(size / 2, size / 2, size / 2);

            // Draw spokes for rotation effect
            graphics.lineStyle(1.5, 0xffffff);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const x1 = size / 2 + Math.cos(angle) * (size / 3);
                const y1 = size / 2 + Math.sin(angle) * (size / 3);
                const x2 = size / 2 + Math.cos(angle) * (size / 2);
                const y2 = size / 2 + Math.sin(angle) * (size / 2);
                graphics.moveTo(x1, y1);
                graphics.lineTo(x2, y2);
            }

            // Render to texture
            const texture = app.renderer.generateTexture(graphics);
            graphics.destroy();

            return texture;
        }

        // Create star-shaped sprite
        function createStarSpriteTexture(size, color) {
            const graphics = new PIXI.Graphics();

            // Draw star
            graphics.beginFill(color);
            const starPoints = 5;
            const points = [];
            for (let i = 0; i < starPoints * 2; i++) {
                const angle = (i / (starPoints * 2)) * Math.PI * 2;
                const radius = i % 2 === 0 ? size / 2 : size / 4;
                const x = size / 2 + Math.cos(angle - Math.PI / 2) * radius;
                const y = size / 2 + Math.sin(angle - Math.PI / 2) * radius;
                points.push(x, y);
            }
            graphics.drawPolygon(points);
            graphics.endFill();

            // Outline
            graphics.lineStyle(1.5, 0xffffff);
            graphics.drawPolygon(points);

            const texture = app.renderer.generateTexture(graphics);
            graphics.destroy();

            return texture;
        }

        // Create square-shaped sprite
        function createSquareSpriteTexture(size, color) {
            const graphics = new PIXI.Graphics();

            // Draw rounded square
            graphics.beginFill(color);
            graphics.drawRoundedRect(0, 0, size, size, size / 8);
            graphics.endFill();

            // Draw pattern inside
            graphics.beginFill(0xffffff);
            graphics.drawCircle(size / 2, size / 2, size / 6);
            graphics.endFill();

            // Outline
            graphics.lineStyle(2, 0xffffff);
            graphics.drawRoundedRect(0, 0, size, size, size / 8);

            const texture = app.renderer.generateTexture(graphics);
            graphics.destroy();

            return texture;
        }

        // Create sprite
        function createSprite() {
            const size = getRandomSize();
            const color = getRandomColor();

            // Choose random sprite type
            const spriteType = Math.floor(Math.random() * 3);
            let texture;

            if (spriteType === 0) {
                texture = createSpriteTexture(size, color);
            } else if (spriteType === 1) {
                texture = createStarSpriteTexture(size, color);
            } else {
                texture = createSquareSpriteTexture(size, color);
            }

            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5);

            // Position randomly
            sprite.x = Math.random() * (app.screen.width - size) + size / 2;
            sprite.y = Math.random() * (app.screen.height - size) + size / 2;

            sprite.interactive = true;
            sprite.cursor = 'grab';
            sprite.size = size;
            sprite.rotationSpeed = (Math.random() - 0.5) * 0.1; // Varied rotation speed

            // Store original position for animation
            sprite.targetX = sprite.x;
            sprite.targetY = sprite.y;

            app.stage.addChild(sprite);
            sprites.push(sprite);
            updateSpriteCount();

            return sprite;
        }

        // Update sprite counter
        function updateSpriteCount() {
            document.getElementById('spriteCount').textContent = sprites.length;
        }

        // Handle touch start
        function handleTouchStart(e) {
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Find sprite at touch point
            for (let i = sprites.length - 1; i >= 0; i--) {
                const sprite = sprites[i];
                const dx = sprite.x - x;
                const dy = sprite.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < sprite.size / 1.5) {
                    touchedSprite = sprite;
                    touchOffset.x = dx;
                    touchOffset.y = dy;
                    sprite.cursor = 'grabbing';
                    sprite.scale.set(1.1);
                    break;
                }
            }
        }

        // Handle touch move
        function handleTouchMove(e) {
            if (!touchedSprite) return;
            e.preventDefault();

            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            touchedSprite.targetX = x + touchOffset.x;
            touchedSprite.targetY = y + touchOffset.y;
        }

        // Handle touch end
        function handleTouchEnd(e) {
            if (touchedSprite) {
                touchedSprite.cursor = 'grab';
                touchedSprite.scale.set(1);
                touchedSprite = null;
            }
        }

        // Mouse fallback
        function handleMouseDown(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            for (let i = sprites.length - 1; i >= 0; i--) {
                const sprite = sprites[i];
                const dx = sprite.x - x;
                const dy = sprite.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < sprite.size / 1.5) {
                    touchedSprite = sprite;
                    touchOffset.x = dx;
                    touchOffset.y = dy;
                    sprite.cursor = 'grabbing';
                    sprite.scale.set(1.1);
                    break;
                }
            }
        }

        function handleMouseMove(e) {
            if (!touchedSprite) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            touchedSprite.targetX = x + touchOffset.x;
            touchedSprite.targetY = y + touchOffset.y;
        }

        function handleMouseUp(e) {
            if (touchedSprite) {
                touchedSprite.cursor = 'grab';
                touchedSprite.scale.set(1);
                touchedSprite = null;
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

            // Update sprite positions and rotations
            for (let i = 0; i < sprites.length; i++) {
                const sprite = sprites[i];

                // Rotate 360 degrees continuously
                if (rotationEnabled && sprite !== touchedSprite) {
                    sprite.rotation += sprite.rotationSpeed;
                }

                // Update position with easing if not being touched
                if (sprite !== touchedSprite) {
                    const dx = sprite.targetX - sprite.x;
                    const dy = sprite.targetY - sprite.y;
                    sprite.x += dx * 0.1;
                    sprite.y += dy * 0.1;
                } else {
                    // Direct position when being dragged
                    sprite.x = sprite.targetX;
                    sprite.y = sprite.targetY;
                }

                // Keep within bounds
                const minX = sprite.size / 2;
                const maxX = app.screen.width - sprite.size / 2;
                const minY = sprite.size / 2;
                const maxY = app.screen.height - sprite.size / 2;

                sprite.x = Math.max(minX, Math.min(maxX, sprite.x));
                sprite.y = Math.max(minY, Math.min(maxY, sprite.y));
                sprite.targetX = sprite.x;
                sprite.targetY = sprite.y;
            }
        }

        // Button handlers
        document.getElementById('addSprite').addEventListener('click', () => {
            createSprite();
        });

        document.getElementById('toggleRotation').addEventListener('click', (e) => {
            rotationEnabled = !rotationEnabled;
            e.target.textContent = rotationEnabled ? 'Pause Rotation' : 'Resume Rotation';
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            sprites.forEach(sprite => app.stage.removeChild(sprite));
            sprites = [];
            updateSpriteCount();
        });

        // Create initial sprites
        createSprite();
        createSprite();
        createSprite();

        // Start animation loop
        app.ticker.add(animate);

        // Handle window/screen resize
        window.addEventListener('resize', () => {
            app.renderer.resize(gameContainer.clientWidth, gameContainer.clientHeight);
        });

        console.log('PIXI Sprite Rotation application initialized successfully');
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
