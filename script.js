document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const loadInput = document.getElementById('load-input');

    // --- Функция Сохранения ---
    saveBtn.addEventListener('click', () => {
        const characterData = {
            name: document.getElementById('char-name').value,
            race: document.getElementById('char-race').value,
            class: document.getElementById('char-class').value,
            level: document.getElementById('char-level').value,
            xp: document.getElementById('char-xp').value,
            hp: document.getElementById('char-hp').value,
            ac: document.getElementById('char-ac').value,
            inventory: document.getElementById('inventory-list').value,
            spells: document.getElementById('spells-list').value,
            gold: document.getElementById('gold-coins').value,
            silver: document.getElementById('silver-coins').value,
            copper: document.getElementById('copper-coins').value,
            // Добавьте сюда сохранение старых характеристик (Сила, Ловкость и т.д.)
            // Например:
            // strength: document.getElementById('strength-stat').value, 
        };

        const dataStr = JSON.stringify(characterData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        // Сохраняем файл с именем персонажа, если оно есть
        const fileName = characterData.name.trim() ? `${characterData.name}.json` : 'character_sheet.json';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('Лист персонажа сохранен!');
    });

    // --- Функции Загрузки ---
    loadBtn.addEventListener('click', () => {
        // Имитируем клик по скрытому полю для выбора файла
        loadInput.click();
    });

    loadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);

                // Заполняем поля данными из файла
                document.getElementById('char-name').value = loadedData.name || '';
                document.getElementById('char-race').value = loadedData.race || '';
                document.getElementById('char-class').value = loadedData.class || '';
                document.getElementById('char-level').value = loadedData.level || '1';
                document.getElementById('char-xp').value = loadedData.xp || '0';
                document.getElementById('char-hp').value = loadedData.hp || '10';
                document.getElementById('char-ac').value = loadedData.ac || '10';
                document.getElementById('inventory-list').value = loadedData.inventory || '';
                document.getElementById('spells-list').value = loadedData.spells || '';
                document.getElementById('gold-coins').value = loadedData.gold || '0';
                document.getElementById('silver-coins').value = loadedData.silver || '0';
                document.getElementById('copper-coins').value = loadedData.copper || '0';
                

// Функция для расчета модификатора по значению характеристики
function getModifier(statValue) {
    return Math.floor((statValue - 10) / 2);
}

// Главная функция для перерасчета всех значений
function calculateAll() {
    // Обновляем модификаторы характеристик
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const modifiers = {};

    stats.forEach(stat => {
        const value = parseInt(document.getElementById(stat).value, 10);
        const mod = getModifier(value);
        document.getElementById(`${stat}-mod`).innerText = mod >= 0 ? `+${mod}` : mod;
        modifiers[stat] = mod;
    });

    // Обновляем навыки
    document.getElementById('acrobatics-skill').innerText = modifiers['dexterity'] >= 0 ? `+${modifiers['dexterity']}` : modifiers['dexterity'];
    document.getElementById('athletics-skill').innerText = modifiers['strength'] >= 0 ? `+${modifiers['strength']}` : modifiers['strength'];
    document.getElementById('performance-skill').innerText = modifiers['charisma'] >= 0 ? `+${modifiers['charisma']}` : modifiers['charisma'];
    document.getElementById('arcana-skill').innerText = modifiers['intelligence'] >= 0 ? `+${modifiers['intelligence']}` : modifiers['intelligence'];
    // ... и так для всех остальных навыков
}


// Инициализация Web App и первоначальный расчет
window.onload = function() {
    let tg = window.Telegram.WebApp;
    tg.expand(); // Расширяем Web App на весь экран
    calculateAll(); // Выполняем первый расчет при загрузке
};
                alert('Лист персонажа успешно загружен!');
            } catch (error) {
                alert('Ошибка! Не удалось прочитать файл. Убедитесь, что это корректный JSON файл персонажа.');
                console.error("Ошибка при загрузке:", error);
            }
        };
        reader.readAsText(file);
        
        // Сбрасываем значение input, чтобы можно было загружать тот же файл повторно
        event.target.value = '';
    });
});
                
