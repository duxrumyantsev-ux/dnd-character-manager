// Структура заклинания DnD 5e
class Spell {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.level = data.level; // 0-9 (0 - заговоры)
        this.school = data.school;
        this.classes = data.classes; // массив классов
        this.castingTime = data.castingTime;
        this.range = data.range;
        this.components = data.components; // V, S, M
        this.material = data.material;
        this.duration = data.duration;
        this.description = data.description;
        this.atHigherLevels = data.atHigherLevels;
        this.image = data.image;
        this.concentration = data.concentration || false;
        this.ritual = data.ritual || false;
    }
}

// Классы DnD
const DND_CLASSES = [
    'Бард', 'Волшебник', 'Жрец', 'Друид', 'Паладин', 'Следопыт',
    'Чародей', 'Колдун', 'Варвар', 'Воин', 'Монах', 'Плут'
];

// Школы магии
const MAGIC_SCHOOLS = [
    'Вызов', 'Ограждение', 'Воплощение', 'Прорицание',
    'Очарование', 'Иллюзия', 'Некромантия', 'Преобразование'
];

// Уровни заклинаний (0-9)
const SPELL_LEVELS = [
    'Заговоры', '1 уровень', '2 уровень', '3 уровень',
    '4 уровень', '5 уровень', '6 уровень', '7 уровень',
    '8 уровень', '9 уровень'
];