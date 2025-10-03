const wrapper = document.getElementById("tabela-wrapper");
let grid;
let fullData = [];

function calculateRealTime(startTime, endTime, endTime8, endTime10) {
    const finalEndTime = endTime || endTime8 || endTime10;
    if (finalEndTime) {
        const start = new Date(startTime);
        const end = new Date(finalEndTime);
        const diffMs = end - start;
        if (isNaN(diffMs) || diffMs < 0) return "00:00";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        if (isNaN(diffMs) || diffMs < 0) return "00:00";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return gridjs.html(`<span class="timer-running">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</span>`);
    }
    return "";
}

async function carregarET_AtualizarTabela() {
    try {
        const response = await fetch(`data.json?v=${new Date().getTime()}`);
        fullData = await response.json();

        if (!grid) {
            grid = new gridjs.Grid({
                columns: [
                    {
                        name: gridjs.html('<strong>Identificador</strong>\nAtivo      Atividade'),
                        formatter: (_, row) => gridjs.html(`<strong>${row.cells[0].data || ''}</strong><br/>${row.cells[1].data || ''}`),
                        attributes: { 'className': 'gridjs-th col-identificador' }
                    },
                    {
                        name: gridjs.html('<strong>Inicio</strong>\nProg      Real'),
                        formatter: (_, row) => gridjs.html(`${row.cells[2].data || ''}<br/>${row.cells[3].data || ''}`)
                    },
                    {
                        name: gridjs.html('<strong>Tempo</strong>\nProg      Real'),
                        formatter: (_, row) => {
                            const progTime = row.cells[8].data || '00:00';
                            const realTime = calculateRealTime(row.cells[3].data, row.cells[9].data, row.cells[10].data, row.cells[11].data);
                            return gridjs.html(`${progTime}<br/>${realTime}`);
                        },
                        attributes: { 'className': 'gridjs-th col-tempo' }
                    },
                    {
                        name: gridjs.html('<strong>Local</strong>\nProg      Real'),
                        formatter: (_, row) => gridjs.html(`${row.cells[4].data || ''}<br/>${row.cells[5].data || ''}`),
                        attributes: { 'className': 'gridjs-th col-local' }
                    },
                    {
                        name: gridjs.html('<strong>Quantidade</strong>\nProg      Real'),
                        formatter: (_, row) => {
                            const progQty = row.cells[6].data || 0;
                            const realQty = row.cells[7].data || 0;
                            return gridjs.html(`${progQty}<br/>${realQty}`);
                        },
                        attributes: { 'className': 'gridjs-th col-quantidade' }
                    },
                    {
                        name: 'Detalhamento',
                        formatter: (_, row) => {
                             const hasEndTime = row.cells[9].data || row.cells[10].data || row.cells[11].data;
                             return hasEndTime ? row.cells[13].data : row.cells[12].data;
                        },
                        attributes: { 'className': 'gridjs-th col-detalhamento' }
                    },
                    { id: 'ATIVO', hidden: true },
                    { id: 'Atividade', hidden: true },
                    { id: 'Inicia', hidden: true },
                    { id: 'HR Turma Pronta', hidden: true },
                    { id: 'SB', hidden: true },
                    { id: 'SB_4', hidden: true },
                    { id: 'Quantidade', hidden: true },
                    { id: 'Quantidade_1', hidden: true },
                    { id: 'Duração', hidden: true },
                    { id: 'Fim', hidden: true },
                    { id: 'Fim_8', hidden: true },
                    { id: 'Fim_10', hidden: true },
                    { id: 'Prévia - 1', hidden: true },
                    { id: 'Prévia - 2', hidden: true }
                ],
                data: () => fullData,
                sort: true,
                search: true,
                pagination: { limit: 20 },
                language: {
                    'search': { 'placeholder': '🔍 Pesquisar...' },
                    'pagination': { 'previous': 'Anterior', 'next': 'Próximo', 'results': () => 'Resultados' }
                },
            }).render(wrapper);
        
        } else {
            await grid.updateConfig({ data: () => fullData }).forceRender();
        }

    } catch (error) {
        console.error('Erro ao carregar ou atualizar a tabela:', error);
    }
}

carregarET_AtualizarTabela();
setInterval(carregarET_AtualizarTabela, 30000);