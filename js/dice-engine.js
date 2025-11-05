// Улучшенный движок для 3D кубиков с физикой
class DiceEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.diceObjects = [];
        this.isRolling = false;
        this.resultCallback = null;
        this.container = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        
        // Цвета для разных типов кубиков
        this.diceColors = {
            d4: 0xFF6B6B,
            d6: 0x4ECDC4,
            d8: 0x45B7D1,
            d10: 0x96CEB4,
            d12: 0xFECA57,
            d20: 0xFF9FF3,
            d100: 0x54A0FF
        };

        this.textures = {};
        this.init();
    }

    async init() {
        // Инициализация будет вызвана при первом использовании
        console.log('DiceEngine initialized');
    }

    async init3D(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Dice container not found');
            return false;
        }

        try {
            this.setupScene();
            this.setupLighting();
            this.createDiceMaterials();
            this.createDiceTable();
            this.animate();
            console.log('3D Dice Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize 3D engine:', error);
            return false;
        }
    }

    setupScene() {
        // Сцена
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Камера
        this.camera = new THREE.PerspectiveCamera(
            60, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, 0);

        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Обработчик ресайза
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light for effects
        const pointLight = new THREE.PointLight(0x4ECDC4, 0.3, 50);
        pointLight.position.set(0, 8, 0);
        this.scene.add(pointLight);
    }

    createDiceMaterials() {
        // Создаем материалы для кубиков
        this.materials = {
            d6: this.createD6Materials(),
            default: new THREE.MeshPhongMaterial({ color: 0xffffff })
        };
    }

    createD6Materials() {
        const materials = [];
        const faceColors = [
            0xFF6B6B, // Красный
            0x4ECDC4, // Бирюзовый
            0x45B7D1, // Голубой
            0x96CEB4, // Зеленый
            0xFECA57, // Желтый
            0xFF9FF3  // Розовый
        ];

        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 256;

            // Фон
            context.fillStyle = `#${faceColors[i].toString(16).padStart(6, '0')}`;
            context.fillRect(0, 0, 256, 256);

            // Граница
            context.strokeStyle = '#ffffff';
            context.lineWidth = 8;
            context.strokeRect(8, 8, 240, 240);

            // Точки
            this.drawDiceDots(context, i + 1, 256);

            const texture = new THREE.CanvasTexture(canvas);
            materials.push(new THREE.MeshPhongMaterial({ map: texture }));
        }

        return materials;
    }

    drawDiceDots(context, number, size) {
        const dotColor = '#ffffff';
        const dotRadius = size * 0.08;
        const center = size / 2;
        const offset = size * 0.25;
        
        context.fillStyle = dotColor;
        
        switch(number) {
            case 1:
                this.drawDot(context, center, center, dotRadius);
                break;
            case 2:
                this.drawDot(context, center - offset, center - offset, dotRadius);
                this.drawDot(context, center + offset, center + offset, dotRadius);
                break;
            case 3:
                this.drawDot(context, center - offset, center - offset, dotRadius);
                this.drawDot(context, center, center, dotRadius);
                this.drawDot(context, center + offset, center + offset, dotRadius);
                break;
            case 4:
                this.drawDot(context, center - offset, center - offset, dotRadius);
                this.drawDot(context, center + offset, center - offset, dotRadius);
                this.drawDot(context, center - offset, center + offset, dotRadius);
                this.drawDot(context, center + offset, center + offset, dotRadius);
                break;
            case 5:
                this.drawDot(context, center - offset, center - offset, dotRadius);
                this.drawDot(context, center + offset, center - offset, dotRadius);
                this.drawDot(context, center, center, dotRadius);
                this.drawDot(context, center - offset, center + offset, dotRadius);
                this.drawDot(context, center + offset, center + offset, dotRadius);
                break;
            case 6:
                this.drawDot(context, center - offset, center - offset, dotRadius);
                this.drawDot(context, center + offset, center - offset, dotRadius);
                this.drawDot(context, center - offset, center, dotRadius);
                this.drawDot(context, center + offset, center, dotRadius);
                this.drawDot(context, center - offset, center + offset, dotRadius);
                this.drawDot(context, center + offset, center + offset, dotRadius);
                break;
        }
    }

    drawDot(context, x, y, radius) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }

    createDiceTable() {
        // Стол
        const tableGeometry = new THREE.PlaneGeometry(20, 15);
        const tableMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2c3e50,
            shininess: 30
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.rotation.x = -Math.PI / 2;
        table.position.y = -2;
        table.receiveShadow = true;
        this.scene.add(table);

        // Борта стола
        this.createTableBorder();
    }

    createTableBorder() {
        const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e });
        
        const borders = [
            { size: [20, 1, 0.5], position: [0, -1.5, -7.5] },
            { size: [20, 1, 0.5], position: [0, -1.5, 7.5] },
            { size: [0.5, 1, 15], position: [-10, -1.5, 0] },
            { size: [0.5, 1, 15], position: [10, -1.5, 0] }
        ];

        borders.forEach(border => {
            const geometry = new THREE.BoxGeometry(...border.size);
            const mesh = new THREE.Mesh(geometry, borderMaterial);
            mesh.position.set(...border.position);
            mesh.castShadow = true;
            this.scene.add(mesh);
        });
    }

    createDice(sides) {
        let geometry, materials;

        switch(sides) {
            case 4:
                geometry = new THREE.TetrahedronGeometry(1.2);
                materials = [new THREE.MeshPhongMaterial({ color: this.diceColors.d4 })];
                break;
            case 6:
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                materials = this.materials.d6;
                break;
            case 8:
                geometry = new THREE.OctahedronGeometry(1.3);
                materials = [new THREE.MeshPhongMaterial({ color: this.diceColors.d8 })];
                break;
            case 10:
                geometry = new THREE.DodecahedronGeometry(1.2);
                materials = [new THREE.MeshPhongMaterial({ color: this.diceColors.d10 })];
                break;
            case 12:
                geometry = new THREE.DodecahedronGeometry(1.4);
                materials = [new THREE.MeshPhongMaterial({ color: this.diceColors.d12 })];
                break;
            case 20:
                geometry = new THREE.IcosahedronGeometry(1.5);
                materials = [new THREE.MeshPhongMaterial({ color: this.diceColors.d20 })];
                break;
            case 100:
                geometry = new THREE.SphereGeometry(1.3, 16, 16);
                materials = [new THREE.MeshPhongMaterial({ color: this.diceColors.d100 })];
                break;
            default:
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                materials = [new THREE.MeshPhongMaterial({ color: 0xffffff })];
        }

        const diceMesh = new THREE.Mesh(geometry, materials);
        diceMesh.castShadow = true;
        diceMesh.receiveShadow = true;
        diceMesh.userData = { 
            sides: sides,
            velocity: new THREE.Vector3(),
            angularVelocity: new THREE.Vector3(),
            settled: false
        };

        return diceMesh;
    }

    async rollDice(sides, count = 1, modifier = 0) {
        if (this.isRolling) return;
        
        // Инициализируем 3D если еще не инициализировано
        if (!this.scene) {
            const success = await this.init3D('dice-result');
            if (!success) {
                console.error('3D initialization failed, falling back to numeric');
                this.fallbackRoll(sides, count, modifier);
                return;
            }
        }

        this.isRolling = true;
        this.clearDice();

        const results = [];
        const diceMeshes = [];

        // Создаем кубики
        for (let i = 0; i < count; i++) {
            const diceMesh = this.createDice(sides);
            
            // Начальная позиция (разбрасываем кубики)
            const startX = (Math.random() - 0.5) * 4;
            const startZ = (Math.random() - 0.5) * 3;
            
            diceMesh.position.set(startX, 5 + i * 0.5, startZ);
            
            // Случайное начальное вращение
            diceMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Начальная скорость и вращение
            diceMesh.userData.velocity.set(
                (Math.random() - 0.5) * 0.3,
                -0.05 - Math.random() * 0.1,
                (Math.random() - 0.5) * 0.3
            );
            
            diceMesh.userData.angularVelocity.set(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            diceMesh.userData.bounces = 0;
            diceMesh.userData.settled = false;

            this.scene.add(diceMesh);
            diceMeshes.push(diceMesh);
        }

        this.diceObjects = diceMeshes;

        // Запускаем анимацию броска
        await this.animateDiceRoll();

        // Определяем результаты (упрощенно)
        for (const dice of this.diceObjects) {
            const result = Math.floor(Math.random() * sides) + 1;
            results.push(result);
        }

        this.isRolling = false;
        
        // Вызываем колбэк с результатами
        if (this.resultCallback) {
            const total = results.reduce((sum, val) => sum + val, 0) + modifier;
            this.resultCallback(results, total, sides, count, modifier);
        }

        return results;
    }

    animateDiceRoll() {
        return new Promise((resolve) => {
            const rollDuration = 3000;
            const startTime = Date.now();
            
            const animateFrame = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / rollDuration, 1);
                
                let allSettled = true;
                
                for (const dice of this.diceObjects) {
                    if (dice.userData.settled) continue;
                    
                    allSettled = false;
                    
                    // Применяем физику
                    dice.position.add(dice.userData.velocity);
                    dice.rotation.x += dice.userData.angularVelocity.x;
                    dice.rotation.y += dice.userData.angularVelocity.y;
                    dice.rotation.z += dice.userData.angularVelocity.z;
                    
                    // Гравитация
                    dice.userData.velocity.y -= 0.01;
                    
                    // Столкновение со столом
                    if (dice.position.y <= -1.75 + this.getDiceRadius(dice)) {
                        dice.position.y = -1.75 + this.getDiceRadius(dice);
                        dice.userData.velocity.y *= -0.6;
                        dice.userData.velocity.x *= 0.9;
                        dice.userData.velocity.z *= 0.9;
                        dice.userData.bounces++;
                        
                        // Замедление вращения
                        dice.userData.angularVelocity.multiplyScalar(0.9);
                        
                        if (dice.userData.bounces > 3 && 
                            dice.userData.velocity.length() < 0.02) {
                            dice.userData.settled = true;
                        }
                    }
                    
                    // Столкновение с бортами
                    const tableBounds = { x: 9.5, z: 6.5 };
                    
                    if (Math.abs(dice.position.x) > tableBounds.x - this.getDiceRadius(dice)) {
                        dice.position.x = Math.sign(dice.position.x) * (tableBounds.x - this.getDiceRadius(dice));
                        dice.userData.velocity.x *= -0.7;
                    }
                    
                    if (Math.abs(dice.position.z) > tableBounds.z - this.getDiceRadius(dice)) {
                        dice.position.z = Math.sign(dice.position.z) * (tableBounds.z - this.getDiceRadius(dice));
                        dice.userData.velocity.z *= -0.7;
                    }
                }
                
                if (allSettled || progress >= 1) {
                    resolve();
                } else {
                    requestAnimationFrame(animateFrame);
                }
            };
            
            animateFrame();
        });
    }

    getDiceRadius(dice) {
        const sides = dice.userData.sides;
        if (sides === 6) return 0.75;
        if (sides === 4) return 0.8;
        return 1.0;
    }

    fallbackRoll(sides, count, modifier) {
        // Fallback для случая, когда 3D не работает
        const results = Array.from({length: count}, () => 
            Math.floor(Math.random() * sides) + 1
        );
        const total = results.reduce((sum, val) => sum + val, 0) + modifier;
        
        if (this.resultCallback) {
            this.resultCallback(results, total, sides, count, modifier);
        }
        
        return results;
    }

    clearDice() {
        for (const dice of this.diceObjects) {
            this.scene.remove(dice);
        }
        this.diceObjects = [];
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Медленное вращение камеры вокруг сцены
        if (this.camera && !this.isRolling) {
            const time = Date.now() * 0.0005;
            this.camera.position.x = Math.sin(time) * 12;
            this.camera.position.z = Math.cos(time) * 12;
            this.camera.lookAt(0, 0, 0);
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        if (this.camera && this.renderer && this.container) {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    onResult(callback) {
        this.resultCallback = callback;
    }
}

// Глобальный экземпляр движка
let diceEngine = new DiceEngine();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    diceEngine.onResult((results, total, sides, count, modifier) => {
        if (window.app && typeof window.app.showNumericResult === 'function') {
            window.app.showNumericResult(total, sides, count, modifier, results);
        }
        if (window.app && typeof window.app.saveToDiceHistory === 'function') {
            window.app.saveToDiceHistory(results, total, sides, count, modifier);
        }
    });
});
