// Главный класс приложения
class DnDApp {
    constructor() {
        this.db = database;
        this.auth = authManager;
        this.spellLoader = spellLoader;
        this.currentTab = 'characters';
        this.characters = [];
        this.currentSpellFilters = {
            level: 'all',
            class: 'all',
            school: 'all',
            search: ''
        };
        this.init();
    }

    async init() {
        try {
            // Инициализируем базу данных
            await this.db.init();
            console.log('Database initialized');
            
            // Настраиваем обработчики аутентификации
            this.auth.onAuthStateChanged = (user) => this.handleAuthStateChange(user);
            
            // Инициализируем компоненты
            this.initUI();
            this.initTabs();
            this.initDice();
            this.initCharacterManager();
            this.initAuthHandlers();
            this.initSpellsManager();
            this.initServiceWorker();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    handleAuthStateChange(user) {
        if (user) {
            // Пользователь вошел - загружаем данные из облака
            this.loadCloudCharacters();
        } else {
            // Пользователь вышел - загружаем локальные данные
            this.characterManager.loadCharacters();
        }
    }

    initUI() {
        // Показываем/скрываем элементы в зависимости от аутентификации
        this.updateUIForAuth();
    }

    updateUIForAuth() {
        const isSignedIn = this.auth.isSignedIn();
        // Можно добавить дополнительную логику отображения
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered'))
                .catch(error => console.log('SW registration failed'));
        }
    }

    initAuthHandlers() {
        // Обработчики для форм аутентификации
        document.getElementById('signin-btn').addEventListener('click', () => this.showAuthModal('signin'));
        document.getElementById('signup-btn').addEventListener('click', () => this.showAuthModal('signup'));
        document.getElementById('logout-btn').addEventListener('click', () => this.signOut());
        
        // Закрытие модального окна
        document.getElementById('auth-modal-close').addEventListener('click', () => this.closeAuthModal());
        document.getElementById('auth-cancel-btn').addEventListener('click', () => this.closeAuthModal());
        
        // Отправка форм
        document.getElementById('auth-form').addEventListener('submit', (e) => this.handleAuthSubmit(e));
    }

    showAuthModal(mode = 'signin') {
        const modal = document.getElementById('auth-modal');
        const title = document.getElementById('auth-modal-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const usernameField = document.getElementById('auth-username-field');

        if (mode === 'signup') {
            title.textContent = 'Регистрация';
            submitBtn.textContent = 'Зарегистрироваться';
            usernameField.style.display = 'block';
        } else {
            title.textContent = 'Вход';
            submitBtn.textContent = 'Войти';
            usernameField.style.display = 'none';
        }

        modal.dataset.mode = mode;
        modal.style.display = 'flex';
        
        // Очищаем форму
        document.getElementById('auth-form').reset();
    }

    closeAuthModal() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('auth-error').textContent = '';
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const modal = document.getElementById('auth-modal');
        const mode = modal.dataset.mode;
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('auth-username').value;
        const errorElement = document.getElementById('auth-error');

        errorElement.textContent = '';

        try {
            let result;
            if (mode === 'signup') {
                result = await this.auth.signUp(email, password, username);
            } else {
                result = await this.auth.signIn(email, password);
            }

            if (result.success) {
                this.closeAuthModal();
            } else {
                errorElement.textContent = result.error;
            }
        } catch (error) {
            errorElement.textContent = 'Произошла ошибка: ' + error.message;
        }
    }

    async signOut() {
        const result = await this.auth.signOut();
        if (result.success) {
            this.characterManager.loadCharacters(); // Переключаемся на локальные данные
        }
    }

    async loadCloudCharacters() {
        try {
            const cloudCharacters = await this.auth.getCloudCharacters();
            this.characters = cloudCharacters;
            this.characterManager.renderCharacters(cloudCharacters);
        } catch (error) {
            console.error('Error loading cloud characters:', error);
            // В случае ошибки загружаем локальные данные
            this.characterManager.loadCharacters();
        }
    }

    // Управление вкладками
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
                if (this.auth.isSignedIn()) {
                    this.loadCloudCharacters();
                } else {
                    this.characterManager.loadCharacters();
                }
                break;
            case 'spells':
                this.loadSpells();
                break;
            case 'combat':
                this.loadCombat();
                break;
        }
    }

    // Система броска кубиков
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

    // Менеджер персонажей
    initCharacterManager() {
        this.characterManager = new CharacterManager(this.db, this.auth);
        document.getElementById('add-character').addEventListener('click', () => {
            this.characterManager.showCharacterForm();
        });
    }

    // Менеджер заклинаний
    initSpellsManager() {
        this.spellsManager = new SpellsManager(this.spellLoader);
    }

    // Загрузка заклинаний
    async loadSpells() {
    try {
        console.log('Starting spells load...');
        
        // Пытаемся загрузить из Firestore
        let spells = await this.spellLoader.loadFromFirestore();
        console.log('Spells from Firestore:', spells);
        
        if (spells.length === 0) {
            console.log('No spells in Firestore, loading from JSON');
            spells = await this.spellLoader.loadFromJSON();
        }
        
        console.log('Total spells to render:', spells.length);
        this.spellsManager.renderSpellsList(spells, this.currentSpellFilters);
        this.setupSpellsFilters();
        
    } catch (error) {
        console.error('Error loading spells:', error);
    }
}

    setupSpellsFilters() {
        // Фильтр по уровню
        document.getElementById('spell-level-filter').addEventListener('change', (e) => {
            this.currentSpellFilters.level = e.target.value;
            this.applySpellsFilters();
        });

        // Фильтр по классу
        document.getElementById('spell-class-filter').addEventListener('change', (e) => {
            this.currentSpellFilters.class = e.target.value;
            this.applySpellsFilters();
        });

        // Фильтр по школе
        document.getElementById('spell-school-filter').addEventListener('change', (e) => {
            this.currentSpellFilters.school = e.target.value;
            this.applySpellsFilters();
        });

        // Поиск
        document.getElementById('spell-search').addEventListener('input', (e) => {
            this.currentSpellFilters.search = e.target.value;
            this.applySpellsFilters();
        });
    }

    applySpellsFilters() {
        const filteredSpells = this.spellLoader.getSpells(this.currentSpellFilters);
        this.spellsManager.renderSpellsList(filteredSpells, this.currentSpellFilters);
    }

    // Загрузка боевой ситуации
    async loadCombat() {
        console.log('Loading combat...');
    }
}

// Менеджер персонажей (обновленная версия)
class CharacterManager {
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;
        this.characters = [];
        this.avatarFile = null;
    }

    async loadCharacters() {
        try {
            if (this.auth.isSignedIn()) {
                // Загружаем из облака
                this.characters = await this.auth.getCloudCharacters();
            } else {
                // Загружаем локально
                this.characters = await this.db.getCharacters();
            }
            this.renderCharacters(this.characters);
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    }

    renderCharacters(characters) {
        const charactersList = document.getElementById('characters-list');
        
        if (characters.length === 0) {
            const message = this.auth.isSignedIn() ? 
                'У вас пока нет персонажей в облаке. Создайте первого!' : 
                'Персонажей пока нет. Создайте первого или войдите для синхронизации!';
                
            charactersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎭</div>
                    <h3>${this.auth.isSignedIn() ? 'Облачные персонажи' : 'Локальные персонажи'}</h3>
                    <p>${message}</p>
                </div>
            `;
            return;
        }

        charactersList.innerHTML = characters.map(character => {
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
                        
                        ${this.auth.isSignedIn() ? 
                            '<div class="cloud-badge">☁️ Облако</div>' : 
                            '<div class="local-badge">📱 Локально</div>'
                        }
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
        const character = characterId ? await this.getCharacter(characterId) : null;
        
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

    async getCharacter(characterId) {
        if (this.auth.isSignedIn()) {
            // Ищем в облачных данных
            return this.characters.find(char => char.id === characterId);
        } else {
            // Ищем в локальных данных
            return await this.db.get('characters', parseInt(characterId));
        }
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
            let success;
            if (this.auth.isSignedIn()) {
                // Сохраняем в облако
                if (characterId) {
                    characterData.id = characterId;
                }
                const result = await this.auth.syncCharacterToCloud(characterData);
                success = result.success;
            } else {
                // Сохраняем локально
                if (characterId) {
                    const existingCharacter = await this.db.get('characters', parseInt(characterId));
                    const updatedCharacter = { ...existingCharacter, ...characterData };
                    await this.db.updateCharacter(updatedCharacter);
                } else {
                    await this.db.addCharacter(characterData);
                }
                success = true;
            }

            if (success) {
                this.closeForm();
                await this.loadCharacters();
            } else {
                alert('Ошибка при сохранении персонажа');
            }
            
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
                let success;
                if (this.auth.isSignedIn()) {
                    success = await this.auth.deleteCloudCharacter(characterId);
                } else {
                    success = await this.db.deleteCharacter(parseInt(characterId));
                }

                if (success) {
                    await this.loadCharacters();
                } else {
                    alert('Ошибка при удалении персонажа');
                }
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
