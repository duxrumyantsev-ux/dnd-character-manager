// Продвинутый движок для 3D кубиков с физикой
class DiceEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.diceObjects = [];
        this.isRolling = false;
        this.resultCallback = null;
        this.container = null;
        
        // Текстуры для разных кубиков
        this.diceMaterials = {
            d4: 0xFF6B6B,
            d6: 0x4ECDC4,
            d8: 0x45B7D1,
            d10: 0x96CEB4,
            d12: 0xFECA57,
            d20: 0xFF9FF3,
            d100: 0x54A0FF
        };
    }

    // Инициализация движка
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.setupScene();
        this.setupPhysics();
        this.setupLighting();
        this.createDiceTable();
        this.animate();
    }

    // Настройка Three.js сцены
    setupScene() {
        // Сцена
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Камера
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, 0);

        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Обработчик ресайза
        window.addEventListener('resize', () => this.onWindowResize());
    }

    // Настройка физики Cannon.js
    setupPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -30, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 16;
    }

    // Освещение
    setupLighting() {
        // Основной свет
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Направленный свет
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Точечный свет для эффектов
        const pointLight = new THREE.PointLight(0x4ECDC4, 0.5, 100);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
    }

    // Создание игрового стола
    createDiceTable() {
        // Стол
        const tableGeometry = new THREE.BoxGeometry(12, 0.5, 8);
        const tableMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2c3e50,
            shininess: 30 
        });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.y = -2;
        table.receiveShadow = true;
        this.scene.add(table);

        // Физика стола
        const tableShape = new CANNON.Box(new CANNON.Vec3(6, 0.25, 4));
        const tableBody = new CANNON.Body({ mass: 0 });
        tableBody.addShape(tableShape);
        tableBody.position.set(0, -2, 0);
        this.world.addBody(tableBody);

        // Борта стола
        this.createTableWalls();
    }

    // Создание бортиков стола
    createTableWalls() {
        const wallThickness = 0.5;
        const wallHeight = 1;
        
        // Передняя стенка
        this.createWall(0, -1.5, -4, 12, wallHeight, wallThickness);
        // Задняя стенка
        this.createWall(0, -1.5, 4, 12, wallHeight, wallThickness);
        // Левая стенка
        this.createWall(-6, -1.5, 0, wallThickness, wallHeight, 8);
        // Правая стенка
        this.createWall(6, -1.5, 0, wallThickness, wallHeight, 8);
    }

    createWall(x, y, z, width, height, depth) {
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(x, y, z);
        wall.receiveShadow = true;
        wall.castShadow = true;
        this.scene.add(wall);

        const wallShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const wallBody = new CANNON.Body({ mass: 0 });
        wallBody.addShape(wallShape);
        wallBody.position.set(x, y, z);
        this.world.addBody(wallBody);
    }

    // Создание 3D кубика
    createDice(sides, color = 0xffffff) {
        let geometry, material, diceMesh;
        
        switch(sides) {
            case 4:
                geometry = new THREE.TetrahedronGeometry(1);
                break;
            case 6:
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                break;
            case 8:
                geometry = new THREE.OctahedronGeometry(1.2);
                break;
            case 10:
                geometry = new THREE.DodecahedronGeometry(1.1);
                break;
            case 12:
                geometry = new THREE.DodecahedronGeometry(1.3);
                break;
            case 20:
                geometry = new THREE.IcosahedronGeometry(1.4);
                break;
            case 100:
                geometry = new THREE.SphereGeometry(1.2, 32, 32);
                break;
            default:
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        }

        material = new THREE.MeshPhongMaterial({ 
            color: this.diceMaterials['d' + sides] || color,
            shininess: 80,
            transparent: true,
            opacity: 0.95
        });

        diceMesh = new THREE.Mesh(geometry, material);
        diceMesh.castShadow = true;
        diceMesh.receiveShadow = true;

        // Добавляем цифры на грани
        this.addNumbersToDice(diceMesh, sides);

        return diceMesh;
    }

    // Добавление цифр на грани кубика
    addNumbersToDice(diceMesh, sides) {
        // Для упрощения добавляем только для d6
        if (sides !== 6) return;

        const numberMaterials = [];
        for (let i = 1; i <= 6; i++) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 64;
            
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, 64, 64);
            
            context.fillStyle = '#2c3e50';
            context.font = 'bold 40px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(i.toString(), 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true
            });
            numberMaterials.push(material);
        }

        // Создаем отдельные меши для каждой грани с цифрами
        const faceGeometry = new THREE.PlaneGeometry(0.8, 0.8);
        const positions = [
            [0, 0, 0.76],   // передняя
            [0, 0, -0.76],  // задняя
            [0.76, 0, 0],   // правая
            [-0.76, 0, 0],  // левая
            [0, 0.76, 0],   // верхняя
            [0, -0.76, 0]   // нижняя
        ];

        const rotations = [
            [0, 0, 0],
            [0, Math.PI, 0],
            [0, Math.PI / 2, 0],
            [0, -Math.PI / 2, 0],
            [-Math.PI / 2, 0, 0],
            [Math.PI / 2, 0, 0]
        ];

        for (let i = 0; i < 6; i++) {
            const numberFace = new THREE.Mesh(faceGeometry, numberMaterials[i]);
            numberFace.position.set(...positions[i]);
            numberFace.rotation.set(...rotations[i]);
            diceMesh.add(numberFace);
        }
    }

    // Бросок кубиков
    async rollDice(sides, count = 1, modifier = 0) {
        if (this.isRolling) return;
        
        this.isRolling = true;
        this.clearDice();

        const results = [];
        const diceMeshes = [];

        // Создаем кубики
        for (let i = 0; i < count; i++) {
            const diceMesh = this.createDice(sides);
            const diceBody = this.createDiceBody(sides);
            
            // Позиционируем кубики над столом
            diceMesh.position.set(
                (Math.random() - 0.5) * 2,
                5 + i * 0.5,
                (Math.random() - 0.5) * 2
            );
            
            diceBody.position.copy(diceMesh.position);
            
            // Применяем случайное вращение и силу
            const force = 10 + Math.random() * 10;
            diceBody.velocity.set(
                (Math.random() - 0.5) * force,
                5 + Math.random() * 5,
                (Math.random() - 0.5) * force
            );
            
            diceBody.angularVelocity.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            this.scene.add(diceMesh);
            this.world.addBody(diceBody);
            
            diceMeshes.push({ mesh: diceMesh, body: diceBody, sides: sides });
        }

        this.diceObjects = diceMeshes;

        // Ждем пока кубики успокоятся
        await this.waitForDiceToSettle();
        
        // Определяем результаты
        for (const dice of this.diceObjects) {
            const result = this.calculateDiceResult(dice.mesh, dice.sides);
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

    // Создание физического тела для кубика
    createDiceBody(sides) {
        let shape;
        
        switch(sides) {
            case 4:
                shape = new CANNON.ConvexPolyhedron([
                    new CANNON.Vec3(1, 1, 1),
                    new CANNON.Vec3(-1, -1, 1),
                    new CANNON.Vec3(-1, 1, -1),
                    new CANNON.Vec3(1, -1, -1)
                ], [[0,1,2], [0,1,3], [0,2,3], [1,2,3]]);
                break;
            case 6:
                shape = new CANNON.Box(new CANNON.Vec3(0.75, 0.75, 0.75));
                break;
            case 8:
                shape = new CANNON.ConvexPolyhedron(this.createOctahedronVertices(), this.createOctahedronFaces());
                break;
            default:
                shape = new CANNON.Sphere(1);
        }

        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            material: new CANNON.Material({ friction: 0.4, restitution: 0.3 })
        });

        return body;
    }

    // Вершины для октаэдра (d8)
    createOctahedronVertices() {
        return [
            new CANNON.Vec3(1, 0, 0),
            new CANNON.Vec3(-1, 0, 0),
            new CANNON.Vec3(0, 1, 0),
            new CANNON.Vec3(0, -1, 0),
            new CANNON.Vec3(0, 0, 1),
            new CANNON.Vec3(0, 0, -1)
        ];
    }

    createOctahedronFaces() {
        return [
            [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
            [1, 2, 5], [1, 5, 3], [1, 3, 4], [1, 4, 2]
        ];
    }

    // Ожидание пока кубики успокоятся
    waitForDiceToSettle() {
        return new Promise((resolve) => {
            const checkStability = () => {
                let allStable = true;
                
                for (const dice of this.diceObjects) {
                    const velocity = dice.body.velocity.length();
                    const angularVelocity = dice.body.angularVelocity.length();
                    
                    if (velocity > 0.1 || angularVelocity > 0.1) {
                        allStable = false;
                        break;
                    }
                }

                if (allStable) {
                    // Добавляем небольшую задержку для уверенности
                    setTimeout(resolve, 500);
                } else {
                    setTimeout(checkStability, 100);
                }
            };

            setTimeout(checkStability, 2000); // Начинаем проверку через 2 секунды
        });
    }

    // Определение результата броска
    calculateDiceResult(diceMesh, sides) {
        // Для упрощения определяем только для d6 по положению в пространстве
        if (sides === 6) {
            const rotation = diceMesh.rotation;
            const euler = new THREE.Euler().setFromQuaternion(diceMesh.quaternion, 'XYZ');
            
            // Определяем какая грань смотрит вверх
            const worldPosition = new THREE.Vector3();
            diceMesh.getWorldPosition(worldPosition);
            
            // Простая эвристика для определения верхней грани
            const up = new THREE.Vector3(0, 1, 0);
            const faces = [
                { normal: new THREE.Vector3(0, 1, 0), value: 6 },   // верх
                { normal: new THREE.Vector3(0, -1, 0), value: 1 },  // низ
                { normal: new THREE.Vector3(1, 0, 0), value: 3 },   // право
                { normal: new THREE.Vector3(-1, 0, 0), value: 4 },  // лево
                { normal: new THREE.Vector3(0, 0, 1), value: 2 },   // перед
                { normal: new THREE.Vector3(0, 0, -1), value: 5 }   // зад
            ];

            let maxDot = -1;
            let result = 1;

            for (const face of faces) {
                const normal = face.normal.clone();
                normal.applyEuler(euler);
                const dot = normal.dot(up);
                
                if (dot > maxDot) {
                    maxDot = dot;
                    result = face.value;
                }
            }

            return result;
        }

        // Для других кубиков - случайное число (в реальной реализации нужна более сложная логика)
        return Math.floor(Math.random() * sides) + 1;
    }

    // Очистка кубиков
    clearDice() {
        for (const dice of this.diceObjects) {
            this.scene.remove(dice.mesh);
            this.world.removeBody(dice.body);
        }
        this.diceObjects = [];
    }

    // Анимация
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Обновляем физику
        this.world.step(1/60);
        
        // Синхронизируем Three.js меши с Cannon.js телами
        for (const dice of this.diceObjects) {
            dice.mesh.position.copy(dice.body.position);
            dice.mesh.quaternion.copy(dice.body.quaternion);
        }
        
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
            
            // Устанавливаем обработчик результатов
            diceEngine.onResult((results, total, sides, count, modifier) => {
                app.showNumericResult(total, sides, count, modifier, results);
                app.saveToDiceHistory(results, total, sides, count, modifier);
            });
        }
    }, 1000);
});