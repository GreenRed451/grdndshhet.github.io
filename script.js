document.addEventListener('DOMContentLoaded', main);

function main() {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- DOM Элементы ---
    const elements = {
        charName: document.getElementById('charName'),
        race: document.getElementById('race'),
        class: document.getElementById('class'),
        level: document.getElementById('level'),
        experience: document.getElementById('experience'),
        armorClass: document.getElementById('armorClass'),
        hitPoints: document.getElementById('hitPoints'),
        recalcAcBtn: document.getElementById('recalc-ac-btn'),
        recalcHpBtn: document.getElementById('recalc-hp-btn'),
        statInputs: document.querySelectorAll('.stat-input'),
        pointBuyCounter: document.getElementById('point-buy-counter'),
        asiSection: document.getElementById('asi-section'),
        asiPoints: document.getElementById('asi-points'),
        inventoryList: document.getElementById('inventory-list'),
        itemSelect: document.getElementById('item-select'),
        addItemBtn: document.getElementById('add-item-btn'),
        spellList: document.getElementById('spell-list'),
        spellSelect: document.getElementById('spell-select'),
        addSpellBtn: document.getElementById('add-spell-btn'),
        saveBtn: document.getElementById('save-btn'),
        shareBtn: document.getElementById('share-btn'),
        downloadBtn: document.getElementById('download-btn'),
        uploadBtn: document.getElementById('upload-btn'),
        fileUploader: document.getElementById('file-uploader'),
        slotSelect: document.getElementById('character-slot-select'),
        newCharBtn: document.getElementById('new-char-btn'),
        deleteCharBtn: document.getElementById('delete-char-btn')
    };

    // --- Глобальное состояние ---
    let characters = [];
    let currentSlot = 0;
    let itemsDB = [];
    let spellsDB = [];
    let asiLevels = [4, 8, 12, 16, 19];
    const pointBuyCost = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

    // --- Функции ---

    function getEmptyCharacter(name = "Новый персонаж") {
        return {
            name: name,
            race: '',
            class: '',
            level: 1,
            experience: 0,
            armorClass: 10,
            hitPoints: 8,
            stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
            inventory: [],
            spells: []
        };
    }

    function calculateModifier(statValue) {
        const mod = Math.floor((statValue - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod;
    }

    function updateAllModifiers() {
        elements.statInputs.forEach(input => {
            const statName = input.id;
            const modSpan = document.getElementById(`${statName}-mod`);
            if (modSpan) {
                modSpan.textContent = calculateModifier(parseInt(input.value));
            }
        });
    }

    function renderCharacter(char) {
        elements.charName.value = char.name;
        elements.race.value = char.race;
        elements.class.value = char.class;
        elements.level.value = char.level;
        elements.experience.value = char.experience;
        elements.armorClass.value = char.armorClass;
        elements.hitPoints.value = char.hitPoints;
        for (const stat in char.stats) {
            document.getElementById(stat).value = char.stats[stat];
        }
        updateAllModifiers();
        updatePointBuy();
        checkASI();
        renderInventory();
        renderSpells();
    }
    
    function saveCurrentCharacterState() {
        const char = characters[currentSlot];
        if (!char) return;

        char.name = elements.charName.value;
        char.race = elements.race.value;
        char.class = elements.class.value;
        char.level = parseInt(elements.level.value) || 1;
        char.experience = parseInt(elements.experience.value) || 0;
        char.armorClass = parseInt(elements.armorClass.value) || 10;
        char.hitPoints = parseInt(elements.hitPoints.value) || 8;
        elements.statInputs.forEach(input => {
            char.stats[input.id] = parseInt(input.value);
        });
        
        // inventory & spells обновляются отдельно
    }

    function saveAllCharacters() {
        saveCurrentCharacterState();
        localStorage.setItem('dndCharacters', JSON.stringify(characters));
        tg.HapticFeedback.notificationOccurred('success');
        alert('Персонаж сохранен в текущий слот!');
    }
    
    function loadCharacters() {
        const data = localStorage.getItem('dndCharacters');
        if (data) {
            characters = JSON.parse(data);
            if (characters.length === 0) {
                characters.push(getEmptyCharacter());
            }
        } else {
            characters.push(getEmptyCharacter());
        }
        currentSlot = parseInt(localStorage.getItem('dndCurrentSlot')) || 0;
        if (currentSlot >= characters.length) currentSlot = 0;
        
        updateSlotSelector();
        renderCharacter(characters[currentSlot]);
    }

    function updateSlotSelector() {
        elements.slotSelect.innerHTML = '';
        characters.forEach((char, index) => {
            const option = new Option(char.name || `Слот ${index + 1}`, index);
            elements.slotSelect.appendChild(option);
        });
        elements.slotSelect.value = currentSlot;
    }
    
    // ... (inventory and spell rendering functions from previous script)
     function renderInventory() {
        const char = characters[currentSlot];
        elements.inventoryList.innerHTML = '';
        char.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'list-item';
            itemDiv.innerHTML = `<span><b>${item.name}</b>: ${item.description}</span>`;
            const removeBtn = document.createElement('button');
            removeBtn.innerText = 'x';
            removeBtn.onclick = () => {
                char.inventory.splice(index, 1);
                renderInventory();
            };
            itemDiv.appendChild(removeBtn);
            elements.inventoryList.appendChild(itemDiv);
        });
    }

    function renderSpells() {
        const char = characters[currentSlot];
        elements.spellList.innerHTML = '';
        char.spells.forEach((spell, index) => {
            const spellDiv = document.createElement('div');
            spellDiv.className = 'list-item';
            spellDiv.innerHTML = `<span><b>${spell.name}</b>: ${spell.description}</span>`;
            const removeBtn = document.createElement('button');
            removeBtn.innerText = 'x';
            removeBtn.onclick = () => {
                char.spells.splice(index, 1);
                renderSpells();
            };
            spellDiv.appendChild(removeBtn);
            elements.spellList.appendChild(spellDiv);
        });
    }

    // --- Логика Point Buy и ASI ---
    function updatePointBuy() {
        const level = parseInt(elements.level.value);
        if (level !== 1) {
            elements.pointBuyCounter.textContent = 'Распределение очков доступно только на 1 уровне.';
            return;
        }
        let totalCost = 0;
        elements.statInputs.forEach(input => {
            const value = parseInt(input.value);
            if (value > 15) input.value = 15;
            totalCost += pointBuyCost[parseInt(input.value)] || 0;
        });
        const pointsLeft = 27 - totalCost;
        elements.pointBuyCounter.textContent = `Очков для распределения: ${pointsLeft}`;
        elements.pointBuyCounter.style.color = pointsLeft < 0 ? 'red' : 'black';
    }

    function checkASI() {
        const level = parseInt(elements.level.value);
        let asiCount = 0;
        asiLevels.forEach(asiLevel => {
            if (level >= asiLevel) asiCount++;
        });
        
        let totalStatPoints = 0;
        elements.statInputs.forEach(input => totalStatPoints += parseInt(input.value));
        
        const basePoints = 6 * 8 + 27; // 8 in each stat + 27 points for point buy
        const spentAsiPoints = totalStatPoints - basePoints;
        const availableAsiPoints = (asiCount * 2) - spentAsiPoints;
        
        if (availableAsiPoints > 0) {
            elements.asiSection.classList.remove('hidden');
            elements.asiPoints.textContent = availableAsiPoints;
        } else {
            elements.asiSection.classList.add('hidden');
        }
    }
    
    // --- Расчеты ХП и КД ---
    function recalcAC() {
        const dexMod = Math.floor((parseInt(elements.statInputs[1].value) - 10) / 2);
        elements.armorClass.value = 10 + dexMod;
    }
    
    function recalcHP() {
        const conMod = Math.floor((parseInt(elements.statInputs[2].value) - 10) / 2);
        // Базовая формула, можно усложнить, добавив кость хитов класса
        elements.hitPoints.value = 8 + conMod; 
    }

    // --- Загрузка/Скачивание и Поделиться ---
    async function loadDatabases() {
        try {
            const [itemsRes, spellsRes] = await Promise.all([fetch('items.json'), fetch('spells.json')]);
            itemsDB = await itemsRes.json();
            spellsDB = await spellsRes.json();
            itemsDB.forEach(item => elements.itemSelect.add(new Option(item.name, item.name)));
            spellsDB.forEach(spell => elements.spellSelect.add(new Option(spell.name, spell.name)));
        } catch (error) { console.error("DB load error:", error); }
    }

    function downloadCharacter() {
        saveCurrentCharacterState();
        const charData = JSON.stringify(characters[currentSlot], null, 2);
        const blob = new Blob([charData], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${characters[currentSlot].name || 'character'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    function uploadCharacter(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const uploadedChar = JSON.parse(e.target.result);
                // Простая валидация
                if (uploadedChar.stats && uploadedChar.name) {
                    characters[currentSlot] = uploadedChar;
                    renderCharacter(uploadedChar);
                    saveAllCharacters(); // Сохраняем в localStorage
                    updateSlotSelector();
                    alert('Персонаж загружен в текущий слот!');
                } else {
                    alert('Неверный формат файла!');
                }
            } catch (err) {
                alert('Ошибка чтения файла!');
            }
        };
        reader.readAsText(file);
    }
    
    function shareWithGM() {
        saveCurrentCharacterState();
        const charDataString = JSON.stringify(characters[currentSlot]);
        // Используем switchInlineQuery - это лучший способ для "поделиться"
        tg.switchInlineQuery(charDataString, []);
    }

    // --- Назначение обработчиков ---
    elements.saveBtn.addEventListener('click', saveAllCharacters);
    elements.shareBtn.addEventListener('click', shareWithGM);
    elements.downloadBtn.addEventListener('click', downloadCharacter);
    elements.uploadBtn.addEventListener('click', () => elements.fileUploader.click());
    elements.fileUploader.addEventListener('change', uploadCharacter);

    elements.newCharBtn.addEventListener('click', () => {
        const newName = prompt("Введите имя нового персонажа:", `Персонаж ${characters.length + 1}`);
        if(newName) {
            characters.push(getEmptyCharacter(newName));
            currentSlot = characters.length - 1;
            localStorage.setItem('dndCurrentSlot', currentSlot);
            updateSlotSelector();
            renderCharacter(characters[currentSlot]);
        }
    });

    elements.deleteCharBtn.addEventListener('click', () => {
        if (characters.length > 1) {
            if (confirm(`Вы уверены, что хотите удалить персонажа "${characters[currentSlot].name}"?`)) {
                characters.splice(currentSlot, 1);
                currentSlot = 0;
                localStorage.setItem('dndCurrentSlot', currentSlot);
                loadCharacters();
            }
        } else {
            alert("Нельзя удалить последнего персонажа!");
        }
    });
    
    elements.slotSelect.addEventListener('change', (e) => {
        saveCurrentCharacterState(); // Сохраняем изменения в текущем слоте перед переключением
        currentSlot = parseInt(e.target.value);
        localStorage.setItem('dndCurrentSlot', currentSlot);
        renderCharacter(characters[currentSlot]);
    });
    
    elements.statInputs.forEach(input => input.addEventListener('input', () => {
        updateAllModifiers();
        updatePointBuy();
        checkASI();
    }));
    elements.level.addEventListener('input', () => {
        updatePointBuy();
        checkASI();
    });

    elements.recalcAcBtn.addEventListener('click', recalcAC);
    elements.recalcHpBtn.addEventListener('click', recalcHP);
    
    elements.addItemBtn.addEventListener('click', () => {
        const item = itemsDB.find(i => i.name === elements.itemSelect.value);
        if (item) {
            characters[currentSlot].inventory.push(item);
            renderInventory();
        }
    });

    elements.addSpellBtn.addEventListener('click', () => {
        const spell = spellsDB.find(s => s.name === elements.spellSelect.value);
        if (spell) {
            characters[currentSlot].spells.push(spell);
            renderSpells();
        }
    });

    // --- Инициализация ---
    loadDatabases().then(loadCharacters);
}

