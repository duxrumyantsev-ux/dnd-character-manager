class DnDDatabase {
    constructor() {
        this.dbName = 'DnDCharacterManager';
        this.version = 1;
        this.db = null;
    }

    // Инициализация базы данных
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Хранилище для персонажей
                if (!db.objectStoreNames.contains('characters')) {
                    const characterStore = db.createObjectStore('characters', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    characterStore.createIndex('name', 'name', { unique: false });
                    characterStore.createIndex('class', 'class', { unique: false });
                    characterStore.createIndex('level', 'level', { unique: false });
                }

                // Хранилище для заклинаний
                if (!db.objectStoreNames.contains('spells')) {
                    const spellStore = db.createObjectStore('spells', { 
                        keyPath: 'id' 
                    });
                    spellStore.createIndex('name', 'name', { unique: true });
                    spellStore.createIndex('level', 'level', { unique: false });
                    spellStore.createIndex('class', 'class', { unique: false });
                }

                // Хранилище для инвентаря
                if (!db.objectStoreNames.contains('inventory')) {
                    const inventoryStore = db.createObjectStore('inventory', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    inventoryStore.createIndex('characterId', 'characterId', { unique: false });
                    inventoryStore.createIndex('type', 'type', { unique: false });
                }

                // Хранилище для боевых ситуаций
                if (!db.objectStoreNames.contains('combat')) {
                    const combatStore = db.createObjectStore('combat', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    combatStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }

    // Общие методы для работы с любым хранилищем
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Специфические методы для персонажей
    async getCharacters() {
        return this.getAll('characters');
    }

    async addCharacter(character) {
        // Базовая структура персонажа
        // В методе addCharacter обновляем структуру по умолчанию:
const defaultCharacter = {
    name: 'Новый персонаж',
    race: 'Человек',
    gender: '',
    level: 1,
    avatar: null,
    background: '',
    alignment: 'Нейтральный',
    experience: 0,
    
    // Характеристики
    abilities: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
    },
    
    // Боевые параметры
    combat: {
        maxHP: 10,
        currentHP: 10,
        temporaryHP: 0,
        armorClass: 10,
        initiative: 0,
        speed: 30
    },
    
    // Навыки
    skills: {},
    
    // Снаряжение
    equipment: [],
    
    // Заклинания
    spells: [],
    
    createdAt: new Date(),
    updatedAt: new Date()
};

        const characterData = { ...defaultCharacter, ...character };
        return this.add('characters', characterData);
    }

    async updateCharacter(character) {
        character.updatedAt = new Date();
        return this.put('characters', character);
    }

    async deleteCharacter(id) {
        return this.delete('characters', id);
    }

    // Методы для заклинаний
    async getSpells() {
        return this.getAll('spells');
    }

    async addSpell(spell) {
        return this.add('spells', spell);
    }

    // Методы для инвентаря
    async getInventory(characterId) {
        const allItems = await this.getAll('inventory');
        return allItems.filter(item => item.characterId === characterId);
    }

    async addInventoryItem(item) {
        return this.add('inventory', item);
    }
}

// Создаем глобальный экземпляр базы данных
const database = new DnDDatabase();