// 3D Vector and Matrix utilities
class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    rotateX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector3(
            this.x,
            this.y * cos - this.z * sin,
            this.y * sin + this.z * cos
        );
    }

    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector3(
            this.x * cos + this.z * sin,
            this.y,
            -this.x * sin + this.z * cos
        );
    }

    rotateZ(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector3(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos,
            this.z
        );
    }

    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    scale(s) {
        return new Vector3(this.x * s, this.y * s, this.z * s);
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }
}

class Cube3D {
    constructor(size, color) {
        this.size = size;
        this.color = color;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.position = new Vector3(0, 0, 0);

        // Define cube vertices
        const d = size / 2;
        this.vertices = [
            new Vector3(-d, -d, -d), // 0
            new Vector3(d, -d, -d),  // 1
            new Vector3(d, d, -d),   // 2
            new Vector3(-d, d, -d),  // 3
            new Vector3(-d, -d, d),  // 4
            new Vector3(d, -d, d),   // 5
            new Vector3(d, d, d),    // 6
            new Vector3(-d, d, d)    // 7
        ];

        // Define cube faces (as vertex indices)
        this.faces = [
            { vertices: [0, 1, 2, 3], color: 0xff6b6b, label: 'Front' },
            { vertices: [5, 4, 7, 6], color: 0xcc0000, label: 'Back' },
            { vertices: [4, 5, 1, 0], color: 0xff9999, label: 'Bottom' },
            { vertices: [3, 2, 6, 7], color: 0xff0000, label: 'Top' },
            { vertices: [4, 0, 3, 7], color: 0xdd4444, label: 'Left' },
            { vertices: [1, 5, 6, 2], color: 0xee5555, label: 'Right' }
        ];

        this.faceTextures = new Array(this.faces.length).fill(null);
    }

    getRotatedVertices() {
        return this.vertices.map(v => {
            let rotated = v.clone();
            rotated = rotated.rotateX(this.rotationX);
            rotated = rotated.rotateY(this.rotationY);
            rotated = rotated.rotateZ(this.rotationZ);
            return rotated.add(this.position);
        });
    }

    projectVertices(rotated, zoom, screenWidth, screenHeight) {
        const fov = 500; // Field of view distance
        return rotated.map(v => {
            const scale = fov / (fov + v.z);
            return {
                x: screenWidth / 2 + v.x * scale * zoom,
                y: screenHeight / 2 + v.y * scale * zoom,
                z: v.z,
                scale: scale
            };
        });
    }

    getFaceCenter(rotated, faceIndices) {
        let centerZ = 0;
        faceIndices.forEach(i => {
            centerZ += rotated[i].z;
        });
        return centerZ / faceIndices.length;
    }
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image: ' + url));
        img.src = url;
    });
}

function createDemoFaceTexture(label, colorA, colorB) {
    const size = 256;
    const tmp = document.createElement('canvas');
    tmp.width = size;
    tmp.height = size;
    const tctx = tmp.getContext('2d');

    const gradient = tctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);
    tctx.fillStyle = gradient;
    tctx.fillRect(0, 0, size, size);

    tctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    tctx.lineWidth = 8;
    tctx.strokeRect(16, 16, size - 32, size - 32);

    tctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let i = 0; i < 6; i++) {
        tctx.fillRect(24 + i * 34, 24, 16, size - 48);
    }

    tctx.fillStyle = 'white';
    tctx.font = '700 36px sans-serif';
    tctx.textAlign = 'center';
    tctx.textBaseline = 'middle';
    tctx.fillText(label.toUpperCase(), size / 2, size / 2);

    return tmp.toDataURL('image/png');
}

async function setCubeSprites(faceImageUrls) {
    if (!Array.isArray(faceImageUrls) || faceImageUrls.length !== 6) {
        throw new Error('setCubeSprites expects an array of 6 image URLs.');
    }

    const images = await Promise.all(faceImageUrls.map((url) => loadImage(url)));
    cube.faceTextures = images;
}

async function setCubeSpritesFromSheet(sheetUrl, columns = 3, rows = 2) {
    const sheet = await loadImage(sheetUrl);
    const tileWidth = Math.floor(sheet.width / columns);
    const tileHeight = Math.floor(sheet.height / rows);
    const urls = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const tile = document.createElement('canvas');
            tile.width = tileWidth;
            tile.height = tileHeight;
            const tctx = tile.getContext('2d');
            tctx.drawImage(
                sheet,
                col * tileWidth,
                row * tileHeight,
                tileWidth,
                tileHeight,
                0,
                0,
                tileWidth,
                tileHeight
            );
            urls.push(tile.toDataURL('image/png'));
        }
    }

    if (urls.length < 6) {
        throw new Error('Sprite sheet must provide at least 6 tiles.');
    }

    await setCubeSprites(urls.slice(0, 6));
}

function drawTexturedTriangle(context, image, sourceTri, destTri) {
    const sx0 = sourceTri[0].x;
    const sy0 = sourceTri[0].y;
    const sx1 = sourceTri[1].x;
    const sy1 = sourceTri[1].y;
    const sx2 = sourceTri[2].x;
    const sy2 = sourceTri[2].y;

    const dx0 = destTri[0].x;
    const dy0 = destTri[0].y;
    const dx1 = destTri[1].x;
    const dy1 = destTri[1].y;
    const dx2 = destTri[2].x;
    const dy2 = destTri[2].y;

    const denom = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);
    if (Math.abs(denom) < 0.000001) {
        return;
    }

    const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
    const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
    const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
    const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;
    const e = (dx0 * (sx1 * sy2 - sx2 * sy1) + dx1 * (sx2 * sy0 - sx0 * sy2) + dx2 * (sx0 * sy1 - sx1 * sy0)) / denom;
    const f = (dy0 * (sx1 * sy2 - sx2 * sy1) + dy1 * (sx2 * sy0 - sx0 * sy2) + dy2 * (sx0 * sy1 - sx1 * sy0)) / denom;

    context.save();
    context.beginPath();
    context.moveTo(dx0, dy0);
    context.lineTo(dx1, dy1);
    context.lineTo(dx2, dy2);
    context.closePath();
    context.clip();
    context.setTransform(a, b, c, d, e, f);
    context.drawImage(image, 0, 0);
    context.restore();
}

function drawTexturedQuad(context, image, quad) {
    const w = image.width;
    const h = image.height;

    const srcTriA = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }];
    const dstTriA = [quad[0], quad[1], quad[2]];

    const srcTriB = [{ x: 0, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
    const dstTriB = [quad[0], quad[2], quad[3]];

    drawTexturedTriangle(context, image, srcTriA, dstTriA);
    drawTexturedTriangle(context, image, srcTriB, dstTriB);
}

// Initialize canvas
const canvas = document.getElementById('canvas3d');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Global state
let cube = new Cube3D(150, 0xff6b6b);
let zoom = 1;
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let dragDelta = { x: 0, y: 0 };
let frameCount = 0;
let lastFpsUpdate = Date.now();

const productData = {
    name: '3D Premium Cube',
    price: '$129.99',
    desc: 'Interactive 3D product with full rotation and zoom capabilities. Perfect for product showcasing.'
};

const demoFaceSprites = [
    createDemoFaceTexture('front', '#ff6b6b', '#f94144'),
    createDemoFaceTexture('back', '#ef476f', '#d90429'),
    createDemoFaceTexture('bottom', '#ffa94d', '#ff922b'),
    createDemoFaceTexture('top', '#5c7cfa', '#4263eb'),
    createDemoFaceTexture('left', '#4ecdc4', '#2a9d8f'),
    createDemoFaceTexture('right', '#b197fc', '#9775fa')
];

setCubeSprites(demoFaceSprites).catch((error) => {
    console.error(error);
});

window.setCubeSprites = setCubeSprites;
window.setCubeSpritesFromSheet = setCubeSpritesFromSheet;

window.closeProductInfo = function() {
    document.getElementById('product-info').classList.add('hidden');
};

function updateStats() {
    const rotationDeg = Math.round((cube.rotationY * 180 / Math.PI) % 360);
    document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
    document.getElementById('rotationInfo').textContent = rotationDeg + '°';
}

// Mouse/Touch events
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        dragDelta.x = (e.clientX - lastMousePos.x) * 0.01;
        dragDelta.y = (e.clientY - lastMousePos.y) * 0.01;
        lastMousePos = { x: e.clientX, y: e.clientY };
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Zoom with wheel
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    zoom = Math.max(0.5, Math.min(3, zoom * zoomFactor));
    updateStats();
});

// Touch support
let touchDistance = 0;
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistance = Math.sqrt(dx * dx + dy * dy);
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
        dragDelta.x = (e.touches[0].clientX - lastMousePos.x) * 0.01;
        dragDelta.y = (e.touches[0].clientY - lastMousePos.y) * 0.01;
        lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        if (touchDistance > 0) {
            zoom = Math.max(0.5, Math.min(3, zoom * (newDistance / touchDistance)));
            updateStats();
        }
        touchDistance = newDistance;
    }
});

canvas.addEventListener('touchend', () => {
    isDragging = false;
    touchDistance = 0;
});

// Click on canvas to show product info
canvas.addEventListener('click', () => {
    document.getElementById('product-info').classList.remove('hidden');
    document.getElementById('product-name').textContent = productData.name;
    document.getElementById('product-price').textContent = productData.price;
    document.getElementById('product-desc').textContent = productData.desc;
});

// Button handlers
document.getElementById('resetView').addEventListener('click', () => {
    cube.rotationX = 0;
    cube.rotationY = 0;
    cube.rotationZ = 0;
    zoom = 1;
    updateStats();
});

document.getElementById('toggleInfo').addEventListener('click', () => {
    const panel = document.getElementById('product-info');
    panel.classList.toggle('hidden');
});

document.getElementById('addCube').addEventListener('click', () => {
    const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7b731, 0x5f27cd];
    const previousTextures = cube.faceTextures;
    cube = new Cube3D(150, colors[Math.floor(Math.random() * colors.length)]);
    cube.faceTextures = previousTextures;
    updateStats();
});

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

    // Update rotation with drag
    if (isDragging) {
        cube.rotationY += dragDelta.x;
        cube.rotationX += dragDelta.y;
        dragDelta.x *= 0.95; // friction
        dragDelta.y *= 0.95;
    } else {
        // Auto-rotate slightly when not dragging
        cube.rotationY += 0.002;
    }

    // Get rotated vertices
    const rotatedVertices = cube.getRotatedVertices();

    // Project to 2D
    const projectedVertices = cube.projectVertices(rotatedVertices, zoom, canvas.width, canvas.height);

    // Sort faces by depth (painter's algorithm)
    const facesWithDepth = cube.faces.map((face, faceIndex) => ({
        ...face,
        faceIndex,
        depth: cube.getFaceCenter(rotatedVertices, face.vertices),
        projected: face.vertices.map(i => projectedVertices[i])
    })).sort((a, b) => a.depth - b.depth);

    // Clear canvas
    ctx.fillStyle = '#1a2a4e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a2a4e');
    gradient.addColorStop(1, '#0f3c6b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw faces
    facesWithDepth.forEach(face => {
        const texture = cube.faceTextures[face.faceIndex];

        if (texture) {
            drawTexturedQuad(ctx, texture, face.projected);
        } else {
            ctx.fillStyle = '#' + face.color.toString(16).padStart(6, '0');
            ctx.beginPath();
            ctx.moveTo(face.projected[0].x, face.projected[0].y);
            for (let i = 1; i < face.projected.length; i++) {
                ctx.lineTo(face.projected[i].x, face.projected[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }

        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (!texture) {
            const centerX = face.projected.reduce((sum, p) => sum + p.x, 0) / face.projected.length;
            const centerY = face.projected.reduce((sum, p) => sum + p.y, 0) / face.projected.length;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(face.label, centerX, centerY);
        }
    });

    // Draw edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // front
        [4, 5], [5, 6], [6, 7], [7, 4], // back
        [0, 4], [1, 5], [2, 6], [3, 7]  // sides
    ];
    edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(projectedVertices[a].x, projectedVertices[a].y);
        ctx.lineTo(projectedVertices[b].x, projectedVertices[b].y);
        ctx.stroke();
    });

    // Draw center point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    updateStats();
    requestAnimationFrame(animate);
}

animate();
