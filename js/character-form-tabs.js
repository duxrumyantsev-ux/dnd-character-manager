// character-form-tabs.js
class CharacterFormTabs {
    constructor(characterManager, character = null) {
        this.characterManager = characterManager;
        this.character = character;
        this.currentTab = 'basic';
        this.tabs = ['basic', 'abilities', 'equipment', 'spells'];
    }

    render() {
        return `
            <div class="character-form-tabs">
                <div class="tabs-navigation">
                    <button type="button" class="tab-nav-btn active" data-tab="basic">
                        <span class="tab-icon">📋</span>
                        Основное
                    </button>
                    <button type="button" class="tab-nav-btn" data-tab="abilities">
                        <span class="tab-icon">💪</span>
                        Способности
                    </button>
                    <button type="button" class="tab-nav-btn" data-tab="equipment">
                        <span class="tab-icon">🎒</span>
                        Снаряжение
                    </button>
                    <button type="button" class="tab-nav-btn" data-tab="spells">
                        <span class="tab-icon">✨</span>
                        Магия
                    </button>
                </div>
                
                <div class="tab-content-wrapper">
                    ${this.renderBasicTab()}
                    ${this.renderAbilitiesTab()}
                    ${this.renderEquipmentTab()}
                    ${this.renderSpellsTab()}
                </div>
            </div>
        `;
    }

    renderBasicTab() {
        const xpProgress = this.character ? Math.min((this.character.experience / this.getXPForNextLevel()) * 100, 100) : 0;
        
        return `
            <div id="tab-basic" class="tab-pane active">
                <!-- Аватар и основная информация -->
                <div class="form-section">
                    <label class="section-label">Внешность</label>
                    <div class="avatar-upload">
                        <div class="avatar-preview" id="avatar-preview">
                            ${this.character?.avatar ? 
                                `<img src="${this.character.avatar}" alt="Preview" />` : 
                                '<div class="avatar-placeholder">🎮</div>'
                            }
                        </div>
                        <div class="avatar-controls">
                            <input type="file" id="avatar-input" accept="image/*" style="display: none;">
                            <button type="button" class="btn-secondary" onclick="document.getElementById('avatar-input').click()">
                                📷 Выбрать изображение
                            </button>
                            ${this.character?.avatar ? `
                                <button type="button" class="btn-danger" onclick="app.characterManager.removeAvatar()">
                                    ❌ Удалить
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Основная информация в 2 колонки -->
                <div class="form-section">
                    <label class="section-label">Основная информация</label>
                    <div class="form-grid-2col">
                        <div class="form-group">
                            <label for="character-name">Имя персонажа *</label>
                            <input type="text" id="character-name" value="${this.character?.name || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="character-race">Раса *</label>
                            <select id="character-race" required>
                                <option value="">Выберите расу</option>
                                ${this.characterManager.renderRaceOptions(this.character)}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="character-class">Класс *</label>
                            <select id="character-class" required>
                                <option value="">Выберите класс</option>
                                ${this.characterManager.renderClassOptions(this.character)}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="character-subclass">Подкласс</label>
                            <select id="character-subclass">
                                <option value="">Выберите подкласс</option>
                                ${this.characterManager.renderSubclassOptions(this.character)}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="character-background">Предыстория</label>
                            <select id="character-background">
                                <option value="">Выберите предысторию</option>
                                ${this.characterManager.renderBackgroundOptions(this.character)}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="character-alignment">Мировоззрение</label>
                            <select id="character-alignment">
                                <option value="">Выберите мировоззрение</option>
                                ${ALIGNMENTS.map(align => 
                                    `<option value="${align}" ${this.character?.alignment === align ? 'selected' : ''}>${align}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Уровень и опыт -->
                <div class="form-section">
                    <label class="section-label">Уровень и опыт</label>
                    <div class="level-xp-container">
                        <div class="level-display">
                            <div class="level-circle">
                                <span class="level-number">${this.character?.level || 1}</span>
                                <span class="level-label">Уровень</span>
                            </div>
                        </div>
                        
                        <div class="xp-progress">
                            <label for="character-experience">Опыт: ${this.character?.experience || 0} / ${this.getXPForNextLevel()}</label>
                            <div class="xp-bar">
                                <div class="xp-fill" style="width: ${xpProgress}%"></div>
                            </div>
                            <input type="number" id="character-experience" value="${this.character?.experience || 0}" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="character-level">Уровень *</label>
                            <input type="number" id="character-level" value="${this.character?.level || 1}" min="1" max="20" required>
                        </div>
                    </div>
                </div>

                <!-- Здоровье и защита -->
                <div class="form-section">
                    <label class="section-label">Здоровье и защита</label>
                    <div class="health-defense-grid">
                        <div class="health-section">
                            <h4>Здоровье</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="character-max-hp">Макс. HP</label>
                                    <input type="number" id="character-max-hp" value="${this.character?.combat?.maxHP || 10}" min="1">
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-current-hp">Текущее HP</label>
                                    <input type="number" id="character-current-hp" value="${this.character?.combat?.currentHP || 10}" min="0">
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-temp-hp">Временные HP</label>
                                    <input type="number" id="character-temp-hp" value="${this.character?.combat?.temporaryHP || 0}" min="0">
                                </div>
                                
                                <div class="form-group">
                                    <label for="character-hit-dice">Кости хитов</label>
                                    <input type="text" id="character-hit-dice" value="${this.character?.combat?.hitDice || '1d8'}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="defense-section">
                            <h4>Защита</h4>
                            <div class="form-group">
                                <label for="character-armor-class">Класс брони</label>
                                <input type="number" id="character-armor-class" value="${this.character?.combat?.armorClass || 10}" min="1">
                            </div>
                            
                            <div class="death-saves">
                                <h5>Спасброски смерти</h5>
                                <div class="death-saves-grid">
                                    <div class="death-save-type">
                                        <label>Успехи</label>
                                        <div class="death-save-checks">
                                            ${[1,2,3].map(i => `
                                                <input type="checkbox" id="death-save-success-${i}" 
                                                    ${this.character?.combat?.deathSaves?.successes >= i ? 'checked' : ''}>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="death-save-type">
                                        <label>Неудачи</label>
                                        <div class="death-save-checks">
                                            ${[1,2,3].map(i => `
                                                <input type="checkbox" id="death-save-failure-${i}"
                                                    ${this.character?.combat?.deathSaves?.failures >= i ? 'checked' : ''}>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAbilitiesTab() {
        return `
            <div id="tab-abilities" class="tab-pane">
                <div class="form-section">
                    <label class="section-label">Основные характеристики</label>
                    <div class="abilities-grid-enhanced">
                        ${this.renderEnhancedAbilityInput('strength', '💪 Сила')}
                        ${this.renderEnhancedAbilityInput('dexterity', '🎯 Ловкость')}
                        ${this.renderEnhancedAbilityInput('constitution', '❤️ Телосложение')}
                        ${this.renderEnhancedAbilityInput('intelligence', '📚 Интеллект')}
                        ${this.renderEnhancedAbilityInput('wisdom', '👁️ Мудрость')}
                        ${this.renderEnhancedAbilityInput('charisma', '💫 Харизма')}
                    </div>
                </div>

                <div class="form-section">
                    <label class="section-label">Бонус владения</label>
                    <div class="proficiency-bonus-display">
                        <div class="proficiency-circle">
                            +${this.getProficiencyBonus()}
                        </div>
                        <span>Бонус владения</span>
                    </div>
                </div>

                <div class="form-section">
                    <label class="section-label">Спасброски</label>
                    <div class="saving-throws-grid">
                        ${Object.entries(ABILITY_NAMES).map(([ability, name]) => this.renderSavingThrow(ability, name)).join('')}
                    </div>
                </div>

                <div class="form-section">
                    <label class="section-label">Другие параметры</label>
                    <div class="other-stats-grid">
                        <div class="form-group">
                            <label for="character-speed">Скорость</label>
                            <input type="number" id="character-speed" value="${this.character?.combat?.speed || 30}" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="character-initiative">Бонус инициативы</label>
                            <input type="number" id="character-initiative" value="${this.character?.combat?.initiative || 0}">
                        </div>
                        
                        <div class="form-group">
                            <label>Пассивное восприятие</label>
                            <div class="passive-skill-value">${this.calculatePassivePerception()}</div>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <label class="section-label">Навыки</label>
                    <div class="skills-grid" id="skills-container">
                        ${this.characterManager.renderSkills(this.character)}
                    </div>
                </div>

                <div class="form-section">
                    <label class="section-label">Текущие состояния</label>
                    <div class="conditions-container">
                        <textarea id="character-conditions" placeholder="Опишите текущие состояния персонажа...">${this.character?.conditions || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    renderEquipmentTab() {
        return `
            <div id="tab-equipment" class="tab-pane">
                <div class="form-section">
                    <label class="section-label">Снаряжение</label>
                    <div class="equipment-management">
                        <div class="equipment-header">
                            <h4>Инвентарь</h4>
                            <button type="button" class="btn-secondary btn-sm" onclick="this.addEquipmentItem()">＋ Добавить</button>
                        </div>
                        <div id="equipment-list" class="equipment-list">
                            ${this.renderEquipmentList()}
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <label class="section-label">Кошелёк</label>
                    <div class="currency-grid">
                        <div class="currency-item">
                            <label for="currency-pp">Платиновые (ПМ)</label>
                            <input type="number" id="currency-pp" value="${this.character?.currency?.pp || 0}" min="0">
                        </div>
                        <div class="currency-item">
                            <label for="currency-gp">Золотые (ЗМ)</label>
                            <input type="number" id="currency-gp" value="${this.character?.currency?.gp || 0}" min="0">
                        </div>
                        <div class="currency-item">
                            <label for="currency-ep">Электрумовые (ЭМ)</label>
                            <input type="number" id="currency-ep" value="${this.character?.currency?.ep || 0}" min="0">
                        </div>
                        <div class="currency-item">
                            <label for="currency-sp">Серебряные (СМ)</label>
                            <input type="number" id="currency-sp" value="${this.character?.currency?.sp || 0}" min="0">
                        </div>
                        <div class="currency-item">
                            <label for="currency-cp">Медные (ММ)</label>
                            <input type="number" id="currency-cp" value="${this.character?.currency?.cp || 0}" min="0">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSpellsTab() {
        return `
            <div id="tab-spells" class="tab-pane">
                <div class="form-section">
                    <label class="section-label">Заклинания</label>
                    <div class="spellcasting-info">
                        <p>Эта вкладка доступна для магических классов. Выберите класс заклинателя для отображения параметров магии.</p>
                        <div class="spell-slots-container" id="spell-slots-container">
                            <!-- Слоты заклинаний будут генерироваться динамически -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEnhancedAbilityInput(ability, label) {
        const value = this.character?.abilities?.[ability] || 10;
        const modifier = Math.floor((value - 10) / 2);
        const modifierDisplay = modifier >= 0 ? `+${modifier}` : modifier;
        
        return `
            <div class="ability-card" data-ability="${ability}">
                <div class="ability-header">
                    <span class="ability-label">${label}</span>
                </div>
                <div class="ability-score-display">
                    <input type="number" class="ability-score-input" 
                           id="ability-${ability}" value="${value}" 
                           min="1" max="30" data-ability="${ability}">
                </div>
                <div class="ability-modifier">
                    <span class="modifier-value">${modifierDisplay}</span>
                </div>
            </div>
        `;
    }

    renderSavingThrow(ability, name) {
        const isProficient = this.character?.savingThrows?.[ability]?.proficient || false;
        const abilityMod = Math.floor(((this.character?.abilities?.[ability] || 10) - 10) / 2);
        const proficiencyBonus = this.getProficiencyBonus();
        const total = abilityMod + (isProficient ? proficiencyBonus : 0);
        
        return `
            <div class="saving-throw-item">
                <label class="saving-throw-checkbox">
                    <input type="checkbox" id="saving-throw-${ability}" ${isProficient ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    ${name}
                </label>
                <span class="saving-throw-modifier">${total >= 0 ? '+' + total : total}</span>
            </div>
        `;
    }

    renderEquipmentList() {
        if (!this.character?.equipment?.length) {
            return '<div class="empty-equipment">Снаряжение отсутствует</div>';
        }
        
        return this.character.equipment.map((item, index) => `
            <div class="equipment-item" data-index="${index}">
                <input type="text" class="equipment-name" value="${item.name || ''}" placeholder="Название предмета">
                <input type="text" class="equipment-quantity" value="${item.quantity || 1}" placeholder="1">
                <input type="text" class="equipment-weight" value="${item.weight || ''}" placeholder="Вес">
                <button type="button" class="btn-danger btn-sm" onclick="this.removeEquipmentItem(${index})">🗑️</button>
            </div>
        `).join('');
    }

    getProficiencyBonus() {
        const level = this.character?.level || 1;
        return Math.floor((level - 1) / 4) + 2;
    }

    calculatePassivePerception() {
        const wisdomMod = Math.floor(((this.character?.abilities?.wisdom || 10) - 10) / 2);
        const isProficient = this.character?.skills?.perception?.proficient || false;
        const hasExpertise = this.character?.skills?.perception?.expertise || false;
        const proficiencyBonus = this.getProficiencyBonus();
        
        let bonus = wisdomMod;
        if (isProficient) bonus += proficiencyBonus;
        if (hasExpertise) bonus += proficiencyBonus;
        
        return 10 + bonus;
    }

    getXPForNextLevel() {
        const level = this.character?.level || 1;
        const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
        return level < 20 ? xpTable[level] : 0;
    }
}