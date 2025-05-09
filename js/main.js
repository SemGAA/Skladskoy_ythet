document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupNavigation();
    setupModals();
    loadInventoryData();
    updateDashboardStats();
    initCharts();
    
    // Загрузка настроек
    loadSettings();
    
    // Установка интервала автообновления
    setupAutoUpdate();
    
    // Инициализация темы
    initTheme();
});

function initApp() {
    console.log('Приложение инициализировано');
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
            
            // Обновляем графики при переходе на вкладку отчетов
            if (sectionId === 'reports') {
                updateAllCharts();
            }
        });
    });
}

function setupModals() {
    // Модальное окно добавления товара
    const addModal = document.getElementById('add-item-modal');
    const addBtn = document.getElementById('add-item-btn');
    const addCloseBtn = addModal.querySelector('.close-modal');
    
    addBtn.addEventListener('click', () => {
        addModal.style.display = 'block';
    });
    
    addCloseBtn.addEventListener('click', () => {
        addModal.style.display = 'none';
    });
    
    // Модальное окно редактирования товара
    const editModal = document.getElementById('edit-item-modal');
    const editCloseBtn = editModal.querySelector('.close-modal');
    
    editCloseBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    
    // Модальное окно данных (импорт/экспорт)
    const dataModal = document.getElementById('data-modal');
    const dataCloseBtn = dataModal.querySelector('.close-modal');
    
    dataCloseBtn.addEventListener('click', () => {
        dataModal.style.display = 'none';
    });
    
    // Закрытие модальных окон при клике вне контента
    window.addEventListener('click', (e) => {
        if (e.target === addModal) addModal.style.display = 'none';
        if (e.target === editModal) editModal.style.display = 'none';
        if (e.target === dataModal) dataModal.style.display = 'none';
    });
    
    // Обработчики форм
    document.getElementById('add-item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewItem();
        this.reset();
        addModal.style.display = 'none';
    });
    
    document.getElementById('edit-item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedItem();
        editModal.style.display = 'none';
    });
    
    // Кнопки импорта/экспорта
    document.getElementById('export-btn').addEventListener('click', showExportModal);
    document.getElementById('import-btn').addEventListener('click', showImportModal);
    
    // Очистка лога
    document.getElementById('clear-log-btn').addEventListener('click', clearOperationsLog);
    
    // Сохранение настроек
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('reset-settings').addEventListener('click', resetSettings);
}

function updateDashboardStats() {
    const inventory = getInventory();
    const currentStats = {
        totalItems: inventory.length,
        totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
        categories: [...new Set(inventory.map(item => item.category))].length,
        capacity: Math.min(100, Math.floor(inventory.length / 50 * 100))
    };
    
    // Обновляем значения
    document.getElementById('total-items').textContent = currentStats.totalItems;
    document.getElementById('in-stock').textContent = currentStats.totalQuantity;
    document.getElementById('total-categories').textContent = currentStats.categories;
    document.getElementById('capacity').textContent = `${currentStats.capacity}%`;
    
    // Обновляем тренды
    updateTrends(currentStats);
    
    // Сохраняем текущую статистику для сравнения
    previousStats = currentStats;
}

function updateTrends(currentStats) {
    const trendIcons = document.querySelectorAll('.trend');
    
    trendIcons.forEach(icon => {
        const statId = icon.parentElement.querySelector('p').id;
        const currentValue = currentStats[statId.replace('-', '')];
        const previousValue = previousStats[statId.replace('-', '')] || currentValue;
        
        icon.innerHTML = '';
        
        if (currentValue > previousValue) {
            icon.className = 'trend trend-up';
            icon.innerHTML = '<i class="fas fa-arrow-up"></i>';
        } else if (currentValue < previousValue) {
            icon.className = 'trend trend-down';
            icon.innerHTML = '<i class="fas fa-arrow-down"></i>';
        } else {
            icon.className = 'trend trend-neutral';
            icon.innerHTML = '<i class="fas fa-equals"></i>';
        }
    });
}

function updateRandomInventory() {
    if (Math.random() < 0.2) {
        if (Math.random() < 0.5) {
            // Добавление нового товара
            const categories = ['Электроника', 'Одежда', 'Продукты', 'Книги', 'Спорт', 'Другое'];
            const newItem = {
                id: generateId(),
                name: `Товар-${Math.floor(Math.random() * 1000)}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                quantity: Math.floor(Math.random() * 50) + 1,
                location: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`,
                price: Math.floor(Math.random() * 10000) + 1000,
                addedDate: new Date().toISOString()
            };
            addItemToInventory(newItem);
        } else {
            // Изменение количества случайного товара
            if (inventory.length > 0) {
                const randomItem = inventory[Math.floor(Math.random() * inventory.length)];
                const change = Math.floor(Math.random() * 10) * (Math.random() < 0.5 ? -1 : 1);
                const newQuantity = Math.max(0, randomItem.quantity + change);
                updateItemQuantity(randomItem.id, newQuantity);
            }
        }
    }
}

function setupAutoUpdate() {
    const savedSettings = localStorage.getItem('settings');
    let interval = 5; // default 5 minutes
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        interval = parseInt(settings.autoUpdate) || 5;
    }
    
    if (interval > 0) {
        setInterval(() => {
            updateRandomInventory();
            updateDashboardStats();
            updateCharts();
        }, interval * 60 * 1000); // Convert minutes to milliseconds
    }
}

function loadSettings() {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        document.getElementById('system-name').value = settings.systemName || 'Складская автоматизация';
        document.getElementById('notifications').value = settings.notifications || 'enabled';
        document.getElementById('auto-update').value = settings.autoUpdate || '5';
        document.getElementById('low-stock-threshold').value = settings.lowStockThreshold || '5';
    }
}

function saveSettings() {
    const settings = {
        systemName: document.getElementById('system-name').value,
        notifications: document.getElementById('notifications').value,
        autoUpdate: document.getElementById('auto-update').value,
        lowStockThreshold: document.getElementById('low-stock-threshold').value
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    showNotification('Настройки сохранены', 'success');
    
    // Перезапускаем автообновление с новым интервалом
    setupAutoUpdate();
}

function resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
        localStorage.removeItem('settings');
        loadSettings();
        showNotification('Настройки сброшены', 'success');
    }
}

function initTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Установка начальной темы
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function setTheme(theme) {
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.textContent = '🌙';
    } else {
        document.body.classList.remove('light-theme');
        themeToggle.textContent = '☀️';
    }
}

function showExportModal() {
    const modalContent = document.getElementById('data-modal-content');
    const modalTitle = document.getElementById('data-modal-title');
    
    modalTitle.innerHTML = '<i class="fas fa-file-export"></i> Экспорт данных';
    modalContent.innerHTML = `
        <p>Экспортировать текущие данные инвентаря в файл JSON:</p>
        <button id="export-json-btn" class="secondary-btn"><i class="fas fa-download"></i> Экспорт JSON</button>
        <div class="json-viewer" id="export-json-viewer">${JSON.stringify({ products: getInventory() }, null, 2)}</div>
    `;
    
    document.getElementById('export-json-btn').addEventListener('click', exportInventory);
    document.getElementById('data-modal').style.display = 'block';
}

function showImportModal() {
    const modalContent = document.getElementById('data-modal-content');
    const modalTitle = document.getElementById('data-modal-title');
    
    modalTitle.innerHTML = '<i class="fas fa-file-import"></i> Импорт данных';
    modalContent.innerHTML = `
        <p>Импортировать данные инвентаря из файла JSON:</p>
        <input type="file" id="import-file" class="file-input" accept=".json">
        <label for="import-file" class="file-label"><i class="fas fa-upload"></i> Выбрать файл</label>
        <button id="import-json-btn" class="secondary-btn" disabled><i class="fas fa-file-import"></i> Импорт</button>
        <div class="json-viewer" id="import-json-viewer">Выберите файл для предпросмотра...</div>
    `;
    
    const fileInput = document.getElementById('import-file');
    const importBtn = document.getElementById('import-json-btn');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                document.getElementById('import-json-viewer').textContent = JSON.stringify(data, null, 2);
                importBtn.disabled = false;
                
                importBtn.addEventListener('click', function() {
                    importInventory(data);
                });
            } catch (error) {
                document.getElementById('import-json-viewer').textContent = 'Ошибка: Неверный формат файла';
                importBtn.disabled = true;
            }
        };
        reader.readAsText(file);
    });
    
    document.getElementById('data-modal').style.display = 'block';
}

function exportInventory() {
    const data = JSON.stringify({ products: getInventory() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Данные успешно экспортированы', 'success');
    addToLog('Экспортированы данные инвентаря', 'info');
}

function importInventory(data) {
    if (!data || !data.products || !Array.isArray(data.products)) {
        showNotification('Неверный формат данных для импорта', 'error');
        return;
    }
    
    if (confirm(`Вы уверены, что хотите импортировать ${data.products.length} товаров? Текущие данные будут заменены.`)) {
        inventory = data.products;
        saveInventory();
        renderInventoryTable();
        updateDashboardStats();
        updateCharts();
        
        showNotification(`Успешно импортировано ${data.products.length} товаров`, 'success');
        addToLog(`Импортировано ${data.products.length} товаров`, 'info');
        document.getElementById('data-modal').style.display = 'none';
    }
}

function clearOperationsLog() {
    if (confirm('Вы уверены, что хотите очистить историю операций?')) {
        document.getElementById('operations-log').innerHTML = '';
        addToLog('История операций очищена', 'warning');
    }
}

// Helper function to update charts when needed
function updateCharts() {
    if (inventoryChart) updateInventoryChart();
    if (movementChart) updateMovementChart();
    if (categoryChart) updateCategoryChart();
    if (categoryPieChart) updateCategoryPieChart();
    if (topItemsChart) updateTopItemsChart();
    if (valueChart) updateValueChart();
}