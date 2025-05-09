let inventory = [];
let previousStats = {};
let notificationsEnabled = true;
let currentPage = 1;
const itemsPerPage = 10;

function loadInventoryData() {
    const savedInventory = localStorage.getItem('inventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    } else {
        // Загружаем начальные данные из inventory.json, если нет сохраненных
        try {
            inventory = [...inventoryData.products];
            saveInventory();
        } catch (e) {
            generateInitialInventory(15);
        }
    }renderInventoryTable
    
    // Загружаем настройки уведомлений
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        notificationsEnabled = settings.notifications === 'enabled';
    }
    
    // Сохраняем начальную статистику для сравнения
    updatePreviousStats();
    
    renderInventoryTable();
    updateCategoryFilter();
    checkLowStockItems();
}

function getInventory() {
    return inventory;
}

function addItemToInventory(item) {
    inventory.push(item);
    saveInventory();
    renderInventoryTable();
    updateDashboardStats();
    updateCharts();
    
    // Проверка на низкий запас после добавления
    if (item.quantity <= 5) {
        showNotification(`Низкий запас: ${item.name} (${item.quantity} шт.)`, 'warning');
        addToLog(`Внимание: низкий запас товара ${item.name} (${item.quantity} шт.)`, 'warning');
    }
}

function removeItemFromInventory(id) {
    const itemIndex = inventory.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
        const removedItem = inventory[itemIndex];
        inventory.splice(itemIndex, 1);
        saveInventory();
        renderInventoryTable();
        updateDashboardStats();
        updateCharts();
        
        showNotification(`Товар удален: ${removedItem.name}`, 'error');
    }
}

function updateItemQuantity(id, newQuantity) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        const oldQuantity = item.quantity;
        item.quantity = newQuantity;
        saveInventory();
        renderInventoryTable();
        updateDashboardStats();
        updateCharts();
        
        // Проверка изменения количества
        if (newQuantity === 0) {
            showNotification(`Товар закончился: ${item.name}`, 'error');
            addToLog(`Товар закончился: ${item.name} (ID: ${id})`, 'error');
        } else if (newQuantity <= 5 && oldQuantity > 5) {
            showNotification(`Низкий запас: ${item.name} (${newQuantity} шт.)`, 'warning');
            addToLog(`Внимание: низкий запас товара ${item.name} (${newQuantity} шт.)`, 'warning');
        } else if (newQuantity > 5 && oldQuantity <= 5) {
            showNotification(`Запас восстановлен: ${item.name} (${newQuantity} шт.)`, 'success');
            addToLog(`Запас восстановлен: ${item.name} (${newQuantity} шт.)`, 'success');
        }
    }
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function addNewItem() {
    const name = document.getElementById('item-name').value.trim();
    const category = document.getElementById('item-category').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);
    const location = document.getElementById('item-location').value.trim();
    
    if (!name || !category || isNaN(quantity) || quantity < 0 || !location) {
        showNotification('Пожалуйста, заполните все поля корректно', 'error');
        return;
    }
    
    const newItem = {
        id: generateId(),
        name,
        category,
        quantity,
        location,
        price: Math.floor(Math.random() * 10000) + 1000
    };
    
    addItemToInventory(newItem);
    addToLog(`Добавлен новый товар: ${name} (${quantity} шт.)`, 'success');
    showNotification(`Товар добавлен: ${name}`, 'success');
}

function renderInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '';
    
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    
    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                             item.id.toString().toLowerCase().includes(searchTerm) ||
                             item.location.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    if (filteredInventory.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center;">Нет товаров, соответствующих критериям поиска</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    filteredInventory.forEach(item => {
        const row = document.createElement('tr');
        
        // Добавляем классы для товаров с низким запасом или отсутствующих
        if (item.quantity === 0) {
            row.classList.add('out-of-stock');
        } else if (item.quantity <= 5) {
            row.classList.add('low-stock');
        }
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${item.location}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${item.id}" title="Изменить количество">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${item.id}" title="Удалить товар">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Обработчики для кнопок редактирования и удаления
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editItem(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const item = inventory.find(item => item.id === id);
            if (item && confirm(`Вы уверены, что хотите удалить товар "${item.name}"?`)) {
                removeItemFromInventory(id);
                addToLog(`Товар удален: ${item.name} (ID: ${id})`, 'error');
            }
        });
    });
}

function editItem(id) {
    const item = inventory.find(item => item.id === id);
    if (!item) return;
    
    const newQuantity = prompt('Введите новое количество:', item.quantity);
    if (newQuantity !== null && !isNaN(newQuantity)) {
        updateItemQuantity(id, parseInt(newQuantity));
    }
}

function updateCategoryFilter() {
    const filter = document.getElementById('category-filter');
    const categories = [...new Set(inventory.map(item => item.category))].sort();
    
    filter.innerHTML = '<option value="all">Все категории</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filter.appendChild(option);
    });
}

function generateInitialInventory(count) {
    const categories = ['Электроника', 'Одежда', 'Продукты', 'Книги', 'Спорт', 'Другое'];
    const names = [
        'Ноутбук', 'Смартфон', 'Футболка', 'Джинсы', 'Яблоки', 
        'Молоко', 'JavaScript для начинающих', 'Мяч футбольный', 'Наушники', 'Часы'
    ];
    
    const brands = {
        'Электроника': ['Samsung', 'Apple', 'Xiaomi', 'Sony', 'LG'],
        'Одежда': ['Nike', 'Adidas', 'Zara', 'H&M', 'Puma'],
        'Продукты': ['Домик в деревне', 'Простоквашино', 'Бурёнка', 'Чудо', 'Фрутоняня'],
        'Книги': ['Эксмо', 'АСТ', 'Питер', 'Манн, Иванов и Фербер', 'Альпина'],
        'Спорт': ['Nike', 'Adidas', 'Puma', 'Reebok', 'Wilson']
    };
    
    for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        let name;
        
        if (brands[category]) {
            const brand = brands[category][Math.floor(Math.random() * brands[category].length)];
            const model = Math.floor(Math.random() * 1000);
            name = `${brand} ${model}`;
        } else {
            name = names[Math.floor(Math.random() * names.length)] + ' ' + Math.floor(Math.random() * 1000);
        }
        
        inventory.push({
            id: generateId(),
            name,
            category,
            quantity: Math.floor(Math.random() * 100) + 1,
            location: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`,
            price: Math.floor(Math.random() * 10000) + 1000,
            addedDate: new Date().toISOString()
        });
    }
    
    saveInventory();
    showNotification(`Сгенерировано ${count} случайных товаров`, 'success');
}

function checkLowStockItems() {
    const lowStockItems = inventory.filter(item => item.quantity <= 5 && item.quantity > 0);
    const outOfStockItems = inventory.filter(item => item.quantity === 0);
    
    if (outOfStockItems.length > 0 && notificationsEnabled) {
        showNotification(`Внимание: ${outOfStockItems.length} товаров закончились на складе`, 'error');
    }
    
    if (lowStockItems.length > 0 && notificationsEnabled) {
        showNotification(`Внимание: ${lowStockItems.length} товаров с низким запасом`, 'warning');
    }
}

function updatePreviousStats() {
    previousStats = {
        totalItems: inventory.length,
        totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
        categories: [...new Set(inventory.map(item => item.category))].length
    };
}

function showNotification(message, type = 'info') {
    if (!notificationsEnabled) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <span class="notification-close">&times;</span>
    `;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Закрытие по кнопке
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function addToLog(message, type = 'info') {
    const log = document.getElementById('operations-log');
    const entry = document.createElement('p');
    const timestamp = new Date().toLocaleTimeString();
    
    entry.textContent = `[${timestamp}] ${message}`;
    entry.className = type;
    
    log.prepend(entry);
    
    if (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Инициализация слушателей событий
document.getElementById('search-input').addEventListener('input', renderInventoryTable);
document.getElementById('category-filter').addEventListener('change', renderInventoryTable);

document.getElementById('generate-items-btn').addEventListener('click', function() {
    generateInitialInventory(10);
    renderInventoryTable();
    updateDashboardStats();
    updateCharts();
    addToLog('Сгенерировано 10 случайных товаров', 'info');
});

document.getElementById('clear-inventory-btn').addEventListener('click', function() {
    if (inventory.length === 0) {
        showNotification('Склад уже пуст', 'warning');
        return;
    }
    
    if (confirm('Вы уверены, что хотите очистить весь склад? Это действие нельзя отменить.')) {
        inventory = [];
        saveInventory();
        renderInventoryTable();
        updateDashboardStats();
        updateCharts();
        addToLog('Склад полностью очищен', 'error');
        showNotification('Склад очищен', 'error');
    }
});

// Инициализация Font Awesome для иконок
document.addEventListener('DOMContentLoaded', function() {
    const faScript = document.createElement('script');
    faScript.src = 'https://kit.fontawesome.com/a076d05399.js';
    faScript.crossOrigin = 'anonymous';
    document.head.appendChild(faScript);
});