
// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/dnd-character-manager/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

// Логика броска кубиков
document.querySelectorAll('.dice').forEach(button => {
    button.addEventListener('click', () => {
        const sides = parseInt(button.dataset.sides);
        const result = Math.floor(Math.random() * sides) + 1;
        document.getElementById('dice-result').innerHTML = `
            <div class="result">
                <span class="dice-roll">d${sides}:</span>
                <span class="result-number">${result}</span>
            </div>
        `;
    });
});

// Управление вкладками
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Простая система персонажей
class CharacterManager {
    constructor() {
        this.characters = JSON.parse(localStorage.getItem('dnd-characters')) || [];
        this.loadCharacters();
    }
    
    loadCharacters() {
        const list = document.getElementById('characters-list');
        list.innerHTML = '';
        
        this.characters.forEach((char, index) => {
            const charElement = document.createElement('div');
            charElement.innerHTML = `
                <div style="border: 1px solid #e94560; padding: 10px; margin: 10px 0; border-radius: 5px;">
                    <h3>${char.name || 'Безымянный'}</h3>
                    <p>Уровень: ${char.level || 1}</p>
                    <p>Класс: ${char.class || 'Неизвестно'}</p>
                    <button onclick="characterManager.deleteCharacter(${index})">Удалить</button>
                </div>
            `;
            list.appendChild(charElement);
        });
    }
    
    addCharacter() {
        const name = prompt('Имя персонажа:');
        if (name) {
            this.characters.push({
                name: name,
                level: 1,
                class: 'Воин'
            });
            localStorage.setItem('dnd-characters', JSON.stringify(this.characters));
            this.loadCharacters();
        }
    }
    
    deleteCharacter(index) {
        this.characters.splice(index, 1);
        localStorage.setItem('dnd-characters', JSON.stringify(this.characters));
        this.loadCharacters();
    }
}

const characterManager = new CharacterManager();
document.getElementById('add-character').addEventListener('click', () => characterManager.addCharacter());

