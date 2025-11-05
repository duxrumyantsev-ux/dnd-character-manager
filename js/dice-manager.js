class DiceManager {
    constructor() {
        this.diceHistory = JSON.parse(localStorage.getItem('dnd_dice_history') || '[]');
        this.init();
    }

    init() {
        this.setupDiceHandlers();
        this.renderDiceHistory();
    }

    setupDiceHandlers() {
        document.querySelectorAll('.dice').forEach(button => {
            button.addEventListener('click', (e) => {
                const sides = parseInt(e.target.dataset.sides);
                this.rollDice(sides);
            });
        });
        
        document.getElementById('roll-custom')?.addEventListener('click', () => {
            const count = parseInt(document.getElementById('dice-count').value) || 1;
            const sides = parseInt(document.getElementById('dice-sides').value) || 6;
            const modifier = parseInt(document.getElementById('dice-modifier').value) || 0;
            this.rollMultipleDice(sides, count, modifier);
        });
        
        document.getElementById('roll-advantage')?.addEventListener('click', () => {
            this.rollWithAdvantage(false);
        });
        
        document.getElementById('roll-disadvantage')?.addEventListener('click', () => {
            this.rollWithAdvantage(true);
        });
    }

    async rollDice(sides) {
        if (diceEngine && !diceEngine.simpleMode) {
            await diceEngine.rollDice(sides, 1, 0);
        } else {
            const result = Math.floor(Math.random() * sides) + 1;
            this.showNumericResult(result, sides, 1, 0, [result]);
            this.saveToDiceHistory([result], result, sides, 1, 0);
        }
    }

    async rollMultipleDice(sides, count, modifier) {
        const results = Array.from({length: count}, () => Math.floor(Math.random() * sides) + 1);
        const total = results.reduce((sum, val) => sum + val, 0) + modifier;
        this.showNumericResult(total, sides, count, modifier, results);
        this.saveToDiceHistory(results, total, sides, count, modifier);
    }

    async rollWithAdvantage(disadvantage = false) {
        const results = [
            Math.floor(Math.random() * 20) + 1,
            Math.floor(Math.random() * 20) + 1
        ];
        const result = disadvantage ? Math.min(...results) : Math.max(...results);
        this.showNumericResult(result, 20, 2, 0, results);
        this.saveToDiceHistory(results, result, 20, 2, 0);
    }

    showNumericResult(total, sides, count, modifier, results) {
        const resultContainer = document.getElementById('dice-result');
        if (!resultContainer) return;

        let formula = `${count}d${sides}`;
        if (modifier > 0) formula += `+${modifier}`;
        else if (modifier < 0) formula += `${modifier}`;
        
        let breakdown = '';
        if (count > 1) {
            breakdown = ` (${results.join(' + ')})`;
            if (modifier !== 0) {
                breakdown += ` ${modifier > 0 ? '+' : ''}${modifier}`;
            }
        }
        
        resultContainer.innerHTML = `
            <div class="dice-result-text">
                <div class="dice-formula">${formula}</div>
                <div class="dice-total">${total}</div>
                <div class="dice-roll-breakdown">${breakdown}</div>
            </div>
        `;
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
            let formula = `${roll.count}d${roll.sides}`;
            if (roll.modifier > 0) formula += `+${roll.modifier}`;
            else if (roll.modifier < 0) formula += `${roll.modifier}`;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'dice-history-item';
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
}