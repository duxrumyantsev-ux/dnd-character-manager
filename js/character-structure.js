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
