/**
 * 3D Constellation View
 * Interactive 3D visualization of mythological constellations
 * Uses Three.js for 3D rendering
 */

class ConstellationView {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || 1000,
            height: options.height || 700,
            autoRotate: options.autoRotate !== false,
            mythology: options.mythology || 'greek',
            showStars: options.showStars !== false,
            showConstellations: options.showConstellations !== false,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.stars = [];
        this.constellations = [];
        this.selectedConstellation = null;
    }

    async init() {
        try {
            this.setupThreeJS();
            this.addLights();
            this.createStarField();
            this.createConstellations();
            this.addControls();
            this.animate();
        } catch (error) {
            console.error('Error initializing constellation view:', error);
            this.showError(error.message);
        }
    }

    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000010);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.options.width / this.options.height,
            0.1,
            1000
        );
        this.camera.position.z = 100;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.options.width, this.options.height);
        this.container.appendChild(this.renderer.domElement);

        // Add orbit controls (if OrbitControls is available)
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = this.options.autoRotate;
            this.controls.autoRotateSpeed = 0.5;
        }

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Handle mouse interactions
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    addLights() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add point light
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
    }

    createStarField() {
        if (!this.options.showStars) return;

        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            // Random position on sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 150 + Math.random() * 50;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Random color (mostly white/yellow)
            const color = new THREE.Color();
            color.setHSL(0.1 + Math.random() * 0.1, 0.5, 0.8 + Math.random() * 0.2);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(starField);
        this.starField = starField;
    }

    createConstellations() {
        if (!this.options.showConstellations) return;

        const constellationData = this.getConstellationData();

        constellationData.forEach(constellation => {
            this.createConstellation(constellation);
        });
    }

    getConstellationData() {
        // Sample constellation data (Greek mythology focus)
        return [
            {
                name: 'Orion',
                mythology: 'greek',
                story: 'The great hunter, placed among the stars by Zeus',
                stars: [
                    { x: 0, y: 20, z: -100, name: 'Betelgeuse', magnitude: 0.5 },
                    { x: 0, y: -20, z: -100, name: 'Rigel', magnitude: 0.1 },
                    { x: -10, y: 0, z: -100, name: 'Bellatrix', magnitude: 1.6 },
                    { x: 10, y: 0, z: -100, name: 'Saiph', magnitude: 2.1 },
                    { x: -3, y: 5, z: -100, name: 'Alnitak', magnitude: 1.7 },
                    { x: 0, y: 5, z: -100, name: 'Alnilam', magnitude: 1.7 },
                    { x: 3, y: 5, z: -100, name: 'Mintaka', magnitude: 2.2 }
                ],
                connections: [
                    [0, 2], [0, 4], [1, 3], [1, 6],
                    [2, 4], [3, 6], [4, 5], [5, 6]
                ]
            },
            {
                name: 'Ursa Major',
                mythology: 'greek',
                story: 'The Great Bear, associated with Callisto',
                stars: [
                    { x: -30, y: 40, z: -120, name: 'Dubhe', magnitude: 1.8 },
                    { x: -25, y: 45, z: -120, name: 'Merak', magnitude: 2.4 },
                    { x: -20, y: 48, z: -120, name: 'Phecda', magnitude: 2.4 },
                    { x: -15, y: 45, z: -120, name: 'Megrez', magnitude: 3.3 },
                    { x: -10, y: 42, z: -120, name: 'Alioth', magnitude: 1.8 },
                    { x: -5, y: 40, z: -120, name: 'Mizar', magnitude: 2.1 },
                    { x: 0, y: 38, z: -120, name: 'Alkaid', magnitude: 1.9 }
                ],
                connections: [
                    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 3]
                ]
            },
            {
                name: 'Cassiopeia',
                mythology: 'greek',
                story: 'The vain queen, mother of Andromeda',
                stars: [
                    { x: 20, y: 50, z: -110, name: 'Schedar', magnitude: 2.2 },
                    { x: 25, y: 55, z: -110, name: 'Caph', magnitude: 2.3 },
                    { x: 30, y: 52, z: -110, name: 'Navi', magnitude: 2.5 },
                    { x: 35, y: 48, z: -110, name: 'Ruchbah', magnitude: 2.7 },
                    { x: 40, y: 50, z: -110, name: 'Segin', magnitude: 3.4 }
                ],
                connections: [
                    [0, 1], [1, 2], [2, 3], [3, 4]
                ]
            },
            {
                name: 'Andromeda',
                mythology: 'greek',
                story: 'The chained maiden, rescued by Perseus',
                stars: [
                    { x: 15, y: 30, z: -115, name: 'Alpheratz', magnitude: 2.1 },
                    { x: 18, y: 25, z: -115, name: 'Mirach', magnitude: 2.1 },
                    { x: 20, y: 20, z: -115, name: 'Almach', magnitude: 2.2 }
                ],
                connections: [
                    [0, 1], [1, 2]
                ]
            },
            {
                name: 'Perseus',
                mythology: 'greek',
                story: 'The hero who slew Medusa',
                stars: [
                    { x: 10, y: 35, z: -110, name: 'Mirfak', magnitude: 1.8 },
                    { x: 12, y: 30, z: -110, name: 'Algol', magnitude: 2.1 },
                    { x: 14, y: 32, z: -110, name: 'Atik', magnitude: 3.8 }
                ],
                connections: [
                    [0, 1], [1, 2]
                ]
            }
        ];
    }

    createConstellation(data) {
        const group = new THREE.Group();
        group.userData = {
            name: data.name,
            mythology: data.mythology,
            story: data.story
        };

        // Create stars
        const starObjects = [];
        data.stars.forEach(star => {
            const geometry = new THREE.SphereGeometry(0.5 + (3 - star.magnitude) * 0.3, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffe0,
                emissive: 0xffffaa,
                emissiveIntensity: 0.5
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(star.x, star.y, star.z);
            sphere.userData = { name: star.name, magnitude: star.magnitude };

            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(1 + (3 - star.magnitude) * 0.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            sphere.add(glow);

            group.add(sphere);
            starObjects.push(sphere);
        });

        // Create connections
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.5
        });

        data.connections.forEach(([i, j]) => {
            const points = [
                starObjects[i].position,
                starObjects[j].position
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            group.add(line);
        });

        // Add label
        this.addConstellationLabel(group, data.name, data.stars[0]);

        this.scene.add(group);
        this.constellations.push(group);
    }

    addConstellationLabel(group, name, firstStar) {
        // Create text sprite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.font = 'Bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(name, 128, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        sprite.position.set(firstStar.x, firstStar.y + 5, firstStar.z);
        sprite.scale.set(10, 2.5, 1);

        group.add(sprite);
    }

    onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
            this.constellations.flatMap(g => g.children.filter(c => c.type === 'Mesh')),
            false
        );

        if (intersects.length > 0) {
            const constellation = intersects[0].object.parent;
            this.selectConstellation(constellation);
        }
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
            this.constellations.flatMap(g => g.children.filter(c => c.type === 'Mesh')),
            false
        );

        // Change cursor
        this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }

    selectConstellation(constellation) {
        // Deselect previous
        if (this.selectedConstellation) {
            this.selectedConstellation.children.forEach(child => {
                if (child.type === 'Mesh') {
                    child.material.emissiveIntensity = 0.5;
                }
            });
        }

        // Select new
        this.selectedConstellation = constellation;
        constellation.children.forEach(child => {
            if (child.type === 'Mesh') {
                child.material.emissiveIntensity = 1.0;
            }
        });

        // Show info panel
        this.showConstellationInfo(constellation.userData);
    }

    showConstellationInfo(data) {
        // Remove existing panel
        const existing = document.querySelector('.constellation-info-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.className = 'constellation-info-panel';
        panel.innerHTML = `
            <button class="close-btn">&times;</button>
            <h2>${data.name}</h2>
            <p><strong>Mythology:</strong> ${data.mythology}</p>
            <p><strong>Story:</strong> ${data.story}</p>
        `;

        this.container.appendChild(panel);

        panel.querySelector('.close-btn').onclick = () => {
            panel.remove();
            if (this.selectedConstellation) {
                this.selectedConstellation.children.forEach(child => {
                    if (child.type === 'Mesh') {
                        child.material.emissiveIntensity = 0.5;
                    }
                });
                this.selectedConstellation = null;
            }
        };
    }

    addControls() {
        const controls = document.createElement('div');
        controls.className = 'constellation-controls';
        controls.innerHTML = `
            <button id="toggle-rotation">⏸ Pause Rotation</button>
            <button id="reset-view">Reset View</button>
            <label>
                <input type="checkbox" id="show-names" checked> Show Names
            </label>
        `;

        this.container.insertBefore(controls, this.container.firstChild);

        // Rotation toggle
        document.getElementById('toggle-rotation').onclick = () => {
            if (this.controls) {
                this.controls.autoRotate = !this.controls.autoRotate;
                document.getElementById('toggle-rotation').textContent =
                    this.controls.autoRotate ? '⏸ Pause Rotation' : '▶ Resume Rotation';
            }
        };

        // Reset view
        document.getElementById('reset-view').onclick = () => {
            this.camera.position.set(0, 0, 100);
            this.camera.lookAt(0, 0, 0);
            if (this.controls) {
                this.controls.reset();
            }
        };

        // Toggle names
        document.getElementById('show-names').onchange = (e) => {
            this.constellations.forEach(group => {
                group.children.forEach(child => {
                    if (child.type === 'Sprite') {
                        child.visible = e.target.checked;
                    }
                });
            });
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        // Twinkle stars
        if (this.starField) {
            const time = Date.now() * 0.001;
            const positions = this.starField.geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] += Math.sin(time + i) * 0.01;
            }

            this.starField.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Error: ${message}`;
        this.container.appendChild(errorDiv);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConstellationView;
}
