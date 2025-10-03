// docs/script.js

// Referência ao container da tabela que está no index.html
const wrapper = document.getElementById("tabela-wrapper");

// Variável global para guardar a instância da nossa tabela
let grid;
// Variável global para guardar os dados completos vindos do JSON
let fullData = [];

// --- FUNÇÃO AUXILIAR PARA O TIMER ---
// Esta função calcula o tempo real decorrido de uma atividade
function calculateRealTime(startTime, endTime, endTime8, endTime10) {
    // Verifica se qualquer um dos campos de "Fim" tem um valor. Se sim, a tarefa terminou.
    const finalEndTime = endTime || endTime8 || endTime10;
    
    if (finalEndTime) {
        const start = new Date(startTime);
        const end = new Date(finalEndTime);
        const diffMs = end - start;
        // Se o cálculo for inválido ou negativo, retorna 00:00
        if (isNaN(diffMs) || diffMs < 0) return "00:00";
        
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    // Se a tarefa ainda está em andamento (nenhum Fim preenchido), calcula o tempo até agora
    if (startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        if (isNaN(diffMs) || diffMs < 0) return "00:00";

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        // Retorna o tempo com uma classe CSS especial para o efeito de "pulsar"
        return gridjs.html(`<span class="timer-running">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</span>`);
    }

    return ""; // Retorna vazio se não houver hora de início
}


// --- FUNÇÃO PRINCIPAL ---
// Carrega os dados do JSON e cria ou atualiza a tabela
async function carregarET_AtualizarTabela() {
    try {
        const response = await fetch(`../data.json?v=${new Date().getTime()}`);
        fullData = await response.json();

        // Se a tabela (grid) ainda não foi criada na página, crie-a
        if (!grid) {
            grid = new gridjs.Grid({
                // --- DEFINIÇÃO DAS COLUNAS ---
                columns: [
                    // --- COLUNA 1: IDENTIFICADOR ---
                    {
                        name: gridjs.html('<strong>Identificador</strong><br/><span style="font-weight:normal;">Ativo &nbsp;&nbsp;&nbsp;&nbsp; Atividade</span>'),
                        formatter: (_, row) => {
                            // O formatter combina os dados de outras colunas nesta célula
                            // row.cells[0].data se refere à primeira coluna definida abaixo (ATIVO)
                            // row.cells[1].data se refere à segunda (Atividade)
                            return gridjs.html(`<strong>${row.cells[0].data || ''}</strong><br/>${row.cells[1].data || ''}`);
                        },
                        // Define as colunas filhas que fornecem os dados, mas ficam ocultas
                        columns: [
                            { name: 'Ativo', id: 'ATIVO' }, // *** AJUSTE AQUI: Nome exato da coluna no seu JSON
                            { name: 'Atividade', id: 'Atividade' } // *** AJUSTE AQUI: Nome exato da coluna no seu JSON
                        ],
                        attributes: { 'className': 'gridjs-th col-identificador' }
                    },

                    // --- COLUNA 2: INICIO ---
                    {
                        name: gridjs.html('<strong>Inicio</strong><br/><span style="font-weight:normal;">Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span>'),
                        formatter: (_, row) => gridjs.html(`${row.cells[2].data || ''}<br/>${row.cells[3].data || ''}`),
                        columns: [
                            { name: 'Prog', id: 'Inicia' }, // *** AJUSTE AQUI
                            { name: 'Real', id: 'HR Turma Pronta' } // *** AJUSTE AQUI
                        ]
                    },

                    // --- COLUNA 3: TEMPO (COM LÓGICA DO TIMER) ---
                    {
                        name: gridjs.html('<strong>Tempo</strong><br/><span style="font-weight:normal;">Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span>'),
                        formatter: (_, row) => {
                            const progTime = row.cells[4].data || '00:00';
                            const realTime = calculateRealTime(row.cells[3].data, row.cells[7].data, row.cells[8].data, row.cells[9].data);
                            return gridjs.html(`${progTime}<br/>${realTime}`);
                        },
                        attributes: { 'className': 'gridjs-th col-tempo' }
                    },

                    // --- COLUNA 4: LOCAL ---
                    {
                        name: gridjs.html('<strong>Local</strong><br/><span style="font-weight:normal;">Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span>'),
                        formatter: (_, row) => gridjs.html(`${row.cells[5].data || ''}<br/>${row.cells[6].data || ''}`),
                        columns: [
                            { name: 'Prog', id: 'SB' }, // *** AJUSTE AQUI
                            { name: 'Real', id: 'SB_4' } // *** AJUSTE AQUI
                        ],
                        attributes: { 'className': 'gridjs-th col-local' }
                    },
                    
                    // --- COLUNA 5: QUANTIDADE ---
                    {
                        name: gridjs.html('<strong>Quantidade</strong><br/><span style="font-weight:normal;">Prog &nbsp;&nbsp;&nbsp;&nbsp; Real</span>'),
                        formatter: (_, row) => {
                            // O campo quantidade é filho dele mesmo, por isso o índice é 7 e 8
                            const progQty = row.cells[12].data || 0;
                            const realQty = row.cells[13].data || 0;
                            return gridjs.html(`${progQty}<br/>${realQty}`);
                        },
                        columns: [
                            { name: 'Prog', id: 'Quantidade' }, // *** AJUSTE AQUI
                            { name: 'Real', id: 'Quantidade_1' } // *** AJUSTE AQUI
                        ],
                        attributes: { 'className': 'gridjs-th col-quantidade' }
                    },

                    // --- COLUNA 6: DETALHAMENTO (COM LÓGICA CONDICIONAL) ---
                    {
                        name: 'Detalhamento',
                        formatter: (_, row) => {
                            const hasEndTime = row.cells[7].data || row.cells[8].data || row.cells[9].data;
                            return hasEndTime ? row.cells[11].data : row.cells[10].data;
                        },
                        attributes: { 'className': 'gridjs-th col-detalhamento' }
                    },
                    
                    // --- COLUNAS DE DADOS OCULTAS ---
                    // Definimos todas as colunas do JSON aqui para que a lógica acima funcione,
                    // mesmo que a gente não queira mostrar todas elas.
                    { id: 'Duração', hidden: true },
                    { id: 'Fim', hidden: true },
                    { id: 'Fim_8', hidden: true },
                    { id: 'Fim_10', hidden: true },
                    { id: 'Prévia - 1', hidden: true },
                    { id: 'Prévia - 2', hidden: true },
                ],

                // --- CONFIGURAÇÕES GERAIS DA TABELA ---
                data: () => fullData, // A tabela sempre pegará os dados da nossa variável
                sort: true,
                search: true,
                pagination: { limit: 20 },
                language: {
                    'search': { 'placeholder': '🔍 Pesquisar...' },
                    'pagination': { 'previous': 'Anterior', 'next': 'Próximo', 'results': () => 'Resultados' }
                },

            }).render(wrapper); // Renderiza a tabela na página
        
        } else {
            // Se a tabela já existe, apenas força uma nova renderização
            // para atualizar os dados e os timers
            await grid.updateConfig({ data: () => fullData }).forceRender();
        }

    } catch (error) {
        console.error('Erro ao carregar ou atualizar a tabela:', error);
    }
}

// --- EXECUÇÃO E AGENDAMENTO ---

// Roda a função pela primeira vez quando a página carrega
carregarET_AtualizarTabela();

// Configura um intervalo para rodar a função repetidamente
// O timer precisa ser atualizado com frequência para parecer em tempo real
setInterval(carregarET_AtualizarTabela, 30000); // Busca novos dados e atualiza os timers a cada 30 segundos