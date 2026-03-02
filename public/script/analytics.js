document.addEventListener("DOMContentLoaded", () => {
    loadAnalytics();
});



async function loadAnalytics() {
    try {
        const res = await authFetch("/api/analytics");
        const data = await res.json(); 
        
        const container = document.getElementById('analyticsContent');
        const ctx = document.getElementById('financeChart').getContext('2d');

        // Словарь для отображения
        const typeMap = {
            'card_to_card': 'Перекази',
            'mobile_topup': 'Мобільний',
            'internet_payment': 'Інтернет',
            'iban_transfer': 'IBAN переказ' // Добавили ключ, который был в базе
        };

        // Фильтруем только расходы и те, которые есть в нашем словаре
        const expenseData = data.filter(item => 
            item.type === 'expense' && typeMap[item.transaction_type]
        );
        
        const labels = expenseData.map(item => typeMap[item.transaction_type]);
        const values = expenseData.map(item => item.total);

        // Отрисовка списка
        container.innerHTML = `
            <h3>Деталізація витрат:</h3>
            ${expenseData.map(item => `
                <div style="display:flex; justify-content:space-between; margin-bottom: 8px; border-bottom: 1px solid #ccc;">
                    <span>💸 ${typeMap[item.transaction_type]}</span>
                    <strong>${Number(item.total).toFixed(2)} ₴</strong>
                </div>
            `).join('')}
        `;

        // Отрисовка графика
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: { 
                    legend: { position: 'bottom' }
                }
            }
        });
    } catch (err) {
        console.error("Помилка завантаження аналітики:", err);
    }
}
function goBack() {
  window.location.href = "/dashboard.html";
}
