// Главный класс приложения
class DnDApp {
    constructor() {
        this.db = database;
        this.currentTab = 'characters';
        this.init();
    }

    async init() {
        try {
            await this.db.init();
            console.log('Database initialized');
            
            this.initTabs();
            this.initDice();
            this.initCharacterManager();
            this.initServiceWorker();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered'))
                .catch(error => console.log('SW registration failed'));
        }
    }

    initTabs() {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabName);
        });

        this.currentTab = tabName;

        switch(tabName) {
            case 'characters':
                this.characterManager.loadCharacters();
                break;
            case 'spells':
                this.loadSpells();
                break;
            case 'combat':
                this.loadCombat();
                break;
        }
    }

    initDice() {
        document.querySelectorAll('.dice').forEach(button => {
            button.addEventListener('click', (e) => {
                const sides = parseInt(e.target.dataset.sides);
                this.rollDice(sides);
            });
        });
    }

    rollDice(sides) {
        const result = Math.floor(Math.random() * sides) + 1;
        const resultElement = document.getElementById('dice-result');
        
        resultElement.innerHTML = `
            <div class="result">
                <span class="dice-roll">d${sides}:</span>
                <span class="result-number">${result}</span>
            </div>
        `;

        resultElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resultElement.style.transform = 'scale(1)';
        }, 200);
    }

    initCharacterManager() {
        this.characterManager = new CharacterManager(this.db);
        document.getElementById('add-character').addEventListener('click', () => {
            this.characterManager.showCharacterForm();
        });
    }

    async loadSpells() {
        try {
            const spells = await this.db.getSpells();
            this.renderSpells(spells);
        } catch (error) {
            console.error('Error loading spells:', error);
        }
    }

    renderSpells(spells) {
        const spellsList = document.getElementById('spells-list');
        
        if (spells.length === 0) {
            spellsList.innerHTML = '<p>Заклинания не загружены. Нужно добавить базу заклинаний.</p>';
            return;
        }

        spellsList.innerHTML = spells.map(spell => `
            <div class="spell-card">
                <h3>${spell.name}</h3>
                <p>Уровень: ${spell.level} | Школа: ${spell.school}</p>
                <p>${spell.description}</p>
            </div>
        `).join('');
    }

    async loadCombat() {
        console.log('Loading combat...');
    }
}

// Менеджер персонажей - полностью переписан
class CharacterManager {
    constructor(db) {
        this.db = db;
        this.characters = [];
        this.avatarFile = null;
    }

    async loadCharacters() {
        try {
            this.characters = await this.db.getCharacters();
            this.renderCharacters();
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    }

    renderCharacters() {
        const charactersList = document.getElementById('characters-list');
        
        if (this.characters.length === 0) {
            charactersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎭</div>
                    <h3>Персонажей пока нет</h3>
                    <p>Создайте своего первого персонажа для приключений!</p>
                </div>
            `;
            return;
        }

        charactersList.innerHTML = this.characters.map(character => {
            const hpPercent = (character.combat.currentHP / character.combat.maxHP) * 100;
            const hpColor = hpPercent > 70 ? '#4CAF50' : hpPercent > 30 ? '#FF9800' : '#F44336';
            
            return `
                <div class="character-card" data-id="${character.id}">
                    <div class="character-avatar">
                        ${character.avatar ? 
                            `<img src="${character.avatar}" alt="${character.name}" />` : 
                            '<div class="avatar-placeholder">🎮</div>'
                        }
                    </div>
                    
                    <div class="character-info">
                        <div class="character-header">
                            <h3 class="character-name">${character.name}</h3>
                            <span class="character-level">Ур. ${character.level}</span>
                        </div>
                        
                        <div class="character-details">
                            <div class="detail-item">
                                <span class="detail-label">Раса:</span>
                                <span class="detail-value">${character.race}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Пол:</span>
                                <span class="detail-value">${character.gender || 'Не указан'}</span>
                            </div>
                        </div>
                        
                        <div class="hp-bar">
                            <div class="hp-info">
                                <span class="hp-current">${character.combat.currentHP}</span>
                                <span class="hp-separator">/</span>
                                <span class="hp-max">${character.combat.maxHP}</span>
                                <span class="hp-text">HP</span>
                            </div>
                            <div class="hp-track">
                                <div class="hp-fill" style="width: ${hpPercent}%; background: ${hpColor}"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="character-actions">
                        <button class="btn-action btn-edit" onclick="app.characterManager.editCharacter(${character.id})" title="Редактировать">
                            ✏️
                        </button>
                        <button class="btn-action btn-delete" onclick="app.characterManager.deleteCharacter(${character.id})" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async showCharacterForm(characterId = null) {
        const character = characterId ? await this.db.get('characters', characterId) : null;
        
        const formHtml = `
            <div class="modal-overlay" id="character-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${character ? 'Редактирование персонажа' : 'Создание нового персонажа'}</h3>
                        <button class="btn-close" onclick="app.characterManager.closeForm()">×</button>
                    </div>
                    
                    <form id="character-form" class="character-form">
                        <input type="hidden" id="character-id" value="${character?.id || ''}">
                        
                        <!-- Блок аватара -->
                        <div class="form-section">
                            <label class="section-label">Внешность</label>
                            <div class="avatar-upload">
                                <div class="avatar-preview" id="avatar-preview">
                                    ${character?.avatar ? 
                                        `<img src="${character.avatar}" alt="Preview" />` : 
                                        '<div class="avatar-placeholder">🎮</div>'
                                    }
                                </div>
                                <div class="avatar-controls">
                                    <input type="file" id="avatar-input" accept="image/*" style="display: none;">
                                    <button type="button" class="btn-secondary" onclick="document.getElementById('avatar-input').click()">
                                        📷 Выбрать изображение
                                    </button>
                                    ${character?.avatar ? `
                                        <button type="button" class="btn-danger" onclick="app.characterManager.removeAvatar()">
                                            ❌ Удалить
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Основная информация -->
                        <div class="form-section">
                            <label class="section-label">Основная информация</label>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="character-name">Имя персонажа *</label>
                                    <input type="text" id="character-name" value="${character?.name || ''}" required 
                                           placeholder="Введите имя персонажа">
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-race">Раса *</label>
                                    <select id="character-race" required>
                                        <option value="">Выберите расу</option>
                                        <option value="Человек" ${character?.race === 'Человек' ? 'selected' : ''}>Человек</option>
                                        <option value="Эльф" ${character?.race === 'Эльф' ? 'selected' : ''}>Эльф</option>
                                        <option value="Дварф" ${character?.race === 'Дварф' ? 'selected' : ''}>Дварф</option>
                                        <option value="Халфлинг" ${character?.race === 'Халфлинг' ? 'selected' : ''}>Халфлинг</option>
                                        <option value="Гном" ${character?.race === 'Гном' ? 'selected' : ''}>Гном</option>
                                        <option value="Полуорк" ${character?.race === 'Полуорк' ? 'selected' : ''}>Полуорк</option>
                                        <option value="Тифлинг" ${character?.race === 'Тифлинг' ? 'selected' : ''}>Тифлинг</option>
                                        <option value="Драконорожденный" ${character?.race === 'Драконорожденный' ? 'selected' : ''}>Драконорожденный</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-gender">Пол</label>
                                    <select id="character-gender">
                                        <option value="">Не указан</option>
                                        <option value="Мужской" ${character?.gender === 'Мужской' ? 'selected' : ''}>Мужской</option>
                                        <option value="Женский" ${character?.gender === 'Женский' ? 'selected' : ''}>Женский</option>
                                        <option value="Другой" ${character?.gender === 'Другой' ? 'selected' : ''}>Другой</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-level">Уровень *</label>
                                    <input type="number" id="character-level" value="${character?.level || 1}" 
                                           min="1" max="20" required>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Здоровье -->
                        <div class="form-section">
                            <label class="section-label">Здоровье</label>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="character-max-hp">Максимальное HP *</label>
                                    <input type="number" id="character-max-hp" 
                                           value="${character?.combat?.maxHP || 10}" min="1" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-current-hp">Текущее HP *</label>
                                    <input type="number" id="character-current-hp" 
                                           value="${character?.combat?.currentHP || 10}" min="0" required>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Характеристики -->
                        <div class="form-section">
                            <label class="section-label">Основные характеристики</label>
                            <div class="abilities-grid">
                                ${this.renderAbilityInput('strength', '💪 Сила', character)}
                                ${this.renderAbilityInput('dexterity', '🎯 Ловкость', character)}
                                ${this.renderAbilityInput('constitution', '❤️ Телосложение', character)}
                                ${this.renderAbilityInput('intelligence', '📚 Интеллект', character)}
                                ${this.renderAbilityInput('wisdom', '👁️ Мудрость', character)}
                                ${this.renderAbilityInput('charisma', '💫 Харизма', character)}
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="app.characterManager.closeForm()">
                                Отмена
                            </button>
                            <button type="submit" class="btn-primary">
                                ${character ? 'Сохранить изменения' : 'Создать персонажа'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);
        this.setupFormHandlers(character);
    }

    renderAbilityInput(ability, label, character) {
        const value = character?.abilities?.[ability] || 10;
        return `
            <div class="ability-input">
                <label for="ability-${ability}">${label}</label>
                <input type="number" id="ability-${ability}" 
                       value="${value}" min="1" max="30" 
                       class="ability-score">
                <div class="ability-modifier">
                    Мод: ${Math.floor((value - 10) / 2)}
                </div>
            </div>
        `;
    }

    setupFormHandlers(character) {
        const form = document.getElementById('character-form');
        const avatarInput = document.getElementById('avatar-input');
        const avatarPreview = document.getElementById('avatar-preview');
        
        // Обработчик выбора аватара
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    alert('Размер файла не должен превышать 2MB');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
                    this.avatarFile = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Обработчик отправки формы
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCharacter();
        });

        // Обновление модификаторов характеристик в реальном времени
        document.querySelectorAll('.ability-score').forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 10;
                const modifier = Math.floor((value - 10) / 2);
                e.target.parentElement.querySelector('.ability-modifier').textContent = 
                    `Мод: ${modifier >= 0 ? '+' + modifier : modifier}`;
            });
        });
    }

    removeAvatar() {
        const avatarPreview = document.getElementById('avatar-preview');
        avatarPreview.innerHTML = '<div class="avatar-placeholder">🎮</div>';
        this.avatarFile = null;
        document.getElementById('avatar-input').value = '';
    }

    async saveCharacter() {
        const form = document.getElementById('character-form');
        const characterId = document.getElementById('character-id').value;
        
        // Сбор данных формы
        const characterData = {
            name: document.getElementById('character-name').value,
            race: document.getElementById('character-race').value,
            gender: document.getElementById('character-gender').value,
            level: parseInt(document.getElementById('character-level').value),
            avatar: this.avatarFile,
            abilities: {
                strength: parseInt(document.getElementById('ability-strength').value),
                dexterity: parseInt(document.getElementById('ability-dexterity').value),
                constitution: parseInt(document.getElementById('ability-constitution').value),
                intelligence: parseInt(document.getElementById('ability-intelligence').value),
                wisdom: parseInt(document.getElementById('ability-wisdom').value),
                charisma: parseInt(document.getElementById('ability-charisma').value)
            },
            combat: {
                maxHP: parseInt(document.getElementById('character-max-hp').value),
                currentHP: parseInt(document.getElementById('character-current-hp').value),
                armorClass: 10 + Math.floor((parseInt(document.getElementById('ability-dexterity').value) - 10) / 2)
            },
            updatedAt: new Date()
        };

        try {
            if (characterId) {
                // Обновление существующего персонажа
                const existingCharacter = await this.db.get('characters', parseInt(characterId));
                const updatedCharacter = { 
                    ...existingCharacter, 
                    ...characterData,
                    id: parseInt(characterId) // Сохраняем оригинальный ID
                };
                
                // Сохраняем аватар только если он был изменен
                if (!this.avatarFile && existingCharacter.avatar) {
                    updatedCharacter.avatar = existingCharacter.avatar;
                }
                
                await this.db.updateCharacter(updatedCharacter);
            } else {
                // Создание нового персонажа
                await this.db.addCharacter(characterData);
            }

            this.closeForm();
            await this.loadCharacters();
            
        } catch (error) {
            console.error('Error saving character:', error);
            alert('Ошибка при сохранении персонажа: ' + error.message);
        }
    }

    async editCharacter(characterId) {
        await this.showCharacterForm(characterId);
    }

    async deleteCharacter(characterId) {
        if (confirm('Вы уверены, что хотите удалить этого персонажа? Это действие нельзя отменить.')) {
            try {
                await this.db.deleteCharacter(characterId);
                await this.loadCharacters();
            } catch (error) {
                console.error('Error deleting character:', error);
                alert('Ошибка при удалении персонажа');
            }
        }
    }

    closeForm() {
        const modal = document.getElementById('character-modal');
        if (modal) {
            modal.remove();
        }
        this.avatarFile = null;
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DnDApp();
});
