class DnDDatabase {
    constructor() {
        this.dbName = 'DnDCharacterManager';
        this.version = 2; // Увеличиваем версию для обновления
        this.db = null;
    }

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
                
                // Удаляем старую базу если есть и создаем новую
                if (db.objectStoreNames.contains('characters')) {
                    db.deleteObjectStore('characters');
                }
                
                const characterStore = db.createObjectStore('characters', { 
                    keyPath: 'id'
                });
                characterStore.createIndex('name', 'name', { unique: false });
                characterStore.createIndex('class', 'class', { unique: false });
                characterStore.createIndex('level', 'level', { unique: false });
                characterStore.createIndex('source', 'source', { unique: false });
            };
        });
    }

    // Генерация уникального ID
    generateId() {
        return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

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

            request.onsuccess = () => {
                console.log('Successfully deleted from IndexedDB:', id);
                resolve(true);
            };
            request.onerror = () => {
                console.error('Error deleting from IndexedDB:', request.error);
                reject(request.error);
            };
        });
    }

    async getCharacters() {
        return this.getAll('characters');
    }

    async getLocalCharacters() {
        const allCharacters = await this.getCharacters();
        return allCharacters.filter(char => !char.source || char.source === 'local');
    }

    async addCharacter(character) {
        const defaultCharacter = {
            id: this.generateId(),
            name: 'Новый персонаж',
            race: 'Человек',
            gender: '',
            level: 1,
            avatar: null,
            background: '',
            alignment: 'Нейтральный',
            experience: 0,
            abilities: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            combat: {
                maxHP: 10,
                currentHP: 10,
                temporaryHP: 0,
                armorClass: 10,
                initiative: 0,
                speed: 30
            },
            skills: {},
            equipment: [],
            spells: [],
            source: 'local',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const characterData = { ...defaultCharacter, ...character };
        // Если передали свой ID, используем его
        if (character.id) {
            characterData.id = character.id;
        }
        return this.add('characters', characterData);
    }

    async updateCharacter(character) {
        character.updatedAt = new Date();
        return this.put('characters', character);
    }

    async deleteCharacter(id) {
        console.log('Deleting character from database with ID:', id);
        return this.delete('characters', id);
    }
}

const database = new DnDDatabase();
