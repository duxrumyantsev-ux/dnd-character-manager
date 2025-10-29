// Главный класс приложения
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
            await this.db.init();
            console.log('Database initialized');
            
            // Настраиваем обработчики аутентификации
            this.auth.onAuthStateChanged = (user) => this.handleAuthStateChange(user);
            
            // Загружаем игровые данные
            await this.loadGameData();
            
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
        
        if (user) {
            try {
                // Загружаем облачных персонажей
                await this.loadCloudCharacters();
                
                // Обновляем аватар
                const profile = await this.auth.getUserProfile();
                if (profile && profile.avatar) {
                    const userAvatar = document.getElementById('user-avatar');
                    if (userAvatar) userAvatar.textContent = profile.avatar;
                }
            } catch (error) {
                console.error('Error in handleAuthStateChange:', error);
                // В случае ошибки загружаем локальные данные
                this.characterManager.loadCharacters();
            }
        } else {
            // Загружаем локальные данные
            this.characterManager.loadCharacters();
        }
    }

    initUI() {
        // UI автоматически обновляется через authManager.updateAuthUI
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Принудительно обновляем Service Worker
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for(let registration of registrations) {
                    registration.unregister();
                }
                // Регистрируем новый
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered:', registration);
                        // Принудительно обновляем кэш
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
            usernameField.classList.remove('hidden');
            usernameField.classList.add('visible');
        } else {
            title.textContent = 'Вход';
            submitBtn.textContent = 'Войти';
            usernameField.classList.remove('visible');
            usernameField.classList.add('hidden');
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
            this.characterManager.loadCharacters();
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

    async loadCloudCharacters() {
        try {
            const cloudCharacters = await this.auth.getCloudCharacters();
            this.characters = cloudCharacters;
            this.characterManager.renderCharacters(cloudCharacters);
        } catch (error) {
            console.error('Error loading cloud characters:', error);
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
            case 'dice':
                // При переключении на вкладку кубиков обновляем историю
                this.renderDiceHistory();
                break;
            case 'combat':
                this.loadCombat();
                break;
        }
    }

    // Система броска кубиков с 3D анимацией
    initDice() {
        document.querySelectorAll('.dice').forEach(button => {
            button.addEventListener('click', (e) => {
                const sides = parseInt(e.target.dataset.sides);
                this.roll3DDice(sides);
            });
        });
        
        // Обработчики для расширенных бросков
        document.getElementById('roll-custom').addEventListener('click', () => {
            const count = parseInt(document.getElementById('dice-count').value) || 1;
            const sides = parseInt(document.getElementById('dice-sides').value) || 6;
            const modifier = parseInt(document.getElementById('dice-modifier').value) || 0;
            
            this.rollMultiple3DDice(sides, count, modifier);
        });
        
        document.getElementById('roll-advantage').addEventListener('click', () => {
            this.rollWithAdvantage(false);
        });
        
        document.getElementById('roll-disadvantage').addEventListener('click', () => {
            this.rollWithAdvantage(true);
        });
        
        // Инициализация истории бросков
        this.diceHistory = JSON.parse(localStorage.getItem('dnd_dice_history') || '[]');
        this.renderDiceHistory();
    }

    // Создание 3D кубика с цветными гранями
    create3DDice(sides) {
        const diceElement = document.createElement('div');
        diceElement.className = `dice-3d dice-d${sides}`;
        
        // Создаем грани в зависимости от типа кубика
        for (let i = 1; i <= sides; i++) {
            const face = document.createElement('div');
            face.className = `dice-face face-${i}`;
            face.textContent = i;
            face.setAttribute('data-value', i);
            diceElement.appendChild(face);
        }
        
        return diceElement;
    }

    // Бросок одного 3D кубика
    async roll3DDice(sides) {
        const resultContainer = document.getElementById('dice-result');
        resultContainer.innerHTML = '';
        
        // Создаем контейнер для кубика
        const diceContainer = document.createElement('div');
        diceContainer.className = 'dice-3d-container';
        
        // Создаем кубик
        const diceElement = this.create3DDice(sides);
        diceContainer.appendChild(diceElement);
        resultContainer.appendChild(diceContainer);
        
        // Генерируем результат
        const result = Math.floor(Math.random() * sides) + 1;
        
        // Запускаем анимацию
        diceElement.classList.add('dice-rolling');
        
        // Ждем завершения анимации
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Останавливаем анимацию и показываем результат
        diceElement.classList.remove('dice-rolling');
        diceElement.classList.add('dice-landed');
        this.show3DDiceResult(diceElement, result, sides);
        
        // Показываем числовой результат
        this.showNumericResult(result, sides, 1, 0);
        
        // Сохраняем в историю
        this.saveToDiceHistory([result], result, sides, 1, 0);
    }

    // Бросок нескольких 3D кубиков
    async rollMultiple3DDice(sides, count, modifier) {
        const resultContainer = document.getElementById('dice-result');
        resultContainer.innerHTML = '';
        
        const diceContainer = document.createElement('div');
        diceContainer.className = 'dice-3d-container';
        
        const results = [];
        const diceElements = [];
        
        // Создаем кубики
        for (let i = 0; i < count; i++) {
            const diceElement = this.create3DDice(sides);
            diceContainer.appendChild(diceElement);
            diceElements.push(diceElement);
            
            // Запускаем анимацию с задержкой
            setTimeout(() => {
                diceElement.classList.add('dice-rolling');
            }, i * 200);
        }
        
        resultContainer.appendChild(diceContainer);
        
        // Ждем завершения анимации
        await new Promise(resolve => setTimeout(resolve, 1500 + count * 200));
        
        // Генерируем результаты и останавливаем кубики
        let total = 0;
        for (let i = 0; i < count; i++) {
            const result = Math.floor(Math.random() * sides) + 1;
            results.push(result);
            total += result;
            
            // Останавливаем анимацию и показываем результат
            diceElements[i].classList.remove('dice-rolling');
            diceElements[i].classList.add('dice-landed');
            this.show3DDiceResult(diceElements[i], result, sides);
            
            // Добавляем задержку между остановками
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Добавляем модификатор
        total += modifier;
        
        // Показываем числовой результат
        this.showNumericResult(total, sides, count, modifier, results);
        
        // Сохраняем в историю
        this.saveToDiceHistory(results, total, sides, count, modifier);
    }

    // Показ результата на 3D кубике с выделением выпавшей грани
    show3DDiceResult(diceElement, result, sides) {
        // Сначала убираем подсветку со всех граней
        const allFaces = diceElement.querySelectorAll('.dice-face');
        allFaces.forEach(face => {
            face.classList.remove('active-face');
        });
        
        // Находим выпавшую грань и подсвечиваем ее
        const resultFace = diceElement.querySelector(`.face-${result}`);
        if (resultFace) {
            resultFace.classList.add('active-face');
        }
        
        // Также подсвечиваем весь кубик
        diceElement.classList.add('highlight');
        
        // Для каждого типа кубика своя анимация остановки
        let finalRotation = '';
        const randomX = Math.random() * 360;
        const randomY = Math.random() * 360;
        const randomZ = Math.random() * 360;
        
        switch(sides) {
            case 4:
                // Для d4 - тетраэдр
                finalRotation = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
                break;
            case 6:
                // Для d6 используем предопределенные позиции, чтобы выпавшая грань была сверху
                const rotations = {
                    1: 'rotateX(0deg) rotateY(0deg)',
                    2: 'rotateX(0deg) rotateY(180deg)',
                    3: 'rotateX(0deg) rotateY(90deg)',
                    4: 'rotateX(0deg) rotateY(-90deg)',
                    5: 'rotateX(90deg) rotateY(0deg)',
                    6: 'rotateX(-90deg) rotateY(0deg)'
                };
                finalRotation = rotations[result] || `rotateX(${randomX}deg) rotateY(${randomY}deg)`;
                break;
            case 8:
                // Для d8 - октаэдр
                finalRotation = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
                break;
            case 10:
                // Для d10
                finalRotation = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
                break;
            case 12:
                // Для d12 - додекаэдр
                finalRotation = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
                break;
            case 20:
                // Для d20 - икосаэдр
                finalRotation = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
                break;
            case 100:
                // Для d100 - сфера
                finalRotation = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
                break;
            default:
                finalRotation = `rotateX(${randomX}deg) rotateY(${randomY}deg) rotateZ(${randomZ}deg)`;
        }
        
        diceElement.style.transform = finalRotation;
        
        // Убираем подсветку через 2 секунды
        setTimeout(() => {
            diceElement.classList.remove('highlight');
            if (resultFace) {
                resultFace.classList.remove('active-face');
            }
        }, 2000);
    }

    // Показ числового результата
    showNumericResult(total, sides, count, modifier, results = []) {
        const resultContainer = document.getElementById('dice-result');
        const resultText = document.createElement('div');
        resultText.className = 'dice-result-text';
        
        let formula = '';
        if (count > 1 || modifier !== 0) {
            formula = `${count}d${sides}`;
            if (modifier > 0) {
                formula += ` + ${modifier}`;
            } else if (modifier < 0) {
                formula += ` - ${Math.abs(modifier)}`;
            }
        }
        
        resultText.innerHTML = `
            <div class="dice-result-number">${total}</div>
            <div class="dice-roll-details">
                ${count > 1 ? `Результаты: ${results.join(' + ')}` : ''}
                ${modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}
                ${formula ? ` (${formula})` : ''}
            </div>
        `;
        
        resultContainer.appendChild(resultText);
    }

    // Бросок с преимуществом/помехой
    async rollWithAdvantage(disadvantage = false) {
        const resultContainer = document.getElementById('dice-result');
        resultContainer.innerHTML = '';
        
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        
        const result = disadvantage ? Math.min(roll1, roll2) : Math.max(roll1, roll2);
        
        // Показываем оба броска
        const diceContainer = document.createElement('div');
        diceContainer.className = 'dice-3d-container';
        
        const dice1 = this.create3DDice(20);
        const dice2 = this.create3DDice(20);
        
        diceContainer.appendChild(dice1);
        diceContainer.appendChild(dice2);
        resultContainer.appendChild(diceContainer);
        
        // Запускаем анимацию
        dice1.classList.add('dice-rolling');
        dice2.classList.add('dice-rolling');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Останавливаем анимацию
        dice1.classList.remove('dice-rolling');
        dice2.classList.remove('dice-rolling');
        dice1.classList.add('dice-landed');
        dice2.classList.add('dice-landed');
        
        this.show3DDiceResult(dice1, roll1, 20);
        this.show3DDiceResult(dice2, roll2, 20);
        
        // Показываем итоговый результат
        const advantageText = document.createElement('div');
        advantageText.className = 'dice-result-text';
        advantageText.innerHTML = `
            <div class="dice-result-number">${result}</div>
            <div class="dice-roll-details">
                Бросок с ${disadvantage ? 'помехой' : 'преимуществом'}: 
                ${roll1} и ${roll2} → берём ${disadvantage ? 'низший' : 'высший'}
            </div>
        `;
        resultContainer.appendChild(advantageText);
        
        this.saveToDiceHistory([roll1, roll2], result, 20, 2, 0);
    }

    saveToDiceHistory(results, total, sides, count, modifier) {
        const rollData = {
            timestamp: new Date().toISOString(),
            results: results,
            total: total,
            sides: sides,
            count: count,
            modifier: modifier,
            time: new Date().toLocaleTimeString()
        };
        
        this.diceHistory.push(rollData);
        
        // Сохраняем только последние 50 бросков
        if (this.diceHistory.length > 50) {
            this.diceHistory = this.diceHistory.slice(-50);
        }
        
        localStorage.setItem('dnd_dice_history', JSON.stringify(this.diceHistory));
        this.renderDiceHistory();
    }

    renderDiceHistory() {
        const historyList = document.getElementById('dice-history-list');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        this.diceHistory.slice().reverse().forEach(roll => {
            const historyItem = document.createElement('div');
            historyItem.className = 'dice-history-item';
            
            let formula = `${roll.count}d${roll.sides}`;
            if (roll.modifier > 0) {
                formula += `+${roll.modifier}`;
            } else if (roll.modifier < 0) {
                formula += `${roll.modifier}`;
            }
            
            historyItem.innerHTML = `
                <div>
                    <strong>${formula}</strong>
                    <div class="dice-roll-details">
                        ${roll.count > 1 ? `${roll.results.join(' + ')}` : ''}
                        ${roll.modifier !== 0 ? ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}` : ''}
                    </div>
                </div>
                <div>
                    <div class="dice-result-number" style="font-size: 1.5em;">${roll.total}</div>
                    <div class="dice-history-time">${roll.time}</div>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    // Менеджер персонажей
    initCharacterManager() {
        this.characterManager = new CharacterManager(this.db, this.auth, this.gameDataLoader);
        const addCharacterBtn = document.getElementById('add-character');
        if (addCharacterBtn) {
            addCharacterBtn.addEventListener('click', () => {
                this.characterManager.showCharacterForm();
            });
        }
    }

    // Менеджер заклинаний
    initSpellsManager() {
        this.spellsManager = new SpellsManager(this.spellLoader);
    }

    // Загрузка заклинаний
    async loadSpells() {
        try {
            let spells = await this.spellLoader.loadFromFirestore();
            if (spells.length === 0) {
                spells = await this.spellLoader.loadFromJSON();
            }
            
            this.spellsManager.renderSpellsList(spells, this.currentSpellFilters);
            this.setupSpellsFilters();
        } catch (error) {
            console.error('Error loading spells:', error);
        }
    }

    setupSpellsFilters() {
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
                        char.cloudId = result.id;
                        await this.db.updateCharacter(char);
                    }
                }

                alert(`Успешно перенесено ${migratedCount} персонажей в облако`);
                this.loadCloudCharacters();
                
                // Скрываем кнопку миграции
                const migrateBtn = document.getElementById('migrate-data');
                if (migrateBtn) migrateBtn.style.display = 'none';
                
            } catch (error) {
                console.error('Migration error:', error);
                alert('Ошибка при переносе данных: ' + error.message);
            }
        }
    }
}

// Менеджер персонажей
class CharacterManager {
    constructor(db, auth, gameDataLoader) {
        this.db = db;
        this.auth = auth;
        this.gameDataLoader = gameDataLoader;
        this.characters = [];
        this.avatarFile = null;
    }

    async loadCharacters() {
        try {
            if (this.auth.isSignedIn()) {
                this.characters = await this.auth.getCloudCharacters();
            } else {
                this.characters = await this.db.getCharacters();
            }
            this.renderCharacters(this.characters);
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    }

    renderCharacters(characters) {
        const charactersList = document.getElementById('characters-list');
        if (!charactersList) return;
        
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
                            <span class="character-level">${character.class || 'Неизвестно'} ${character.level} ур.</span>
                        </div>
                        
                        <div class="character-details">
                            <div class="detail-item">
                                <span class="detail-label">Раса:</span>
                                <span class="detail-value">${character.race || 'Не указана'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Мировоззрение:</span>
                                <span class="detail-value">${character.alignment || 'Не указано'}</span>
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
                <div class="modal" style="max-width: 800px;">
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
                                        ${this.renderRaceOptions(character)}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-class">Класс *</label>
                                    <select id="character-class" required>
                                        <option value="">Выберите класс</option>
                                        ${this.renderClassOptions(character)}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-subclass">Подкласс</label>
                                    <select id="character-subclass">
                                        <option value="">Выберите подкласс</option>
                                        ${this.renderSubclassOptions(character)}
                                    </select>
                                    <small id="subclass-hint" class="form-hint" style="display: none;"></small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-level">Уровень *</label>
                                    <input type="number" id="character-level" value="${character?.level || 1}" 
                                           min="1" max="20" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-background">Предыстория</label>
                                    <select id="character-background">
                                        <option value="">Выберите предысторию</option>
                                        ${this.renderBackgroundOptions(character)}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-alignment">Мировоззрение</label>
                                    <select id="character-alignment">
                                        <option value="">Выберите мировоззрение</option>
                                        ${ALIGNMENTS.map(align => 
                                            `<option value="${align}" ${character?.alignment === align ? 'selected' : ''}>${align}</option>`
                                        ).join('')}
                                    </select>
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
                        
                        <!-- Навыки -->
                        <div class="form-section">
                            <label class="section-label">Навыки</label>
                            <div class="skills-grid" id="skills-container">
                                ${this.renderSkills(character)}
                            </div>
                        </div>
                        
                        <!-- Владения -->
                        <div class="form-section">
                            <label class="section-label">Владения</label>
                            <div class="proficiencies-grid">
                                <div class="form-group">
                                    <label>Языки</label>
                                    <div class="checkbox-group" id="languages-container">
                                        ${this.renderLanguageOptions(character)}
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>Инструменты</label>
                                    <div class="checkbox-group" id="tools-container">
                                        ${this.renderToolOptions(character)}
                                    </div>
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

    // Вспомогательные методы для рендеринга опций
    renderRaceOptions(character) {
        const races = this.gameDataLoader.getAvailableRaces();
        if (races.length === 0) {
            return '<option value="">Загрузка рас...</option>';
        }
        return races.map(race => 
            `<option value="${race.id}" ${character?.raceId === race.id ? 'selected' : ''}>
                ${race.name}
            </option>`
        ).join('');
    }

    renderClassOptions(character) {
        const classes = this.gameDataLoader.getAvailableClasses();
        if (classes.length === 0) {
            return '<option value="">Загрузка классов...</option>';
        }
        return classes.map(cls => 
            `<option value="${cls.id}" ${character?.classId === cls.id ? 'selected' : ''}>
                ${cls.name}
            </option>`
        ).join('');
    }

    renderSubclassOptions(character) {
        if (!character?.classId) return '';
        
        const availableSubclasses = this.gameDataLoader.getAvailableSubclasses(character);
        return availableSubclasses.map(subclass => 
            `<option value="${subclass.id}" ${character?.subclassId === subclass.id ? 'selected' : ''}>
                ${subclass.name}
            </option>`
        ).join('');
    }

    renderBackgroundOptions(character) {
        const backgrounds = this.gameDataLoader.getAvailableBackgrounds();
        if (backgrounds.length === 0) {
            return '<option value="">Загрузка предысторий...</option>';
        }
        return backgrounds.map(bg => 
            `<option value="${bg.id}" ${character?.backgroundId === bg.id ? 'selected' : ''}>
                ${bg.name}
            </option>`
        ).join('');
    }

    renderSkills(character) {
        let html = '';
        const skills = character?.skills || this.initializeSkills();
        
        for (const [skillId, skillData] of Object.entries(skills)) {
            const skillName = SKILL_NAMES[skillId] || skillId;
            const ability = this.getSkillAbility(skillId);
            const abilityName = ABILITY_NAMES[ability];
            
            html += `
                <div class="skill-item">
                    <label class="skill-checkbox">
                        <input type="checkbox" id="skill-${skillId}" 
                               ${skillData.proficient ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        ${skillName}
                        <small class="skill-ability">(${abilityName})</small>
                    </label>
                    <label class="expertise-checkbox">
                        <input type="checkbox" id="expertise-${skillId}" 
                               ${skillData.expertise ? 'checked' : ''}
                               ${!skillData.proficient ? 'disabled' : ''}>
                        <span class="checkmark expert"></span>
                        Эксперт
                    </label>
                </div>
            `;
        }
        return html;
    }

    renderLanguageOptions(character) {
        const languages = this.gameDataLoader.getAvailableLanguages();
        if (languages.length === 0) {
            return '<div class="checkbox-item">Загрузка языков...</div>';
        }
        return languages.map(lang => {
            const isSelected = character?.proficiencies?.languages?.includes(lang.id);
            return `
                <label class="checkbox-item">
                    <input type="checkbox" value="${lang.id}" 
                           ${isSelected ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    ${lang.name}
                </label>
            `;
        }).join('');
    }

    renderToolOptions(character) {
        const tools = this.gameDataLoader.getAvailableTools();
        if (tools.length === 0) {
            return '<div class="checkbox-item">Загрузка инструментов...</div>';
        }
        return tools.map(tool => {
            const isSelected = character?.proficiencies?.tools?.includes(tool.id);
            return `
                <label class="checkbox-item">
                    <input type="checkbox" value="${tool.id}" 
                           ${isSelected ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    ${tool.name}
                </label>
            `;
        }).join('');
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
        return 'intelligence';
    }

    renderAbilityInput(ability, label, character) {
        const value = character?.abilities?.[ability] || 10;
        const modifier = Math.floor((value - 10) / 2);
        return `
            <div class="ability-input">
                <label for="ability-${ability}">${label}</label>
                <input type="number" id="ability-${ability}" 
                       value="${value}" min="1" max="30" 
                       class="ability-score">
                <div class="ability-modifier">
                    Мод: ${modifier >= 0 ? '+' + modifier : modifier}
                </div>
            </div>
        `;
    }

    setupFormHandlers(character) {
        const form = document.getElementById('character-form');
        const avatarInput = document.getElementById('avatar-input');
        const avatarPreview = document.getElementById('avatar-preview');
        const classSelect = document.getElementById('character-class');
        const levelInput = document.getElementById('character-level');
        const subclassSelect = document.getElementById('character-subclass');
        const subclassHint = document.getElementById('subclass-hint');
        
        // Обработчик выбора аватара
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                        alert('Размер файла не должен превышать 2MB');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (avatarPreview) {
                            avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
                        }
                        this.avatarFile = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Обработчик изменения класса и уровня
        if (classSelect && levelInput && subclassSelect && subclassHint) {
            const updateSubclassOptions = () => {
                const classId = classSelect.value;
                const level = parseInt(levelInput.value) || 1;
                
                if (!classId) {
                    subclassSelect.innerHTML = '<option value="">Выберите подкласс</option>';
                    subclassHint.style.display = 'none';
                    return;
                }
                
                const tempCharacter = { classId, level };
                const availableSubclasses = this.gameDataLoader.getAvailableSubclasses(tempCharacter);
                
                subclassSelect.innerHTML = '<option value="">Выберите подкласс</option>';
                availableSubclasses.forEach(subclass => {
                    const option = document.createElement('option');
                    option.value = subclass.id;
                    option.textContent = subclass.name;
                    subclassSelect.appendChild(option);
                });
                
                // Показываем подсказку о доступности подклассов
                const classData = this.gameDataLoader.getClassById(classId);
                if (classData) {
                    const subclasses = classData.subclasses || [];
                    if (subclasses.length > 0) {
                        const minLevel = Math.min(...subclasses.map(s => s.availableAt || 3));
                        if (level < minLevel) {
                            subclassHint.textContent = `Подклассы доступны с ${minLevel} уровня`;
                            subclassHint.style.display = 'block';
                        } else {
                            subclassHint.style.display = 'none';
                        }
                    }
                }
            };
            
            classSelect.addEventListener('change', updateSubclassOptions);
            levelInput.addEventListener('input', updateSubclassOptions);
            
            // Инициализируем при загрузке
            updateSubclassOptions();
        }

        // Обработчик навыков
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id.startsWith('skill-')) {
                checkbox.addEventListener('change', (e) => {
                    const skillId = e.target.id.replace('skill-', '');
                    const expertiseCheckbox = document.getElementById(`expertise-${skillId}`);
                    if (expertiseCheckbox) {
                        expertiseCheckbox.disabled = !e.target.checked;
                        if (!e.target.checked) {
                            expertiseCheckbox.checked = false;
                        }
                    }
                });
            }
        });

        // Обработчик отправки формы
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCharacter();
            });
        }

        // Обновление модификаторов характеристик
        document.querySelectorAll('.ability-score').forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 10;
                const modifier = Math.floor((value - 10) / 2);
                const modifierElement = e.target.parentElement.querySelector('.ability-modifier');
                if (modifierElement) {
                    modifierElement.textContent = `Мод: ${modifier >= 0 ? '+' + modifier : modifier}`;
                }
            });
        });
    }

    removeAvatar() {
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) {
            avatarPreview.innerHTML = '<div class="avatar-placeholder">🎮</div>';
        }
        this.avatarFile = null;
        const avatarInput = document.getElementById('avatar-input');
        if (avatarInput) avatarInput.value = '';
    }

    async getCharacter(characterId) {
        if (this.auth.isSignedIn()) {
            return this.characters.find(char => char.id === characterId);
        } else {
            return await this.db.get('characters', parseInt(characterId));
        }
    }

    async saveCharacter() {
        const form = document.getElementById('character-form');
        const characterId = document.getElementById('character-id').value;
        
        if (!form) return;

        // Сбор данных формы
        const characterData = {
            name: document.getElementById('character-name').value,
            raceId: document.getElementById('character-race').value,
            race: this.gameDataLoader.getRaceById(document.getElementById('character-race').value)?.name || '',
            classId: document.getElementById('character-class').value,
            class: this.gameDataLoader.getClassById(document.getElementById('character-class').value)?.name || '',
            subclassId: document.getElementById('character-subclass').value,
            subclass: this.gameDataLoader.getSubclassesForClass(document.getElementById('character-class').value)
                        .find(sc => sc.id === document.getElementById('character-subclass').value)?.name || '',
            level: parseInt(document.getElementById('character-level').value),
            backgroundId: document.getElementById('character-background').value,
            background: this.gameDataLoader.getBackgroundById(document.getElementById('character-background').value)?.name || '',
            alignment: document.getElementById('character-alignment').value,
            gender: document.getElementById('character-gender')?.value || '',
            avatar: this.avatarFile,
            abilities: {
                strength: parseInt(document.getElementById('ability-strength').value),
                dexterity: parseInt(document.getElementById('ability-dexterity').value),
                constitution: parseInt(document.getElementById('ability-constitution').value),
                intelligence: parseInt(document.getElementById('ability-intelligence').value),
                wisdom: parseInt(document.getElementById('ability-wisdom').value),
                charisma: parseInt(document.getElementById('ability-charisma').value)
            },
            skills: this.collectSkillsData(),
            proficiencies: this.collectProficienciesData(),
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

    collectSkillsData() {
        const skills = this.initializeSkills();
        for (const skillId of Object.keys(skills)) {
            const skillCheckbox = document.getElementById(`skill-${skillId}`);
            const expertiseCheckbox = document.getElementById(`expertise-${skillId}`);
            
            if (skillCheckbox) {
                skills[skillId].proficient = skillCheckbox.checked;
            }
            if (expertiseCheckbox) {
                skills[skillId].expertise = expertiseCheckbox.checked;
            }
        }
        return skills;
    }

    collectProficienciesData() {
        const languages = [];
        const tools = [];
        
        // Собираем выбранные языки
        document.querySelectorAll('#languages-container input[type="checkbox"]:checked').forEach(checkbox => {
            languages.push(checkbox.value);
        });
        
        // Собираем выбранные инструменты
        document.querySelectorAll('#tools-container input[type="checkbox"]:checked').forEach(checkbox => {
            tools.push(checkbox.value);
        });
        
        return {
            languages,
            tools,
            armor: [],
            weapons: []
        };
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
