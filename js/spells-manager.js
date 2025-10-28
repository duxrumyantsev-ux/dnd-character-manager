class SpellsManager {
    constructor(spellLoader) {
        this.spellLoader = spellLoader;
    }

    // Рендер списка заклинаний на главной вкладке
    renderSpellsList(spells, filters = {}) {
        const spellsList = document.getElementById('spells-list');
        
        if (spells.length === 0) {
            spellsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>Заклинания не найдены</h3>
                    <p>Попробуйте изменить параметры фильтрации</p>
                </div>
            `;
            return;
        }

        // Группируем заклинания по уровням
        const spellsByLevel = this.groupSpellsByLevel(spells);
        
        let html = '';
        
        Object.keys(spellsByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
            const levelSpells = spellsByLevel[level];
            const levelName = level === '0' ? 'Заговоры' : `${level} уровень`;
            
            html += `
                <div class="spell-level-section">
                    <h3 class="spell-level-title">${levelName}</h3>
                    <div class="spells-grid">
                        ${levelSpells.map(spell => this.renderSpellCard(spell)).join('')}
                    </div>
                </div>
            `;
        });

        spellsList.innerHTML = html;
        
        // Добавляем обработчики для карточек
        this.setupSpellCardHandlers();
    }

    groupSpellsByLevel(spells) {
        return spells.reduce((groups, spell) => {
            const level = spell.level;
            if (!groups[level]) {
                groups[level] = [];
            }
            groups[level].push(spell);
            return groups;
        }, {});
    }

    renderSpellCard(spell) {
        const levelText = spell.level === 0 ? 'Заговор' : `${spell.level} ур.`;
        const classesText = spell.classes.join(', ');
        
        return `
            <div class="spell-card" data-spell-id="${spell.id}">
                <div class="spell-header">
                    <h4 class="spell-name">${spell.name}</h4>
                    <span class="spell-level">${levelText}</span>
                </div>
                
                <div class="spell-details">
                    <div class="spell-school">${spell.school}</div>
                    <div class="spell-classes">${classesText}</div>
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
                        <span class="property-value">${spell.components.join(', ')}</span>
                    </div>
                    <div class="spell-property">
                        <span class="property-label">Длительность:</span>
                        <span class="property-value">${spell.duration}</span>
                    </div>
                </div>
                
                <div class="spell-actions">
                    <button class="btn-view-spell" data-spell-id="${spell.id}">
                        📖 Подробнее
                    </button>
                    <button class="btn-add-to-character" data-spell-id="${spell.id}">
                        ➕ Добавить персонажу
                    </button>
                </div>
            </div>
        `;
    }

    setupSpellCardHandlers() {
        // Просмотр подробной информации о заклинании
        document.querySelectorAll('.btn-view-spell').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spellId = e.target.dataset.spellId;
                this.showSpellDetails(spellId);
            });
        });

        // Добавление заклинания персонажу
        document.querySelectorAll('.btn-add-to-character').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spellId = e.target.dataset.spellId;
                this.addSpellToCharacter(spellId);
            });
        });
    }

    // Показать детальную информацию о заклинании
    showSpellDetails(spellId) {
        const spell = this.spellLoader.getSpellById(spellId);
        if (!spell) return;

        const modalHtml = `
            <div class="modal-overlay" id="spell-details-modal">
                <div class="modal spell-modal">
                    <div class="modal-header">
                        <h3>${spell.name}</h3>
                        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    
                    <div class="spell-details-content">
                        <div class="spell-basic-info">
                            <div class="spell-level-badge level-${spell.level}">
                                ${spell.level === 0 ? 'Заговор' : `${spell.level} уровень`}
                            </div>
                            <div class="spell-school-badge">${spell.school}</div>
                            ${spell.concentration ? '<div class="concentration-badge">Концентрация</div>' : ''}
                            ${spell.ritual ? '<div class="ritual-badge">Ритуал</div>' : ''}
                        </div>
                        
                        <div class="spell-properties-grid">
                            <div class="property">
                                <strong>Время накладывания:</strong> ${spell.castingTime}
                            </div>
                            <div class="property">
                                <strong>Дистанция:</strong> ${spell.range}
                            </div>
                            <div class="property">
                                <strong>Компоненты:</strong> ${spell.components.join(', ')}
                            </div>
                            <div class="property">
                                <strong>Длительность:</strong> ${spell.duration}
                            </div>
                        </div>
                        
                        ${spell.material ? `
                            <div class="spell-material">
                                <strong>Материальные компоненты:</strong> ${spell.material}
                            </div>
                        ` : ''}
                        
                        <div class="spell-classes">
                            <strong>Классы:</strong> ${spell.classes.join(', ')}
                        </div>
                        
                        <div class="spell-description">
                            <p>${spell.description}</p>
                        </div>
                        
                        ${spell.atHigherLevels ? `
                            <div class="spell-higher-levels">
                                <strong>На высших уровнях:</strong>
                                <p>${spell.atHigherLevels}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="spellsManager.addSpellToCharacter('${spell.id}')">
                            Добавить персонажу
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

    // Добавление заклинания персонажу
    addSpellToCharacter(spellId) {
        if (!app.characterManager) {
            alert('Сначала создайте персонажа или откройте существующего для редактирования');
            return;
        }

        const spell = this.spellLoader.getSpellById(spellId);
        if (!spell) return;

        // Здесь будет логика добавления заклинания к текущему редактируемому персонажу
        // Пока просто покажем сообщение
        alert(`Заклинание "${spell.name}" будет добавлено персонажу`);
        
        // Закрываем модальное окно, если открыто
        const modal = document.getElementById('spell-details-modal');
        if (modal) {
            modal.remove();
        }
    }
}

const spellsManager = new SpellsManager(spellLoader);