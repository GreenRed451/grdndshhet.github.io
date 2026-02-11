// Инициализируем Web App от Telegram
const tg = window.Telegram.WebApp;
tg.expand(); // Расширяем приложение на весь экран

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ЭЛЕМЕНТЫ DOM ---
let itemsDB = [];
let spellsDB = [];

const charNameInput = document.getElementById('charName');
const levelInput = document.getElementById('level');
const statInputs = document.querySelectorAll('.stat-input');
const pointBuyCounter = document.getElementById('point-buy-counter');

const inventoryList = document.getElementById('inventory-list');
const itemSelect = document.getElementById('item-select');
const addItemBtn = document.getElementById('add-item-btn');

const spellList = document.getElementById('spell-list');
const spellSelect = document.getElementById('spell-select');
const addSpellBtn = document.getElementById('add-spell-btn');

const saveBtn = document.getElementById('save-btn');
const shareBtn = document.getElementById('share-btn');

// --- ЗАГРУЗКА ДАННЫХ (ПРЕДМЕТЫ И ЗАКЛИНАНИЯ) ---
async function loadDatabases() {
    try {
        const [itemsResponse, spellsResponse] = await Promise.all([
            fetch('items.json'),
            fetch('spells.json')
        ]);
        itemsDB = await itemsResponse.json();
        spellsDB = await spellsResponse.json();

        // Заполняем выпадающие списки
        itemsDB.forEach(item => {
            const option = new Option(item.name, item.name);
            itemSelect.add(option);
        });
        spellsDB.forEach(spell => {
            const option = new Option(spell.name, spell.name);
            spellSelect.add(option);
        });
    } catch (error) {
        console.error("Не удалось загрузить базы данных:", error);
    }
}

// --- УПРАВЛЕНИЕ ПЕРСОНАЖЕМ (СОХРАНЕНИЕ/ЗАГРУЗКА) ---
let character = {
    name: '',
    level: 1,
    stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
    inventory: [],
    spells: []
};

function saveCharacter() {
    character.name = charNameInput.value;
    character.level = parseInt(levelInput.value) || 1;
    statInputs.forEach(input => {
        character.stats[input.id] = parseInt(input.value) || 8;
    });
    // inventory и spells уже обновляются при добавлении/удалении

    localStorage.setItem('dndCharacter', JSON.stringify(character));
    tg.HapticFeedback.notificationOccurred('success');
    alert('Персонаж сохранен!');
}

function loadCharacter() {
    const savedData = localStorage.getItem('dndCharacter');
    if (savedData) {
        character = JSON.parse(savedData);
        
        charNameInput.value = character.name;
        levelInput.value = character.level;
        statInputs.forEach(input => {
            input.value = character.stats[input.id];
        });
        
        renderInventory();
        renderSpells();
        updatePointBuy();
    }
}

// --- ЛОГИКА ИНВЕНТАРЯ И ЗАКЛИНАНИЙ ---
function renderInventory() {
    inventoryList.innerHTML = '';
    character.inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'list-item';
        itemDiv.innerHTML = `<span><b>${item.name}</b>: ${item.description}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.innerText = 'x';
        removeBtn.onclick = () => {
            character.inventory.splice(index, 1);
            renderInventory();
        };
        itemDiv.appendChild(removeBtn);
        inventoryList.appendChild(itemDiv);
    });
}

function renderSpells() {
    spellList.innerHTML = '';
    character.spells.forEach((spell, index) => {
        const spellDiv = document.createElement('div');
        spellDiv.className = 'list-item';
        spellDiv.innerHTML = `<span><b>${spell.name}</b>: ${spell.description}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.innerText = 'x';
        removeBtn.onclick = () => {
            character.spells.splice(index, 1);
            renderSpells();
        };
        spellDiv.appendChild(removeBtn);
        spellList.appendChild(spellDiv);
    });
}

addItemBtn.addEventListener('click', () => {
    const selectedItemName = itemSelect.value;
    const itemData = itemsDB.find(item => item.name === selectedItemName);
    if (itemData) {
        character.inventory.push(itemData);
        renderInventory();
    }
});

addSpellBtn.addEventListener('click', () => {
    const selectedSpellName = spellSelect.value;
    const spellData = spellsDB.find(spell => spell.name === selectedSpellName);
    if (spellData) {
        character.spells.push(spellData);
        renderSpells();
    }
});

// --- ЛОГИКА ЛИМИТОВ ХАРАКТЕРИСТИК (POINT BUY) ---
const pointBuyCost = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

function updatePointBuy() {
    if (character.level !== 1) {
        pointBuyCounter.textContent = 'Распределение очков доступно только на 1 уровне.';
        statInputs.forEach(input => input.max = 20); // Снимаем ограничение после 1 уровня
        return;
    }
    
    let totalCost = 0;
    statInputs.forEach(input => {
        const value = parseInt(input.value);
        if (value > 15) { // Ограничение Point Buy
            input.value = 15;
        }
        totalCost += pointBuyCost[parseInt(input.value)] || 0;
    });

    const pointsLeft = 27 - totalCost;
    pointBuyCounter.textContent = `Очков для распределения: ${pointsLeft}`;
    
    if (pointsLeft < 0) {
        pointBuyCounter.style.color = 'red';
    } else {
        pointBuyCounter.style.color = 'black';
    }
}

// --- ФУНКЦИЯ "ПОДЕЛИТЬСЯ С ГМ" ---
function shareWithGM() {
    saveCharacter(); // Убедимся, что делимся актуальными данными
    const characterDataString = JSON.stringify(character);
    const encodedData = btoa(characterDataString); // Кодируем в Base64 для безопасности в URL
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    
    // Используем API Telegram для отправки текста в чат
    tg.sendData(`Вот мой лист персонажа: ${shareUrl}`);
    
    // Если sendData не работает (старая версия), можно просто показать ссылку
    // alert(`Скопируйте и отправьте ГМу:\n${shareUrl}`);
}

function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');
    if (data) {
        try {
            const decodedData = atob(data); // Декодируем из Base64
            localStorage.setItem('dndCharacter', decodedData); // Сохраняем полученные данные
            loadCharacter(); // Загружаем их в интерфейс
            alert('Лист персонажа загружен по ссылке!');
        } catch (e) {
            console.error("Ошибка при загрузке данных из URL:", e);
            loadCharacter(); // Загружаем обычные данные, если URL неверный
        }
    } else {
        loadCharacter(); // Загружаем из localStorage, если в URL нет данных
    }
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadDatabases(); // Сначала грузим базы
    loadFromURL();         // Потом грузим персонажа (из URL или localStorage)

    // Добавляем слушатели событий
    saveBtn.addEventListener('click', saveCharacter);
    shareBtn.addEventListener('click', shareWithGM);
    statInputs.forEach(input => input.addEventListener('input', updatePointBuy));
    levelInput.addEventListener('input', updatePointBuy);
});
