const wrapper = document.getElementById("tabela-wrapper");
let grid;
let fullData = []; // Armazena todos os dados para os filtros

// *** FUNÇÃO PARA O TIMER ***
// Esta função calcula o tempo decorrido
function calculateRealTime(startTime, endTime1, endTime2, endTime3) {
    // Se qualquer um dos campos de "Fim" tiver valor, a tarefa terminou
    const finalEndTime = endTime1 || endTime2 || endTime3;
    if (finalEndTime) {
        const start = new Date(startTime);
        const end = new Date(finalEndTime);
        const diffMs = end - start;
        if (isNaN(diffMs) || diffMs < 0) return "00:00";
        
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    // Se a tarefa ainda está em andamento, calcula o tempo até agora
    if (startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        if (isNaN(diffMs) || diffMs < 0) return "00:00";

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        // Adiciona a classe CSS para o efeito de "pulsar"
        return gridjs.html(`<span class="timer-running">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</span>`);
    }

    return ""; // Se não houver hora de início
}


async function carregarET_AtualizarTabela() {
    try {
        const response = await fetch(`../data.json?v=${new Date().getTime()}`);
        fullData = await response.json();

        if (!grid) {
            grid = new gridjs.Grid({
                columns: [
                    // *** AJUSTE OS NOMES DAS COLUNAS AQUI ***
                    // O nome da coluna do Grid.js pode ser o que você quiser.
                    // O 'id' deve ser EXATAMENTE igual ao nome da coluna no seu data.json
                    {
                        name: gridjs.html('<strong>Identificador</strong><br/>Ativo &nbsp;&nbsp;&nbsp;&nbsp; Atividade'),
                        id: 'ATIVO', // Coluna principal para ordenação
                        formatter: (_, row) => gridjs.html(`<strong>${row.cells[0].data}</strong><br/>${row.cells[1].data}`),
                        columns: [
                            { name: 'Ativo', id: 'ATIVO', hidden: true },
                            { name: 'Atividade', id: 'Atividade', hidden: true }
                        ],
                        attributes: { 'className': 'gridjs-th col-identificador' }
                    },
                    {
                        name: gridjs.html('<strong>Inicio</strong><br/>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real'),
                        id: 'Inicia',
                        formatter: (_, row) => gridjs.html(`${row.cells[2].data || ''}<br/>${row.cells[3].data || ''}`),
                        columns: [
                            { name: 'Prog', id: 'Inicia', hidden: true },
                            { name: 'Real', id: 'HR Turma Pronta', hidden: true }
                        ]
                    },
                    {
                        name: gridjs.html('<strong>Tempo</strong><br/>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real'),
                        id: 'Duração',
                        formatter: (_, row) => {
                            const progTime = row.cells[4].data || '';
                            const realTime = calculateRealTime(row.cells[3].data, row.cells[8].data, row.cells[9].data, row.cells[10].data);
                            return gridjs.html(`${progTime}<br/>${realTime}`);
                        },
                        columns: [
                            { name: 'Prog', id: 'Duração', hidden: true }
                        ]
                    },
                    {
                        name: gridjs.html('<strong>Local</strong><br/>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real'),
                        id: 'SB',
                        formatter: (_, row) => gridjs.html(`${row.cells[5].data || ''}<br/>${row.cells[6].data || ''}`),
                        columns: [
                            { name: 'Prog', id: 'SB', hidden: true },
                            { name: 'Real', id: 'SB_4', hidden: true }
                        ],
                        attributes: { 'className': 'gridjs-th col-local' }
                    },
                    {
                        name: gridjs.html('<strong>Quantidade</strong><br/>Prog &nbsp;&nbsp;&nbsp;&nbsp; Real'),
                        id: 'Quantidade',
                        formatter: (_, row) => gridjs.html(`${row.cells[7].data || ''}<br/>${row.cells[8].data || ''}`),
                        columns: [
                            { name: 'Prog', id: 'Quantidade', hidden: true },
                            { name: 'Real', id: 'Quantidade_1', hidden: true }
                        ],
                        attributes: { 'className': 'gridjs-th col-quantidade' }
                    },
                    {
                        name: 'Detalhamento',
                        id: 'Prévia - 1',
                        formatter: (_, row) => {
                             const hasEndTime = row.cells[9].data || row.cells[10].data || row.cells[11].data;
                             return hasEndTime ? row.cells[12].data : row.cells[11].data;
                        },
                         columns: [
                            // Colunas ocultas necessárias para a lógica do timer e detalhamento
                            { id: 'Fim', hidden: true },
                            { id: 'Fim_8', hidden: true },
                            { id: 'Fim_10', hidden: true },
                            { id: 'Prévia - 1', hidden: true },
                            { id: 'Prévia - 2', hidden: true },
                         ],
                        attributes: { 'className': 'gridjs-th col-detalhamento' }
                    }
                ],
                data: () => fullData,
                sort: true,
                pagination: { limit: 20 },
                language: {
                    'search': { 'placeholder': '🔍 Pesquisar...' },
                    'pagination': { 'previous': 'Anterior', 'next': 'Próximo', 'results': () => 'Resultados' }
                },
            }).render(wrapper);
        } else {
            // Apenas força a re-renderização para atualizar os dados e os timers
            await grid.updateConfig({ data: () => fullData }).forceRender();
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

// Execução e agendamento
carregarET_AtualizarTabela();
// O timer precisa ser atualizado com mais frequência para parecer em tempo real
setInterval(carregarET_AtualizarTabela, 15000); // Busca novos dados a cada 15 segundos