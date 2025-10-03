const wrapper = document.getElementById("tabela-wrapper");
let grid;
let fullData = [];
let choices = {};

// --- Funções Auxiliares (Versão Robusta Final) ---
function excelSerialToJSDate(serial) {
    const numSerial = parseFloat(serial);
    if (!numSerial || isNaN(numSerial) || numSerial <= 0) return null;
    if (numSerial >= 1) {
        const utc_days = Math.floor(numSerial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const fractional_day = numSerial - Math.floor(numSerial);
        const total_seconds = Math.floor(86400 * fractional_day);
        date_info.setSeconds(total_seconds);
        return new Date(date_info.getTime() + (date_info.getTimezoneOffset() * 60 * 1000));
    } else {
        const total_seconds = Math.round(numSerial * 86400);
        const hours = Math.floor(total_seconds / 3600);
        const minutes = Math.floor((total_seconds % 3600) / 60);
        const tempDate = new Date();
        tempDate.setHours(hours, minutes, 0, 0);
        return tempDate;
    }
}

function formatTime(value) {
    const dateObj = excelSerialToJSDate(value);
    if (!dateObj || isNaN(dateObj.getTime())) return "";
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function calculateRealTime(startTime, endTime, endTime8, endTime10) {
    const start = excelSerialToJSDate(startTime);
    if (!start) return "";
    const finalEndTimeRaw = endTime || endTime8 || endTime10;
    if (finalEndTimeRaw && parseFloat(finalEndTimeRaw) > 0) {
        const end = excelSerialToJSDate(finalEndTimeRaw);
        if (!end) return "00:00";
        if (end < start) { end.setDate(end.getDate() + 1); }
        const diffMs = end - start;
        if (isNaN(diffMs) || diffMs < 0) return "00:00";
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    const now = new Date();
    const diffMs = now - start;
    if (isNaN(diffMs) || diffMs < 0) return "00:00";
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return gridjs.html(`<span class="timer-running">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</span>`);
}

// --- Lógica de Filtros (Completa e Funcional) ---
function applyFilters() {
    const selectedDate = document.getElementById('filtro-data').value;
    const selectedGerencias = choices['gerencia'] ? choices['gerencia'].getValue(true) : [];
    const selectedTrechos = choices['trecho'] ? choices['trecho'].getValue(true) : [];
    const selectedAtivos = choices['ativo'] ? choices['ativo'].getValue(true) : [];
    const selectedAtividades = choices['atividade'] ? choices['atividade'].getValue(true) : [];
    const selectedTipos = choices['tipo'] ? choices['tipo'].getValue(true) : [];

    const filteredData = fullData.filter(row => {
        let correspondeData = true;
        if (selectedDate && row['DATA']) {
            const rowDate = excelSerialToJSDate(row['DATA']);
            correspondeData = rowDate ? (rowDate.toISOString().split('T')[0] === selectedDate) : false;
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

// --- Função Principal ---
async function carregarET_AtualizarTabela() {
    try {
        const response = await fetch('data.json?v=' + new Date().getTime());
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        fullData = await response.json();

        if (!grid) {
            grid = new gridjs.Grid({
                columns: [
                    { name: 'Identificador', columns: [{ name: 'Ativo', id: 'ATIVO', width: '120px' }, { name: 'Atividade', id: 'Atividade', width: '150px' }], attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-identificador' } : null },
                    { name: 'Inicio', columns: [{ name: 'Prog', id: 'Inicia', formatter: (cell) => formatTime(cell) }, { name: 'Real', id: 'HR Turma Pronta', formatter: (cell) => formatTime(cell) }], attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-inicio' } : null },
                    { name: 'Tempo', columns: [{ name: 'Prog', id: 'Duração', formatter: (cell) => formatTime(cell) }, { name: 'Real', formatter: (_, row) => calculateRealTime(row.cells[3].data, row.cells[9].data, row.cells[10].data, row.cells[11].data) }], attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-tempo' } : null },
                    { name: 'Local', columns: [{ name: 'Prog', id: 'SB', width: '100px' }, { name: 'Real', id: 'SB_4', width: '100px' }], attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-local' } : null },
                    { name: 'Quantidade', columns: [{ name: 'Prog', id: 'Quantidade' }, { name: 'Real', id: 'Quantidade_1' }], attributes: (c, r, col) => col ? { 'className': 'gridjs-th col-quantidade' } : null },
                    { name: 'Detalhamento', id: 'Prévia - 1', width: '350px', formatter: (_, row) => { const fim = row.cells[9].data; const fim8 = row.cells[10].data; const fim10 = row.cells[11].data; const hasEndTime = (fim && parseFloat(fim) > 0) || (fim8 && parseFloat(fim8) > 0) || (fim10 && parseFloat(fim10) > 0); return hasEndTime ? row.cells[13].data : row.cells[12].data; }, attributes: (cell, row, col) => { if (col) { return { 'className': 'gridjs-th col-detalhamento' }; } return { 'className': 'gridjs-cell-detalhamento' }; } },
                    { id: 'Fim', hidden: true }, { id: 'Fim_8', hidden: true }, { id: 'Fim_10', hidden: true }, { id: 'Prévia - 2', hidden: true }, { id: 'DATA', hidden: true }, { id: 'Gerência da Via', hidden: true }, { id: 'Trecho', hidden: true }, { id: 'Programar para D+1', hidden: true }
                ],
                data: fullData,
                sort: true, search: true, pagination: { limit: 20 },
                language: { 'search': { 'placeholder': '🔍 Pesquisar...' }, 'pagination': { 'previous': 'Anterior', 'next': 'Próximo', 'results': () => 'Resultados' } },
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
            Object.values(choices).forEach(choice => choice.destroy()); // Limpa e destrói os filtros antigos
            setupFilters(); // Recria os filtros com as novas opções de dados
            applyFilters(); // Aplica a seleção de filtros atual
            console.log("Tabela e opções de filtros atualizadas.");
        }
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
    }
}

carregarET_AtualizarTabela();
setInterval(atualizarDados, 30000);