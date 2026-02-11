document.addEventListener('DOMContentLoaded', main);

function main() {
    const tg = window.Telegram.WebApp;
    if (tg) {
        tg.expand();
    }

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

    // --- Глобальное состояние ---
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
        char.money = char.money || { gp: 0, sp: 0, cp: 0 };
        char.features = char.features || [];
        char.notes = char.notes || '';
        char.stats = char.stats || { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 };

        elements.charName.value = char.name;
        elements.race.value = char.race;
        elements.class.value = char.class;
        elements.level.value = char.level;
        elements.experience.value = char.experience;
        elements.armorClass.value = char.armorClass;
        elements.hitPoints.value = char.hitPoints;
        elements.gp.value = char.money.gp;
        elements.sp.value = char.money.sp;
        elements.cp.value = char.money.cp;
        elements.notes.value = char.notes;
        for (const stat in char.stats) {
            if(document.getElementById(stat)) {
                document.getElementById(stat).value = char.stats[stat];
            }
        }
        
        updateAllCalculatedFields();
        renderList(elements.inventoryList, char.inventory, 'inventory');
        renderList(elements.spellList, char.spells, 'spells');
        renderList(elements.featuresList, char.features, 'features');
    }
    
    function saveCurrentCharacterState() {
        const char = characters[currentSlot]; if (!char) return;

        char.name = elements.charName.value;
        char.race = elements.race.value;
        char.class = elements.class.value;
        char.level = parseInt(elements.level.value) || 1;
        char.experience = parseInt(elements.experience.value) || 0;
        char.armorClass = parseInt(elements.armorClass.value) || 10;
        char.hitPoints = parseInt(elements.hitPoints.value) || 8;
        char.money = { 
            gp: parseInt(elements.gp.value) || 0, 
            sp: parseInt(elements.sp.value) || 0, 
            cp: parseInt(elements.cp.value) || 0 
        };
        char.notes = elements.notes.value;
        elements.statInputs.forEach(input => {
            if (char.stats) {
                char.stats[input.id] = parseInt(input.value);
            }
        });
    }
    
    function saveAllCharactersToLocalStorage() {
        saveCurrentCharacterState();
        localStorage.setItem('dndCharacters', JSON.stringify(characters));
        localStorage.setItem('dndCurrentSlot', currentSlot);
    }
    
    function updateAllCalculatedFields() {
        elements.statInputs.forEach(input => {
            const modElement = document.getElementById(`${input.id}-mod`);
            if (modElement) {
                modElement.textContent = calculateModifier(parseInt(input.value));
            }
        });

        const level = parseInt(elements.level.value);
        
        if (level === 1) {
            elements.pointBuyCounter.style.display = 'block';
            let totalCost = 0;
            elements.statInputs.forEach(input => {
                let value = parseInt(input.value);
                if (value > 15) {
                    value = 15;
                    input.value = 15;
                    const modElement = document.getElementById(`${input.id}-mod`);
                    if (modElement) {
                       modElement.textContent = calculateModifier(value);
                    }
                }
                totalCost += pointBuyCost[value] || 0;
            });
            elements.pointBuyCounter.textContent = `Очков для распределения (Point Buy): ${27 - totalCost}`;
        } else {
            elements.pointBuyCounter.style.display = 'none';
        }

        if (level < 4) {
            elements.asiSection.classList.add('hidden');
        } else {
            let asiCount = 0;
            asiLevels.forEach(asiLevel => { if (level >= asiLevel) asiCount++; });
            let totalStatPoints = 0;
            elements.statInputs.forEach(input => { totalStatPoints += parseInt(input.value); });
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

    function renderList(listElement, dataArray, arrayName) {
        if (!listElement || !Array.isArray(dataArray)) return;
        listElement.innerHTML = '';
        dataArray.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'list-item';
            if (typeof item === 'string') {
                itemDiv.innerHTML = `<span>${item}</span>`;
            } else {
                itemDiv.innerHTML = `<span><b>${item.name}</b>: ${item.description}</span>`;
            }
            const removeBtn = document.createElement('button');
            removeBtn.innerText = 'x';
            removeBtn.onclick = () => {
                characters[currentSlot][arrayName].splice(index, 1);
                renderList(listElement, dataArray, arrayName);
            };
            itemDiv.appendChild(removeBtn);
            listElement.appendChild(itemDiv);
        });
    }

    function shareWithGM() {
        if (!tg.switchInlineQuery) return;
        saveCurrentCharacterState();
        const char = characters[currentSlot];
        let text = `*${char.name}*, ${char.race || 'раса'} ${char.class || 'класс'} ${char.level} ур.\n`;
        text += `*ХП:* ${char.hitPoints}, *КД:* ${char.armorClass}\n`;
        text += `*Характеристики:*\n`;
        text += `СИЛ ${char.stats.strength} (${calculateModifier(char.stats.strength)}) | ЛОВ ${char.stats.dexterity} (${calculateModifier(char.stats.dexterity)}) | ТЕЛ ${char.stats.constitution} (${calculateModifier(char.stats.constitution)}) | `;
        text += `ИНТ ${char.stats.intelligence} (${calculateModifier(char.stats.intelligence)}) | МУД ${char.stats.wisdom} (${calculateModifier(char.stats.wisdom)}) | ХАР ${char.stats.charisma} (${calculateModifier(char.stats.charisma)})`;
        tg.switchInlineQuery(text, []);
    }
    
    function loadCharactersFromLocalStorage(){
        const data = localStorage.getItem('dndCharacters');
        characters = data ? JSON.parse(data) : [];
        if (characters.length === 0) {
            characters.push(getEmptyCharacter());
        }
        currentSlot = parseInt(localStorage.getItem('dndCurrentSlot')) || 0;
        if (currentSlot >= characters.length) {
            currentSlot = 0;
        }
        updateSlotSelector();
        renderCharacter(characters[currentSlot]);
    }
    
    function updateSlotSelector(){
        elements.slotSelect.innerHTML = '';
        characters.forEach((char, index) => {
            elements.slotSelect.add(new Option(char.name || `Слот ${index + 1}`, index));
        });
        elements.slotSelect.value = currentSlot;
    }

    function downloadCharacter(){
        saveCurrentCharacterState();
        const charData = JSON.stringify(characters[currentSlot], null, 2);
        const blob = new Blob([charData], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${characters[currentSlot].name || "character"}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function uploadCharacter(event){
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const uploadedChar = JSON.parse(e.target.result);
                if (uploadedChar.stats && uploadedChar.name) {
                    characters[currentSlot] = uploadedChar;
                    renderCharacter(uploadedChar);
                    saveAllCharactersToLocalStorage();
                    updateSlotSelector();
                    alert("Персонаж загружен в текущий слот!");
                } else { alert("Неверный формат файла!"); }
            } catch (err) { alert("Ошибка чтения файла!"); }
        };
        reader.readAsText(file);
    }

    async function loadDatabases() {
        try {
            const [itemsRes, spellsRes] = await Promise.all([fetch('items.json'), fetch('spells.json')]);
            itemsDB = await itemsRes.json();
            spellsDB = await spellsRes.json();
            elements.itemSelect.innerHTML = '';
            elements.spellSelect.innerHTML = '';
            itemsDB.forEach(item => elements.itemSelect.add(new Option(item.name, item.name)));
            spellsDB.forEach(spell => elements.spellSelect.add(new Option(spell.name, spell.name)));
        } catch (error) { console.error("DB load error:", error); }
    }

    // --- Назначение обработчиков ---
    elements.saveBtn.addEventListener("click", () => {
        saveAllCharactersToLocalStorage();
        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred("success");
        }
        alert("Персонаж сохранен в текущий слот!");
    });
    elements.shareBtn.addEventListener("click", shareWithGM);
    elements.downloadBtn.addEventListener("click", downloadCharacter);
    elements.uploadBtn.addEventListener("click", () => elements.fileUploader.click());
    elements.fileUploader.addEventListener("change", uploadCharacter);
    
    elements.newCharBtn.addEventListener("click", () => {
        const newName = prompt("Введите имя нового персонажа:", `Персонаж ${characters.length + 1}`);
        if(newName) {
            characters.push(getEmptyCharacter(newName));
            currentSlot = characters.length - 1;
            updateSlotSelector();
            renderCharacter(characters[currentSlot]);
        }
    });

    elements.deleteCharBtn.addEventListener("click", () => {
        if (characters.length > 1) {
            if (confirm(`Вы уверены, что хотите удалить персонажа "${characters[currentSlot].name}"?`)) {
                characters.splice(currentSlot, 1);
                currentSlot = 0;
                saveAllCharactersToLocalStorage();
                updateSlotSelector();
                renderCharacter(characters[currentSlot]);
            }
        } else { alert("Нельзя удалить последнего персонажа!"); }
    });
    
    elements.slotSelect.addEventListener("change", e => {
        saveCurrentCharacterState();
        currentSlot = parseInt(e.target.value);
        localStorage.setItem('dndCurrentSlot', currentSlot);
        renderCharacter(characters[currentSlot]);
    });

    elements.statInputs.forEach(input => input.addEventListener('input', updateAllCalculatedFields));
    elements.level.addEventListener('input', updateAllCalculatedFields);
    
    elements.recalcAcBtn.addEventListener("click", () => {
        const dexInput = document.getElementById('dexterity');
        if (dexInput) {
            elements.armorClass.value = 10 + Math.floor((parseInt(dexInput.value) - 10) / 2);
        }
    });
    elements.recalcHpBtn.addEventListener("click", () => {
        const conInput = document.getElementById('constitution');
        if (conInput) {
            elements.hitPoints.value = 8 + Math.floor((parseInt(conInput.value) - 10) / 2);
        }
    });

    elements.addFeatureBtn.addEventListener("click", () => {
        const featureText = elements.featureInput.value.trim();
        if (featureText) {
            if (!characters[currentSlot].features) {
                characters[currentSlot].features = [];
            }
            characters[currentSlot].features.push(featureText);
            renderList(elements.featuresList, characters[currentSlot].features, 'features');
            elements.featureInput.value = '';
        }
    });
    
    elements.addItemBtn.addEventListener("click", () => {
        const item = itemsDB.find(i => i.name === elements.itemSelect.value);
        if (item) {
            if (!characters[currentSlot].inventory) {
                characters[currentSlot].inventory = [];
            }
            characters[currentSlot].inventory.push(item);
            renderList(elements.inventoryList, characters[currentSlot].inventory, 'inventory');
        }
    });
    
    elements.addSpellBtn.addEventListener("click", () => {
        const spell = spellsDB.find(s => s.name === elements.spellSelect.value);
        if (spell) {
             if (!characters[currentSlot].spells) {
                characters[currentSlot].spells = [];
            }
            characters[currentSlot].spells.push(spell);
            renderList(elements.spellList, characters[currentSlot].spells, 'spells');
        }
    });

    // --- Инициализация ---
    loadDatabases().then(loadCharactersFromLocalStorage);
}
