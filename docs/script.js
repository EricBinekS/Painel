// docs/script.js
const ctx = document.getElementById('meuGrafico').getContext('2d');
let grafico;

async function carregarDadosEAtualizarGrafico() {
    try {
        const response = await fetch(`../data.json?v=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar os dados: ${response.statusText}`);
        }
        const dados = await response.json();

        // IMPORTANTE: Adapte 'NomeDaColunaCategoria' e 'NomeDaColunaValor'
        // para os nomes exatos das colunas nas suas planilhas
        const labels = dados.map(item => item.NomeDaColunaCategoria); 
        const valores = dados.map(item => item.NomeDaColunaValor);  

        if (grafico) {
            grafico.data.labels = labels;
            grafico.data.datasets[0].data = valores;
            grafico.update();
            console.log("Gráfico atualizado com novos dados.");
        } else {
            grafico = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Volume de Dados',
                        data: valores,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            console.log("Gráfico criado.");
        }

    } catch (error) {
        console.error('Erro no script do gráfico:', error);
    }
}

carregarDadosEAtualizarGrafico();
setInterval(carregarDadosEAtualizarGrafico, 30000);