 const dashboardData = JSON.parse(
    document.getElementById("dashboardData").textContent
);
 
 const ctx = document.getElementById('myChart');

    new Chart(ctx, {
        type: 'bar',
        data: {
        labels: dashboardData.monthlyData.map(m => m.label),
        datasets: [{
            label: 'Income',
            data: dashboardData.monthlyData.map(m => m.income),
            borderWidth: 1
        },
        {
            label: 'Expenses',
            data: dashboardData.monthlyData.map(m => m.expense),
            borderWidth: 1
        }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });


    const piechart = document.getElementById('expenseChart');

    new Chart(piechart, {
        type: 'pie',
        data: {
        labels: dashboardData.expenseLabels,
        datasets: [{
            label: 'Expenses',
            data: dashboardData.expenseValues,
            borderWidth: 1
        }]
        },
        options: {
            responsive: true,
        },
        
    });
