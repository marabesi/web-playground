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
            backgroundColor: 0x0f1419,
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
        let cubes = [];
        let mousePos = { x: 0, y: 0 };
        let lastMousePos = { x: 0, y: 0 };
        let isDragging = false;
        let dragDelta = { x: 0, y: 0 };
        let frameCount = 0;
        let lastFpsUpdate = Date.now();

        // Colors palette for cube faces
        const colors = [
            { front: 0xff6b6b, back: 0xcc0000, top: 0xff9999, bottom: 0x990000, left: 0xcc0000, right: 0xff0000 },
            { front: 0x4ecdc4, back: 0x2a9d8f, top: 0x8ee4d9, bottom: 0x1a6f63, left: 0x2a9d8f, right: 0x3fb8aa },
            { front: 0x45b7d1, back: 0x0a7fbf, top: 0x7dd1e0, bottom: 0x0d5e99, left: 0x0a7fbf, right: 0x1e96d4 },
            { front: 0xf7b731, back: 0xd4861d, top: 0xf9d287, bottom: 0xb8860b, left: 0xd4861d, right: 0xf5c844 },
            { front: 0x5f27cd, back: 0x3d1a7f, top: 0x8b5cf6, bottom: 0x2d0a52, left: 0x3d1a7f, right: 0x7c3aed }
        ];

        function getRandomColorSet() {
            return colors[Math.floor(Math.random() * colors.length)];
        }

        function getRandomSize() {
            return Math.random() * 20 + 40;
        }

        // Create 3D cube sprite
        function create3DCube() {
            const size = getRandomSize();
            const colorSet = getRandomColorSet();
            const container = new PIXI.Container();

            // Create cube faces
            const faces = {
                front: createFace(size, colorSet.front, ''),
                back: createFace(size, colorSet.back, ''),
                top: createFace(size, colorSet.top, ''),
                bottom: createFace(size, colorSet.bottom, ''),
                left: createFace(size, colorSet.left, ''),
                right: createFace(size, colorSet.right, '')
            };

            // Store faces for later manipulation
            container.cubeFaces = faces;
            container.size = size;
            container.colorSet = colorSet;

            // Add all faces to container
            container.addChild(faces.front);
            container.addChild(faces.back);
            container.addChild(faces.top);
            container.addChild(faces.bottom);
            container.addChild(faces.left);
            container.addChild(faces.right);

            // Position container randomly
            container.x = Math.random() * (app.screen.width - size) + size / 2;
            container.y = Math.random() * (app.screen.height - size) + size / 2;

            // 3D rotation state
            container.rotationX = Math.random() * Math.PI;
            container.rotationY = Math.random() * Math.PI;
            container.rotationZ = Math.random() * Math.PI;

            // Target rotations based on mouse
            container.targetRotationX = 0;
            container.targetRotationY = 0;

            container.interactive = true;
            container.cursor = 'grab';

            app.stage.addChild(container);
            cubes.push(container);
            updateObjectCount();

            return container;
        }

        function createFace(size, color, label) {
            const face = new PIXI.Graphics();
            face.beginFill(color);
            face.drawRect(-size / 2, -size / 2, size, size);
            face.endFill();

            // Draw border
            face.lineStyle(2, 0xffffff);
            face.drawRect(-size / 2, -size / 2, size, size);

            // Add some pattern
            face.lineStyle(1, 0xffffff);
            face.moveTo(-size / 2, 0);
            face.lineTo(size / 2, 0);
            face.moveTo(0, -size / 2);
            face.lineTo(0, size / 2);

            return face;
        }

        // Update 3D rotation based on drag
        function updateCubeRotations() {
            cubes.forEach(cube => {
                if (isDragging) {
                    // Rotate based on drag delta
                    cube.rotationY += dragDelta.x * 0.05;
                    cube.rotationX += dragDelta.y * 0.05;
                    dragDelta.x *= 0.95; // Friction
                    dragDelta.y *= 0.95;
                } else {
                    // Auto-rotation when not dragging
                    cube.rotationZ += 0.003;
                }

                // Apply 3D transformation using skew and scale
                updateCubeDisplay(cube);
            });
        }

        function updateCubeDisplay(cube) {
            const faces = cube.cubeFaces;
            const size = cube.size;

            // Calculate 3D perspective
            const cosX = Math.cos(cube.rotationX);
            const sinX = Math.sin(cube.rotationX);
            const cosY = Math.cos(cube.rotationY);
            const sinY = Math.sin(cube.rotationY);

            // Update face visibility and position based on 3D rotation
            // Front face
            faces.front.alpha = Math.max(0.3, (cosY + 1) / 2);
            faces.front.skewY = sinX * 0.3;
            faces.front.scale.set(1 + cosY * 0.2);

            // Back face
            faces.back.alpha = Math.max(0.3, (1 - cosY) / 2);
            faces.back.skewY = -sinX * 0.3;
            faces.back.scale.set(1 - cosY * 0.2);

            // Top face
            faces.top.skewX = sinY * 0.3;
            faces.top.scale.set(1 + Math.abs(sinX) * 0.2);
            faces.top.y = -size * 0.25 * Math.cos(cube.rotationX);
            faces.top.alpha = Math.max(0.3, (sinX + 1) / 2);

            // Bottom face
            faces.bottom.skewX = -sinY * 0.3;
            faces.bottom.scale.set(1 + Math.abs(sinX) * 0.2);
            faces.bottom.y = size * 0.25 * Math.cos(cube.rotationX);
            faces.bottom.alpha = Math.max(0.3, (1 - sinX) / 2);

            // Left face
            faces.left.skewY = sinX * 0.2;
            faces.left.scale.set(1 - sinY * 0.3);
            faces.left.x = -size * 0.25 * Math.cos(cube.rotationY);
            faces.left.alpha = Math.max(0.3, (1 - sinY) / 2);

            // Right face
            faces.right.skewY = sinX * 0.2;
            faces.right.scale.set(1 + sinY * 0.3);
            faces.right.x = size * 0.25 * Math.cos(cube.rotationY);
            faces.right.alpha = Math.max(0.3, (sinY + 1) / 2);

            // Apply Z rotation to entire cube
            cube.rotation = cube.rotationZ;
        }

        // Update object counter
        function updateObjectCount() {
            document.getElementById('objectCount').textContent = cubes.length;
        }

        // Track mouse/touch movement for drag rotation
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
        document.getElementById('addCube').addEventListener('click', () => {
            create3DCube();
        });

        document.getElementById('clearAll').addEventListener('click', () => {
            cubes.forEach(cube => app.stage.removeChild(cube));
            cubes = [];
            updateObjectCount();
        });

        // Create initial cubes
        create3DCube();
        create3DCube();
        create3DCube();

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

            // Update all cubes
            updateCubeRotations();
        }

        // Start animation loop
        app.ticker.add(animate);

        // Handle window/screen resize
        window.addEventListener('resize', () => {
            app.renderer.resize(gameContainer.clientWidth, gameContainer.clientHeight);
        });

        console.log('PIXI 3D Cube application initialized successfully');
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
