const wrapper = document.getElementById("tabela-wrapper");
let grid;
let fullData = [];
let choices = {};

function calculateRealTime(startISO, endISO) {
    if (endISO) {
        const start = new Date(startISO);
        const end = new Date(endISO);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "00:00";
        if (end < start) { end.setDate(end.getDate() + 1); }
        const diffMs = end - start;
        if (diffMs < 0) return "00:00";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (startISO) {
        const start = new Date(startISO);
        if (isNaN(start.getTime())) return "";
        const now = new Date();
        const diffMs = now - start;
        if (diffMs < 0) return "00:00";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return gridjs.html(`<span class="timer-running">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</span>`);
    }
    return "";
}

function applyFilters() {
    const selectedDateStr = document.getElementById('filtro-data').value;
    const selectedGerencias = choices['gerencia']?.getValue(true) || [];
    const selectedTrechos = choices['trecho']?.getValue(true) || [];
    const selectedAtivos = choices['ativo']?.getValue(true) || [];
    const selectedAtividades = choices['atividade']?.getValue(true) || [];
    const selectedTipos = choices['tipo']?.getValue(true) || [];

    const filteredData = fullData.filter(row => {
        let correspondeData = true;
        if (selectedDateStr && row['DATA']) {
            const rowDate = excelSerialToJSDate(row['DATA']); // Requer a função auxiliar apenas aqui
            correspondeData = rowDate ? (rowDate.toISOString().split('T')[0] === selectedDateStr) : false;
        }
        const correspondeGerencia = selectedGerencias.length === 0 || selectedGerencias.includes(row['Gerência da Via']);
        const correspondeTrecho = selectedTrechos.length === 0 || selectedTrechos.includes(row['Trecho']);
        const correspondeAtivo = selectedAtivos.length === 0 || selectedAtivos.includes(row['ATIVO']);
        const correspondeAtividade = selectedAtividades.length === 0 || selectedAtividades.includes(row['Atividade']);
        const correspondeTipo = selectedTipos.length === 0 || selectedTipos.includes(row['Programar para D+1']);
        return correspondeData && correspondeGerencia && correspondeTrecho && correspondeAtivo && correspondeAtividade && correspondeTipo;
    });
    grid.updateConfig({ data: filteredData }).forceRender();
}

function setupFilters() {
    const filterConfigs = [
        { id: 'filtro-gerencia', column: 'Gerência da Via', placeholder: 'Selecione a Gerência' },
        { id: 'filtro-trecho', column: 'Trecho', placeholder: 'Selecione o Trecho' },
        { id: 'filtro-ativo', column: 'ATIVO', placeholder: 'Selecione o Ativo' },
        { id: 'filtro-atividade', column: 'Atividade', placeholder: 'Selecione a Atividade' },
        { id: 'filtro-tipo', column: 'Programar para D+1', placeholder: 'Selecione o Tipo' }
    ];
    filterConfigs.forEach(config => {
        const uniqueValues = [...new Set(fullData.map(item => item[config.column]))].filter(Boolean).sort().map(value => ({ value: value, label: value }));
        const element = document.getElementById(config.id);
        if (element) {
            const choiceKey = config.id.replace('filtro-', '');
            if (choices[choiceKey]) { choices[choiceKey].destroy(); }
            choices[choiceKey] = new Choices(element, { removeItemButton: true, placeholder: true, placeholderValue: config.placeholder, choices: uniqueValues });
            element.addEventListener('change', applyFilters);
        }
    });
    document.getElementById('filtro-data').addEventListener('change', applyFilters);
}

async function carregarET_AtualizarTabela() {
    try {
        const response = await fetch('data.json?v=' + new Date().getTime());
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        fullData = await response.json();
        
        if (!grid) {
            grid = new gridjs.Grid({
                columns: [
                    { name: 'Identificador', id: 'display_identificador', formatter: (cell) => gridjs.html(cell), width: '200px', attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-identificador' } : null },
                    { name: 'Inicio', id: 'display_inicio', formatter: (cell) => gridjs.html(cell), width: '120px', attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-inicio' } : null },
                    { name: 'Tempo', columns: [{ name: 'Prog', id: 'display_tempo_prog', width: '60px'}, { name: 'Real', formatter: (_, row) => calculateRealTime(row.data.timer_start_timestamp, row.data.timer_end_timestamp), width: '60px' }], attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-tempo' } : null },
                    { name: 'Local', id: 'display_local', formatter: (cell) => gridjs.html(cell), width: '150px', attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-local' } : null },
                    { name: 'Quantidade', id: 'display_quantidade', formatter: (cell) => gridjs.html(cell), width: '120px', attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-quantidade' } : null },
                    { name: 'Detalhamento', id: 'display_detalhamento', width: '400px', attributes: (cell, row, col) => { if (col) { return { 'className': 'gridjs-th col-detalhamento' }; } return { 'className': 'gridjs-cell-detalhamento' }; } }
                ],
                data: fullData,
                sort: true, search: true, pagination: { limit: 20 },
                language: { 'search': { 'placeholder': '🔍 Pesquisar...' }, 'pagination': { 'previous': 'Anterior', 'next': 'Próximo', 'results': () => 'Resultados' }},
            }).render(wrapper);
            setupFilters();
        } else {
            applyFilters();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}
async function atualizarDados() {
     try {
        const response = await fetch('data.json?v=' + new Date().getTime());
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        fullData = await response.json();
        if (grid) {
            Object.values(choices).forEach(choice => choice.destroy());
            setupFilters();
            applyFilters();
        }
     } catch(error) {
        console.error('Erro ao atualizar dados:', error);
     }
}
carregarET_AtualizarTabela();
setInterval(atualizarDados, 30000);