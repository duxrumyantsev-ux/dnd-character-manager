// Главный класс приложения - координация всех компонентов
class DnDApp {
    constructor() {
        this.db = database;
        this.auth = authManager;
        this.spellLoader = spellLoader;
        this.gameDataLoader = gameDataLoader;
        this.currentTab = 'characters';
        this.characters = [];
        this.currentSpellFilters = {
            level: 'all',
            class: 'all',
            school: 'all',
            search: ''
        };
        this.diceHistory = [];
        this.init();
    }

    async init() {
        try {
            // Сначала инициализируем базу данных
            await this.db.init();
            console.log('Database initialized');
            
            // Затем менеджер персонажей
            this.characterManager = new CharacterManager(this.db, this.auth, this.gameDataLoader);
            
            // Затем аутентификацию
            this.auth.onAuthStateChanged = (user) => this.handleAuthStateChange(user);
            
            // Инициализируем менеджер заклинаний
            this.spellsManager = new SpellsManager(this.spellLoader);
            
            // Инициализируем менеджер кубиков
            this.diceManager = new DiceManager();
            
            // Параллельно загружаем остальные данные
            await Promise.all([
                this.loadGameData(),
                this.initUI(),
                this.initTabs(),
                this.initAuthHandlers(),
                this.initSpellsFilters()
            ]);
            
            this.initServiceWorker();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    async loadGameData() {
        try {
            // Пытаемся загрузить из Firestore, если нет - из JSON
            let success = await this.gameDataLoader.loadFromFirestore();
            if (!success) {
                success = await this.gameDataLoader.loadFromJSON();
            }
            
            if (success) {
                console.log('Game data loaded successfully');
            } else {
                console.error('Failed to load game data');
            }
        } catch (error) {
            console.error('Error loading game data:', error);
        }
    }

    async handleAuthStateChange(user) {
        console.log('App handling auth state change:', user ? user.email : 'No user');
        
        try {
            if (user) {
                console.log('Loading cloud characters for user:', user.uid);
                await this.loadCloudCharacters();
                
                // Обновляем аватар
                const profile = await this.auth.getUserProfile();
                if (profile && profile.avatar) {
                    const userAvatar = document.getElementById('user-avatar');
                    if (userAvatar) userAvatar.textContent = profile.avatar;
                }
            } else {
                console.log('Loading local characters');
                await this.characterManager.loadCharacters();
            }
        } catch (error) {
            console.error('Error in handleAuthStateChange:', error);
            // В случае ошибки загружаем локальные данные
            await this.characterManager.loadCharacters();
        }
    }

    initUI() {
        // UI автоматически обновляется через authManager.updateAuthUI
    }

    initServiceWorker() {
        // Проверяем, что мы не в file:// протоколе
        if (window.location.protocol === 'file:') {
            console.log('Service Worker disabled for file:// protocol');
            return;
        }
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for(let registration of registrations) {
                    registration.unregister();
                }
                // Регистрируем новый
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered:', registration);
                        registration.update();
                    })
                    .catch(error => console.log('SW registration failed:', error));
            });
        }
    }

    initAuthHandlers() {
        // Обработчики для кнопок аутентификации
        const signinBtn = document.getElementById('signin-btn');
        const signupBtn = document.getElementById('signup-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (signinBtn) signinBtn.addEventListener('click', () => this.showAuthModal('signin'));
        if (signupBtn) signupBtn.addEventListener('click', () => this.showAuthModal('signup'));
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.signOut());
        
        // Закрытие модальных окон
        const authModalClose = document.getElementById('auth-modal-close');
        const authCancelBtn = document.getElementById('auth-cancel-btn');
        const profileModalClose = document.getElementById('profile-modal-close');
        const profileCancelBtn = document.getElementById('profile-cancel-btn');
        
        if (authModalClose) authModalClose.addEventListener('click', () => this.closeAuthModal());
        if (authCancelBtn) authCancelBtn.addEventListener('click', () => this.closeAuthModal());
        if (profileModalClose) profileModalClose.addEventListener('click', () => this.closeProfileModal());
        if (profileCancelBtn) profileCancelBtn.addEventListener('click', () => this.closeProfileModal());
        
        // Отправка форм
        const authForm = document.getElementById('auth-form');
        const profileForm = document.getElementById('profile-form');
        
        if (authForm) authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        if (profileForm) profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        
        // Обработчики для аватара пользователя
        const userAvatarContainer = document.getElementById('user-avatar-container');
        if (userAvatarContainer) {
            userAvatarContainer.addEventListener('click', () => this.showProfileModal());
        }
        
        // Обработчики для выбора аватара
        setTimeout(() => {
            document.querySelectorAll('.avatar-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                    e.target.classList.add('selected');
                    const avatarInput = document.getElementById('profile-avatar');
                    if (avatarInput) avatarInput.value = e.target.dataset.avatar;
                });
            });
        }, 100);
        
        // Кнопка миграции данных
        const migrateBtn = document.getElementById('migrate-data');
        if (migrateBtn) {
            migrateBtn.addEventListener('click', () => this.migrateLocalToCloud());
        }

        // Кнопка создания персонажа
        const addCharacterBtn = document.getElementById('add-character');
        if (addCharacterBtn) {
            addCharacterBtn.addEventListener('click', () => {
                this.characterManager.showCharacterForm();
            });
        }

        // Кнопка принудительного обновления данных
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn-secondary';
        refreshBtn.innerHTML = '🔄 Обновить';
        refreshBtn.style.marginLeft = '10px';
        refreshBtn.addEventListener('click', () => this.forceRefresh());
        
        const userSection = document.getElementById('user-section');
        if (userSection) {
            userSection.appendChild(refreshBtn);
        }
    }

    async forceRefresh() {
        console.log('Force refreshing data...');
        if (this.auth.isSignedIn()) {
            await this.loadCloudCharacters();
        } else {
            await this.characterManager.loadCharacters();
        }
        alert('Данные обновлены');
    }

    showAuthModal(mode = 'signin') {
        const modal = document.getElementById('auth-modal');
        const title = document.getElementById('auth-modal-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const usernameField = document.getElementById('auth-username-field');

        if (!modal || !title || !submitBtn || !usernameField) return;

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
        const authForm = document.getElementById('auth-form');
        if (authForm) authForm.reset();
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        const errorElement = document.getElementById('auth-error');
        
        if (modal) modal.style.display = 'none';
        if (errorElement) errorElement.textContent = '';
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const modal = document.getElementById('auth-modal');
        const mode = modal ? modal.dataset.mode : 'signin';
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('auth-username').value;
        const errorElement = document.getElementById('auth-error');

        if (!email || !password) {
            if (errorElement) errorElement.textContent = 'Заполните все обязательные поля';
            return;
        }

        if (errorElement) errorElement.textContent = '';

        try {
            let result;
            if (mode === 'signup') {
                if (!username) {
                    if (errorElement) errorElement.textContent = 'Введите имя пользователя';
                    return;
                }
                result = await this.auth.signUp(email, password, username);
            } else {
                result = await this.auth.signIn(email, password);
            }

            if (result.success) {
                this.closeAuthModal();
            } else {
                if (errorElement) errorElement.textContent = result.error;
            }
        } catch (error) {
            if (errorElement) errorElement.textContent = 'Произошла ошибка: ' + error.message;
        }
    }

    async signOut() {
        const result = await this.auth.signOut();
        if (result.success) {
            await this.characterManager.loadCharacters();
        }
    }

    showProfileModal() {
        const modal = document.getElementById('profile-modal');
        const user = this.auth.getCurrentUser();
        
        if (!modal || !user) return;

        // Заполняем текущие данные
        const usernameInput = document.getElementById('profile-username');
        if (usernameInput) usernameInput.value = user.displayName || '';
        
        // Загружаем дополнительные данные профиля
        this.auth.getUserProfile().then(profile => {
            if (profile) {
                const avatarInput = document.getElementById('profile-avatar');
                if (avatarInput) avatarInput.value = profile.avatar || '😊';
                
                const userAvatar = document.getElementById('user-avatar');
                if (userAvatar) userAvatar.textContent = profile.avatar || '😊';
                
                // Выбираем текущий аватар в списке
                document.querySelectorAll('.avatar-option').forEach(option => {
                    if (option.dataset.avatar === (profile.avatar || '😊')) {
                        option.classList.add('selected');
                    }
                });
            }
        });
        
        modal.style.display = 'flex';
    }

    closeProfileModal() {
        const modal = document.getElementById('profile-modal');
        const errorElement = document.getElementById('profile-error');
        
        if (modal) modal.style.display = 'none';
        if (errorElement) errorElement.textContent = '';
        
        const passwordInput = document.getElementById('profile-password');
        const confirmInput = document.getElementById('profile-password-confirm');
        if (passwordInput) passwordInput.value = '';
        if (confirmInput) confirmInput.value = '';
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const username = document.getElementById('profile-username').value;
        const avatar = document.getElementById('profile-avatar').value;
        const newPassword = document.getElementById('profile-password').value;
        const confirmPassword = document.getElementById('profile-password-confirm').value;
        const errorElement = document.getElementById('profile-error');
        
        if (errorElement) errorElement.textContent = '';
        
        if (!username) {
            if (errorElement) errorElement.textContent = 'Введите имя пользователя';
            return;
        }
        
        if (newPassword && newPassword !== confirmPassword) {
            if (errorElement) errorElement.textContent = 'Пароли не совпадают';
            return;
        }
        
        try {
            // Обновляем профиль
            const profileResult = await this.auth.updateProfile(username, avatar);
            if (!profileResult.success) {
                if (errorElement) errorElement.textContent = profileResult.error;
                return;
            }
            
            // Если указан новый пароль, обновляем его
            if (newPassword) {
                const passwordResult = await this.auth.updatePassword(newPassword);
                if (!passwordResult.success) {
                    if (errorElement) errorElement.textContent = passwordResult.error;
                    return;
                }
            }
            
            this.closeProfileModal();
            alert('Профиль успешно обновлен!');
        } catch (error) {
            if (errorElement) errorElement.textContent = 'Ошибка при обновлении профиля: ' + error.message;
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
            case 'dice':
                this.diceManager.renderDiceHistory();
                break;
            case 'combat':
                this.loadCombat();
                break;
        }
    }

    async viewCharacter(characterId) {
        console.log('=== VIEW CHARACTER DEBUG ===');
        console.log('Requested character ID:', characterId);
        
        try {
            const character = await this.characterManager.getCharacter(characterId);
            console.log('Found character:', character);
            
            if (!character) {
                alert('Персонаж не найден. ID: ' + characterId);
                return;
            }
            
            this.showCharacterView(character);
        } catch (error) {
            console.error('Error viewing character:', error);
            alert('Ошибка при загрузке персонажа: ' + error.message);
        }
    }

    showCharacterView(character) {
        const modalHtml = `
            <div class="modal-overlay" id="character-view-modal">
                <div class="modal" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>${character.name || 'Без имени'}</h3>
                        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    
                    <div class="character-view-content">
                        ${CharacterViewManager.renderCharacterView(character)}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="app.characterManager.editCharacter('${character.id}'); this.closest('.modal-overlay').remove()">
                            ✏️ Редактировать
                        </button>
                        <button class="btn-primary" onclick="app.characterManager.selectCharacterById('${character.id}'); this.closest('.modal-overlay').remove()">
                            ⭐ Выбрать персонажа
                        </button>
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async loadCloudCharacters() {
        try {
            console.log('Starting cloud characters load...');
            const cloudCharacters = await this.auth.getCloudCharacters();
            console.log('Cloud characters received:', cloudCharacters);
            this.characters = cloudCharacters;
            this.characterManager.characters = cloudCharacters;
            this.characterManager.renderCharacters(cloudCharacters);
        } catch (error) {
            console.error('Error loading cloud characters:', error);
            // При ошибке загрузки облачных данных, показываем локальные
            console.log('Falling back to local characters');
            await this.characterManager.loadCharacters();
        }
    }

    // Загрузка заклинаний
    async loadSpells() {
        try {
            let spells = await this.spellLoader.loadFromFirestore();
            if (spells.length === 0) {
                spells = await this.spellLoader.loadFromJSON();
            }
            
            this.spellsManager.renderSpellsList(spells, this.currentSpellFilters);
        } catch (error) {
            console.error('Error loading spells:', error);
        }
    }

    initSpellsFilters() {
        const levelFilter = document.getElementById('spell-level-filter');
        const classFilter = document.getElementById('spell-class-filter');
        const schoolFilter = document.getElementById('spell-school-filter');
        const searchFilter = document.getElementById('spell-search');

        if (levelFilter) levelFilter.addEventListener('change', (e) => {
            this.currentSpellFilters.level = e.target.value;
            this.applySpellsFilters();
        });

        if (classFilter) classFilter.addEventListener('change', (e) => {
            this.currentSpellFilters.class = e.target.value;
            this.applySpellsFilters();
        });

        if (schoolFilter) schoolFilter.addEventListener('change', (e) => {
            this.currentSpellFilters.school = e.target.value;
            this.applySpellsFilters();
        });

        if (searchFilter) searchFilter.addEventListener('input', (e) => {
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
        // TODO: Реализовать логику боевого трекера
    }

    // Миграция локальных данных в облако
    async migrateLocalToCloud() {
        if (!this.auth.isSignedIn()) {
            alert('Необходимо войти в систему для миграции данных');
            return;
        }

        if (confirm('Хотите перенести всех локальных персонажей в облако?')) {
            try {
                const localChars = await this.db.getLocalCharacters();
                let migratedCount = 0;

                for (const char of localChars) {
                    const result = await this.auth.syncCharacterToCloud(char);
                    if (result.success) {
                        migratedCount++;
                        // Помечаем персонажа как облачного
                        char.source = 'cloud';
                        char.id = result.id; // Обновляем ID на cloud ID
                        await this.db.updateCharacter(char);
                    }
                }

                alert(`Успешно перенесено ${migratedCount} персонажей в облако`);
                await this.loadCloudCharacters();
                
                // Скрываем кнопку миграции
                const migrateBtn = document.getElementById('migrate-data');
                if (migrateBtn) migrateBtn.style.display = 'none';
                
            } catch (error) {
                console.error('Migration error:', error);
                alert('Ошибка при переносе данных: ' + error.message);
            }
        }
    }

    // Методы для глобального доступа из HTML
    clearSelectedCharacter() {
        this.characterManager.clearSelectedCharacter();
    }

    selectCharacter(character) {
        this.characterManager.selectCharacter(character);
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DnDApp();
    window.app = app;
});
