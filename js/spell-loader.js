class SpellLoader {
    constructor() {
        this.spells = [];
    }

    // Загрузка заклинаний из JSON файла
    async loadFromJSON() {
        try {
            const response = await fetch('./data/spells.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.spells = data.spells || [];
            console.log(`Loaded ${this.spells.length} spells from JSON`);
            return this.spells;
        } catch (error) {
            console.error('Error loading spells from JSON:', error);
            // Возвращаем тестовые заклинания если файл не найден
            this.spells = this.getDefaultSpells();
            return this.spells;
        }
    }

    // Загрузка заклинаний из Firestore
    async loadFromFirestore() {
        if (!authManager.isInitialized || !authManager.db) {
            console.log('Firebase not initialized, using local spells');
            return this.loadFromJSON();
        }

        try {
            const snapshot = await authManager.db.collection('spells').get();
            const spells = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`Loaded ${spells.length} spells from Firestore`);
            this.spells = spells;
            return spells;
        } catch (error) {
            console.error('Error loading spells from Firestore:', error);
            return this.loadFromJSON();
        }
    }

    // Загрузка заклинаний в Firestore (для первоначального наполнения)
    async uploadToFirestore() {
        if (!authManager.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const spells = await this.loadFromJSON();
            const batch = authManager.db.batch();

            spells.forEach(spell => {
                const spellRef = authManager.db.collection('spells').doc(spell.id);
                batch.set(spellRef, spell);
            });

            await batch.commit();
            console.log(`Successfully uploaded ${spells.length} spells to Firestore`);
            return true;
        } catch (error) {
            console.error('Error uploading spells to Firestore:', error);
            return false;
        }
    }

    // Получение заклинаний с фильтрацией
    getSpells(filters = {}) {
        let filteredSpells = [...this.spells];

        if (filters.level !== undefined && filters.level !== 'all') {
            filteredSpells = filteredSpells.filter(spell => spell.level === parseInt(filters.level));
        }

        if (filters.class && filters.class !== 'all') {
            filteredSpells = filteredSpells.filter(spell => 
                spell.classes.includes(filters.class)
            );
        }

        if (filters.school && filters.school !== 'all') {
            filteredSpells = filteredSpells.filter(spell => 
                spell.school === filters.school
            );
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredSpells = filteredSpells.filter(spell => 
                spell.name.toLowerCase().includes(searchTerm) ||
                (spell.description && spell.description.toLowerCase().includes(searchTerm))
            );
        }

        return filteredSpells;
    }

    // Получение заклинания по ID
    getSpellById(id) {
        return this.spells.find(spell => spell.id === id);
    }

    // Получение всех классов, которые есть в заклинаниях
    getAvailableClasses() {
        const classes = new Set();
        this.spells.forEach(spell => {
            spell.classes.forEach(className => classes.add(className));
        });
        return Array.from(classes).sort();
    }

    // Запасные заклинания если файл не найден
    getDefaultSpells() {
        return [
            {
                "id": "fireball",
                "name": "Огненный шар",
                "level": 3,
                "school": "Вызов",
                "classes": ["Волшебник", "Чародей", "Колдун"],
                "castingTime": "1 действие",
                "range": "150 футов",
                "components": ["V", "S", "M"],
                "material": "Крошечный шарик из гуано и серы",
                "duration": "Мгновенная",
                "description": "Яркая вспышка вырывается из вашего пальца, чтобы превратиться в шар пламени с громким ревом. Все существа в сфере радиусом 20 футов должны совершить спасбросок Ловкости.",
                "atHigherLevels": "Если вы накладываете это заклинание, используя ячейку 4 уровня или выше, урон увеличивается на 1к6 за каждый уровень ячейки выше третьего.",
                "concentration": false,
                "ritual": false
            },
            {
                "id": "magic-missile",
                "name": "Волшебная стрела",
                "level": 1,
                "school": "Вызов",
                "classes": ["Волшебник", "Чародей"],
                "castingTime": "1 действие",
                "range": "120 футов",
                "components": ["V", "S"],
                "duration": "Мгновенная",
                "description": "Вы создаете три сверкающие стрелы магии. Каждая стрела поражает одно существо по вашему выбору, которое вы можете видеть в пределах дистанции.",
                "atHigherLevels": "Если вы накладываете это заклинание, используя ячейку 2 уровня или выше, вы создаете одну дополнительную стрелу за каждый уровень ячейки выше первого.",
                "concentration": false,
                "ritual": false
            }
        ];
    }
}

// Глобальный экземпляр загрузчика заклинаний
const spellLoader = new SpellLoader();
