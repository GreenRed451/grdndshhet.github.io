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
