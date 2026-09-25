// ======================================================
// CONTROLE DE CARGAS — INTERFACE
// ------------------------------------------------------
// As regras de negócio (conversões, status, filtros,
// mesclagem da importação) ficam em utils.js.
// ======================================================

// ======================================================
// ESTADO
// ======================================================

let cargas = [];

let cargaSelecionada = null;

let elementoFocoAnterior = null;

const ordenacao = {
    campo: null,
    direcao: "asc",
};

let cargasFiltradas = [];

let graficoStatus = null;

let graficoTransportadora = null;

// ======================================================
// LOCALSTORAGE
// ======================================================

const CHAVE_ALTERACOES = "controle_cargas_alteracoes";

const CHAVE_CARGAS = "controle_cargas_base";

const CHAVE_HISTORICO = "controle_cargas_historico";

function lerArmazenamento(chave, valorPadrao) {
    try {
        const dados = localStorage.getItem(chave);

        return dados ? JSON.parse(dados) : valorPadrao;
    } catch (erro) {
        console.error(`Erro ao ler "${chave}" do navegador:`, erro);

        return valorPadrao;
    }
}

// setItem pode falhar (limite de espaço, navegação privada)
function salvarArmazenamento(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));

        return true;
    } catch (erro) {
        console.error(`Erro ao salvar "${chave}" no navegador:`, erro);

        mostrarAviso(
            "Não foi possível salvar os dados no navegador. " +
                "Verifique o espaço disponível ou se está em uma janela anônima.",
            "erro",
        );

        return false;
    }
}

function removerArmazenamento(chave) {
    try {
        localStorage.removeItem(chave);
    } catch (erro) {
        console.error(`Erro ao remover "${chave}" do navegador:`, erro);
    }
}

// ======================================================
// ELEMENTOS
// ======================================================

const $ = (id) => document.getElementById(id);

const tabela = $("tabela-cargas");
const tabelaContador = $("tabela-contador");

const campoPesquisa = $("pesquisa-oc");
const filtroTransportadora = $("filtro-transportadora");
const filtroStatus = $("filtro-status");
const filtroData = $("filtro-data");
const btnLimparFiltros = $("btn-limpar-filtros");

const arquivoExcel = $("arquivo-excel");
const btnImportar = $("btn-importar");
const btnExportar = $("btn-exportar");
const btnLimparDados = $("btn-limpar-dados");

const dataAtual = $("data-atual");
const avisos = $("avisos");

// KPIs

const totalCargas = $("total-cargas");
const totalCarregadas = $("total-carregadas");
const totalPrazo = $("total-prazo");
const totalAtrasadas = $("total-atrasadas");
const pesoTotal = $("peso-total");
const vendaTotal = $("venda-total");

// Modal

const modal = $("modal-detalhes");
const modalConteudo = modal.querySelector(".modal-conteudo");
const modalOC = $("modal-oc");
const modalRota = $("modal-rota");
const modalTransportadora = $("modal-transportadora");
const modalStatus = $("modal-status");
const modalStatusOrigem = $("modal-status-origem");
const modalDoca = $("modal-doca");
const modalDocaOrigem = $("modal-doca-origem");
const modalGR = $("modal-gr");
const modalData = $("modal-data");
const modalPeso = $("modal-peso");
const modalVenda = $("modal-venda");
const modalObservacao = $("modal-observacao");

const btnFecharModal = $("btn-fechar-modal");
const btnCancelar = $("btn-cancelar");
const btnSalvar = $("btn-salvar");
const btnRestaurar = $("btn-restaurar");

// Histórico

const listaHistorico = $("lista-historico");
const historicoQuantidade = $("historico-quantidade");

// ======================================================
// AVISOS (substituem os alert)
// ======================================================

function mostrarAviso(mensagem, tipo = "sucesso", duracao = 5000) {
    const aviso = document.createElement("div");

    aviso.className = `aviso aviso-${tipo}`;
    aviso.setAttribute("role", tipo === "erro" ? "alert" : "status");
    aviso.textContent = mensagem;

    const btnFechar = document.createElement("button");

    btnFechar.type = "button";
    btnFechar.className = "aviso-fechar";
    btnFechar.setAttribute("aria-label", "Fechar aviso");
    btnFechar.textContent = "×";
    btnFechar.addEventListener("click", () => aviso.remove());

    aviso.appendChild(btnFechar);
    avisos.appendChild(aviso);

    if (duracao > 0) {
        setTimeout(() => aviso.remove(), duracao);
    }
}

// ======================================================
// DATA ATUAL
// ======================================================

function mostrarDataAtual() {
    dataAtual.textContent = new Date().toLocaleDateString("pt-BR");
}

// ======================================================
// BASE DE CARGAS
// ======================================================

function salvarCargasNoNavegador() {
    return salvarArmazenamento(CHAVE_CARGAS, cargas);
}

function carregarAlteracoesSalvas() {
    const alteracoes = lerArmazenamento(CHAVE_ALTERACOES, {});

    return alteracoes && typeof alteracoes === "object" ? alteracoes : {};
}

// Ajusta bases salvas por versões anteriores do projeto
// (OC/GR numéricos, doca numérica, sem valores da planilha).
function migrarCarga(carga, alteracao) {
    const migrada = {
        ...carga,
        oc: converterTexto(carga.oc),
        rota: converterTexto(carga.rota),
        transportadora: converterTexto(carga.transportadora),
        status: carga.status || "",
        gr: converterTexto(carga.gr),
        venda: converterNumero(carga.venda),
        doca: converterTexto(carga.doca),
        peso: converterNumero(carga.peso),
        data: converterTexto(carga.data),
        observacao: carga.observacao || "",
    };

    // Sem alteração manual no campo: o valor atual é o da planilha
    if (migrada.statusPlanilha === undefined && (!alteracao || alteracao.status === undefined)) {
        migrada.statusPlanilha = migrada.status;
    }

    if (migrada.docaPlanilha === undefined && (!alteracao || alteracao.doca === undefined)) {
        migrada.docaPlanilha = migrada.doca;
    }

    return migrada;
}

function carregarCargasDoNavegador() {
    const dados = lerArmazenamento(CHAVE_CARGAS, null);

    if (!Array.isArray(dados)) {
        return false;
    }

    const alteracoes = carregarAlteracoesSalvas();

    cargas = dados
        .filter((carga) => carga && carga.oc !== undefined && carga.oc !== null && carga.oc !== "")
        .map((carga) => {
            const alteracao = alteracoes[String(carga.oc)];

            return aplicarAlteracao(migrarCarga(carga, alteracao), alteracao);
        });

    return true;
}

// ======================================================
// ALTERAÇÕES MANUAIS
// ======================================================

function salvarAlteracaoCarga(carga) {
    const alteracoes = carregarAlteracoesSalvas();
    const alteracao = montarAlteracao(carga);

    if (alteracao) {
        alteracoes[String(carga.oc)] = alteracao;
    } else {
        delete alteracoes[String(carga.oc)];
    }

    const salvouAlteracoes = salvarArmazenamento(CHAVE_ALTERACOES, alteracoes);
    const salvouCargas = salvarCargasNoNavegador();

    return salvouAlteracoes && salvouCargas;
}

// ======================================================
// HISTÓRICO
// ======================================================

function carregarHistoricoCompleto() {
    const historico = lerArmazenamento(CHAVE_HISTORICO, {});

    return historico && typeof historico === "object" ? historico : {};
}

function adicionarHistorico(historicoCompleto, oc, alteracoes) {
    const chaveOC = String(oc);

    if (!Array.isArray(historicoCompleto[chaveOC])) {
        historicoCompleto[chaveOC] = [];
    }

    historicoCompleto[chaveOC].unshift({
        dataHora: new Date().toISOString(),
        alteracoes,
    });
}

function registrarHistorico(oc, alteracoes) {
    const historicoCompleto = carregarHistoricoCompleto();

    adicionarHistorico(historicoCompleto, oc, alteracoes);

    return salvarArmazenamento(CHAVE_HISTORICO, historicoCompleto);
}

// Eventos gerados pela importação (planilha sobrescreveu alteração manual)
function registrarEventosImportacao(eventos) {
    if (eventos.length === 0) {
        return;
    }

    const porOC = new Map();

    eventos.forEach(({ oc, mensagem }) => {
        if (!porOC.has(oc)) {
            porOC.set(oc, []);
        }

        porOC.get(oc).push(mensagem);
    });

    const historicoCompleto = carregarHistoricoCompleto();

    porOC.forEach((mensagens, oc) => adicionarHistorico(historicoCompleto, oc, mensagens));

    salvarArmazenamento(CHAVE_HISTORICO, historicoCompleto);
}

function mostrarHistorico(oc) {
    const historicoCompleto = carregarHistoricoCompleto();
    const historico = Array.isArray(historicoCompleto[String(oc)]) ? historicoCompleto[String(oc)] : [];

    listaHistorico.replaceChildren();

    historicoQuantidade.textContent = historico.length === 1 ? "1 alteração" : `${historico.length} alterações`;

    if (historico.length === 0) {
        const vazio = document.createElement("div");

        vazio.className = "historico-vazio";
        vazio.textContent = "Nenhuma alteração registrada.";

        listaHistorico.appendChild(vazio);

        return;
    }

    historico.forEach((item) => {
        const bloco = document.createElement("div");

        bloco.className = "historico-item";

        const data = document.createElement("div");

        data.className = "historico-data";
        data.textContent = formatarDataHora(item.dataHora);

        bloco.appendChild(data);

        (Array.isArray(item.alteracoes) ? item.alteracoes : []).forEach((alteracao) => {
            const mudanca = document.createElement("div");

            mudanca.className = "historico-mudanca";
            mudanca.textContent = alteracao;

            bloco.appendChild(mudanca);
        });

        listaHistorico.appendChild(bloco);
    });
}

// ======================================================
// TRANSPORTADORAS
// ======================================================

function atualizarTransportadoras() {
    const valorSelecionado = filtroTransportadora.value;

    const transportadoras = [...new Set(cargas.map((carga) => carga.transportadora).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
    );

    const opcaoTodas = document.createElement("option");

    opcaoTodas.value = "";
    opcaoTodas.textContent = "Todas as transportadoras";

    filtroTransportadora.replaceChildren(opcaoTodas);

    transportadoras.forEach((transportadora) => {
        const opcao = document.createElement("option");

        opcao.value = transportadora;
        opcao.textContent = transportadora;

        filtroTransportadora.appendChild(opcao);
    });

    filtroTransportadora.value = transportadoras.includes(valorSelecionado) ? valorSelecionado : "";
}

// ======================================================
// KPIs
// ======================================================

function atualizarIndicadores(indicadores) {
    totalCargas.textContent = indicadores.total;
    totalCarregadas.textContent = indicadores.porStatus.CARREGADO;
    totalPrazo.textContent = indicadores.porStatus["DENTRO DO PRAZO"];
    totalAtrasadas.textContent = indicadores.porStatus.ATRASADO;
    pesoTotal.textContent = formatarPeso(indicadores.peso);
    vendaTotal.textContent = formatarMoeda(indicadores.venda);
}

// ======================================================
// GRÁFICOS
// ======================================================

function graficosDisponiveis() {
    return typeof Chart !== "undefined";
}

function mostrarGraficosIndisponiveis() {
    document.querySelectorAll(".grafico-area").forEach((area) => {
        const mensagem = document.createElement("p");

        mensagem.className = "grafico-indisponivel";
        mensagem.textContent =
            "Não foi possível carregar a biblioteca de gráficos. Verifique a conexão com a internet.";

        area.replaceChildren(mensagem);
    });
}

function criarGraficos() {
    graficoStatus = new Chart($("grafico-status"), {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [
                {
                    data: [],
                    backgroundColor: [],
                    borderWidth: 0,
                    hoverOffset: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        padding: 18,
                    },
                },
            },
        },
    });

    graficoTransportadora = new Chart($("grafico-transportadora"), {
        type: "bar",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Quantidade de cargas",
                    data: [],
                    backgroundColor: "#334155",
                    borderRadius: 5,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "#e2e8f0" },
                },
                y: {
                    grid: { display: false },
                },
            },
            plugins: {
                legend: { display: false },
            },
        },
    });
}

// Atualiza os dados em vez de destruir e recriar os gráficos
function atualizarGraficos(indicadores, lista) {
    if (!graficoStatus || !graficoTransportadora) {
        return;
    }

    const fatias = [
        [STATUS.CARREGADO, indicadores.porStatus.CARREGADO],
        [STATUS["DENTRO DO PRAZO"], indicadores.porStatus["DENTRO DO PRAZO"]],
        [STATUS.ATRASADO, indicadores.porStatus.ATRASADO],
    ];

    if (indicadores.porStatus.SEM_STATUS > 0) {
        fatias.push([SEM_STATUS, indicadores.porStatus.SEM_STATUS]);
    }

    graficoStatus.data.labels = fatias.map(([info]) => info.rotuloGrafico);
    graficoStatus.data.datasets[0].data = fatias.map(([, quantidade]) => quantidade);
    graficoStatus.data.datasets[0].backgroundColor = fatias.map(([info]) => info.cor);
    graficoStatus.update();

    const porTransportadora = contarPorTransportadora(lista);

    graficoTransportadora.data.labels = porTransportadora.map(([nome]) => nome);
    graficoTransportadora.data.datasets[0].data = porTransportadora.map(([, quantidade]) => quantidade);
    graficoTransportadora.update();
}

// ======================================================
// TABELA
// ======================================================

function criarCelula(conteudo) {
    const celula = document.createElement("td");

    if (conteudo instanceof Node) {
        celula.appendChild(conteudo);
    } else {
        celula.textContent = conteudo ?? "";
    }

    return celula;
}

function criarBadgeStatus(status) {
    const badge = document.createElement("span");

    badge.className = `status-badge ${obterClasseStatus(status)}`;
    badge.textContent = obterTextoStatus(status);

    return badge;
}

function mostrarTabelaVazia() {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");

    linha.className = "linha-vazia";
    celula.colSpan = 9;
    celula.textContent =
        cargas.length === 0
            ? "Nenhuma carga carregada. Clique em “Importar / Atualizar Planilha” para começar."
            : "Nenhuma carga encontrada com os filtros selecionados.";

    linha.appendChild(celula);
    tabela.appendChild(linha);
}

function atualizarTabela(lista) {
    tabela.replaceChildren();

    tabelaContador.textContent = cargas.length === 0 ? "" : `${lista.length} de ${cargas.length} cargas`;

    if (lista.length === 0) {
        mostrarTabelaVazia();

        return;
    }

    const fragmento = document.createDocumentFragment();

    lista.forEach((carga) => {
        const linha = document.createElement("tr");

        linha.className = obterClasseStatus(carga.status);
        linha.tabIndex = 0;
        linha.setAttribute("aria-label", `Abrir detalhes da OC ${carga.oc}`);

        linha.append(
            criarCelula(carga.oc),
            criarCelula(carga.rota),
            criarCelula(carga.transportadora),
            criarCelula(criarBadgeStatus(carga.status)),
            criarCelula(carga.gr),
            criarCelula(formatarMoeda(carga.venda)),
            criarCelula(carga.doca),
            criarCelula(formatarPeso(carga.peso)),
            criarCelula(carga.data),
        );

        linha.addEventListener("click", () => abrirModal(carga));

        linha.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                abrirModal(carga);
            }
        });

        fragmento.appendChild(linha);
    });

    tabela.appendChild(fragmento);
}

// ======================================================
// ORDENAÇÃO
// ======================================================

function atualizarIndicadoresOrdenacao() {
    document.querySelectorAll("th[data-campo]").forEach((th) => {
        if (th.dataset.campo === ordenacao.campo) {
            th.setAttribute("aria-sort", ordenacao.direcao === "asc" ? "ascending" : "descending");
        } else {
            th.removeAttribute("aria-sort");
        }
    });
}

document.querySelectorAll("th[data-campo] .btn-ordenar").forEach((botao) => {
    botao.addEventListener("click", () => {
        const campo = botao.closest("th").dataset.campo;

        if (ordenacao.campo === campo) {
            ordenacao.direcao = ordenacao.direcao === "asc" ? "desc" : "asc";
        } else {
            ordenacao.campo = campo;
            ordenacao.direcao = "asc";
        }

        atualizarIndicadoresOrdenacao();
        aplicarFiltros();
    });
});

// ======================================================
// FILTROS
// ======================================================

function obterFiltros() {
    return {
        oc: campoPesquisa.value.trim(),
        transportadora: filtroTransportadora.value,
        status: filtroStatus.value,
        data: filtroData.value,
    };
}

function aplicarFiltros() {
    cargasFiltradas = ordenarCargas(filtrarCargas(cargas, obterFiltros()), ordenacao.campo, ordenacao.direcao);

    const indicadores = calcularIndicadores(cargasFiltradas);

    atualizarIndicadores(indicadores);
    atualizarTabela(cargasFiltradas);
    atualizarGraficos(indicadores, cargasFiltradas);
}

function limparFiltros() {
    campoPesquisa.value = "";
    filtroTransportadora.value = "";
    filtroStatus.value = "";
    filtroData.value = "";

    aplicarFiltros();
}

// Evita recalcular tudo a cada tecla digitada
function comAtraso(funcao, espera) {
    let temporizador = null;

    return (...argumentos) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => funcao(...argumentos), espera);
    };
}

// ======================================================
// MODAL
// ======================================================

function descreverOrigem(valorAtual, valorPlanilha, formatar) {
    if (valorPlanilha === undefined) {
        return "";
    }

    if (valorAtual === valorPlanilha) {
        return "Conforme a planilha";
    }

    return `Alterado manualmente (planilha: ${formatar(valorPlanilha)})`;
}

function possuiDiferencaDaPlanilha(carga) {
    const statusDiferente = carga.statusPlanilha !== undefined && carga.status !== carga.statusPlanilha;
    const docaDiferente = carga.docaPlanilha !== undefined && carga.doca !== carga.docaPlanilha;

    return statusDiferente || docaDiferente;
}

function preencherModal(carga) {
    modalOC.textContent = carga.oc;
    modalRota.value = carga.rota ?? "";
    modalTransportadora.value = carga.transportadora ?? "";
    modalStatus.value = STATUS[carga.status] ? carga.status : "";
    modalDoca.value = carga.doca ?? "";
    modalGR.value = carga.gr ?? "";
    modalData.value = carga.data ?? "";
    modalPeso.value = formatarPeso(carga.peso);
    modalVenda.value = formatarMoeda(carga.venda);
    modalObservacao.value = carga.observacao || "";

    modalStatusOrigem.textContent = descreverOrigem(carga.status, carga.statusPlanilha, obterTextoStatus);
    modalDocaOrigem.textContent = descreverOrigem(carga.doca, carga.docaPlanilha, (doca) => doca || "Sem doca");

    btnRestaurar.hidden = !possuiDiferencaDaPlanilha(carga);

    mostrarHistorico(carga.oc);
}

function abrirModal(carga) {
    cargaSelecionada = carga;
    elementoFocoAnterior = document.activeElement;

    preencherModal(carga);

    modal.classList.add("modal-aberto");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("sem-rolagem");

    modalStatus.focus();
}

function fecharModal() {
    modal.classList.remove("modal-aberto");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("sem-rolagem");

    cargaSelecionada = null;

    // Devolve o foco para a linha que abriu o modal (se ainda existir)
    if (elementoFocoAnterior && document.body.contains(elementoFocoAnterior)) {
        elementoFocoAnterior.focus();
    }

    elementoFocoAnterior = null;
}

function modalEstaAberto() {
    return modal.classList.contains("modal-aberto");
}

// Mantém o foco do teclado dentro do modal
function manterFocoNoModal(evento) {
    const focaveis = [
        ...modalConteudo.querySelectorAll("button, input, select, textarea, [tabindex]:not([tabindex='-1'])"),
    ].filter((elemento) => !elemento.disabled && !elemento.hidden);

    if (focaveis.length === 0) {
        return;
    }

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
    } else if (!modalConteudo.contains(document.activeElement)) {
        evento.preventDefault();
        primeiro.focus();
    }
}

// ======================================================
// SALVAR ALTERAÇÕES DO MODAL
// ======================================================

function descreverAlteracoes(carga, novoStatus, novaDoca, novaObservacao) {
    const alteracoes = [];

    const statusAntigo = carga.status || "";
    const docaAntiga = carga.doca ?? "";
    const observacaoAntiga = carga.observacao || "";

    if (statusAntigo !== novoStatus) {
        alteracoes.push(`Status: ${obterTextoStatus(statusAntigo)} → ${obterTextoStatus(novoStatus)}`);
    }

    if (docaAntiga !== novaDoca) {
        alteracoes.push(`Doca: ${docaAntiga || "Sem doca"} → ${novaDoca || "Sem doca"}`);
    }

    if (observacaoAntiga !== novaObservacao) {
        if (!observacaoAntiga) {
            alteracoes.push(`Observação adicionada: "${novaObservacao}"`);
        } else if (!novaObservacao) {
            alteracoes.push("Observação removida");
        } else {
            alteracoes.push("Observação alterada");
        }
    }

    return alteracoes;
}

function concluirAlteracao(carga, descricao) {
    const salvou = salvarAlteracaoCarga(carga);

    registrarHistorico(carga.oc, descricao);

    preencherModal(carga);
    aplicarFiltros();

    if (salvou) {
        mostrarAviso("Alterações salvas com sucesso!");
    }
}

btnSalvar.addEventListener("click", () => {
    if (!cargaSelecionada) {
        return;
    }

    const novoStatus = modalStatus.value;
    const novaDoca = modalDoca.value.trim();
    const novaObservacao = modalObservacao.value.trim();

    const descricao = descreverAlteracoes(cargaSelecionada, novoStatus, novaDoca, novaObservacao);

    if (descricao.length === 0) {
        mostrarAviso("Nenhuma alteração foi realizada.", "info");

        return;
    }

    cargaSelecionada.status = novoStatus;
    cargaSelecionada.doca = novaDoca;
    cargaSelecionada.observacao = novaObservacao;

    concluirAlteracao(cargaSelecionada, descricao);
});

// Volta status e doca para os valores da planilha (mantém a observação)
btnRestaurar.addEventListener("click", () => {
    if (!cargaSelecionada) {
        return;
    }

    const carga = cargaSelecionada;
    const descricao = [];

    if (carga.statusPlanilha !== undefined && carga.status !== carga.statusPlanilha) {
        descricao.push(
            `Status restaurado da planilha: ${obterTextoStatus(carga.status)} → ${obterTextoStatus(carga.statusPlanilha)}`,
        );

        carga.status = carga.statusPlanilha;
    }

    if (carga.docaPlanilha !== undefined && carga.doca !== carga.docaPlanilha) {
        descricao.push(
            `Doca restaurada da planilha: ${carga.doca || "Sem doca"} → ${carga.docaPlanilha || "Sem doca"}`,
        );

        carga.doca = carga.docaPlanilha;
    }

    if (descricao.length === 0) {
        return;
    }

    concluirAlteracao(carga, descricao);
});

// ======================================================
// FECHAR MODAL
// ======================================================

btnFecharModal.addEventListener("click", fecharModal);

btnCancelar.addEventListener("click", fecharModal);

modal.addEventListener("click", (evento) => {
    if (evento.target === modal) {
        fecharModal();
    }
});

document.addEventListener("keydown", (evento) => {
    if (!modalEstaAberto()) {
        return;
    }

    if (evento.key === "Escape") {
        fecharModal();
    } else if (evento.key === "Tab") {
        manterFocoNoModal(evento);
    }
});

// ======================================================
// IMPORTAR / ATUALIZAR PLANILHA
// ======================================================

// Procura a primeira cor de status: primeiro na célula da OC,
// depois nas demais células da linha (linha inteira pintada).
function identificarStatusDaLinha(linha, colunas) {
    const statusOC = identificarStatus(linha.getCell(colunas.oc));

    if (statusOC) {
        return statusOC;
    }

    for (const numeroColuna of Object.values(colunas)) {
        const status = identificarStatus(linha.getCell(numeroColuna));

        if (status) {
            return status;
        }
    }

    return "";
}

function lerCargasDaPlanilha(planilha) {
    const cabecalhos = [];

    planilha.getRow(1).eachCell({ includeEmpty: true }, (celula, numeroColuna) => {
        cabecalhos[numeroColuna] = converterTexto(celula.value);
    });

    const { colunas, ausentes, porPosicao } = mapearColunas(cabecalhos);

    const cargasLidas = [];
    let semStatus = 0;

    planilha.eachRow((linha, numeroLinha) => {
        // A linha 1 é o cabeçalho
        if (numeroLinha === 1) {
            return;
        }

        const valor = (campo) => (colunas[campo] ? linha.getCell(colunas[campo]).value : null);

        const oc = converterTexto(valor("oc"));

        if (!oc) {
            return;
        }

        // Coluna "Status" (texto) tem prioridade sobre a cor
        const status =
            identificarStatusPorTexto(converterTexto(valor("status"))) || identificarStatusDaLinha(linha, colunas);

        if (!status) {
            semStatus++;
        }

        cargasLidas.push(
            criarCarga({
                oc,
                rota: valor("rota"),
                transportadora: valor("transportadora"),
                gr: valor("gr"),
                venda: valor("venda"),
                doca: valor("doca"),
                peso: valor("peso"),
                data: valor("data"),
                status,
            }),
        );
    });

    return { cargas: cargasLidas, ausentes, porPosicao, semStatus };
}

const NOMES_CAMPOS = {
    rota: "Rota",
    transportadora: "Transportadora",
    gr: "GR",
    venda: "Venda",
    doca: "Doca",
    peso: "Peso",
    data: "Data",
};

async function importarPlanilha(arquivo) {
    if (!arquivo) {
        return;
    }

    if (!/\.xlsx$/i.test(arquivo.name)) {
        mostrarAviso("Selecione um arquivo no formato .xlsx.", "erro");

        return;
    }

    if (typeof ExcelJS === "undefined") {
        mostrarAviso(
            "Não foi possível carregar a biblioteca de leitura de Excel. Verifique a conexão com a internet.",
            "erro",
        );

        return;
    }

    btnImportar.disabled = true;
    btnImportar.textContent = "Importando...";

    try {
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.load(await arquivo.arrayBuffer());

        const planilha = workbook.worksheets[0];

        if (!planilha) {
            mostrarAviso("A planilha não possui nenhuma aba.", "erro");

            return;
        }

        const leitura = lerCargasDaPlanilha(planilha);

        // Não apaga a base atual por causa de um arquivo errado
        if (leitura.cargas.length === 0) {
            mostrarAviso(
                "Nenhuma carga encontrada na planilha. Confira se a primeira aba tem a coluna OC preenchida.",
                "erro",
                8000,
            );

            return;
        }

        const resultado = mesclarImportacao(cargas, leitura.cargas, carregarAlteracoesSalvas());

        cargas = resultado.cargas;

        salvarArmazenamento(CHAVE_ALTERACOES, resultado.alteracoes);
        salvarCargasNoNavegador();
        registrarEventosImportacao(resultado.eventos);

        atualizarTransportadoras();
        limparFiltros();

        const { resumo } = resultado;

        const linhas = [
            "Planilha atualizada com sucesso!",
            `Atualizadas: ${resumo.atualizadas} · Novas: ${resumo.novas} · Removidas: ${resumo.removidas}`,
            `Total: ${resumo.total}`,
        ];

        if (resumo.duplicadas > 0) {
            linhas.push(`OCs duplicadas ignoradas: ${resumo.duplicadas}`);
        }

        if (leitura.semStatus > 0) {
            linhas.push(`Cargas sem status (cor não reconhecida): ${leitura.semStatus}`);
        }

        if (resultado.eventos.length > 0) {
            linhas.push(`Alterações manuais substituídas pela planilha: ${resultado.eventos.length}`);
        }

        if (leitura.ausentes.length > 0) {
            linhas.push(`Colunas não encontradas: ${leitura.ausentes.map((campo) => NOMES_CAMPOS[campo]).join(", ")}`);
        }

        const temAlerta = leitura.ausentes.length > 0 || leitura.semStatus > 0 || resumo.duplicadas > 0;

        mostrarAviso(linhas.join("\n"), temAlerta ? "info" : "sucesso", 10000);
    } catch (erro) {
        console.error(erro);

        mostrarAviso("Ocorreu um erro ao ler a planilha. Verifique se o arquivo não está corrompido.", "erro");
    } finally {
        btnImportar.disabled = false;
        btnImportar.textContent = "Importar / Atualizar Planilha";

        // Permite importar o mesmo arquivo novamente
        arquivoExcel.value = "";
    }
}

btnImportar.addEventListener("click", () => arquivoExcel.click());

arquivoExcel.addEventListener("change", () => importarPlanilha(arquivoExcel.files[0]));

// ======================================================
// EXPORTAR CSV
// ======================================================

btnExportar.addEventListener("click", () => {
    if (cargasFiltradas.length === 0) {
        mostrarAviso("Não há cargas para exportar.", "info");

        return;
    }

    // BOM para o Excel reconhecer os acentos (UTF-8)
    const conteudo = "﻿" + gerarCSV(cargasFiltradas);
    const arquivo = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(arquivo);

    const hoje = new Date();
    const dataArquivo = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(
        hoje.getDate(),
    ).padStart(2, "0")}`;

    const link = document.createElement("a");

    link.href = url;
    link.download = `cargas-${dataArquivo}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ======================================================
// LIMPAR DADOS
// ======================================================

btnLimparDados.addEventListener("click", () => {
    if (cargas.length === 0) {
        mostrarAviso("Não há dados salvos para limpar.", "info");

        return;
    }

    const confirmou = confirm(
        "Isso vai apagar do navegador todas as cargas importadas, alterações manuais e o histórico.\n\nDeseja continuar?",
    );

    if (!confirmou) {
        return;
    }

    removerArmazenamento(CHAVE_CARGAS);
    removerArmazenamento(CHAVE_ALTERACOES);
    removerArmazenamento(CHAVE_HISTORICO);

    cargas = [];

    atualizarTransportadoras();
    limparFiltros();

    mostrarAviso("Dados removidos do navegador.");
});

// ======================================================
// EVENTOS DOS FILTROS
// ======================================================

campoPesquisa.addEventListener("input", comAtraso(aplicarFiltros, 200));

filtroTransportadora.addEventListener("change", aplicarFiltros);

filtroStatus.addEventListener("change", aplicarFiltros);

filtroData.addEventListener("change", aplicarFiltros);

btnLimparFiltros.addEventListener("click", limparFiltros);

// ======================================================
// INICIALIZAÇÃO
// ======================================================

mostrarDataAtual();

if (graficosDisponiveis()) {
    criarGraficos();
} else {
    mostrarGraficosIndisponiveis();
}

carregarCargasDoNavegador();

atualizarTransportadoras();

aplicarFiltros();
