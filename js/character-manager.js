// Менеджер персонажей - отвечает за все операции с персонажами
class CharacterManager {
    constructor(db, auth, gameDataLoader) {
        this.db = db;
        this.auth = auth;
        this.gameDataLoader = gameDataLoader;
        this.characters = [];
        this.avatarFile = null;
        this.selectedCharacter = null;
        this.initSelectedCharacter();
    }

    // Управление выбранным персонажем
    initSelectedCharacter() {
        const savedCharacter = localStorage.getItem('dnd_selected_character');
        if (savedCharacter) {
            try {
                this.selectedCharacter = JSON.parse(savedCharacter);
                this.updateSelectedCharacterUI();
            } catch (error) {
                console.error('Error loading selected character:', error);
            }
        }
    }

    updateSelectedCharacterUI() {
        const selectedCharContainer = document.getElementById('selected-character-display');
        if (!selectedCharContainer) return;

        if (this.selectedCharacter) {
            selectedCharContainer.innerHTML = `
                <div class="selected-character-display">
                    <div class="selected-character-avatar">
                        ${this.selectedCharacter.avatar ? 
                            `<img src="${this.selectedCharacter.avatar}" alt="${this.selectedCharacter.name}" />` : 
                            '<div class="avatar-placeholder">🎮</div>'
                        }
                    </div>
                    <span class="selected-character-name">${this.selectedCharacter.name}</span>
                    <button class="btn-clear-selection" onclick="app.characterManager.clearSelectedCharacter()" title="Сбросить выбор">×</button>
                </div>
            `;
            selectedCharContainer.style.display = 'flex';
        } else {
            selectedCharContainer.style.display = 'none';
        }
    }

    clearSelectedCharacter() {
        this.selectedCharacter = null;
        localStorage.removeItem('dnd_selected_character');
        this.updateSelectedCharacterUI();
        this.renderCharacters(this.characters);
    }

    selectCharacter(character) {
        this.selectedCharacter = character;
        localStorage.setItem('dnd_selected_character', JSON.stringify(character));
        this.updateSelectedCharacterUI();
        this.renderCharacters(this.characters);
    }

    selectCharacterById(characterId) {
        const character = this.characters.find(char => char.id === characterId);
        if (character) {
            this.selectCharacter(character);
        }
    }

    // Загрузка и отображение персонажей
    async loadCharacters() {
        try {
            console.log('Loading characters...');
            
            if (this.auth.isSignedIn()) {
                console.log('User is signed in, loading cloud characters');
                this.characters = await this.auth.getCloudCharacters();
                console.log('Cloud characters loaded:', this.characters);
            } else {
                console.log('User is not signed in, loading local characters');
                this.characters = await this.db.getCharacters();
                console.log('Local characters loaded:', this.characters);
            }
            
            this.renderCharacters(this.characters);
        } catch (error) {
            console.error('Error loading characters:', error);
            this.renderCharacters([]);
        }
    }

    renderCharacters(characters) {
        const charactersList = document.getElementById('characters-list');
        if (!charactersList) {
            console.error('Characters list container not found');
            return;
        }
        
        console.log('Rendering characters:', characters);
        
        if (!characters || characters.length === 0) {
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

        try {
            charactersList.innerHTML = characters.map(character => this.renderCharacterCard(character)).join('');
            console.log('Characters rendered successfully');
        } catch (error) {
            console.error('Error rendering characters:', error);
            charactersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Ошибка загрузки</h3>
                    <p>Произошла ошибка при отображении персонажей</p>
                </div>
            `;
        }
    }

    renderCharacterCard(character) {
        const combat = character.combat || {};
        const maxHP = combat.maxHP || 10;
        const currentHP = combat.currentHP || maxHP;
        const hpPercent = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
        const hpColor = hpPercent > 70 ? '#4CAF50' : hpPercent > 30 ? '#FF9800' : '#F44336';
        
        // Экранируем ID для использования в HTML атрибутах
        const safeId = character.id.replace(/"/g, '&quot;');
        
        return `
            <div class="character-card" data-id="${safeId}">
                <div class="character-avatar">
                    ${character.avatar ? 
                        `<img src="${character.avatar}" alt="${character.name || 'Персонаж'}" />` : 
                        '<div class="avatar-placeholder">🎮</div>'
                    }
                </div>
                
                <div class="character-info">
                    <div class="character-header">
                        <h3 class="character-name">${character.name || 'Без имени'}</h3>
                        <span class="character-level">${character.class || 'Неизвестно'} ${character.level || 1} ур.</span>
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
                            <span class="hp-current">${currentHP}</span>
                            <span class="hp-separator">/</span>
                            <span class="hp-max">${maxHP}</span>
                            <span class="hp-text">HP</span>
                        </div>
                        <div class="hp-track">
                            <div class="hp-fill" style="width: ${hpPercent}%; background: ${hpColor}"></div>
                        </div>
                    </div>
                    
                    ${character.source === 'cloud' ? 
                        '<div class="cloud-badge">☁️ Облако</div>' : 
                        '<div class="local-badge">📱 Локально</div>'
                    }
                </div>
                
                <div class="character-actions">
                    <button class="btn-action btn-view" onclick="app.viewCharacter('${safeId}')" title="Просмотр">
                        👁️
                    </button>
                    <button class="btn-action btn-edit" onclick="app.characterManager.editCharacter('${safeId}')" title="Редактировать">
                        ✏️
                    </button>
                    ${this.selectedCharacter && this.selectedCharacter.id === character.id ? 
                        '<button class="btn-action btn-selected" title="Выбран">✅</button>' :
                        `<button class="btn-action btn-select" onclick="app.characterManager.selectCharacterById('${safeId}')" title="Выбрать">⭐</button>`
                    }
                    <button class="btn-action btn-delete" onclick="app.characterManager.deleteCharacter('${safeId}')" title="Удалить">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    // CRUD операции с персонажами
    async getCharacter(characterId) {
        console.log('=== GET CHARACTER DEBUG ===');
        console.log('Searching for character ID:', characterId);
        console.log('Available characters:', this.characters);
        
        // Ищем в загруженных персонажах
        let character = this.characters.find(char => char.id === characterId);
        
        if (character) {
            console.log('Character found in memory:', character);
            return character;
        }
        
        // Если не нашли в памяти, пробуем загрузить из базы (для локальных персонажей)
        if (!this.auth.isSignedIn()) {
            try {
                console.log('Trying to load from local database...');
                character = await this.db.get('characters', characterId);
                if (character) {
                    console.log('Character loaded from local database:', character);
                    return character;
                }
            } catch (error) {
                console.error('Error loading from local database:', error);
            }
        }
        
        console.log('Character not found with ID:', characterId);
        return null;
    }

    async showCharacterForm(characterId = null) {
        const character = characterId ? await this.getCharacter(characterId) : null;
        
        console.log('=== DEBUG showCharacterForm ===');
        console.log('Character ID:', characterId);
        console.log('Loaded character:', character);
        
        if (characterId && !character) {
            alert('Персонаж не найден');
            return;
        }
        
        // Создаем экземпляр формы с вкладками
        const formTabs = new CharacterFormTabs(this, character);
        
        const formHtml = `
            <div class="modal-overlay" id="character-modal">
                <div class="modal" style="max-width: 900px; max-height: 90vh;">
                    <div class="modal-header">
                        <h3>${character ? 'Редактирование персонажа' : 'Создание нового персонажа'}</h3>
                        <button class="btn-close" onclick="app.characterManager.closeForm()">×</button>
                    </div>
                    
                    <form id="character-form" class="character-form">
                        <input type="hidden" id="character-id" value="${character?.id || ''}">
                        
                        ${formTabs.render()}
                        
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
        
        console.log('=== Form setup complete ===');
    }

    // Сохранение состояния формы перед перерисовкой
    saveFormState() {
        const formState = {
            basic: {},
            abilities: {},
            skills: {},
            savingThrows: {},
            equipment: [],
            spellcasting: {}
        };

        // Сохраняем основные поля
        const basicFields = ['character-name', 'character-race', 'character-class', 
                            'character-subclass', 'character-background', 'character-alignment',
                            'character-level', 'character-experience', 'character-max-hp',
                            'character-current-hp', 'character-temp-hp', 'character-armor-class',
                            'character-speed', 'character-initiative', 'character-hit-dice'];
        
        basicFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) formState.basic[field] = element.value;
        });

        // Сохраняем характеристики
        Object.keys(ABILITY_NAMES).forEach(ability => {
            const element = document.getElementById(`ability-${ability}`);
            if (element) formState.abilities[ability] = element.value;
        });

        // Сохраняем навыки
        Object.keys(this.initializeSkills()).forEach(skill => {
            const skillCheckbox = document.getElementById(`skill-${skill}`);
            const expertiseCheckbox = document.getElementById(`expertise-${skill}`);
            if (skillCheckbox && expertiseCheckbox) {
                formState.skills[skill] = {
                    proficient: skillCheckbox.checked,
                    expertise: expertiseCheckbox.checked
                };
            }
        });

        // Сохраняем спасброски
        Object.keys(ABILITY_NAMES).forEach(ability => {
            const checkbox = document.getElementById(`saving-throw-${ability}`);
            if (checkbox) {
                formState.savingThrows[ability] = checkbox.checked;
            }
        });

        // Сохраняем снаряжение
        const equipmentItems = document.querySelectorAll('.equipment-item');
        equipmentItems.forEach(item => {
            const name = item.querySelector('.equipment-name')?.value;
            const quantity = item.querySelector('.equipment-quantity')?.value;
            const weight = item.querySelector('.equipment-weight')?.value;
            if (name) {
                formState.equipment.push({ name, quantity, weight });
            }
        });

        // Сохраняем аватар
        formState.avatar = this.avatarFile;

        return formState;
    }

    // Восстановление состояния формы после перерисовки
    restoreFormState(formState) {
        if (!formState) return;

        // Восстанавливаем основные поля
        Object.keys(formState.basic).forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = formState.basic[field];
        });

        // Восстанавливаем характеристики
        Object.keys(formState.abilities).forEach(ability => {
            const element = document.getElementById(`ability-${ability}`);
            if (element) {
                element.value = formState.abilities[ability];
                this.updateAbilityModifier(ability);
            }
        });

        // Восстанавливаем навыки
        Object.keys(formState.skills).forEach(skill => {
            const skillCheckbox = document.getElementById(`skill-${skill}`);
            const expertiseCheckbox = document.getElementById(`expertise-${skill}`);
            if (skillCheckbox && expertiseCheckbox) {
                skillCheckbox.checked = formState.skills[skill].proficient;
                expertiseCheckbox.checked = formState.skills[skill].expertise;
                expertiseCheckbox.disabled = !formState.skills[skill].proficient;
            }
        });

        // Восстанавливаем спасброски
        Object.keys(formState.savingThrows).forEach(ability => {
            const checkbox = document.getElementById(`saving-throw-${ability}`);
            if (checkbox) {
                checkbox.checked = formState.savingThrows[ability];
            }
        });

        // Восстанавливаем снаряжение
        if (formState.equipment.length > 0) {
            const equipmentList = document.getElementById('equipment-list');
            if (equipmentList) {
                equipmentList.innerHTML = '';
                formState.equipment.forEach(item => {
                    const itemHtml = `
                        <div class="equipment-item">
                            <input type="text" class="equipment-name" value="${item.name || ''}" placeholder="Название предмета">
                            <input type="text" class="equipment-quantity" value="${item.quantity || '1'}" placeholder="1">
                            <input type="text" class="equipment-weight" value="${item.weight || ''}" placeholder="Вес">
                            <button type="button" class="btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
                        </div>
                    `;
                    equipmentList.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        }

        // Восстанавливаем аватар
        if (formState.avatar) {
            this.avatarFile = formState.avatar;
            const avatarPreview = document.getElementById('avatar-preview');
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${formState.avatar}" alt="Preview" />`;
            }
        }
    }
    async editCharacter(characterId) {
        try {
            console.log('=== EDIT CHARACTER DEBUG ===');
            console.log('Editing character with ID:', characterId);
            const character = await this.getCharacter(characterId);
            if (!character) {
                alert('Персонаж не найден. ID: ' + characterId);
                return;
            }
            console.log('Loaded character for editing:', character);
            await this.showCharacterForm(characterId);
        } catch (error) {
            console.error('Error in editCharacter:', error);
            alert('Ошибка при загрузке персонажа для редактирования: ' + error.message);
        }
    }

    async deleteCharacter(characterId) {
        console.log('=== DELETE CHARACTER DEBUG ===');
        console.log('Deleting character with ID:', characterId);
        console.log('Current characters:', this.characters);
        
        const character = await this.getCharacter(characterId);
        if (!character) {
            alert('Персонаж не найден для удаления. ID: ' + characterId);
            return;
        }

        if (confirm(`Вы уверены, что хотите удалить персонажа "${character.name}"? Это действие нельзя отменить.`)) {
            try {
                let success;
                console.log('Character source:', character.source);

                if (character.source === 'cloud' && this.auth.isSignedIn()) {
                    console.log('Deleting cloud character...');
                    success = await this.auth.deleteCloudCharacter(characterId);
                } else {
                    console.log('Deleting local character...');
                    success = await this.db.deleteCharacter(characterId);
                }

                if (success) {
                    console.log('Character deleted successfully, reloading list...');
                    await this.loadCharacters();
                    // Если удаляемый персонаж был выбран, сбрасываем выбор
                    if (this.selectedCharacter && this.selectedCharacter.id === characterId) {
                        this.clearSelectedCharacter();
                    }
                    console.log('Character list reloaded');
                } else {
                    alert('Ошибка при удалении персонажа');
                }
            } catch (error) {
                console.error('Error deleting character:', error);
                alert('Ошибка при удалении персонажа: ' + error.message);
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

    // Вспомогательные методы для работы с навыками
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
    // Обновим метод updateSubclassOptions для работы с сохраненным состоянием
    updateSubclassOptions() {
        const classSelect = document.getElementById('character-class');
        const levelInput = document.getElementById('character-level');
        const subclassSelect = document.getElementById('character-subclass');
        
        if (!classSelect || !levelInput || !subclassSelect) return;

        const classId = classSelect.value;
        const level = parseInt(levelInput.value) || 1;
        
        if (!classId) {
            subclassSelect.innerHTML = '<option value="">Выберите подкласс</option>';
            return;
        }
        
        const tempCharacter = { classId, level };
        const availableSubclasses = this.gameDataLoader.getAvailableSubclasses(tempCharacter);
        
        // Сохраняем текущее значение подкласса
        const currentSubclass = subclassSelect.value;
        
        subclassSelect.innerHTML = '<option value="">Выберите подкласс</option>';
        availableSubclasses.forEach(subclass => {
            const option = document.createElement('option');
            option.value = subclass.id;
            option.textContent = subclass.name;
            subclassSelect.appendChild(option);
        });
        
        // Восстанавливаем выбранный подкласс, если он доступен
        if (currentSubclass && availableSubclasses.some(sc => sc.id === currentSubclass)) {
            subclassSelect.value = currentSubclass;
        }
    }
    // Обработчики формы
    setupFormHandlers(character) {
        const form = document.getElementById('character-form');
        const avatarInput = document.getElementById('avatar-input');
        const avatarPreview = document.getElementById('avatar-preview');
        const classSelect = document.getElementById('character-class');
        const levelInput = document.getElementById('character-level');
        const subclassSelect = document.getElementById('character-subclass');
        
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

        // Обработчики вкладок
        document.querySelectorAll('.tab-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                
                // Убираем активный класс у всех кнопок и вкладок
                document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Добавляем активный класс текущей кнопке и вкладке
                e.target.classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
            });
        });
        
        // Обновление модификаторов характеристик в реальном времени
        document.querySelectorAll('.ability-score-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateAbilityModifier(e.target.dataset.ability);
            });
            
            // Инициализируем модификаторы при загрузке
            const ability = input.dataset.ability;
            if (ability) {
                this.updateAbilityModifier(ability);
            }
        });

        // Обработчик изменения класса и уровня
        if (classSelect && levelInput && subclassSelect) {
            const updateSubclassOptions = () => {
                this.updateSubclassOptions();
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
    }
    initializeAllAbilityModifiers() {
        Object.keys(ABILITY_NAMES).forEach(ability => {
            this.updateAbilityModifier(ability);
        });
    }
    updateAbilityModifier(ability) {
        const input = document.getElementById(`ability-${ability}`);
        if (!input) return;
        
        const value = parseInt(input.value) || 10;
        const modifier = Math.floor((value - 10) / 2);
        const modifierDisplay = modifier >= 0 ? `+${modifier}` : modifier;
        
        const card = input.closest('.ability-card');
        if (card) {
            const modifierElement = card.querySelector('.modifier-value');
            if (modifierElement) {
                modifierElement.textContent = modifierDisplay;
            }
        }
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

    // Методы для работы с магией
    onClassChange() {
        console.log('=== DEBUG onClassChange START ===');
        
        // Сохраняем состояние формы перед перерисовкой
        const formState = this.saveFormState();
        console.log('Form state saved:', formState);
        
        // При изменении класса перерисовываем вкладки с задержкой
        setTimeout(() => {
            const characterModal = document.getElementById('character-modal');
            if (characterModal) {
                const formTabs = document.querySelector('.character-form-tabs');
                if (formTabs) {
                    const characterId = document.getElementById('character-id').value;
                    
                    // Создаем временный объект персонажа с текущими данными из формы
                    const currentClassId = document.getElementById('character-class')?.value;
                    const currentLevel = parseInt(document.getElementById('character-level')?.value) || 1;
                    const classData = this.gameDataLoader.getClassById(currentClassId);
                    
                    console.log('Current class ID from form:', currentClassId);
                    console.log('Current level from form:', currentLevel);
                    console.log('Class data:', classData);
                    
                    const tempCharacter = { 
                        classId: currentClassId,
                        class: classData?.name || '', // Используем русское название
                        level: currentLevel
                    };
                    
                    console.log('Temp character for form tabs:', tempCharacter);
                    
                    const newFormTabs = new CharacterFormTabs(this, tempCharacter);
                    formTabs.outerHTML = newFormTabs.render();
                    
                    // Восстанавливаем состояние формы
                    this.restoreFormState(formState);
                    this.setupFormHandlers(tempCharacter);
                    
                    // Обновляем подклассы на основе нового класса
                    this.updateSubclassOptions();
                    
                    console.log('=== DEBUG onClassChange COMPLETE ===');
                } else {
                    console.error('Form tabs element not found');
                }
            } else {
                console.error('Character modal not found');
            }
        }, 100);
    }

    onLevelChange() {
        console.log('=== DEBUG onLevelChange START ===');
        
        // Сохраняем состояние формы перед перерисовкой
        const formState = this.saveFormState();
        
        // При изменении уровня перерисовываем вкладки с задержкой
        setTimeout(() => {
            const characterModal = document.getElementById('character-modal');
            if (characterModal) {
                const formTabs = document.querySelector('.character-form-tabs');
                if (formTabs) {
                    const characterId = document.getElementById('character-id').value;
                    
                    // Создаем временный объект персонажа с текущими данными из формы
                    const currentClassId = document.getElementById('character-class')?.value;
                    const currentLevel = parseInt(document.getElementById('character-level')?.value) || 1;
                    const classData = this.gameDataLoader.getClassById(currentClassId);
                    
                    console.log('Current class ID from form:', currentClassId);
                    console.log('Current level from form:', currentLevel);
                    console.log('Class data:', classData);
                    
                    const tempCharacter = { 
                        classId: currentClassId,
                        class: classData?.name || '', // Используем русское название
                        level: currentLevel
                    };
                    
                    const newFormTabs = new CharacterFormTabs(this, tempCharacter);
                    formTabs.outerHTML = newFormTabs.render();
                    
                    // Восстанавливаем состояние формы
                    this.restoreFormState(formState);
                    this.setupFormHandlers(tempCharacter);
                    
                    console.log('=== DEBUG onLevelChange COMPLETE ===');
                }
            }
        }, 100);
    }

    async applySpellFilters(preloadedSpells = null) {
        try {
            let spells = preloadedSpells || await spellLoader.loadFromFirestore();
            if (spells.length === 0 && !preloadedSpells) {
                spells = await spellLoader.loadFromJSON();
            }

            const character = this.getCurrentFormCharacter();
            if (!character) return;

            // Получаем класс персонажа
            const classData = this.gameDataLoader.getClassById(character.classId);
            const className = classData?.name;
            
            console.log('=== DEBUG applySpellFilters ===');
            console.log('Character class:', className);
            console.log('All spells count:', spells.length);

            // Фильтруем заклинания по классу персонажа
            let filteredSpells = spells.filter(spell => {
                return spell.classes && spell.classes.includes(className);
            });

            console.log('After class filter:', filteredSpells.length);

            // Применяем фильтр по уровню
            const levelFilter = document.getElementById('spell-level-filter');
            if (levelFilter && levelFilter.value !== 'all') {
                const level = parseInt(levelFilter.value);
                filteredSpells = filteredSpells.filter(spell => spell.level === level);
                console.log('After level filter:', filteredSpells.length);
            }

            // Применяем фильтр по поиску
            const searchFilter = document.getElementById('spell-search');
            if (searchFilter && searchFilter.value) {
                const searchTerm = searchFilter.value.toLowerCase();
                filteredSpells = filteredSpells.filter(spell => 
                    spell.name.toLowerCase().includes(searchTerm) ||
                    (spell.description && spell.description.toLowerCase().includes(searchTerm))
                );
                console.log('After search filter:', filteredSpells.length);
            }

            // Сортируем по уровню (возрастание)
            filteredSpells.sort((a, b) => a.level - b.level);

            this.renderSpellSelectionList(filteredSpells);
        } catch (error) {
            console.error('Error applying spell filters:', error);
        }
    }

    // Метод для отображения модального окна выбора заклинаний
    showSpellSelectionModal() {
        const character = this.getCurrentFormCharacter();
        if (!character) {
            alert('Персонаж не найден');
            return;
        }

        const advancedChar = new AdvancedCharacter(character);
        const knownSpellsCount = advancedChar.getKnownSpellsCount();
        const currentSpellsCount = character.spells?.length || 0;
        
        const remainingSlots = knownSpellsCount === 'all' ? '∞' : Math.max(0, knownSpellsCount - currentSpellsCount);

        const modalHtml = `
            <div class="modal-overlay" id="spell-selection-modal">
                <div class="modal" style="max-width: 1000px; max-height: 90vh;">
                    <div class="modal-header">
                        <h3>Выбор заклинаний 
                            <span style="font-size: 14px; color: var(--text-muted); margin-left: 10px;">
                                (Доступно слотов: ${remainingSlots})
                            </span>
                        </h3>
                        <button class="btn-close" onclick="app.characterManager.closeSpellSelectionModal()">×</button>
                    </div>
                    
                    <div class="modal-content">
                        <div class="spells-filters">
                            <div class="filter-group">
                                <label for="spell-level-filter">Уровень:</label>
                                <select id="spell-level-filter">
                                    <option value="all">Все уровни</option>
                                    <option value="0">Заговоры</option>
                                    <option value="1">1 уровень</option>
                                    <option value="2">2 уровень</option>
                                    <option value="3">3 уровень</option>
                                    <option value="4">4 уровень</option>
                                    <option value="5">5 уровень</option>
                                    <option value="6">6 уровень</option>
                                    <option value="7">7 уровень</option>
                                    <option value="8">8 уровень</option>
                                    <option value="9">9 уровень</option>
                                </select>
                            </div>
                            
                            <div class="filter-group search-group">
                                <label for="spell-search">Поиск:</label>
                                <input type="text" id="spell-search" placeholder="Название или описание...">
                            </div>
                        </div>
                        
                        <div id="spell-selection-list" class="spells-list" style="max-height: 500px; overflow-y: auto;">
                            <!-- Список заклинаний будет загружен здесь -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Добавляем обработчики фильтров
        setTimeout(() => {
            const levelFilter = document.getElementById('spell-level-filter');
            const searchFilter = document.getElementById('spell-search');
            
            if (levelFilter) {
                levelFilter.addEventListener('change', () => this.applySpellFilters());
            }
            if (searchFilter) {
                searchFilter.addEventListener('input', () => this.applySpellFilters());
            }
        }, 100);
        
        this.loadSpellsForSelection();
    }

    async loadSpellsForSelection() {
        try {
            let spells = await spellLoader.loadFromFirestore();
            if (spells.length === 0) {
                spells = await spellLoader.loadFromJSON();
            }
            
            this.applySpellFilters(spells);
        } catch (error) {
            console.error('Error loading spells for selection:', error);
            document.getElementById('spell-selection-list').innerHTML = '<p>Ошибка загрузки заклинаний</p>';
        }
    }

    // Добавим метод группировки заклинаний по уровням
    groupSpellsByLevel(spells) {
        return spells.reduce((groups, spell) => {
            const level = spell.level.toString();
            if (!groups[level]) {
                groups[level] = [];
            }
            groups[level].push(spell);
            return groups;
        }, {});
    }

    renderSpellSelectionList(spells) {
        const spellsList = document.getElementById('spell-selection-list');
        if (!spellsList) return;

        const character = this.getCurrentFormCharacter();
        if (!character) return;

        const advancedChar = new AdvancedCharacter(character);
        const knownSpellsCount = advancedChar.getKnownSpellsCount();
        const currentSpellsCount = character.spells?.length || 0;

        // Проверяем ограничение по количеству заклинаний
        const canAddMore = knownSpellsCount === 'all' || currentSpellsCount < knownSpellsCount;
        const remainingSlots = knownSpellsCount === 'all' ? '∞' : Math.max(0, knownSpellsCount - currentSpellsCount);

        if (!canAddMore && knownSpellsCount !== 'all') {
            spellsList.innerHTML = `
                <div class="empty-state">
                    <p>Достигнуто максимальное количество известных заклинаний: ${knownSpellsCount}</p>
                    <p>Удалите некоторые заклинания перед добавлением новых.</p>
                </div>
            `;
            return;
        }

        if (!spells.length) {
            spellsList.innerHTML = `
                <div class="empty-state">
                    <p>Заклинания не найдены</p>
                    <p>Попробуйте изменить параметры фильтрации</p>
                </div>
            `;
            return;
        }

        // Группируем заклинания по уровням
        const spellsByLevel = this.groupSpellsByLevel(spells);
        
        let html = '';
        
        // Рендерим заклинания по уровням
        Object.keys(spellsByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
            const levelSpells = spellsByLevel[level];
            const levelName = level === '0' ? 'Заговоры' : `${level} уровень`;
            
            html += `
                <div class="spell-level-section">
                    <h3 class="spell-level-title">${levelName}</h3>
                    <div class="spells-grid">
                        ${levelSpells.map(spell => {
                            const isAlreadyKnown = character.spells?.some(s => s.id === spell.id);
                            const canAddThisSpell = !isAlreadyKnown && canAddMore;
                            
                            return `
                                <div class="spell-card ${isAlreadyKnown ? 'already-known' : ''}">
                                    <div class="spell-header">
                                        <h4 class="spell-name">${spell.name}</h4>
                                        <span class="spell-level">${spell.level === 0 ? 'Заговор' : spell.level + ' уровень'}</span>
                                    </div>
                                    
                                    <div class="spell-details">
                                        <span class="spell-school">${spell.school}</span>
                                    </div>
                                    
                                    <div class="spell-info">
                                        <div class="spell-property">
                                            <span class="property-label">Время накладывания:</span>
                                            <span class="property-value">${spell.castingTime}</span>
                                        </div>
                                        <div class="spell-property">
                                            <span class="property-label">Дистанция:</span>
                                            <span class="property-value">${spell.range}</span>
                                        </div>
                                        <div class="spell-property">
                                            <span class="property-label">Компоненты:</span>
                                            <span class="property-value">${spell.components}</span>
                                        </div>
                                        <div class="spell-property">
                                            <span class="property-label">Длительность:</span>
                                            <span class="property-value">${spell.duration}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="spell-actions">
                                        <button type="button" class="btn-view-spell" onclick="app.characterManager.viewSpellDetails('${spell.id}')">
                                            Просмотр
                                        </button>
                                        ${!isAlreadyKnown ? `
                                            <button type="button" class="btn-add-to-character" 
                                                    onclick="app.characterManager.addSpellToCharacter('${spell.id}')"
                                                    ${!canAddThisSpell ? 'disabled' : ''}>
                                                Добавить
                                            </button>
                                        ` : `
                                            <button type="button" class="btn-add-to-character" disabled>
                                                Уже известно
                                            </button>
                                        `}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        spellsList.innerHTML = html;
    }

    getCurrentFormCharacter() {
        // Получаем данные персонажа из текущей формы
        const characterId = document.getElementById('character-id')?.value;
        if (characterId) {
            return this.characters.find(c => c.id === characterId);
        }
        return null;
    }

    // Добавим метод для обновления счетчика известных заклинаний
    updateKnownSpellsCount() {
        const character = this.getCurrentFormCharacter();
        if (!character) return;

        const advancedChar = new AdvancedCharacter(character);
        const knownSpellsCount = advancedChar.getKnownSpellsCount();
        const currentSpellsCount = character.spells?.length || 0;

        const knownSpellsDisplay = document.querySelector('.known-spells-display');
        if (knownSpellsDisplay) {
            knownSpellsDisplay.textContent = `${currentSpellsCount} / ${knownSpellsCount === 'all' ? 'все' : knownSpellsCount}`;
        }
    }

    async addSpellToCharacter(spellId) {
        const character = this.getCurrentFormCharacter();
        if (!character) {
            alert('Персонаж не найден');
            return;
        }

        try {
            // Загружаем информацию о заклинании
            let spells = await spellLoader.loadFromFirestore();
            if (spells.length === 0) {
                spells = await spellLoader.loadFromJSON();
            }

            const spell = spells.find(s => s.id === spellId);
            if (!spell) {
                alert('Заклинание не найдено');
                return;
            }

            // Проверяем ограничения
            const advancedChar = new AdvancedCharacter(character);
            const knownSpellsCount = advancedChar.getKnownSpellsCount();
            const currentSpellsCount = character.spells?.length || 0;

            if (knownSpellsCount !== 'all' && currentSpellsCount >= knownSpellsCount) {
                alert(`Достигнуто максимальное количество известных заклинаний: ${knownSpellsCount}`);
                return;
            }

            // Добавляем заклинание
            if (!character.spells) {
                character.spells = [];
            }

            // Проверяем, не добавлено ли уже это заклинание
            if (character.spells.some(s => s.id === spellId)) {
                alert('Это заклинание уже известно персонажу');
                return;
            }

            character.spells.push(spell);
            
            // Немедленно обновляем отображение
            this.updateSpellsList();
            this.updateKnownSpellsCount();
            
            // Перезагружаем список заклинаний в модальном окне
            this.applySpellFilters();
            
            // Показываем сообщение об успехе
            alert(`Заклинание "${spell.name}" успешно добавлено!`);
            
        } catch (error) {
            console.error('Error adding spell to character:', error);
            alert('Ошибка при добавлении заклинания: ' + error.message);
        }
    }

    removeSpell(spellIndex) {
        const character = this.getCurrentFormCharacter();
        if (!character || !character.spells) return;

        if (confirm('Удалить это заклинание?')) {
            character.spells.splice(spellIndex, 1);
            this.updateSpellsList();
        }
    }

    updateSpellsList() {
        const spellsList = document.getElementById('spells-list');
        if (!spellsList) return;

        const character = this.getCurrentFormCharacter();
        if (!character) return;

        const formTabs = new CharacterFormTabs(this, character);
        spellsList.innerHTML = formTabs.renderSpellsList();
    }

    closeSpellSelectionModal() {
        const modal = document.getElementById('spell-selection-modal');
        if (modal) {
            modal.remove();
        }
    }

    viewSpellDetails(spellId) {
        // Используем существующий функционал просмотра заклинаний
        if (window.spellsManager) {
            window.spellsManager.showSpellDetails(spellId);
        }
    }

    toggleSpellSlot(level, index) {
        const character = this.getCurrentFormCharacter();
        if (!character || !character.spellcasting) return;

        const slot = character.spellcasting.slots[level];
        if (!slot) return;

        // Переключаем состояние ячейки
        const newUsed = slot.used;
        if (index < slot.used) {
            newUsed = index; // Сбрасываем все ячейки после этой
        } else {
            newUsed = index + 1; // Заполняем до этой ячейки
        }

        character.spellcasting.slots[level].used = Math.max(0, Math.min(newUsed, slot.total));
        this.updateSpellSlotsDisplay();
    }

    updateSpellSlotsDisplay() {
        const slotsContainer = document.querySelector('.spell-slots-container');
        if (!slotsContainer) return;

        const character = this.getCurrentFormCharacter();
        if (!character) return;

        const formTabs = new CharacterFormTabs(this, character);
        slotsContainer.innerHTML = formTabs.renderSpellSlots();
    }

    // Методы для снаряжения
    addEquipmentItem() {
        const equipmentList = document.getElementById('equipment-list');
        if (!equipmentList) return;

        const newItemHtml = `
            <div class="equipment-item" data-index="new">
                <input type="text" class="equipment-name" placeholder="Название предмета">
                <input type="text" class="equipment-quantity" value="1" placeholder="1">
                <input type="text" class="equipment-weight" placeholder="Вес">
                <button type="button" class="btn-danger btn-sm" onclick="this.parentElement.remove()">🗑️</button>
            </div>
        `;

        equipmentList.insertAdjacentHTML('beforeend', newItemHtml);
    }

    removeEquipmentItem(index) {
        const equipmentItem = document.querySelector(`.equipment-item[data-index="${index}"]`);
        if (equipmentItem) {
            equipmentItem.remove();
        }
    }

    async saveCharacter() {
        const form = document.getElementById('character-form');
        const characterId = document.getElementById('character-id').value;
        
        if (!form) return;

        // Получаем ID и название класса
        const classId = document.getElementById('character-class').value;
        const classData = this.gameDataLoader.getClassById(classId);
        
        console.log('=== DEBUG saveCharacter ===');
        console.log('Class ID:', classId);
        console.log('Class data:', classData);
        
        // Сбор данных формы
        const characterData = {
            name: document.getElementById('character-name').value,
            raceId: document.getElementById('character-race').value,
            race: this.gameDataLoader.getRaceById(document.getElementById('character-race').value)?.name || '',
            classId: classId,
            class: classData?.name || '', // Используем русское название из gameDataLoader
            subclassId: document.getElementById('character-subclass').value,
            subclass: this.gameDataLoader.getSubclassesForClass(classId)
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
            equipment: this.collectEquipmentData(),
            spells: this.getCurrentFormCharacter()?.spells || [],
            spellcasting: this.collectSpellcastingData(),
            updatedAt: new Date()
        };

        console.log('Character data to save:', characterData);
        
        try {
            let success;
            
            if (characterId) {
                // Редактирование существующего персонажа
                characterData.id = characterId;
                
                if (this.auth.isSignedIn()) {
                    // Сохраняем в облако
                    const result = await this.auth.syncCharacterToCloud(characterData);
                    success = result.success;
                } else {
                    // Сохраняем локально
                    const existingCharacter = await this.db.get('characters', characterId);
                    const updatedCharacter = { ...existingCharacter, ...characterData };
                    await this.db.updateCharacter(updatedCharacter);
                    success = true;
                }
            } else {
                // Создание нового персонажа
                if (this.auth.isSignedIn()) {
                    // Создаем в облако
                    const result = await this.auth.syncCharacterToCloud(characterData);
                    success = result.success;
                } else {
                    // Создаем локально
                    await this.db.addCharacter(characterData);
                    success = true;
                }
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

    collectEquipmentData() {
        const equipment = [];
        document.querySelectorAll('.equipment-item').forEach(item => {
            const name = item.querySelector('.equipment-name')?.value;
            const quantity = item.querySelector('.equipment-quantity')?.value;
            const weight = item.querySelector('.equipment-weight')?.value;
            
            if (name) {
                equipment.push({
                    name,
                    quantity: quantity || 1,
                    weight: weight || ''
                });
            }
        });
        return equipment;
    }

    collectSpellcastingData() {
        const character = this.getCurrentFormCharacter();
        if (!character) return this.initializeSpellcasting();

        const advancedChar = new AdvancedCharacter(character);
        advancedChar.updateSpellcasting();
        return advancedChar.spellcasting;
    }

    initializeSpellcasting() {
        return {
            ability: '',
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
}
