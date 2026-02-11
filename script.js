document.addEventListener('DOMContentLoaded', main);

function main() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM Элементы ---
    const elements = {
        charName: document.getElementById('charName'), race: document.getElementById('race'), class: document.getElementById('class'),
        level: document.getElementById('level'), experience: document.getElementById('experience'),
        armorClass: document.getElementById('armorClass'), hitPoints: document.getElementById('hitPoints'),
        gp: document.getElementById('gp'), sp: document.getElementById('sp'), cp: document.getElementById('cp'),
        recalcAcBtn: document.getElementById('recalc-ac-btn'), recalcHpBtn: document.getElementById('recalc-hp-btn'),
        statInputs: document.querySelectorAll('.stat-input'), pointBuyCounter: document.getElementById('point-buy-counter'),
        asiSection: document.getElementById('asi-section'), asiPoints: document.getElementById('asi-points'),
        inventoryList: document.getElementById('inventory-list'), itemSelect: document.getElementById('item-select'),
        addItemBtn: document.getElementById('add-item-btn'), spellList: document.getElementById('spell-list'),
        spellSelect: document.getElementById('spell-select'), addSpellBtn: document.getElementById('add-spell-btn'),
        featuresList: document.getElementById('features-list'), featureInput: document.getElementById('feature-input'),
        addFeatureBtn: document.getElementById('add-feature-btn'), notes: document.getElementById('notes'),
        saveBtn: document.getElementById('save-btn'), shareBtn: document.getElementById('share-btn'),
        downloadBtn: document.getElementById('download-btn'), uploadBtn: document.getElementById('upload-btn'),
        fileUploader: document.getElementById('file-uploader'), slotSelect: document.getElementById('character-slot-select'),
        newCharBtn: document.getElementById('new-char-btn'), deleteCharBtn: document.getElementById('delete-char-btn')
    };

    let characters = []; let currentSlot = 0; let itemsDB = []; let spellsDB = [];
    const asiLevels = [4, 8, 12, 16, 19];
    const pointBuyCost = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

    function getEmptyCharacter(name = "Новый персонаж") {
        return {
            name, race: '', class: '', level: 1, experience: 0, armorClass: 10, hitPoints: 8,
            money: { gp: 0, sp: 0, cp: 0 },
            stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
            features: [], inventory: [], spells: [], notes: ''
        };
    }

    function calculateModifier(statValue) {
        const mod = Math.floor((statValue - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    // --- Рендеринг и сохранение ---
    function renderCharacter(char) {
        // Убедимся, что все поля существуют, даже если загружен старый сейв
        char.money = char.money || { gp: 0, sp: 0, cp: 0 };
        char.features = char.features || [];
        char.notes = char.notes || '';

        elements.charName.value = char.name; elements.race.value = char.race; elements.class.value = char.class;
        elements.level.value = char.level; elements.experience.value = char.experience;
        elements.armorClass.value = char.armorClass; elements.hitPoints.value = char.hitPoints;
        elements.gp.value = char.money.gp; elements.sp.value = char.money.sp; elements.cp.value = char.money.cp;
        elements.notes.value = char.notes;
        for (const stat in char.stats) document.getElementById(stat).value = char.stats[stat];
        
        updateAllCalculatedFields();
        renderList(elements.inventoryList, char.inventory, 'inventory');
        renderList(elements.spellList, char.spells, 'spells');
        renderList(elements.featuresList, char.features, 'features');
    }
    
    function saveCurrentCharacterState() {
        const char = characters[currentSlot]; if (!char) return;
        char.name = elements.charName.value; char.race = elements.race.value; char.class = elements.class.value;
        char.level = parseInt(elements.level.value) || 1; char.experience = parseInt(elements.experience.value) || 0;
        char.armorClass = parseInt(elements.armorClass.value) || 10; char.hitPoints = parseInt(elements.hitPoints.value) || 8;
        char.money = { gp: parseInt(elements.gp.value) || 0, sp: parseInt(elements.sp.value) || 0, cp: parseInt(elements.cp.value) || 0 };
        char.notes = elements.notes.value;
        elements.statInputs.forEach(input => char.stats[input.id] = parseInt(input.value));
        // features, inventory, spells - мутируются напрямую, сохранять не надо
    }
    
    // --- Логика Point Buy и ASI ---
    function updateAllCalculatedFields() {
        // Обновляем модификаторы
        elements.statInputs.forEach(input => {
            document.getElementById(`${input.id}-mod`).textContent = calculateModifier(parseInt(input.value));
        });

        const level = parseInt(elements.level.value);
        
        // Логика Point Buy
        if (level === 1) {
            elements.pointBuyCounter.style.display = 'block';
            let totalCost = 0;
            elements.statInputs.forEach(input => {
                let value = parseInt(input.value);
                if (value > 15) {
                    value = 15;
                    input.value = 15;
                    document.getElementById(`${input.id}-mod`).textContent = calculateModifier(value); // Сразу обновляем мод.
                }
                totalCost += pointBuyCost[value] || 0;
            });
            elements.pointBuyCounter.textContent = `Очков для распределения (Point Buy): ${27 - totalCost}`;
        } else {
            elements.pointBuyCounter.style.display = 'none';
        }

        // Логика ASI (Bug fix: не показывать на 1-3 уровнях)
        if (level < 4) {
            elements.asiSection.classList.add('hidden');
        } else {
            let asiCount = 0;
            asiLevels.forEach(asiLevel => { if (level >= asiLevel) asiCount++; });
            
            let totalStatPoints = 0;
            elements.statInputs.forEach(input => totalStatPoints += parseInt(input.value));
            
            const basePoints = 6 * 8 + 27;
            const spentAsiPoints = totalStatPoints - basePoints;
            const availableAsiPoints = (asiCount * 2) - spentAsiPoints;
            
            if (availableAsiPoints > 0) {
                elements.asiSection.classList.remove('hidden');
                elements.asiPoints.textContent = availableAsiPoints;
            } else {
                elements.asiSection.classList.add('hidden');
            }
        }
    }

    // --- Остальные функции (без изменений, кроме shareWithGM) ---
    // ... (loadCharacters, updateSlotSelector, renderList, recalcAC, recalcHP, loadDatabases, downloadCharacter, uploadCharacter, etc.)
    function shareWithGM() {
        saveCurrentCharacterState();
        const char = characters[currentSlot];
        let text = `*${char.name}*, ${char.race || 'раса'} ${char.class || 'класс'} ${char.level} ур.\n`;
        text += `*ХП:* ${char.hitPoints}, *КД:* ${char.armorClass}\n`;
        text += `*Характеристики:*\n`;
        text += `СИЛ ${char.stats.strength} (${calculateModifier(char.stats.strength)}) | ЛОВ ${char.stats.dexterity} (${calculateModifier(char.stats.dexterity)}) | ТЕЛ ${char.stats.constitution} (${calculateModifier(char.stats.constitution)}) | `;
        text += `ИНТ ${char.stats.intelligence} (${calculateModifier(char.stats.intelligence)}) | МУД ${char.stats.wisdom} (${calculateModifier(char.stats.wisdom)}) | ХАР ${char.stats.charisma} (${calculateModifier(char.stats.charisma)})`;
        tg.switchInlineQuery(text, []);
    }
    
    // --- Назначение обработчиков ---
    elements.statInputs.forEach(input => input.addEventListener('input', updateAllCalculatedFields));
    elements.level.addEventListener('input', updateAllCalculatedFields);
    
    elements.addFeatureBtn.addEventListener('click', () => {
        const featureText = elements.featureInput.value.trim();
        if (featureText) {
            characters[currentSlot].features.push(featureText);
            renderList(elements.featuresList, characters[currentSlot].features, 'features');
            elements.featureInput.value = '';
        }
    });

    // --- Полный код всех остальных функций для копирования ---
    function loadCharacte
