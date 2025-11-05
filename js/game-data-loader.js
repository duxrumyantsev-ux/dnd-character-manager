class GameDataLoader {
    constructor() {
        this.races = [];
        this.classes = [];
        this.backgrounds = [];
        this.feats = [];
        this.weapons = [];
        this.armor = [];
        this.tools = [];
        this.languages = [];
    }

    // Загрузка из Firestore
    async loadFromFirestore() {
        if (!authManager.isInitialized) {
            console.log('Firebase not initialized');
            return false;
        }

        try {
            const collections = ['races', 'classes', 'backgrounds', 'feats', 'weapons', 'armor', 'tools', 'languages'];
            
            for (const collection of collections) {
                const snapshot = await authManager.db.collection(collection).get();
                this[collection] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`Loaded ${this[collection].length} ${collection} from Firestore`);
            }
            
            return true;
        } catch (error) {
            console.error('Error loading game data from Firestore:', error);
            return false;
        }
    }

    // Загрузка из JSON
    async loadFromJSON() {
        try {
            const collections = ['races', 'classes', 'backgrounds', 'feats', 'weapons', 'armor', 'tools', 'languages'];
            
            for (const collection of collections) {
                try {
                    const response = await fetch(`/data/${collection}.json`);
                    if (response.ok) {
                        const data = await response.json();
                        this[collection] = data;
                        console.log(`Loaded ${this[collection].length} ${collection} from JSON`);
                    }
                } catch (error) {
                    console.warn(`Could not load ${collection}.json:`, error);
                    this[collection] = [];
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error loading game data from JSON:', error);
            return false;
        }
    }

    // Загрузка в Firestore (для первоначального наполнения)
    async uploadToFirestore() {
        if (!authManager.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const collections = ['races', 'classes', 'backgrounds', 'feats', 'weapons', 'armor', 'tools', 'languages'];
            
            for (const collection of collections) {
                try {
                    const response = await fetch(`/data/${collection}.json`);
                    if (!response.ok) continue;
                    
                    const data = await response.json();
                    const batch = authManager.db.batch();

                    data.forEach(item => {
                        const docRef = authManager.db.collection(collection).doc(item.id);
                        batch.set(docRef, item);
                    });

                    await batch.commit();
                    console.log(`Uploaded ${data.length} ${collection} to Firestore`);
                } catch (error) {
                    console.warn(`Could not upload ${collection}:`, error);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error uploading game data to Firestore:', error);
            return false;
        }
    }

    // Методы для получения данных
    getRaceById(id) {
        return this.races.find(race => race.id === id);
    }

    getClassById(id) {
        return this.classes.find(cls => cls.id === id);
    }

    getSubclassesForClass(classId) {
        const cls = this.getClassById(classId);
        return cls ? cls.subclasses || [] : [];
    }

    getAvailableSubclasses(character) {
        const classData = this.getClassById(character.classId);
        if (!classData) return [];
        
        const subclasses = classData.subclasses || [];
        return subclasses.filter(subclass => {
            return subclass.availableAt <= character.level;
        });
    }

    getBackgroundById(id) {
        return this.backgrounds.find(background => background.id === id);
    }

    getWeaponById(id) {
        return this.weapons.find(weapon => weapon.id === id);
    }

    getArmorById(id) {
        return this.armor.find(armor => armor.id === id);
    }

    getToolById(id) {
        return this.tools.find(tool => tool.id === id);
    }

    getLanguageById(id) {
        return this.languages.find(language => language.id === id);
    }

    // Получение всех данных для фильтров
    getAvailableRaces() {
        return this.races.sort((a, b) => a.name.localeCompare(b.name));
    }

    getAvailableClasses() {
        return this.classes.sort((a, b) => a.name.localeCompare(b.name));
    }

    getAvailableBackgrounds() {
        return this.backgrounds.sort((a, b) => a.name.localeCompare(b.name));
    }

    getAvailableLanguages() {
        return this.languages.sort((a, b) => a.name.localeCompare(b.name));
    }

    getAvailableTools() {
        return this.tools.sort((a, b) => a.name.localeCompare(b.name));
    }
}

// Глобальный экземпляр загрузчика игровых данных
const gameDataLoader = new GameDataLoader();
