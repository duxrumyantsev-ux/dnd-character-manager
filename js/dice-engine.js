// Упрощенный и оптимизированный движок для 3D кубиков
class DiceEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.diceObjects = [];
        this.isRolling = false;
        this.resultCallback = null;
        this.container = null;
        
        // Цвета для разных типов кубиков
        this.diceColors = {
            d4: 0xFF6B6B,    // Красный
            d6: 0x4ECDC4,    // Бирюзовый
            d8: 0x45B7D1,    // Голубой
            d10: 0x96CEB4,   // Зеленый
            d12: 0xFECA57,   // Желтый
            d20: 0xFF9FF3,   // Розовый
            d100: 0x54A0FF   // Синий
        };

        // Текстуры для кубиков (создаем программно)
        this.textures = {};
    }

    // Инициализация движка
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.setupScene();
        this.setupLighting();
        this.createTextures();
        this.animate();
        
        console.log('DiceEngine initialized in simple mode');
    }

    // Настройка Three.js сцены
    setupScene() {
        // Сцена
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Камера
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 8);
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

    // Создание текстур для кубиков
    createTextures() {
        // Создаем простые текстуры с цифрами для d6
        this.createD6Textures();
    }

    createD6Textures() {
        const faces = [1, 2, 3, 4, 5, 6];
        this.textures.d6 = [];
        
        faces.forEach((number, index) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 128;
            
            // Фон
            context.fillStyle = '#2c3e50';
            context.fillRect(0, 0, 128, 128);
            
            // Граница
            context.strokeStyle = '#ecf0f1';
            context.lineWidth = 4;
            context.strokeRect(4, 4, 120, 120);
            
            // Точки для граней (как на настоящем кубике)
            this.drawDiceDots(context, number, 128);
            
            const texture = new THREE.CanvasTexture(canvas);
            this.textures.d6.push(texture);
        });
    }

    // Рисуем точки на гранях кубика
    drawDiceDots(context, number, size) {
        const dotColor = '#ecf0f1';
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

    // Освещение
    setupLighting() {
        // Основной свет
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Направленный свет
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 3);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Точечный свет для эффектов
        const pointLight = new THREE.PointLight(0x4ECDC4, 0.3, 50);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }

    // Создание игрового стола
    createDiceTable() {
        // Текстура стола
        const tableGeometry = new THREE.PlaneGeometry(15, 10);
        const tableMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2c3e50,
            shininess: 10
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.rotation.x = -Math.PI / 2;
        table.position.y = -2;
        table.receiveShadow = true;
        this.scene.add(table);

        // Борта стола (простая рамка)
        this.createTableBorder();
    }

    createTableBorder() {
        const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e });
        
        // Боковые борта
        const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 0.5), borderMaterial);
        leftBorder.position.set(0, -1.5, -5);
        this.scene.add(leftBorder);
        
        const rightBorder = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 0.5), borderMaterial);
        rightBorder.position.set(0, -1.5, 5);
        this.scene.add(rightBorder);
        
        const topBorder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 10), borderMaterial);
        topBorder.position.set(-7.5, -1.5, 0);
        this.scene.add(topBorder);
        
        const bottomBorder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 10), borderMaterial);
        bottomBorder.position.set(7.5, -1.5, 0);
        this.scene.add(bottomBorder);
    }

    // Создание 3D кубика
    createDice(sides) {
        let geometry, materials = [];
        
        switch(sides) {
            case 4:
                geometry = new THREE.TetrahedronGeometry(1.2);
                materials = [new THREE.MeshPhongMaterial({ color: this.diceColors.d4 })];
                break;
            case 6:
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                // Используем текстуры для d6
                materials = this.textures.d6.map(texture => 
                    new THREE.MeshPhongMaterial({ map: texture })
                );
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

        const diceMesh = new THREE.Mesh(geometry, materials.length > 1 ? materials : materials[0]);
        diceMesh.castShadow = true;
        diceMesh.receiveShadow = true;
        diceMesh.userData = { sides: sides };

        return diceMesh;
    }

    // Бросок кубиков с анимацией
    async rollDice(sides, count = 1, modifier = 0) {
        if (this.isRolling) return;
        
        this.isRolling = true;
        this.clearDice();

        // Создаем стол если его нет
        if (this.scene.children.length <= 3) { // lights + camera
            this.createDiceTable();
        }

        const results = [];
        const diceMeshes = [];

        // Создаем кубики
        for (let i = 0; i < count; i++) {
            const diceMesh = this.createDice(sides);
            
            // Начальная позиция над столом
            const startX = (Math.random() - 0.5) * 3;
            const startZ = (Math.random() - 0.5) * 2;
            
            diceMesh.position.set(startX, 3 + i * 0.3, startZ);
            
            // Случайное начальное вращение
            diceMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Добавляем физические свойства для анимации
            diceMesh.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                -0.1 - Math.random() * 0.1,
                (Math.random() - 0.5) * 0.2
            );
            
            diceMesh.userData.angularVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            
            diceMesh.userData.bounces = 0;
            diceMesh.userData.settled = false;

            this.scene.add(diceMesh);
            diceMeshes.push(diceMesh);
        }

        this.diceObjects = diceMeshes;

        // Запускаем анимацию броска
        await this.animateDiceRoll();

        // Определяем результаты
        for (const dice of this.diceObjects) {
            const result = this.calculateDiceResult(dice);
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

    // Анимация броска
    animateDiceRoll() {
        return new Promise((resolve) => {
            const rollDuration = 3000; // 3 секунды анимации
            const startTime = Date.now();
            
            const animate = () => {
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
                    
                    // Столкновение со столом (y = -1.75 для стола)
                    if (dice.position.y <= -1.75 + this.getDiceRadius(dice)) {
                        dice.position.y = -1.75 + this.getDiceRadius(dice);
                        dice.userData.velocity.y *= -0.6; // Отскок
                        dice.userData.bounces++;
                        
                        // Замедление при отскоках
                        dice.userData.velocity.multiplyScalar(0.95);
                        dice.userData.angularVelocity.multiplyScalar(0.9);
                        
                        // Если кубик почти остановился, помечаем как у settled
                        if (dice.userData.bounces > 2 && 
                            dice.userData.velocity.length() < 0.02 &&
                            dice.userData.angularVelocity.length() < 0.02) {
                            dice.userData.settled = true;
                        }
                    }
                    
                    // Столкновение с бортами
                    const tableHalfWidth = 7;
                    const tableHalfDepth = 5;
                    
                    if (Math.abs(dice.position.x) > tableHalfWidth - this.getDiceRadius(dice)) {
                        dice.position.x = Math.sign(dice.position.x) * (tableHalfWidth - this.getDiceRadius(dice));
                        dice.userData.velocity.x *= -0.7;
                    }
                    
                    if (Math.abs(dice.position.z) > tableHalfDepth - this.getDiceRadius(dice)) {
                        dice.position.z = Math.sign(dice.position.z) * (tableHalfDepth - this.getDiceRadius(dice));
                        dice.userData.velocity.z *= -0.7;
                    }
                }
                
                // Если все кубики успокоились или время вышло
                if (allSettled || progress >= 1) {
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    // Получить радиус кубика для столкновений
    getDiceRadius(dice) {
        const sides = dice.userData.sides;
        if (sides === 6) return 0.75; // d6
        if (sides === 4) return 0.8;  // d4
        return 1.0; // остальные
    }

    // Определение результата броска (упрощенное)
    calculateDiceResult(diceMesh) {
        const sides = diceMesh.userData.sides;
        
        // Для упрощения используем случайное число
        // В реальной реализации нужно определять по ориентации кубика
        return Math.floor(Math.random() * sides) + 1;
    }

    // Очистка кубиков
    clearDice() {
        for (const dice of this.diceObjects) {
            this.scene.remove(dice);
        }
        this.diceObjects = [];
    }

    // Основная анимация
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    // Обработчик изменения размера окна
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    // Установка колбэка для результатов
    onResult(callback) {
        this.resultCallback = callback;
    }
}

// Глобальный экземпляр движка
let diceEngine;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const diceContainer = document.getElementById('dice-result');
        if (diceContainer) {
            diceEngine = new DiceEngine();
            diceEngine.init('dice-result');
            
            diceEngine.onResult((results, total, sides, count, modifier) => {
                if (window.app && typeof window.app.showNumericResult === 'function') {
                    window.app.showNumericResult(total, sides, count, modifier, results);
                }
                if (window.app && typeof window.app.saveToDiceHistory === 'function') {
                    window.app.saveToDiceHistory(results, total, sides, count, modifier);
                }
            });
        }
    }, 500);
});
