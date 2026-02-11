// Этот обработчик ждет, пока вся HTML-страница полностью загрузится
document.addEventListener('DOMContentLoaded', () => {

    // --- Старый код для кнопок характеристик ---
    // Он должен быть здесь, внутри основного обработчика
    document.querySelectorAll('.stat').forEach(statElement => {
        const valueElement = statElement.querySelector('.value');
        const modifierElement = statElement.querySelector('.modifier');
        const increaseButton = statElement.querySelector('.increase');
        const decreaseButton = statElement.querySelector('.decrease');

        const updateModifier = () => {
            const value = parseInt(valueElement.textContent);
            const modifier = Math.floor((value - 10) / 2);
            modifierElement.textContent = (modifier >= 0 ? '+' : '') + modifier;
        };

        increaseButton.addEventListener('click', () => {
            let value = parseInt(valueElement.textContent);
            value++;
            valueElement.textContent = value;
            updateModifier();
        });

        decreaseButton.addEventListener('click', () => {
            let value = parseInt(valueElement.textContent);
            value--;
            valueElement.textContent = value;
            updateModifier();
        });

        // Инициализация модификатора при загрузке
        updateModifier();
    });


    // --- Новый код для сохранения и загрузки ---
    // Он должен быть здесь же, как отдельный независимый блок
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
            stats: {} // Создаем объект для характеристик
        };
        
        // Собираем все характеристики
        document.querySelectorAll('.stat').forEach(statElement => {
            const statName = statElement.querySelector('h2').textContent.toLowerCase();
            const statValue = statElement.querySelector('.value').textContent;
            characterData.stats[statName] = statValue;
        });

        const dataStr = JSON.stringify(characterData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        const fileName = characterData.name.trim() ? `${characterData.name.replace(/[^a-z0-9]/gi, '_')}.json` : 'character_sheet.json';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('Лист персонажа сохранен!');
    });

    // --- Функции Загрузки ---
    loadBtn.addEventListener('click', () => {
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

                // Загружаем характеристики
                if (loadedData.stats) {
                    document.querySelectorAll('.stat').forEach(statElement => {
                        const statName = statElement.querySelector('h2').textContent.toLowerCase();
                        if (loadedData.stats[statName]) {
                            statElement.querySelector('.value').textContent = loadedData.stats[statName];
                            // Обновляем модификатор после загрузки
                            const value = parseInt(loadedData.stats[statName]);
                            const modifier = Math.floor((value - 10) / 2);
                            statElement.querySelector('.modifier').textContent = (modifier >= 0 ? '+' : '') + modifier;
                        }
                    });
                }
                
                alert('Лист персонажа успешно загружен!');
            } catch (error) {
                alert('Ошибка! Не удалось прочитать файл. Убедитесь, что это корректный JSON файл персонажа.');
                console.error("Ошибка при загрузке:", error);
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    });
});
