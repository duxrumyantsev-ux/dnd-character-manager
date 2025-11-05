// Расширенная структура персонажа DnD 5e
class AdvancedCharacter {
    constructor(data) {
        // Основная информация
        this.id = data.id;
        this.name = data.name || '';
        this.race = data.race || '';
        this.raceId = data.raceId || '';
        this.class = data.class || '';
        this.classId = data.classId || '';
        this.subclass = data.subclass || '';
        this.subclassId = data.subclassId || '';
        this.level = data.level || 1;
        this.background = data.background || '';
        this.backgroundId = data.backgroundId || '';
        this.alignment = data.alignment || '';
        this.experience = data.experience || 0;
        this.gender = data.gender || '';
        this.age = data.age || '';
        this.height = data.height || '';
        this.weight = data.weight || '';
        this.appearance = data.appearance || '';
        this.personality = data.personality || '';
        this.ideals = data.ideals || '';
        this.bonds = data.bonds || '';
        this.flaws = data.flaws || '';
        this.avatar = data.avatar || null;
        
        // Характеристики
        this.abilities = data.abilities || {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };
        
        // Боевые параметры
        this.combat = data.combat || {
            maxHP: 10,
            currentHP: 10,
            temporaryHP: 0,
            armorClass: 10,
            initiative: 0,
            speed: 30,
            hitDice: '1d8',
            deathSaves: {
                successes: 0,
                failures: 0
            }
        };
        
        // Навыки
        this.skills = data.skills || this.initializeSkills();
        
        // Спасброски
        this.savingThrows = data.savingThrows || this.initializeSavingThrows();
        
        // Владения
        this.proficiencies = data.proficiencies || {
            armor: [],
            weapons: [],
            tools: [],
            languages: []
        };
        
        // Пассивные навыки
        this.passiveSkills = data.passiveSkills || this.calculatePassiveSkills();
        
        // Особенности
        this.features = data.features || [];
        
        // Снаряжение
        this.equipment = data.equipment || [];
        
        // Магия
        this.spellcasting = data.spellcasting || this.initializeSpellcasting();
        
        // Заклинания
        this.spells = data.spells || [];
        
        // Метаданные
        this.source = data.source || 'local';
        this.userId = data.userId || null;
        this.cloudId = data.cloudId || null;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }
    
    initializeSkills() {
        return {
            acrobatics: { proficient: false, expertise: false },
            animalHandling: { proficient: false, expertise: false },
            arcana: { proficient: false, expertise: false },
            athletics: { proficient: false, expertise: false },
            deception: { proficient: false, expertise: false },
            history: { proficient: false, expertise: false },
            insight: { proficient: false, expertise: false },
            intimidation: { proficient: false, expertise: false },
            investigation: { proficient: false, expertise: false },
            medicine: { proficient: false, expertise: false },
            nature: { proficient: false, expertise: false },
            perception: { proficient: false, expertise: false },
            performance: { proficient: false, expertise: false },
            persuasion: { proficient: false, expertise: false },
            religion: { proficient: false, expertise: false },
            sleightOfHand: { proficient: false, expertise: false },
            stealth: { proficient: false, expertise: false },
            survival: { proficient: false, expertise: false }
        };
    }
    
    initializeSavingThrows() {
        return {
            strength: { proficient: false },
            dexterity: { proficient: false },
            constitution: { proficient: false },
            intelligence: { proficient: false },
            wisdom: { proficient: false },
            charisma: { proficient: false }
        };
    }

    initializeSpellcasting() {
        return {
            ability: '', // intelligence, wisdom, charisma
            spellAttack: 0,
            spellSaveDC: 0,
            slots: {
                1: { total: 0, used: 0 },
                2: { total: 0, used: 0 },
                3: { total: 0, used: 0 },
                4: { total: 0, used: 0 },
                5: { total: 0, used: 0 },
                6: { total: 0, used: 0 },
                7: { total: 0, used: 0 },
                8: { total: 0, used: 0 },
                9: { total: 0, used: 0 }
            }
        };
    }
    
    calculatePassiveSkills() {
        const proficiencyBonus = this.getProficiencyBonus();
        return {
            perception: 10 + this.getAbilityModifier('wisdom') + 
                       (this.skills.perception.proficient ? proficiencyBonus : 0) +
                       (this.skills.perception.expertise ? proficiencyBonus : 0),
            investigation: 10 + this.getAbilityModifier('intelligence') + 
                          (this.skills.investigation.proficient ? proficiencyBonus : 0) +
                          (this.skills.investigation.expertise ? proficiencyBonus : 0),
            insight: 10 + this.getAbilityModifier('wisdom') + 
                     (this.skills.insight.proficient ? proficiencyBonus : 0) +
                     (this.skills.insight.expertise ? proficiencyBonus : 0)
        };
    }
    
    getAbilityModifier(ability) {
        const score = this.abilities[ability];
        return Math.floor((score - 10) / 2);
    }
    
    getProficiencyBonus() {
        return Math.floor((this.level - 1) / 4) + 2;
    }
    
    getSkillModifier(skill) {
        const skillData = this.skills[skill];
        const ability = this.getSkillAbility(skill);
        const abilityModifier = this.getAbilityModifier(ability);
        const proficiencyBonus = this.getProficiencyBonus();
        
        let modifier = abilityModifier;
        if (skillData.proficient) modifier += proficiencyBonus;
        if (skillData.expertise) modifier += proficiencyBonus;
        
        return modifier;
    }
    
    getSkillAbility(skill) {
        const skillAbilities = {
            strength: ['athletics'],
            dexterity: ['acrobatics', 'sleightOfHand', 'stealth'],
            intelligence: ['arcana', 'history', 'investigation', 'nature', 'religion'],
            wisdom: ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
            charisma: ['deception', 'intimidation', 'performance', 'persuasion']
        };
        
        for (const [ability, skills] of Object.entries(skillAbilities)) {
            if (skills.includes(skill)) return ability;
        }
        return 'intelligence'; // fallback
    }

    // Метод для определения, является ли класс заклинателем
    isSpellcaster() {
        const spellcastingClasses = {
            'Бард': { ability: 'charisma', level: 1 },
            'Жрец': { ability: 'wisdom', level: 1 },
            'Друид': { ability: 'wisdom', level: 1 },
            'Паладин': { ability: 'charisma', level: 2 },
            'Следопыт': { ability: 'wisdom', level: 2 },
            'Чародей': { ability: 'charisma', level: 1 },
            'Колдун': { ability: 'charisma', level: 1 },
            'Волшебник': { ability: 'intelligence', level: 1 },
            'Изобретатель': { ability: 'intelligence', level: 1 }
        };
        
        console.log('=== DEBUG isSpellcaster ===');
        console.log('Current class:', this.class);
        console.log('Current level:', this.level);
        console.log('Available spellcasting classes:', Object.keys(spellcastingClasses));
        
        const classInfo = spellcastingClasses[this.class];
        console.log('Class info:', classInfo);
        
        const result = classInfo && this.level >= classInfo.level;
        console.log('Is spellcaster:', result);
        console.log('====================');
        
        return result;
    }

    // Метод для получения заклинательной характеристики
    getSpellcastingAbility() {
        const spellcastingClasses = {
            'Бард': 'charisma',
            'Жрец': 'wisdom',
            'Друид': 'wisdom',
            'Паладин': 'charisma',
            'Следопыт': 'wisdom',
            'Чародей': 'charisma',
            'Колдун': 'charisma',
            'Волшебник': 'intelligence',
            'Изобретатель': 'intelligence'
        };
        
        console.log('=== DEBUG getSpellcastingAbility ===');
        console.log('Current class:', this.class);
        console.log('Spellcasting ability:', spellcastingClasses[this.class]);
        console.log('====================');
        
        return spellcastingClasses[this.class] || '';
    }

    // Расчет ячеек заклинаний
    calculateSpellSlots() {
        // Обновим таблицы для русских названий классов
        const fullCasters = ['Бард', 'Жрец', 'Друид', 'Чародей', 'Волшебник'];
        const halfCasters = ['Паладин', 'Следопыт', 'Изобретатель'];
        
        let table;
        if (fullCasters.includes(this.class)) {
            table = this.fullCasterTable;
        } else if (halfCasters.includes(this.class)) {
            table = this.halfCasterTable;
        } else {
            table = {};
        }

        const level = Math.min(this.level, 20);
        const slots = table[level] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
        
        console.log('=== DEBUG calculateSpellSlots ===');
        console.log('Class:', this.class);
        console.log('Level:', level);
        console.log('Slots array:', slots);
        console.log('Table used:', fullCasters.includes(this.class) ? 'fullCaster' : halfCasters.includes(this.class) ? 'halfCaster' : 'none');
        
        return {
            1: { total: slots[0], used: this.spellcasting?.slots?.[1]?.used || 0 },
            2: { total: slots[1], used: this.spellcasting?.slots?.[2]?.used || 0 },
            3: { total: slots[2], used: this.spellcasting?.slots?.[3]?.used || 0 },
            4: { total: slots[3], used: this.spellcasting?.slots?.[4]?.used || 0 },
            5: { total: slots[4], used: this.spellcasting?.slots?.[5]?.used || 0 },
            6: { total: slots[5], used: this.spellcasting?.slots?.[6]?.used || 0 },
            7: { total: slots[6], used: this.spellcasting?.slots?.[7]?.used || 0 },
            8: { total: slots[7], used: this.spellcasting?.slots?.[8]?.used || 0 },
            9: { total: slots[8], used: this.spellcasting?.slots?.[9]?.used || 0 }
        };
    }

    // Добавим таблицы как свойства класса
    get fullCasterTable() {
        return {
            1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
            8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
            9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
            10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
            11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
            12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
            13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
            14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
            15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
            16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
            17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
            18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
            19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
            20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
        };
    }

    get halfCasterTable() {
        return {
            1: [0, 0, 0, 0, 0, 0, 0, 0, 0],
            2: [2, 0, 0, 0, 0, 0, 0, 0, 0],
            3: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            4: [3, 0, 0, 0, 0, 0, 0, 0, 0],
            5: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            6: [4, 2, 0, 0, 0, 0, 0, 0, 0],
            7: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            8: [4, 3, 0, 0, 0, 0, 0, 0, 0],
            9: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            10: [4, 3, 2, 0, 0, 0, 0, 0, 0],
            11: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            12: [4, 3, 3, 0, 0, 0, 0, 0, 0],
            13: [4, 3, 3, 1, 0, 0, 0, 0, 0],
            14: [4, 3, 3, 1, 0, 0, 0, 0, 0],
            15: [4, 3, 3, 2, 0, 0, 0, 0, 0],
            16: [4, 3, 3, 2, 0, 0, 0, 0, 0],
            17: [4, 3, 3, 3, 1, 0, 0, 0, 0],
            18: [4, 3, 3, 3, 1, 0, 0, 0, 0],
            19: [4, 3, 3, 3, 2, 0, 0, 0, 0],
            20: [4, 3, 3, 3, 2, 0, 0, 0, 0]
        };
    }

    // Расчет бонуса атаки заклинанием
    calculateSpellAttack() {
        if (!this.isSpellcaster()) return 0;
        const ability = this.getSpellcastingAbility();
        const abilityMod = this.getAbilityModifier(ability);
        return this.getProficiencyBonus() + abilityMod;
    }

    // Расчет Сл спасброска от заклинаний
    calculateSpellSaveDC() {
        if (!this.isSpellcaster()) return 0;
        const ability = this.getSpellcastingAbility();
        const abilityMod = this.getAbilityModifier(ability);
        return 8 + this.getProficiencyBonus() + abilityMod;
    }

    // Обновление всей информации о магии
    updateSpellcasting() {
        if (this.isSpellcaster()) {
            this.spellcasting.ability = this.getSpellcastingAbility();
            this.spellcasting.spellAttack = this.calculateSpellAttack();
            this.spellcasting.spellSaveDC = this.calculateSpellSaveDC();
            this.spellcasting.slots = this.calculateSpellSlots();
        }
    }

    // Получение количества известных заклинаний
    getKnownSpellsCount() {
        const knownSpells = {
            'Бард': Math.min(this.level + 3, 24),
            'Жрец': 'all',
            'Друид': 'all',
            'Чародей': Math.min(this.level + 1, 15),
            'Волшебник': 'all',
            'Колдун': Math.min(this.level + 1, 15),
            'Паладин': Math.min(this.level / 2 + 1, 10),
            'Следопыт': Math.min(this.level / 2 + 1, 11),
            'Изобретатель': 'all'
        };
        
        console.log('=== DEBUG getKnownSpellsCount ===');
        console.log('Current class:', this.class);
        console.log('Known spells count:', knownSpells[this.class]);
        console.log('====================');
        
        return knownSpells[this.class] || 0;
    }
}

// Константы для DnD 5e
const ALIGNMENTS = [
    'Законно-добрый', 'Законно-нейтральный', 'Законно-злой',
    'Нейтрально-добрый', 'Истинно-нейтральный', 'Нейтрально-злой',
    'Хаотично-добрый', 'Хаотично-нейтральный', 'Хаотично-злой'
];

const ABILITY_NAMES = {
    strength: '💪 Сила',
    dexterity: '🎯 Ловкость', 
    constitution: '❤️ Телосложение',
    intelligence: '📚 Интеллект',
    wisdom: '👁️ Мудрость',
    charisma: '💫 Харизма'
};

const SKILL_NAMES = {
    acrobatics: 'Акробатика',
    animalHandling: 'Уход за животными',
    arcana: 'Магия',
    athletics: 'Атлетика',
    deception: 'Обман',
    history: 'История',
    insight: 'Проницательность',
    intimidation: 'Запугивание',
    investigation: 'Расследование',
    medicine: 'Медицина',
    nature: 'Природа',
    perception: 'Внимательность',
    performance: 'Выступление',
    persuasion: 'Убеждение',
    religion: 'Религия',
    sleightOfHand: 'Ловкость рук',
    stealth: 'Скрытность',
    survival: 'Выживание'
};

// Константы для магии
const SPELLCASTING_CLASSES = [
    'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard', 'Artificer'
];
