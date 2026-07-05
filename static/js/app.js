let q = { esc: 0, cax: 0, rep: 0 };
let saveTimeout;
let isCleaning = false;
const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCurrency(value) {
    return fmt.format(value);
}

function parseCurrency(value) {
    if (typeof value === 'number') return value;
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
}

function handleMoneyInput(input) {
    let value = input.value.replace(/\D/g, '');
    value = (value / 100).toFixed(2);
    input.value = fmt.format(value);
    run();
}

function updateQtd(t, d) {
    q[t] += d;
    if (q[t] < 0) q[t] = 0;
    document.getElementById(`qtd_${t}`).innerText = q[t];
    run();
}

async function loadInitialData() {
    try {
        // Adiciona buster de cache para garantir dados frescos do servidor
        const res = await fetch('/api/get_data?t=' + new Date().getTime());
        if (res.status === 401) { window.location.href = '/login'; return; }
        const data = await res.json();

        document.getElementById('fat_input').value = fmt.format(data.fat || 0);
        document.getElementById('socios_input').value = data.socios;
        document.getElementById('base_esc').value = fmt.format(data.base_esc || 0);
        document.getElementById('base_cax').value = fmt.format(data.base_cax || 0);
        document.getElementById('base_rep').value = fmt.format(data.base_rep || 0);
        document.getElementById('agua_input').value = fmt.format(data.agua || 0);
        document.getElementById('energia_input').value = fmt.format(data.energia || 0);
        document.getElementById('combustivel_input').value = fmt.format(data.combustivel || 0);
        document.getElementById('aluguel_input').value = fmt.format(data.aluguel || 0);

        q.esc = data.q_esc;
        q.cax = data.q_cax;
        q.rep = data.q_rep;

        document.getElementById('qtd_esc').innerText = q.esc;
        document.getElementById('qtd_cax').innerText = q.cax;
        document.getElementById('qtd_rep').innerText = q.rep;

        run(false);
    } catch (e) { console.error("Erro ao carregar dados:", e); }
}

function run(shouldSave = true) {
    if (isCleaning) return; // Bloqueia cálculos se estiver limpando
    const fat = parseCurrency(document.getElementById('fat_input').value);
    const nSocios = parseInt(document.getElementById('socios_input').value) || 0;
    const bEsc = parseCurrency(document.getElementById('base_esc').value);
    const bCax = parseCurrency(document.getElementById('base_cax').value);
    const bRep = parseCurrency(document.getElementById('base_rep').value);
    const agua = parseCurrency(document.getElementById('agua_input').value);
    const energia = parseCurrency(document.getElementById('energia_input').value);
    const combustivel = parseCurrency(document.getElementById('combustivel_input').value);
    const aluguel = parseCurrency(document.getElementById('aluguel_input').value);

    const rEsc = bEsc * 1.4;
    const rCax = bCax * 1.4;
    const rRep = bRep * 1.4;

    const tEsc = q.esc * rEsc;
    const tCax = q.cax * rCax;
    const tRep = q.rep * rRep;

    const folhaTotal = tEsc + tCax + tRep;
    const perFolha = fat > 0 ? ((folhaTotal / fat) * 100).toFixed(1) : 0;
    const tetoOp = fat * 0.65;
    const despesasAdicionais = agua + energia + combustivel + aluguel;
    const sobraEstoque = tetoOp - folhaTotal - despesasAdicionais;
    const lucroTotalLiquido = fat * 0.25;

    if (nSocios > 0) {
        document.getElementById('label_lucro').innerText = `Rendimento por Sócio (${nSocios})`;
        document.getElementById('res_socio').innerText = fmt.format(lucroTotalLiquido / nSocios);
    } else {
        document.getElementById('label_lucro').innerText = "Rendimento Líquido Único";
        document.getElementById('res_socio').innerText = fmt.format(lucroTotalLiquido);
    }

    document.getElementById('real_esc').innerText = fmt.format(rEsc);
    document.getElementById('real_cax').innerText = fmt.format(rCax);
    document.getElementById('real_rep').innerText = fmt.format(rRep);
    document.getElementById('sub_esc').innerText = fmt.format(tEsc);
    document.getElementById('sub_cax').innerText = fmt.format(tCax);
    document.getElementById('sub_rep').innerText = fmt.format(tRep);
    document.getElementById('res_folha').innerText = fmt.format(folhaTotal);
    document.getElementById('per_folha').innerText = perFolha + '%';

    // --- Atualização da Tabela Dinâmica de Engenharia Financeira por Setor ---
    const totalColab = q.esc + q.cax + q.rep;
    
    // Cálculo por categoria
    const calcEsc = {
        base: bEsc * q.esc,
        ferias: (bEsc * q.esc) * 0.1111,
        decimo: (bEsc * q.esc) * 0.0833,
        fgts: (bEsc * q.esc) * 0.12,
        ben: (bEsc * q.esc) * 0.0856,
        total: (bEsc * q.esc) * 1.4
    };

    const calcCax = {
        base: bCax * q.cax,
        ferias: (bCax * q.cax) * 0.1111,
        decimo: (bCax * q.cax) * 0.0833,
        fgts: (bCax * q.cax) * 0.12,
        ben: (bCax * q.cax) * 0.0856,
        total: (bCax * q.cax) * 1.4
    };

    const calcRep = {
        base: bRep * q.rep,
        ferias: (bRep * q.rep) * 0.1111,
        decimo: (bRep * q.rep) * 0.0833,
        fgts: (bRep * q.rep) * 0.12,
        ben: (bRep * q.rep) * 0.0856,
        total: (bRep * q.rep) * 1.4
    };

    const calcTotal = {
        base: calcEsc.base + calcCax.base + calcRep.base,
        ferias: calcEsc.ferias + calcCax.ferias + calcRep.ferias,
        decimo: calcEsc.decimo + calcCax.decimo + calcRep.decimo,
        fgts: calcEsc.fgts + calcCax.fgts + calcRep.fgts,
        ben: calcEsc.ben + calcCax.ben + calcRep.ben,
        total: calcEsc.total + calcCax.total + calcRep.total
    };

    document.getElementById('calc_total_header').innerText = `Total Geral (${totalColab} Colab.)`;

    // Categoria Escritório
    document.getElementById('calc_base_esc').innerText = fmt.format(calcEsc.base);
    document.getElementById('calc_ferias_esc').innerText = fmt.format(calcEsc.ferias);
    document.getElementById('calc_13_esc').innerText = fmt.format(calcEsc.decimo);
    document.getElementById('calc_fgts_esc').innerText = fmt.format(calcEsc.fgts);
    document.getElementById('calc_ben_esc').innerText = fmt.format(calcEsc.ben);
    document.getElementById('calc_invest_esc').innerText = fmt.format(calcEsc.total);

    // Categoria Caixa
    document.getElementById('calc_base_cax').innerText = fmt.format(calcCax.base);
    document.getElementById('calc_ferias_cax').innerText = fmt.format(calcCax.ferias);
    document.getElementById('calc_13_cax').innerText = fmt.format(calcCax.decimo);
    document.getElementById('calc_fgts_cax').innerText = fmt.format(calcCax.fgts);
    document.getElementById('calc_ben_cax').innerText = fmt.format(calcCax.ben);
    document.getElementById('calc_invest_cax').innerText = fmt.format(calcCax.total);

    // Categoria Repositor
    document.getElementById('calc_base_rep').innerText = fmt.format(calcRep.base);
    document.getElementById('calc_ferias_rep').innerText = fmt.format(calcRep.ferias);
    document.getElementById('calc_13_rep').innerText = fmt.format(calcRep.decimo);
    document.getElementById('calc_fgts_rep').innerText = fmt.format(calcRep.fgts);
    document.getElementById('calc_ben_rep').innerText = fmt.format(calcRep.ben);
    document.getElementById('calc_invest_rep').innerText = fmt.format(calcRep.total);

    // Coluna Total Geral
    document.getElementById('calc_base_total').innerText = fmt.format(calcTotal.base);
    document.getElementById('calc_ferias_total').innerText = fmt.format(calcTotal.ferias);
    document.getElementById('calc_13_total').innerText = fmt.format(calcTotal.decimo);
    document.getElementById('calc_fgts_total').innerText = fmt.format(calcTotal.fgts);
    document.getElementById('calc_ben_total').innerText = fmt.format(calcTotal.ben);
    document.getElementById('calc_invest_total').innerText = fmt.format(calcTotal.total);

    if (fat > 0) {
        let recom = perFolha > 20 ?
            '<span style="color:var(--error)">ALERTA: Folha acima de 20%. Risco de liquidez.</span>' :
            '<span style="color:var(--success)">OTIMIZADO: Estrutura de pessoal saudável.</span>';

        document.getElementById('analise').innerHTML = `
            <strong>Relatório Analítico de Performance:</strong><br>
            • Teto Operacional (Compras + Logística - 65%): <strong>${fmt.format(tetoOp)}</strong><br>
            • Custos Fixos & Utilidades (Aluguel + Água + Luz + Comb.): <strong>${fmt.format(despesasAdicionais)}</strong> (${(fat > 0 ? (despesasAdicionais / fat * 100) : 0).toFixed(1)}%)<br>
            • Saldo para Reposição de Estoque: <strong>${fmt.format(sobraEstoque)}</strong><br>
            • Fundo de Reserva & Expansão (10%): <strong>${fmt.format(fat * 0.1)}</strong><br>
            • Custo de RH: <strong>${perFolha}%</strong> do faturamento bruto.<br><br>
            <em>${recom}</em>
        `;
    } else {
        document.getElementById('analise').innerText = "Aguardando faturamento...";
    }

    if (shouldSave) {
        clearTimeout(saveTimeout);
        showSavingStatus();
        saveTimeout = setTimeout(saveToServer, 300); // 300ms para salvar mais rápido
    }
}

async function saveToServer() {
    if (isCleaning) return; // Bloqueia salvamento se estivermos no meio de uma limpeza
    
    const payload = {
        fat: parseCurrency(document.getElementById('fat_input').value),
        socios: parseInt(document.getElementById('socios_input').value) || 0,
        base_esc: parseCurrency(document.getElementById('base_esc').value),
        base_cax: parseCurrency(document.getElementById('base_cax').value),
        base_rep: parseCurrency(document.getElementById('base_rep').value),
        q_esc: q.esc, q_cax: q.cax, q_rep: q.rep,
        agua: parseCurrency(document.getElementById('agua_input').value),
        energia: parseCurrency(document.getElementById('energia_input').value),
        combustivel: parseCurrency(document.getElementById('combustivel_input').value),
        aluguel: parseCurrency(document.getElementById('aluguel_input').value)
    };

    try {
        await fetch('/api/save_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        showSavedStatus();
    } catch (e) { console.error("Erro ao salvar:", e); }
}

async function clearDatabase() {
    if (confirm("Deseja realmente excluir os dados já cadastrados no banco?")) {
        isCleaning = true; // Trava qualquer tentativa de salvamento imediato
        clearTimeout(saveTimeout); // Cancela qualquer salvamento pendente
        
        try {
            const response = await fetch('/api/clear_data', { method: 'POST' });
            
            if (response.ok) {
                document.getElementById('fat_input').value = "R$ 0,00";
                document.getElementById('base_esc').value = "R$ 0,00";
                document.getElementById('base_cax').value = "R$ 0,00";
                document.getElementById('base_rep').value = "R$ 0,00";
                document.getElementById('agua_input').value = "R$ 0,00";
                document.getElementById('energia_input').value = "R$ 0,00";
                document.getElementById('combustivel_input').value = "R$ 0,00";
                document.getElementById('aluguel_input').value = "R$ 0,00";
                document.getElementById('socios_input').value = 0;
                
                q = { esc: 0, cax: 0, rep: 0 };
                document.getElementById('qtd_esc').innerText = "0";
                document.getElementById('qtd_cax').innerText = "0";
                document.getElementById('qtd_rep').innerText = "0";

                showSavedStatus();
                
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            }
        } catch (e) {
            isCleaning = false;
            console.error("Erro ao limpar banco:", e);
            alert("A limpeza falhou. Por favor, verifique sua conexão ou tente recarregar a página.");
        }
    }
}

function showSavingStatus() {
    const indicator = document.getElementById('save_indicator');
    indicator.classList.add('active');
    document.getElementById('sync_dot').classList.add('syncing');
    document.getElementById('sync_text').innerText = "Salvando...";
}

function showSavedStatus() {
    document.getElementById('sync_dot').classList.remove('syncing');
    document.getElementById('sync_text').innerText = "Sincronizado";
    setTimeout(() => { document.getElementById('save_indicator').classList.remove('active'); }, 2000);
}

function toggleKnowledge() {
    const content = document.getElementById('knowledge_content');
    const eye = document.getElementById('eye_btn');
    content.classList.toggle('open');
    eye.innerText = content.classList.contains('open') ? '🕶️' : '👁️';
}

window.onload = loadInitialData;
