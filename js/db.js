class DnDDatabase {
    constructor() {
        this.dbName = 'DnDCharacterManager';
        this.version = 2; // Увеличиваем версию для новых изменений
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
                const oldVersion = event.oldVersion;
                
                // Миграция с версии 1 на 2
                if (oldVersion < 2) {
                    // Хранилище для персонажей
                    if (!db.objectStoreNames.contains('characters')) {
                        const characterStore = db.createObjectStore('characters', { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        characterStore.createIndex('name', 'name', { unique: false });
                        characterStore.createIndex('class', 'class', { unique: false });
                        characterStore.createIndex('level', 'level', { unique: false });
                        characterStore.createIndex('userId', 'userId', { unique: false });
                        characterStore.createIndex('cloudId', 'cloudId', { unique: false });
                        characterStore.createIndex('source', 'source', { unique: false });
                    } else {
                        // Обновляем существующее хранилище
                        const transaction = event.target.transaction;
                        const characterStore = transaction.objectStore('characters');
                        
                        // Добавляем новые индексы
                        if (!characterStore.indexNames.contains('userId')) {
                            characterStore.createIndex('userId', 'userId', { unique: false });
                        }
                        if (!characterStore.indexNames.contains('cloudId')) {
                            characterStore.createIndex('cloudId', 'cloudId', { unique: false });
                        }
                        if (!characterStore.indexNames.contains('source')) {
                            characterStore.createIndex('source', 'source', { unique: false });
                        }
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

                    // Хранилище для пользовательских данных
                    if (!db.objectStoreNames.contains('userData')) {
                        const userStore = db.createObjectStore('userData', { 
                            keyPath: 'id'
                        });
                        userStore.createIndex('type', 'type', { unique: false });
                    }
                }
            };
        });
    }

    // Общие методы для работы с любым хранилищем
    async getAll(storeName, indexName = null, indexValue = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (indexName && indexValue !== null) {
                const index = store.index(indexName);
                request = index.getAll(indexValue);
            } else {
                request = store.getAll();
            }

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
    async getCharacters(userId = null) {
        if (userId) {
            return this.getAll('characters', 'userId', userId);
        }
        return this.getAll('characters');
    }

    async getLocalCharacters() {
        return this.getAll('characters', 'source', 'local');
    }

    async getCloudCharacters(userId) {
        return this.getAll('characters', 'userId', userId);
    }

    async addCharacter(character, userId = null) {
        // Базовая структура персонажа с улучшенными полями
        const defaultCharacter = {
            name: 'Новый персонаж',
            race: 'Человек',
            class: 'Воин',
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
                speed: 30,
                hitDice: '1d10',
                deathSaves: {
                    successes: 0,
                    failures: 0
                }
            },
            
            // Навыки
            skills: {},
            
            // Снаряжение
            equipment: [],
            
            // Заклинания
            spells: [],
            
            // Мета-данные
            userId: userId,
            cloudId: null,
            source: userId ? 'cloud' : 'local',
            isSynced: false,
            lastSync: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const characterData = { ...defaultCharacter, ...character };
        
        // Если пользователь авторизован, устанавливаем cloud source
        if (userId) {
            characterData.userId = userId;
            characterData.source = 'cloud';
        }
        
        return this.add('characters', characterData);
    }

    async updateCharacter(character) {
        character.updatedAt = new Date();
        
        // Если это облачный персонаж, помечаем как нуждающийся в синхронизации
        if (character.source === 'cloud') {
            character.isSynced = false;
        }
        
        return this.put('characters', character);
    }

    async deleteCharacter(id) {
        return this.delete('characters', id);
    }

    // Методы для синхронизации с облаком
    async getUnsyncedCharacters(userId) {
        const characters = await this.getCloudCharacters(userId);
        return characters.filter(char => !char.isSynced);
    }

    async markCharacterAsSynced(characterId, cloudId) {
        const character = await this.get('characters', characterId);
        if (character) {
            character.isSynced = true;
            character.cloudId = cloudId;
            character.lastSync = new Date();
            return this.updateCharacter(character);
        }
    }

    async importCloudCharacters(cloudCharacters, userId) {
        const results = [];
        
        for (const cloudChar of cloudCharacters) {
            // Проверяем, существует ли уже этот персонаж локально
            const existingChar = await this.findCharacterByCloudId(cloudChar.id);
            
            if (existingChar) {
                // Обновляем существующего персонажа
                const updatedChar = {
                    ...existingChar,
                    ...cloudChar,
                    cloudId: cloudChar.id,
                    isSynced: true,
                    lastSync: new Date(),
                    updatedAt: new Date()
                };
                results.push(await this.updateCharacter(updatedChar));
            } else {
                // Создаем нового персонажа
                const newChar = {
                    ...cloudChar,
                    cloudId: cloudChar.id,
                    userId: userId,
                    source: 'cloud',
                    isSynced: true,
                    lastSync: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                // Удаляем id из облачных данных, чтобы IndexedDB создал свой
                delete newChar.id;
                results.push(await this.addCharacter(newChar, userId));
            }
        }
        
        return results;
    }

    async findCharacterByCloudId(cloudId) {
        const characters = await this.getAll('characters', 'cloudId', cloudId);
        return characters.length > 0 ? characters[0] : null;
    }

    // Методы для пользовательских данных
    async getUserSettings(userId) {
        return this.get('userData', `settings_${userId}`);
    }

    async saveUserSettings(userId, settings) {
        const userSettings = {
            id: `settings_${userId}`,
            type: 'settings',
            userId: userId,
            data: settings,
            updatedAt: new Date()
        };
        return this.put('userData', userSettings);
    }

    async getLastSession(userId) {
        return this.get('userData', `session_${userId}`);
    }

    async saveLastSession(userId, sessionData) {
        const session = {
            id: `session_${userId}`,
            type: 'session',
            userId: userId,
            data: sessionData,
            updatedAt: new Date()
        };
        return this.put('userData', session);
    }

    // Методы для заклинаний
    async getSpells() {
        return this.getAll('spells');
    }

    async addSpell(spell) {
        return this.add('spells', spell);
    }

    async saveSpells(spells) {
        // Очищаем существующие заклинания
        const transaction = this.db.transaction(['spells'], 'readwrite');
        const store = transaction.objectStore('spells');
        await store.clear();

        // Сохраняем новые заклинания
        const results = [];
        for (const spell of spells) {
            results.push(await this.addSpell(spell));
        }
        return results;
    }

    // Методы для инвентаря
    async getInventory(characterId) {
        const allItems = await this.getAll('inventory');
        return allItems.filter(item => item.characterId === characterId);
    }

    async addInventoryItem(item) {
        return this.add('inventory', item);
    }

    async updateInventoryItem(item) {
        return this.put('inventory', item);
    }

    async deleteInventoryItem(id) {
        return this.delete('inventory', id);
    }

    // Методы для очистки данных
    async clearLocalData() {
        // Очищаем только локальные данные (не облачные)
        const characters = await this.getLocalCharacters();
        for (const char of characters) {
            await this.deleteCharacter(char.id);
        }
    }

    async clearAllUserData(userId) {
        // Очищаем все данные пользователя
        const userCharacters = await this.getCloudCharacters(userId);
        for (const char of userCharacters) {
            await this.deleteCharacter(char.id);
        }
        
        // Очищаем пользовательские настройки
        await this.delete('userData', `settings_${userId}`);
        await this.delete('userData', `session_${userId}`);
    }

    // Утилиты для миграции данных
    async migrateLocalToCloud(userId) {
        const localCharacters = await this.getLocalCharacters();
        const results = [];
        
        for (const localChar of localCharacters) {
            // Конвертируем локального персонажа в облачного
            const cloudChar = {
                ...localChar,
                userId: userId,
                source: 'cloud',
                isSynced: false,
                cloudId: null
            };
            
            // Обновляем персонажа в базе
            results.push(await this.updateCharacter(cloudChar));
        }
        
        return results;
    }
}

// Создаем глобальный экземпляр базы данных
const database = new DnDDatabase();
