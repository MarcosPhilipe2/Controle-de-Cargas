// ======================================================
// CONTROLE DE CARGAS
// ======================================================

let cargas = [];

let cargaSelecionada = null;


// GRÁFICOS

let graficoStatus = null;

let graficoTransportadora = null;


// ======================================================
// LOCALSTORAGE
// ======================================================

const CHAVE_ALTERACOES =
    "controle_cargas_alteracoes";

const CHAVE_CARGAS =
    "controle_cargas_base";

const CHAVE_HISTORICO =
    "controle_cargas_historico";


// ======================================================
// ELEMENTOS PRINCIPAIS
// ======================================================

const tabela =
    document.getElementById(
        "tabela-cargas"
    );


const campoPesquisa =
    document.getElementById(
        "pesquisa-oc"
    );


const filtroTransportadora =
    document.getElementById(
        "filtro-transportadora"
    );


const filtroStatus =
    document.getElementById(
        "filtro-status"
    );


const filtroData =
    document.getElementById(
        "filtro-data"
    );


const arquivoExcel =
    document.getElementById(
        "arquivo-excel"
    );


const btnImportar =
    document.getElementById(
        "btn-importar"
    );


const dataAtual =
    document.getElementById(
        "data-atual"
    );


// ======================================================
// KPIs
// ======================================================

const totalCargas =
    document.getElementById(
        "total-cargas"
    );


const totalCarregadas =
    document.getElementById(
        "total-carregadas"
    );


const totalPrazo =
    document.getElementById(
        "total-prazo"
    );


const totalAtrasadas =
    document.getElementById(
        "total-atrasadas"
    );


const pesoTotal =
    document.getElementById(
        "peso-total"
    );


const vendaTotal =
    document.getElementById(
        "venda-total"
    );


// ======================================================
// MODAL
// ======================================================

const modal =
    document.getElementById(
        "modal-detalhes"
    );


const modalOC =
    document.getElementById(
        "modal-oc"
    );


const modalRota =
    document.getElementById(
        "modal-rota"
    );


const modalTransportadora =
    document.getElementById(
        "modal-transportadora"
    );


const modalStatus =
    document.getElementById(
        "modal-status"
    );


const modalDoca =
    document.getElementById(
        "modal-doca"
    );


const modalGR =
    document.getElementById(
        "modal-gr"
    );


const modalData =
    document.getElementById(
        "modal-data"
    );


const modalPeso =
    document.getElementById(
        "modal-peso"
    );


const modalVenda =
    document.getElementById(
        "modal-venda"
    );


const modalObservacao =
    document.getElementById(
        "modal-observacao"
    );


const btnFecharModal =
    document.getElementById(
        "btn-fechar-modal"
    );


const btnCancelar =
    document.getElementById(
        "btn-cancelar"
    );


const btnSalvar =
    document.getElementById(
        "btn-salvar"
    );


// ======================================================
// HISTÓRICO
// ======================================================

const listaHistorico =
    document.getElementById(
        "lista-historico"
    );


const historicoQuantidade =
    document.getElementById(
        "historico-quantidade"
    );


// ======================================================
// DATA ATUAL
// ======================================================

function mostrarDataAtual() {

    const hoje =
        new Date();


    dataAtual.textContent =
        hoje.toLocaleDateString(
            "pt-BR"
        );

}


// ======================================================
// FORMATAÇÃO
// ======================================================

function formatarMoeda(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function formatarPeso(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + " kg";

}


function obterDataHoraAtual() {

    return new Date()
        .toLocaleString(
            "pt-BR"
        );

}


// ======================================================
// DATA DA PLANILHA
// ======================================================

function converterData(valor) {

    if (!valor) {

        return "";

    }


    if (
        valor instanceof Date
    ) {

        const dia =
            String(
                valor.getDate()
            ).padStart(
                2,
                "0"
            );


        const mes =
            String(
                valor.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const ano =
            valor.getFullYear();


        return (
            `${dia}/${mes}/${ano}`
        );

    }


    return String(
        valor
    ).trim();

}


// ======================================================
// SALVAR / CARREGAR BASE
// ======================================================

function salvarCargasNoNavegador() {

    localStorage.setItem(
        CHAVE_CARGAS,
        JSON.stringify(
            cargas
        )
    );

}


function carregarCargasDoNavegador() {

    const dados =
        localStorage.getItem(
            CHAVE_CARGAS
        );


    if (!dados) {

        return false;

    }


    try {

        cargas =
            JSON.parse(
                dados
            );


        return true;

    }

    catch (erro) {

        console.error(
            "Erro ao carregar cargas:",
            erro
        );


        return false;

    }

}


// ======================================================
// ALTERAÇÕES MANUAIS
// ======================================================

function carregarAlteracoesSalvas() {

    const dados =
        localStorage.getItem(
            CHAVE_ALTERACOES
        );


    if (!dados) {

        return {};

    }


    try {

        return JSON.parse(
            dados
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar alterações:",
            erro
        );


        return {};

    }

}


function salvarAlteracaoCarga(
    carga
) {

    const alteracoes =
        carregarAlteracoesSalvas();


    alteracoes[
        String(
            carga.oc
        )
    ] = {

        status:
            carga.status,

        doca:
            carga.doca,

        observacao:
            carga.observacao || ""

    };


    localStorage.setItem(
        CHAVE_ALTERACOES,
        JSON.stringify(
            alteracoes
        )
    );


    salvarCargasNoNavegador();

}


function aplicarAlteracoesSalvas() {

    const alteracoes =
        carregarAlteracoesSalvas();


    cargas.forEach(
        carga => {

            const alteracao =
                alteracoes[
                    String(
                        carga.oc
                    )
                ];


            if (!alteracao) {

                return;

            }


            if (
                alteracao.status !==
                undefined
            ) {

                carga.status =
                    alteracao.status;

            }


            if (
                alteracao.doca !==
                undefined
            ) {

                carga.doca =
                    alteracao.doca;

            }


            if (
                alteracao.observacao !==
                undefined
            ) {

                carga.observacao =
                    alteracao.observacao;

            }

        }
    );

}


// ======================================================
// HISTÓRICO
// ======================================================

function carregarHistoricoCompleto() {

    const dados =
        localStorage.getItem(
            CHAVE_HISTORICO
        );


    if (!dados) {

        return {};

    }


    try {

        return JSON.parse(
            dados
        );

    }

    catch (erro) {

        console.error(
            "Erro ao carregar histórico:",
            erro
        );


        return {};

    }

}


function registrarHistorico(
    oc,
    alteracoes
) {

    const historicoCompleto =
        carregarHistoricoCompleto();


    const chaveOC =
        String(
            oc
        );


    if (
        !historicoCompleto[
            chaveOC
        ]
    ) {

        historicoCompleto[
            chaveOC
        ] = [];

    }


    historicoCompleto[
        chaveOC
    ].unshift({

        dataHora:
            obterDataHoraAtual(),

        alteracoes:
            alteracoes

    });


    localStorage.setItem(
        CHAVE_HISTORICO,
        JSON.stringify(
            historicoCompleto
        )
    );

}


function mostrarHistorico(
    oc
) {

    const historicoCompleto =
        carregarHistoricoCompleto();


    const historico =
        historicoCompleto[
            String(
                oc
            )
        ] || [];


    listaHistorico.innerHTML =
        "";


    historicoQuantidade.textContent =
        historico.length === 1
            ? "1 alteração"
            : `${historico.length} alterações`;


    if (
        historico.length === 0
    ) {

        listaHistorico.innerHTML = `
            <div class="historico-vazio">
                Nenhuma alteração registrada.
            </div>
        `;


        return;

    }


    historico.forEach(
        item => {

            const bloco =
                document.createElement(
                    "div"
                );


            bloco.className =
                "historico-item";


            const alteracoesHTML =
                item.alteracoes
                    .map(
                        alteracao => `
                            <div class="historico-mudanca">
                                ${alteracao}
                            </div>
                        `
                    )
                    .join("");


            bloco.innerHTML = `

                <div class="historico-data">
                    ${item.dataHora}
                </div>

                ${alteracoesHTML}

            `;


            listaHistorico
                .appendChild(
                    bloco
                );

        }
    );

}


// ======================================================
// STATUS PELA COR DA PLANILHA
// ======================================================

function identificarStatus(
    celula
) {

    if (
        !celula ||
        !celula.fill ||
        celula.fill.type !==
            "pattern"
    ) {

        return "";

    }


    if (
        !celula.fill.fgColor ||
        !celula.fill.fgColor.argb
    ) {

        return "";

    }


    let cor =
        celula.fill.fgColor.argb
            .toUpperCase();


    if (
        cor.length === 8
    ) {

        cor =
            cor.substring(
                2
            );

    }


    // VERDE

    if (
        cor === "00B050"
    ) {

        return "CARREGADO";

    }


    // AMARELO

    if (
        cor === "FFFF00"
    ) {

        return "DENTRO DO PRAZO";

    }


    // VERMELHO

    if (
        cor === "FF0000"
    ) {

        return "ATRASADO";

    }


    return "";

}


// ======================================================
// STATUS
// ======================================================

function obterTextoStatus(
    status
) {

    if (
        status ===
        "CARREGADO"
    ) {

        return "Carregado";

    }


    if (
        status ===
        "DENTRO DO PRAZO"
    ) {

        return "Dentro do prazo";

    }


    if (
        status ===
        "ATRASADO"
    ) {

        return "Atrasado";

    }


    return "Sem status";

}


function obterClasseStatus(
    status
) {

    if (
        status ===
        "CARREGADO"
    ) {

        return "status-carregado";

    }


    if (
        status ===
        "DENTRO DO PRAZO"
    ) {

        return "status-prazo";

    }


    if (
        status ===
        "ATRASADO"
    ) {

        return "status-atrasado";

    }


    return "";

}


// ======================================================
// TRANSPORTADORAS
// ======================================================

function atualizarTransportadoras() {

    const valorSelecionado =
        filtroTransportadora.value;


    const transportadoras =
        [
            ...new Set(
                cargas
                    .map(
                        carga =>
                            carga.transportadora
                    )
                    .filter(
                        Boolean
                    )
            )
        ].sort();


    filtroTransportadora.innerHTML = `

        <option value="">
            Todas as transportadoras
        </option>

    `;


    transportadoras.forEach(
        transportadora => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                transportadora;


            option.textContent =
                transportadora;


            filtroTransportadora
                .appendChild(
                    option
                );

        }
    );


    if (
        transportadoras.includes(
            valorSelecionado
        )
    ) {

        filtroTransportadora.value =
            valorSelecionado;

    }

}


// ======================================================
// KPIs
// ======================================================

function atualizarIndicadores(
    cargasFiltradas
) {

    totalCargas.textContent =
        cargasFiltradas.length;


    totalCarregadas.textContent =
        cargasFiltradas.filter(
            carga =>
                carga.status ===
                "CARREGADO"
        ).length;


    totalPrazo.textContent =
        cargasFiltradas.filter(
            carga =>
                carga.status ===
                "DENTRO DO PRAZO"
        ).length;


    totalAtrasadas.textContent =
        cargasFiltradas.filter(
            carga =>
                carga.status ===
                "ATRASADO"
        ).length;


    const somaPeso =
        cargasFiltradas.reduce(
            (
                total,
                carga
            ) => {

                return (
                    total +
                    Number(
                        carga.peso || 0
                    )
                );

            },
            0
        );


    pesoTotal.textContent =
        formatarPeso(
            somaPeso
        );


    const somaVenda =
        cargasFiltradas.reduce(
            (
                total,
                carga
            ) => {

                return (
                    total +
                    Number(
                        carga.venda || 0
                    )
                );

            },
            0
        );


    vendaTotal.textContent =
        formatarMoeda(
            somaVenda
        );

}


// ======================================================
// GRÁFICO STATUS
// ======================================================

function atualizarGraficoStatus(
    cargasFiltradas
) {

    const carregadas =
        cargasFiltradas.filter(
            carga =>
                carga.status ===
                "CARREGADO"
        ).length;


    const dentroPrazo =
        cargasFiltradas.filter(
            carga =>
                carga.status ===
                "DENTRO DO PRAZO"
        ).length;


    const atrasadas =
        cargasFiltradas.filter(
            carga =>
                carga.status ===
                "ATRASADO"
        ).length;


    const canvas =
        document.getElementById(
            "grafico-status"
        );


    if (
        graficoStatus
    ) {

        graficoStatus.destroy();

    }


    graficoStatus =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels: [
                        "Carregadas",
                        "Dentro do prazo",
                        "Atrasadas"
                    ],

                    datasets: [
                        {

                            data: [
                                carregadas,
                                dentroPrazo,
                                atrasadas
                            ],

                            backgroundColor: [
                                "#22c55e",
                                "#eab308",
                                "#ef4444"
                            ],

                            borderWidth:
                                0,

                            hoverOffset:
                                6

                        }
                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "62%",

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                usePointStyle:
                                    true,

                                padding:
                                    18

                            }

                        }

                    }

                }

            }
        );

}


// ======================================================
// GRÁFICO TRANSPORTADORA
// ======================================================

function atualizarGraficoTransportadora(
    cargasFiltradas
) {

    const contagem =
        {};


    cargasFiltradas.forEach(
        carga => {

            const transportadora =
                carga.transportadora ||
                "Sem transportadora";


            if (
                !contagem[
                    transportadora
                ]
            ) {

                contagem[
                    transportadora
                ] = 0;

            }


            contagem[
                transportadora
            ]++;

        }
    );


    const dadosOrdenados =
        Object.entries(
            contagem
        ).sort(
            (
                a,
                b
            ) =>
                b[1] -
                a[1]
        );


    const transportadoras =
        dadosOrdenados.map(
            item =>
                item[0]
        );


    const quantidades =
        dadosOrdenados.map(
            item =>
                item[1]
        );


    const canvas =
        document.getElementById(
            "grafico-transportadora"
        );


    if (
        graficoTransportadora
    ) {

        graficoTransportadora.destroy();

    }


    graficoTransportadora =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        transportadoras,

                    datasets: [
                        {

                            label:
                                "Quantidade de cargas",

                            data:
                                quantidades,

                            backgroundColor:
                                "#334155",

                            borderRadius:
                                5

                        }
                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    indexAxis:
                        "y",

                    scales: {

                        x: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            },

                            grid: {

                                color:
                                    "#e2e8f0"

                            }

                        },


                        y: {

                            grid: {

                                display:
                                    false

                            }

                        }

                    },


                    plugins: {

                        legend: {

                            display:
                                false

                        }

                    }

                }

            }
        );

}


// ======================================================
// MODAL
// ======================================================

function abrirModal(
    carga
) {

    cargaSelecionada =
        carga;


    modalOC.textContent =
        carga.oc;


    modalRota.value =
        carga.rota;


    modalTransportadora.value =
        carga.transportadora;


    modalStatus.value =
        carga.status;


    modalDoca.value =
        carga.doca;


    modalGR.value =
        carga.gr;


    modalData.value =
        carga.data;


    modalPeso.value =
        formatarPeso(
            carga.peso
        );


    modalVenda.value =
        formatarMoeda(
            carga.venda
        );


    modalObservacao.value =
        carga.observacao || "";


    mostrarHistorico(
        carga.oc
    );


    modal.classList.add(
        "modal-aberto"
    );

}


function fecharModal() {

    modal.classList.remove(
        "modal-aberto"
    );


    cargaSelecionada =
        null;

}


// ======================================================
// TABELA
// ======================================================

function atualizarTabela(
    cargasFiltradas
) {

    tabela.innerHTML =
        "";


    cargasFiltradas.forEach(
        carga => {

            const linha =
                document.createElement(
                    "tr"
                );


            const classeStatus =
                obterClasseStatus(
                    carga.status
                );


            linha.className =
                classeStatus;


            linha.innerHTML = `

                <td>
                    ${carga.oc ?? ""}
                </td>

                <td>
                    ${carga.rota ?? ""}
                </td>

                <td>
                    ${carga.transportadora ?? ""}
                </td>

                <td>

                    <span
                        class="status-badge ${classeStatus}"
                    >

                        ${obterTextoStatus(
                            carga.status
                        )}

                    </span>

                </td>

                <td>
                    ${carga.gr ?? ""}
                </td>

                <td>
                    ${formatarMoeda(
                        carga.venda
                    )}
                </td>

                <td>
                    ${carga.doca ?? ""}
                </td>

                <td>
                    ${formatarPeso(
                        carga.peso
                    )}
                </td>

                <td>
                    ${carga.data ?? ""}
                </td>

            `;


            linha.addEventListener(
                "click",
                function () {

                    abrirModal(
                        carga
                    );

                }
            );


            tabela.appendChild(
                linha
            );

        }
    );

}


// ======================================================
// FILTROS
// ======================================================

function aplicarFiltros() {

    const textoOC =
        campoPesquisa.value
            .trim();


    const transportadoraSelecionada =
        filtroTransportadora.value;


    const statusSelecionado =
        filtroStatus.value;


    const dataSelecionada =
        filtroData.value;


    const dataSelecionadaBR =
        dataSelecionada
            ? dataSelecionada
                .split("-")
                .reverse()
                .join("/")
            : "";


    const cargasFiltradas =
        cargas.filter(
            carga => {

                const correspondeOC =
                    String(
                        carga.oc
                    ).includes(
                        textoOC
                    );


                const correspondeTransportadora =
                    transportadoraSelecionada ===
                        "" ||
                    carga.transportadora ===
                        transportadoraSelecionada;


                const correspondeStatus =
                    statusSelecionado ===
                        "" ||
                    carga.status ===
                        statusSelecionado;


                const correspondeData =
                    dataSelecionadaBR ===
                        "" ||
                    carga.data ===
                        dataSelecionadaBR;


                return (
                    correspondeOC &&
                    correspondeTransportadora &&
                    correspondeStatus &&
                    correspondeData
                );

            }
        );


    atualizarIndicadores(
        cargasFiltradas
    );


    atualizarTabela(
        cargasFiltradas
    );


    atualizarGraficoStatus(
        cargasFiltradas
    );


    atualizarGraficoTransportadora(
        cargasFiltradas
    );

}


// ======================================================
// SALVAR ALTERAÇÕES DO MODAL
// ======================================================

btnSalvar.addEventListener(
    "click",
    function () {

        if (
            !cargaSelecionada
        ) {

            return;

        }


        const statusAntigo =
            cargaSelecionada.status;


        const docaAntiga =
            String(
                cargaSelecionada.doca ??
                ""
            );


        const observacaoAntiga =
            cargaSelecionada.observacao ||
            "";


        const novoStatus =
            modalStatus.value;


        const novaDoca =
            String(
                modalDoca.value
            );


        const novaObservacao =
            modalObservacao.value
                .trim();


        const alteracoesHistorico =
            [];


        if (
            statusAntigo !==
            novoStatus
        ) {

            alteracoesHistorico.push(
                `Status: ${obterTextoStatus(statusAntigo)} → ${obterTextoStatus(novoStatus)}`
            );

        }


        if (
            docaAntiga !==
            novaDoca
        ) {

            alteracoesHistorico.push(
                `Doca: ${docaAntiga || "Sem doca"} → ${novaDoca || "Sem doca"}`
            );

        }


        if (
            observacaoAntiga !==
            novaObservacao
        ) {

            if (
                !observacaoAntiga &&
                novaObservacao
            ) {

                alteracoesHistorico.push(
                    `Observação adicionada: "${novaObservacao}"`
                );

            }

            else if (
                observacaoAntiga &&
                !novaObservacao
            ) {

                alteracoesHistorico.push(
                    "Observação removida"
                );

            }

            else {

                alteracoesHistorico.push(
                    "Observação alterada"
                );

            }

        }


        if (
            alteracoesHistorico.length ===
            0
        ) {

            alert(
                "Nenhuma alteração foi realizada."
            );


            return;

        }


        cargaSelecionada.status =
            novoStatus;


        cargaSelecionada.doca =
            novaDoca;


        cargaSelecionada.observacao =
            novaObservacao;


        salvarAlteracaoCarga(
            cargaSelecionada
        );


        registrarHistorico(
            cargaSelecionada.oc,
            alteracoesHistorico
        );


        mostrarHistorico(
            cargaSelecionada.oc
        );


        aplicarFiltros();


        alert(
            "Alterações salvas com sucesso!"
        );

    }
);


// ======================================================
// FECHAR MODAL
// ======================================================

btnFecharModal.addEventListener(
    "click",
    fecharModal
);


btnCancelar.addEventListener(
    "click",
    fecharModal
);


modal.addEventListener(
    "click",
    function (
        evento
    ) {

        if (
            evento.target ===
            modal
        ) {

            fecharModal();

        }

    }
);


// ESC FECHA O MODAL

document.addEventListener(
    "keydown",
    function (
        evento
    ) {

        if (
            evento.key ===
                "Escape" &&
            modal.classList.contains(
                "modal-aberto"
            )
        ) {

            fecharModal();

        }

    }
);


// ======================================================
// IMPORTAR / ATUALIZAR PLANILHA
// ======================================================

btnImportar.addEventListener(
    "click",
    async function () {

        const arquivo =
            arquivoExcel.files[0];


        if (!arquivo) {

            alert(
                "Selecione uma planilha primeiro."
            );


            return;

        }


        try {

            const buffer =
                await arquivo
                    .arrayBuffer();


            const workbook =
                new ExcelJS.Workbook();


            await workbook.xlsx.load(
                buffer
            );


            const planilha =
                workbook.worksheets[0];


            const cargasImportadas =
                [];


            planilha.eachRow(
                (
                    linha,
                    numeroLinha
                ) => {

                    if (
                        numeroLinha ===
                        1
                    ) {

                        return;

                    }


                    const oc =
                        linha
                            .getCell(1)
                            .value;


                    if (!oc) {

                        return;

                    }


                    const rota =
                        linha
                            .getCell(2)
                            .value;


                    const transportadora =
                        linha
                            .getCell(3)
                            .value;


                    const gr =
                        linha
                            .getCell(4)
                            .value;


                    const venda =
                        linha
                            .getCell(5)
                            .value;


                    const doca =
                        linha
                            .getCell(6)
                            .value;


                    const peso =
                        linha
                            .getCell(7)
                            .value;


                    const data =
                        linha
                            .getCell(8)
                            .value;


                    const status =
                        identificarStatus(
                            linha.getCell(
                                1
                            )
                        );


                    cargasImportadas.push({

                        oc:
                            oc,

                        rota:
                            String(
                                rota || ""
                            ).trim(),

                        transportadora:
                            String(
                                transportadora ||
                                ""
                            ).trim(),

                        status:
                            status,

                        gr:
                            Number(
                                gr || 0
                            ),

                        venda:
                            Number(
                                venda || 0
                            ),

                        doca:
                            doca,

                        peso:
                            Number(
                                peso || 0
                            ),

                        data:
                            converterData(
                                data
                            ),

                        observacao:
                            ""

                    });

                }
            );


            let novas =
                0;


            let atualizadas =
                0;


            const alteracoes =
                carregarAlteracoesSalvas();


            const novaBase =
                cargasImportadas.map(
                    cargaNova => {

                        const cargaAntiga =
                            cargas.find(
                                carga =>
                                    String(
                                        carga.oc
                                    ) ===
                                    String(
                                        cargaNova.oc
                                    )
                            );


                        if (
                            cargaAntiga
                        ) {

                            atualizadas++;

                        }

                        else {

                            novas++;

                        }


                        const alteracao =
                            alteracoes[
                                String(
                                    cargaNova.oc
                                )
                            ];


                        if (
                            alteracao
                        ) {

                            if (
                                alteracao.status !==
                                undefined
                            ) {

                                cargaNova.status =
                                    alteracao.status;

                            }


                            if (
                                alteracao.doca !==
                                undefined
                            ) {

                                cargaNova.doca =
                                    alteracao.doca;

                            }


                            if (
                                alteracao.observacao !==
                                undefined
                            ) {

                                cargaNova.observacao =
                                    alteracao.observacao;

                            }

                        }

                        else if (
                            cargaAntiga &&
                            cargaAntiga.observacao
                        ) {

                            cargaNova.observacao =
                                cargaAntiga.observacao;

                        }


                        return cargaNova;

                    }
                );


            cargas =
                novaBase;


            salvarCargasNoNavegador();


            campoPesquisa.value =
                "";


            filtroStatus.value =
                "";


            filtroData.value =
                "";


            atualizarTransportadoras();


            filtroTransportadora.value =
                "";


            aplicarFiltros();


            alert(
                "Planilha atualizada com sucesso!\n\n" +
                `Atualizadas: ${atualizadas}\n` +
                `Novas: ${novas}\n` +
                `Total: ${cargas.length}`
            );

        }

        catch (erro) {

            console.error(
                erro
            );


            alert(
                "Ocorreu um erro ao atualizar a planilha."
            );

        }

    }
);


// ======================================================
// EVENTOS DOS FILTROS
// ======================================================

campoPesquisa.addEventListener(
    "input",
    aplicarFiltros
);


filtroTransportadora.addEventListener(
    "change",
    aplicarFiltros
);


filtroStatus.addEventListener(
    "change",
    aplicarFiltros
);


filtroData.addEventListener(
    "change",
    aplicarFiltros
);


// ======================================================
// INICIALIZAÇÃO
// ======================================================

mostrarDataAtual();


const possuiBaseSalva =
    carregarCargasDoNavegador();


if (
    possuiBaseSalva
) {

    aplicarAlteracoesSalvas();

}


atualizarTransportadoras();


aplicarFiltros();