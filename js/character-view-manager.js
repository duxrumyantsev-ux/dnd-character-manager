class CharacterViewManager {
    static renderCharacterView(character) {
        const combat = character.combat || {};
        const abilities = character.abilities || {};
        
        return `
            <div class="character-view">
                <div class="character-view-header">
                    <div class="character-view-avatar">
                        ${character.avatar ? 
                            `<img src="${character.avatar}" alt="${character.name}" />` : 
                            '<div class="avatar-placeholder large">🎮</div>'
                        }
                    </div>
                    <div class="character-view-basic-info">
                        <h4>${character.race || 'Не указана'} • ${character.class || 'Неизвестно'} ${character.level || 1} ур.</h4>
                        <p><strong>Предыстория:</strong> ${character.background || 'Не указана'}</p>
                        <p><strong>Мировоззрение:</strong> ${character.alignment || 'Не указано'}</p>
                        <p><strong>Опыт:</strong> ${character.experience || 0}</p>
                    </div>
                </div>

                ${this.renderHealthSection(combat)}
                ${this.renderAbilitiesSection(abilities)}
                ${this.renderSkillsSection(character)}
                ${this.renderEquipmentSection(character)}
                ${this.renderDescriptionSection(character)}
            </div>
        `;
    }

    static renderHealthSection(combat) {
        return `
            <div class="character-view-section">
                <h4>❤️ Здоровье и защита</h4>
                <div class="character-view-stats">
                    <div class="stat-item">
                        <label>HP</label>
                        <span>${combat.currentHP || 0}/${combat.maxHP || 0}</span>
                    </div>
                    <div class="stat-item">
                        <label>Временные HP</label>
                        <span>${combat.temporaryHP || 0}</span>
                    </div>
                    <div class="stat-item">
                        <label>Класс брони</label>
                        <span>${combat.armorClass || 10}</span>
                    </div>
                    <div class="stat-item">
                        <label>Скорость</label>
                        <span>${combat.speed || 30} фт.</span>
                    </div>
                </div>
            </div>
        `;
    }

    static renderAbilitiesSection(abilities) {
        return `
            <div class="character-view-section">
                <h4>💪 Характеристики</h4>
                <div class="abilities-grid-view">
                    ${Object.entries(ABILITY_NAMES).map(([key, name]) => {
                        const value = abilities[key] || 10;
                        const modifier = Math.floor((value - 10) / 2);
                        return `
                            <div class="ability-view-item">
                                <div class="ability-name">${name}</div>
                                <div class="ability-value">${value}</div>
                                <div class="ability-modifier">${modifier >= 0 ? '+' + modifier : modifier}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    static renderSkillsSection(character) {
        const skillsHtml = this.renderSkillsView(character);
        return `
            <div class="character-view-section">
                <h4>🎯 Навыки</h4>
                <div class="skills-view">
                    ${skillsHtml}
                </div>
            </div>
        `;
    }

    static renderSkillsView(character) {
        const skills = character.skills || {};
        let html = '';
        
        for (const [skillId, skillData] of Object.entries(skills)) {
            if (skillData.proficient) {
                const skillName = SKILL_NAMES[skillId] || skillId;
                const ability = this.getSkillAbility(skillId);
                const abilityMod = Math.floor(((character.abilities?.[ability] || 10) - 10) / 2);
                const proficiencyBonus = Math.floor(((character.level || 1) - 1) / 4) + 2;
                const total = abilityMod + (skillData.proficient ? proficiencyBonus : 0) + (skillData.expertise ? proficiencyBonus : 0);
                
                html += `
                    <div class="skill-view-item">
                        <span class="skill-name">${skillName}</span>
                        <span class="skill-bonus">${total >= 0 ? '+' + total : total}</span>
                        ${skillData.expertise ? '<span class="expertise-badge" title="Эксперт">★</span>' : ''}
                    </div>
                `;
            }
        }
        
        return html || '<p>Нет выбранных навыков</p>';
    }

    static getSkillAbility(skill) {
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

    static renderEquipmentSection(character) {
        return `
            <div class="character-view-section">
                <h4>🎒 Снаряжение</h4>
                <div class="equipment-view">
                    ${character.equipment && character.equipment.length > 0 ? 
                        character.equipment.map(item => `
                            <div class="equipment-item-view">
                                <span class="equipment-name">${item.name || 'Предмет'}</span>
                                ${item.quantity ? `<span class="equipment-quantity">x${item.quantity}</span>` : ''}
                            </div>
                        `).join('') :
                        '<p>Снаряжение отсутствует</p>'
                    }
                </div>
            </div>
        `;
    }

    static renderDescriptionSection(character) {
        if (!character.personality && !character.appearance) return '';
        
        return `
            <div class="character-view-section">
                <h4>📝 Описание</h4>
                ${character.personality ? `<p><strong>Личность:</strong> ${character.personality}</p>` : ''}
                ${character.appearance ? `<p><strong>Внешность:</strong> ${character.appearance}</p>` : ''}
            </div>
        `;
    }
}