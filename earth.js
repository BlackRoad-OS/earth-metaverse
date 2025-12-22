import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class EarthMetaverse {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.earth = null;
        this.clouds = null;
        this.stars = null;
        this.controls = null;
        this.autoRotate = false;
        this.frameCount = 0;
        this.lastTime = performance.now();

        this.init();
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        await this.loadEarth();
        this.setupControls();
        this.setupEventListeners();
        this.hideLoading();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 3;
    }

    setupRenderer() {
        const canvas = document.getElementById('earth-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setupLights() {
        // Ambient light for base visibility
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        // Directional light for sun
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(5, 3, 5);
        this.scene.add(sun);

        // Add starfield
        this.createStarfield();
    }

    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            sizeAttenuation: true
        });

        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position',
            new THREE.Float32BufferAttribute(starsVertices, 3));

        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    async loadEarth() {
        const textureLoader = new THREE.TextureLoader();
        const updateProgress = (percent) => {
            document.getElementById('progress').style.width = percent + '%';
        };

        // Earth geometry - high detail sphere
        const geometry = new THREE.SphereGeometry(1, 128, 128);

        updateProgress(20);

        // Load textures
        const earthTexture = await this.loadTexture(textureLoader,
            'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
        updateProgress(40);

        const bumpTexture = await this.loadTexture(textureLoader,
            'https://unpkg.com/three-globe/example/img/earth-topology.png');
        updateProgress(60);

        const specularTexture = await this.loadTexture(textureLoader,
            'https://unpkg.com/three-globe/example/img/earth-water.png');
        updateProgress(80);

        // Earth material with realistic properties
        const material = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: bumpTexture,
            bumpScale: 0.05,
            specularMap: specularTexture,
            specular: new THREE.Color(0x333333),
            shininess: 10
        });

        this.earth = new THREE.Mesh(geometry, material);
        this.scene.add(this.earth);

        // Add atmospheric glow
        this.addAtmosphere();

        // Add cloud layer
        await this.addClouds(textureLoader);

        updateProgress(100);

        // Update stats
        document.getElementById('vertices').textContent =
            (geometry.attributes.position.count).toLocaleString();
        document.getElementById('textures').textContent = '3';
    }

    addAtmosphere() {
        const atmosphereGeometry = new THREE.SphereGeometry(1.01, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.earth.add(atmosphere);
    }

    async addClouds(loader) {
        const cloudTexture = await this.loadTexture(loader,
            'https://unpkg.com/three-globe/example/img/earth-clouds.png');

        const cloudGeometry = new THREE.SphereGeometry(1.005, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.4,
            depthWrite: false
        });

        this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        this.earth.add(this.clouds);
    }

    loadTexture(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
        });
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 10;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.autoRotate = !this.autoRotate;
                this.controls.autoRotate = this.autoRotate;
            }
        });

        // Update lat/lon on camera move
        this.controls.addEventListener('change', () => {
            this.updateLatLon();
        });
    }

    updateLatLon() {
        // Calculate approximate lat/lon based on camera position
        const vector = new THREE.Vector3();
        this.camera.getWorldDirection(vector);

        const lat = (Math.asin(vector.y) * 180 / Math.PI).toFixed(2);
        const lon = (Math.atan2(vector.x, vector.z) * 180 / Math.PI).toFixed(2);

        document.getElementById('lat').textContent = lat;
        document.getElementById('lon').textContent = lon;
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
        document.getElementById('controls').style.display = 'block';
        document.getElementById('stats').style.display = 'block';
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate Earth slowly
        if (this.earth) {
            this.earth.rotation.y += 0.001;
        }

        // Rotate clouds slightly faster
        if (this.clouds) {
            this.clouds.rotation.y += 0.0005;
        }

        // Rotate stars very slowly
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }

        // Update controls
        if (this.controls) {
            this.controls.update();
        }

        // Update FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            document.getElementById('fps').textContent = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize Earth Metaverse
new EarthMetaverse();
