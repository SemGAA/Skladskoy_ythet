
let inventoryChart, movementChart, categoryChart, topItemsChart, valueChart, categoryPieChart;
let currentPeriod = 'week';

function initCharts() {
    createInventoryChart();
    createMovementChart();
    createCategoryChart();
    createTopItemsChart();
    createValueChart();
    createCategoryPieChart();
    
    document.querySelectorAll('.chart-period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPeriod = this.dataset.period;
            updateAllCharts();
        });
    });
}

function updateAllCharts() {
    updateInventoryChart();
    updateMovementChart();
    updateCategoryChart();
    updateTopItemsChart();
    updateValueChart();
    updateCategoryPieChart();
}

function createInventoryChart() {
    const ctx = document.getElementById('inventoryChart').getContext('2d');
        
    inventoryChart = new Chart(ctx, {
        type: 'line',
        data: getInventoryChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Динамика количества товаров',
                    color: '#e0e0e0'
                },
                legend: {
                    labels: {
                        color: '#a0a0a0'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#a0a0a0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#a0a0a0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad'
            }
        }
    });
}

function getInventoryChartData() {
    const inventory = getInventory();
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    
    let labels = [];
    let data = [];
    
    if (currentPeriod === 'week') {
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}));
        }
        
        // Более реалистичные данные с учетом реального инвентаря
        const baseValue = totalItems;
        data = labels.map((_, i) => {
            const fluctuation = Math.sin(i) * baseValue * 0.1;
            return Math.round(baseValue + fluctuation);
        });
    } else if (currentPeriod === 'month') {
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('ru-RU', {month: 'short'}));
        }
        
        const baseValue = totalItems;
        data = labels.map((_, i) => {
            const fluctuation = Math.sin(i/2) * baseValue * 0.15;
            return Math.round(baseValue + fluctuation);
        });
    } else { // year
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today);
            date.setFullYear(date.getFullYear() - i);
            labels.push(date.getFullYear().toString());
        }
        
        const baseValue = totalItems;
        data = labels.map((_, i) => {
            const growth = i * (baseValue * 0.2);
            return Math.round(baseValue + growth);
        });
    }
    
    return {
        labels,
        datasets: [{
            label: 'Общее количество товаров',
            data,
            borderColor: 'rgba(187, 134, 252, 1)',
            backgroundColor: 'rgba(187, 134, 252, 0.2)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgba(187, 134, 252, 1)',
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
            pointRadius: 4
        }]
    };
}
function updateChartsOnDataChange() {
    if (inventoryChart) updateInventoryChart();
    if (movementChart) updateMovementChart();
    if (categoryChart) updateCategoryChart();
    if (categoryPieChart) updateCategoryPieChart();
    if (topItemsChart) updateTopItemsChart();
    if (valueChart) updateValueChart();
}
function updateInventoryChart() {
    inventoryChart.data = getInventoryChartData();
    inventoryChart.update();
}

function createMovementChart() {
    const ctx = document.getElementById('movementChart').getContext('2d');
    
    movementChart = new Chart(ctx, {
        type: 'bar',
        data: getMovementChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Движение товаров',
                    color: '#e0e0e0'
                },
                legend: {
                    labels: {
                        color: '#a0a0a0'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: '#a0a0a0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: '#a0a0a0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

function getMovementChartData() {
    let labels = [];
    let incoming = [];
    let outgoing = [];
    
    if (currentPeriod === 'week') {
        labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        incoming = labels.map(() => Math.floor(Math.random() * 30) + 10);
        outgoing = labels.map(() => Math.floor(Math.random() * 25) + 5);
    } else if (currentPeriod === 'month') {
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        
        // Группируем по неделям
        labels = ['Неделя 1', 'Неделя 2', 'Неделя 3', 'Неделя 4'];
        if (daysInMonth > 28) labels.push('Неделя 5');
        
        incoming = labels.map(() => Math.floor(Math.random() * 100) + 30);
        outgoing = labels.map(() => Math.floor(Math.random() * 80) + 20);
    } else { // year
        labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        incoming = labels.map(() => Math.floor(Math.random() * 300) + 100);
        outgoing = labels.map(() => Math.floor(Math.random() * 250) + 80);
    }
    
    return {
        labels,
        datasets: [
            {
                label: 'Приход',
                data: incoming,
                backgroundColor: 'rgba(3, 218, 198, 0.7)',
                borderColor: 'rgba(3, 218, 198, 1)',
                borderWidth: 1
            },
            {
                label: 'Расход',
                data: outgoing,
                backgroundColor: 'rgba(207, 102, 121, 0.7)',
                borderColor: 'rgba(207, 102, 121, 1)',
                borderWidth: 1
            }
        ]
    };
}

function updateMovementChart() {
    movementChart.data = getMovementChartData();
    movementChart.update();
}

function createCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: getCategoryChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Распределение по категориям',
                    color: '#e0e0e0'
                },
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a0a0a0'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function createCategoryPieChart() {
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    
    categoryPieChart = new Chart(ctx, {
        type: 'pie',
        data: getCategoryChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Распределение по категориям',
                    color: '#e0e0e0'
                },
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a0a0a0'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function getCategoryChartData() {
    const inventory = getInventory();
    const categories = [...new Set(inventory.map(item => item.category))];
    
    const data = categories.map(category => {
        return inventory.filter(item => item.category === category).length;
    });
    
    // Генерация цветов для категорий
    const backgroundColors = categories.map((_, i) => {
        const hue = (i * 137.508) % 360; // Золотой угол для распределения цветов
        return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    return {
        labels: categories,
        datasets: [{
            data,
            backgroundColor: backgroundColors,
            borderColor: 'rgba(30, 30, 30, 0.8)',
            borderWidth: 1
        }]
    };
}

function updateCategoryChart() {
    categoryChart.data = getCategoryChartData();
    categoryChart.update();
}

function updateCategoryPieChart() {
    categoryPieChart.data = getCategoryChartData();
    categoryPieChart.update();
}

function createTopItemsChart() {
    const ctx = document.getElementById('topItemsChart').getContext('2d');
    
    topItemsChart = new Chart(ctx, {
        type: 'bar',
        data: getTopItemsChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Топ товаров по количеству',
                    color: '#e0e0e0'
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Количество: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#a0a0a0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#a0a0a0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function getTopItemsChartData() {
    const inventory = getInventory();
    
    // Сортируем товары по количеству и берем топ-5
    const sorted = [...inventory].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    
    const labels = sorted.map(item => item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name);
    const data = sorted.map(item => item.quantity);
    
    return {
        labels,
        datasets: [{
            data,
            backgroundColor: 'rgba(187, 134, 252, 0.7)',
            borderColor: 'rgba(187, 134, 252, 1)',
            borderWidth: 1
        }]
    };
}

function updateTopItemsChart() {
    topItemsChart.data = getTopItemsChartData();
    topItemsChart.update();
}

function createValueChart() {
    const ctx = document.getElementById('valueChart').getContext('2d');
    
    valueChart = new Chart(ctx, {
        type: 'radar',
        data: getValueChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Оценка стоимости по категориям',
                    color: '#e0e0e0'
                },
                legend: {
                    labels: {
                        color: '#a0a0a0'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} тыс. руб`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#a0a0a0'
                    },
                    ticks: {
                        display: false,
                        backdropColor: 'rgba(0, 0, 0, 0)'
                    }
                }
            }
        }
    });
}

function getValueChartData() {
    const inventory = getInventory();
    const categories = [...new Set(inventory.map(item => item.category))];
    
    // Генерируем оценки стоимости для каждой категории
    const data = categories.map(category => {
        const items = inventory.filter(item => item.category === category);
        const avgPrice = items.reduce((sum, item) => sum + (item.price || 1000), 0) / items.length;
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        return Math.round(avgPrice * totalQuantity / 1000); // В тысячах рублей
    });
    
    return {
        labels: categories,
        datasets: [{
            label: 'Стоимость (тыс. руб)',
            data,
            backgroundColor: 'rgba(187, 134, 252, 0.2)',
            borderColor: 'rgba(187, 134, 252, 1)',
            pointBackgroundColor: 'rgba(187, 134, 252, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(187, 134, 252, 1)'
        }]
    };
}

function updateValueChart() {
    valueChart.data = getValueChartData();
    valueChart.update();
}

// Обработчик изменения размера окна для перерисовки графиков
window.addEventListener('resize', function() {
    if (inventoryChart) inventoryChart.resize();
    if (movementChart) movementChart.resize();
    if (categoryChart) categoryChart.resize();
    if (categoryPieChart) categoryPieChart.resize();
    if (topItemsChart) topItemsChart.resize();
    if (valueChart) valueChart.resize();
});
