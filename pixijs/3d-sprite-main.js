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
        let lastMousePos = { x: 0, y: 0 };
        let isDragging = false;
        let dragDelta = { x: 0, y: 0 };
        let frameCount = 0;
        let lastFpsUpdate = Date.now();

        // Character sprite colors
        const spriteColors = [
            { skin: 0xf4a460, hair: 0x8b4513, shirt: 0xff6b6b, pants: 0x1a1a2e },
            { skin: 0xfdbcb4, hair: 0xffd700, shirt: 0x4ecdc4, pants: 0x2a4a5e },
            { skin: 0xd4a574, hair: 0x1a1a1a, shirt: 0x45b7d1, pants: 0xf7b731 },
            { skin: 0xe8b4a8, hair: 0xa0522d, shirt: 0x5f27cd, pants: 0x0f3c6b }
        ];

        function getRandomColors() {
            return spriteColors[Math.floor(Math.random() * spriteColors.length)];
        }

        // Create character sprite texture
        function createCharacterSprite(size, colors) {
            const graphics = new PIXI.Graphics();
            const halfSize = size / 2;
            const quarterSize = size / 4;

            // Head (circle)
            graphics.beginFill(colors.skin);
            graphics.drawCircle(size / 2, quarterSize, quarterSize * 0.8);
            graphics.endFill();

            // Hair
            graphics.beginFill(colors.hair);
            graphics.drawCircle(size / 2, quarterSize * 0.8, quarterSize * 0.7);
            graphics.endFill();

            // Body (rectangle)
            graphics.beginFill(colors.shirt);
            graphics.drawRect(size / 2 - quarterSize * 0.6, quarterSize * 1.8, quarterSize * 1.2, quarterSize * 1.5);
            graphics.endFill();

            // Pants
            graphics.beginFill(colors.pants);
            graphics.drawRect(size / 2 - quarterSize * 0.5, quarterSize * 3.3, quarterSize, quarterSize);
            graphics.endFill();

            // Arms
            graphics.beginFill(colors.skin);
            graphics.drawRect(size / 2 - quarterSize * 1.3, quarterSize * 2, quarterSize * 0.5, quarterSize * 1.2);
            graphics.drawRect(size / 2 + quarterSize * 0.8, quarterSize * 2, quarterSize * 0.5, quarterSize * 1.2);
            graphics.endFill();

            // Eyes
            graphics.beginFill(0xffffff);
            graphics.drawCircle(size / 2 - quarterSize * 0.3, quarterSize * 0.8, quarterSize * 0.15);
            graphics.drawCircle(size / 2 + quarterSize * 0.3, quarterSize * 0.8, quarterSize * 0.15);
            graphics.endFill();

            // Pupils
            graphics.beginFill(0x000000);
            graphics.drawCircle(size / 2 - quarterSize * 0.3, quarterSize * 0.8, quarterSize * 0.08);
            graphics.drawCircle(size / 2 + quarterSize * 0.3, quarterSize * 0.8, quarterSize * 0.08);
            graphics.endFill();

            // Border
            graphics.lineStyle(2, 0xffffff);
            graphics.drawCircle(size / 2, quarterSize, quarterSize * 0.8);
            graphics.drawRect(size / 2 - quarterSize * 0.6, quarterSize * 1.8, quarterSize * 1.2, quarterSize * 2.5);

            return graphics;
        }

        // Create robot sprite texture
        function createRobotSprite(size, colors) {
            const graphics = new PIXI.Graphics();
            const quarter = size / 4;

            // Head (square)
            graphics.beginFill(colors.shirt);
            graphics.drawRect(size / 2 - quarter * 0.9, quarter * 0.5, quarter * 1.8, quarter * 1.8);
            graphics.endFill();

            // Eyes
            graphics.beginFill(0xffff00);
            graphics.drawRect(size / 2 - quarter * 0.6, quarter * 1, quarter * 0.4, quarter * 0.4);
            graphics.drawRect(size / 2 + quarter * 0.2, quarter * 1, quarter * 0.4, quarter * 0.4);
            graphics.endFill();

            // Body (larger square)
            graphics.beginFill(colors.pants);
            graphics.drawRect(size / 2 - quarter * 0.8, quarter * 2.5, quarter * 1.6, quarter * 1.8);
            graphics.endFill();

            // Antenna
            graphics.lineStyle(3, colors.hair);
            graphics.moveTo(size / 2, quarter * 0.3);
            graphics.lineTo(size / 2, -quarter * 0.2);

            // Arms
            graphics.beginFill(colors.skin);
            graphics.drawRect(size / 2 - quarter * 1.4, quarter * 2.8, quarter * 0.6, quarter * 0.8);
            graphics.drawRect(size / 2 + quarter * 0.8, quarter * 2.8, quarter * 0.6, quarter * 0.8);
            graphics.endFill();

            // Border
            graphics.lineStyle(2, 0xffffff);
            graphics.drawRect(size / 2 - quarter * 0.9, quarter * 0.5, quarter * 1.8, quarter * 1.8);
            graphics.drawRect(size / 2 - quarter * 0.8, quarter * 2.5, quarter * 1.6, quarter * 1.8);

            return graphics;
        }

        // Create 3D sprite object
        function create3DSprite() {
            const size = Math.random() * 20 + 60;
            const colors = getRandomColors();
            const container = new PIXI.Container();

            // Create 6 sprite faces
            const spriteType = Math.random() > 0.5 ? 'character' : 'robot';
            const faceGraphics = spriteType === 'character' 
                ? createCharacterSprite(size, colors)
                : createRobotSprite(size, colors);

            // Create texture from graphics
            const texture = app.renderer.generateTexture(faceGraphics);
            faceGraphics.destroy();

            // Create 6 sprites for cube faces
            const faces = {
                front: new PIXI.Sprite(texture),
                back: new PIXI.Sprite(texture),
                top: new PIXI.Sprite(texture),
                bottom: new PIXI.Sprite(texture),
                left: new PIXI.Sprite(texture),
                right: new PIXI.Sprite(texture)
            };

            // Setup sprite properties
            Object.values(faces).forEach(sprite => {
                sprite.anchor.set(0.5);
                sprite.width = size;
                sprite.height = size;
                container.addChild(sprite);
            });

            container.spriteFaces = faces;
            container.size = size;

            // Position randomly
            container.x = Math.random() * (app.screen.width - size) + size / 2;
            container.y = Math.random() * (app.screen.height - size) + size / 2;

            // 3D rotation state
            container.rotationX = Math.random() * Math.PI;
            container.rotationY = Math.random() * Math.PI;
            container.rotationZ = Math.random() * Math.PI;

            app.stage.addChild(container);
            objects.push(container);
            updateObjectCount();

            return container;
        }

        // Update 3D sprite display
        function updateSpriteDisplay(sprite) {
            const faces = sprite.spriteFaces;
            const size = sprite.size;

            // Calculate 3D perspective
            const cosX = Math.cos(sprite.rotationX);
            const sinX = Math.sin(sprite.rotationX);
            const cosY = Math.cos(sprite.rotationY);
            const sinY = Math.sin(sprite.rotationY);

            // Update face visibility and transformation
            faces.front.alpha = Math.max(0.4, (cosY + 1) / 2);
            faces.front.skewY = sinX * 0.2;
            faces.front.scale.set(1 + cosY * 0.15);

            faces.back.alpha = Math.max(0.4, (1 - cosY) / 2);
            faces.back.skewY = -sinX * 0.2;
            faces.back.scale.set(1 - cosY * 0.15);

            faces.top.skewX = sinY * 0.2;
            faces.top.scale.set(1 + Math.abs(sinX) * 0.15);
            faces.top.y = -size * 0.2 * Math.cos(sprite.rotationX);
            faces.top.alpha = Math.max(0.4, (sinX + 1) / 2);

            faces.bottom.skewX = -sinY * 0.2;
            faces.bottom.scale.set(1 + Math.abs(sinX) * 0.15);
            faces.bottom.y = size * 0.2 * Math.cos(sprite.rotationX);
            faces.bottom.alpha = Math.max(0.4, (1 - sinX) / 2);

            faces.left.skewY = sinX * 0.15;
            faces.left.scale.set(1 - sinY * 0.2);
            faces.left.x = -size * 0.2 * Math.cos(sprite.rotationY);
            faces.left.alpha = Math.max(0.4, (1 - sinY) / 2);

            faces.right.skewY = sinX * 0.15;
            faces.right.scale.set(1 + sinY * 0.2);
            faces.right.x = size * 0.2 * Math.cos(sprite.rotationY);
            faces.right.alpha = Math.max(0.4, (sinY + 1) / 2);

            sprite.rotation = sprite.rotationZ;
        }

        // Update sprite counter
        function updateObjectCount() {
            document.getElementById('spriteCount').textContent = objects.length;
        }

        // Drag interaction
        document.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMousePos = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                dragDelta.x = (e.clientX - lastMousePos.x) * 2;
                dragDelta.y = (e.clientY - lastMousePos.y) * 2;
                lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        document.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Touch support
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                isDragging = true;
                lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length > 0) {
                dragDelta.x = (e.touches[0].clientX - lastMousePos.x) * 2;
                dragDelta.y = (e.touches[0].clientY - lastMousePos.y) * 2;
                lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Button handlers
        document.getElementById('addSprite').addEventListener('click', () => {
            create3DSprite();
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            objects.forEach(obj => app.stage.removeChild(obj));
            objects = [];
            updateObjectCount();
        });

        // Create initial sprites
        create3DSprite();
        create3DSprite();

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

            // Update all sprites
            objects.forEach(sprite => {
                if (isDragging) {
                    sprite.rotationY += dragDelta.x * 0.05;
                    sprite.rotationX += dragDelta.y * 0.05;
                    dragDelta.x *= 0.95;
                    dragDelta.y *= 0.95;
                } else {
                    sprite.rotationZ += 0.003;
                }

                updateSpriteDisplay(sprite);
            });
        }

        // Start animation loop
        app.ticker.add(animate);

        // Handle window/screen resize
        window.addEventListener('resize', () => {
            app.renderer.resize(gameContainer.clientWidth, gameContainer.clientHeight);
        });

        console.log('PIXI 3D Sprite application initialized successfully');
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
