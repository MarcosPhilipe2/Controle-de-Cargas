// ======================================================
// CONTROLE DE CARGAS — FUNÇÕES PURAS
// ------------------------------------------------------
// Regras de negócio sem dependência do DOM. São usadas
// pelo script.js no navegador e pelos testes no Node.
// ======================================================

// ======================================================
// STATUS
// ======================================================

const STATUS = {
    CARREGADO: {
        texto: "Carregado",
        classe: "status-carregado",
        cor: "#22c55e",
        rotuloGrafico: "Carregadas",
    },
    "DENTRO DO PRAZO": {
        texto: "Dentro do prazo",
        classe: "status-prazo",
        cor: "#eab308",
        rotuloGrafico: "Dentro do prazo",
    },
    ATRASADO: {
        texto: "Atrasado",
        classe: "status-atrasado",
        cor: "#ef4444",
        rotuloGrafico: "Atrasadas",
    },
};

// Valor usado no filtro para cargas cujo status está vazio
const FILTRO_SEM_STATUS = "SEM_STATUS";

const SEM_STATUS = {
    texto: "Sem status",
    classe: "status-sem",
    cor: "#94a3b8",
    rotuloGrafico: "Sem status",
};

function obterInfoStatus(status) {
    return STATUS[status] || SEM_STATUS;
}

function obterTextoStatus(status) {
    return obterInfoStatus(status).texto;
}

function obterClasseStatus(status) {
    return obterInfoStatus(status).classe;
}

// ======================================================
// TEXTO
// ======================================================

// Remove acentos, espaços extras e deixa em maiúsculas
function normalizarTexto(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

// ======================================================
// VALORES DAS CÉLULAS (ExcelJS)
// ======================================================

// O ExcelJS devolve objetos para fórmulas, hiperlinks e
// textos formatados. Esta função devolve sempre o valor
// "simples" da célula: string, número, Date ou null.
function lerValorCelula(valor) {
    if (valor === null || valor === undefined) {
        return null;
    }

    if (valor instanceof Date) {
        return valor;
    }

    if (typeof valor !== "object") {
        return valor;
    }

    // Texto formatado: { richText: [{ text }, ...] }
    if (Array.isArray(valor.richText)) {
        return valor.richText.map((parte) => parte.text ?? "").join("");
    }

    // Fórmula: { formula, result } ou { sharedFormula, result }
    if ("formula" in valor || "sharedFormula" in valor || "result" in valor) {
        return lerValorCelula(valor.result);
    }

    // Hiperlink: { text, hyperlink }
    if ("text" in valor) {
        return lerValorCelula(valor.text);
    }

    // Erro: { error: "#N/A" }
    if ("error" in valor) {
        return null;
    }

    return null;
}

function converterTexto(valor) {
    const simples = lerValorCelula(valor);

    if (simples === null) {
        return "";
    }

    if (simples instanceof Date) {
        return converterData(simples);
    }

    return String(simples).trim();
}

// Aceita números, "1234.56", "1.234,56", "R$ 1.234,56", "1234,5 kg"
function converterNumero(valor) {
    const simples = lerValorCelula(valor);

    if (simples === null || simples === "") {
        return 0;
    }

    if (typeof simples === "number") {
        return Number.isFinite(simples) ? simples : 0;
    }

    if (typeof simples === "boolean" || simples instanceof Date) {
        return 0;
    }

    let texto = String(simples).replace(/[^\d,.-]/g, "");

    if (texto.includes(",")) {
        // Formato brasileiro: ponto é milhar, vírgula é decimal
        texto = texto.replace(/\./g, "").replace(",", ".");
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : 0;
}

// ======================================================
// DATAS
// ======================================================

function doisDigitos(numero) {
    return String(numero).padStart(2, "0");
}

// Converte o valor da planilha para "dd/mm/aaaa".
// Datas do ExcelJS vêm em UTC (meia-noite UTC). Usar
// getDate() no fuso do Brasil (UTC-3) exibiria o dia
// anterior, por isso são usados os métodos getUTC*.
function converterData(valor) {
    const simples = lerValorCelula(valor);

    if (simples === null || simples === "") {
        return "";
    }

    if (simples instanceof Date) {
        if (Number.isNaN(simples.getTime())) {
            return "";
        }

        return (
            `${doisDigitos(simples.getUTCDate())}/` +
            `${doisDigitos(simples.getUTCMonth() + 1)}/` +
            `${simples.getUTCFullYear()}`
        );
    }

    // Número serial do Excel (dias desde 30/12/1899)
    if (typeof simples === "number") {
        if (simples <= 0) {
            return "";
        }

        const inicioExcel = Date.UTC(1899, 11, 30);

        return converterData(new Date(inicioExcel + Math.round(simples) * 86400000));
    }

    const texto = String(simples).trim();

    // dd/mm/aaaa ou d/m/aaaa (também aceita "-" e ".")
    const formatoBR = texto.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);

    if (formatoBR) {
        const [, dia, mes, ano] = formatoBR;

        return `${doisDigitos(dia)}/${doisDigitos(mes)}/${ano}`;
    }

    // aaaa-mm-dd (ISO)
    const formatoISO = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (formatoISO) {
        const [, ano, mes, dia] = formatoISO;

        return `${doisDigitos(dia)}/${doisDigitos(mes)}/${ano}`;
    }

    return texto;
}

// "dd/mm/aaaa" -> "aaaa-mm-dd" (usado para ordenar e filtrar)
function dataBRParaISO(dataBR) {
    const partes = String(dataBR || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!partes) {
        return "";
    }

    const [, dia, mes, ano] = partes;

    return `${ano}-${mes}-${dia}`;
}

// ======================================================
// STATUS PELA COR DA CÉLULA
// ======================================================

// Cores mais usadas no Excel para cada situação
const CORES_CONHECIDAS = {
    "00B050": "CARREGADO",
    "92D050": "CARREGADO",
    "00FF00": "CARREGADO",
    "008000": "CARREGADO",
    "70AD47": "CARREGADO",
    C6EFCE: "CARREGADO",

    FFFF00: "DENTRO DO PRAZO",
    FFC000: "DENTRO DO PRAZO",
    FFEB9C: "DENTRO DO PRAZO",
    FFD966: "DENTRO DO PRAZO",

    FF0000: "ATRASADO",
    C00000: "ATRASADO",
    FFC7CE: "ATRASADO",
};

// Converte "FF00B050" / "00B050" em "00B050"
function normalizarCor(argb) {
    if (typeof argb !== "string") {
        return "";
    }

    const cor = argb.trim().toUpperCase().replace(/^#/, "");

    if (/^[0-9A-F]{8}$/.test(cor)) {
        return cor.substring(2);
    }

    if (/^[0-9A-F]{6}$/.test(cor)) {
        return cor;
    }

    return "";
}

// Classifica tons próximos de verde, amarelo e vermelho
// pelo matiz (hue), para não depender do código exato.
function classificarCorPorTom(corHex) {
    const r = parseInt(corHex.substring(0, 2), 16) / 255;
    const g = parseInt(corHex.substring(2, 4), 16) / 255;
    const b = parseInt(corHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luminosidade = (max + min) / 2;
    const delta = max - min;

    // Branco, preto e tons de cinza não indicam status
    if (delta < 0.15 || luminosidade > 0.95 || luminosidade < 0.1) {
        return "";
    }

    let matiz;

    if (max === r) {
        matiz = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
        matiz = 60 * ((b - r) / delta + 2);
    } else {
        matiz = 60 * ((r - g) / delta + 4);
    }

    if (matiz < 0) {
        matiz += 360;
    }

    if (matiz < 20 || matiz >= 330) {
        return "ATRASADO";
    }

    if (matiz >= 40 && matiz < 70) {
        return "DENTRO DO PRAZO";
    }

    if (matiz >= 75 && matiz < 170) {
        return "CARREGADO";
    }

    return "";
}

function identificarStatusPorCor(argb) {
    const cor = normalizarCor(argb);

    if (!cor) {
        return "";
    }

    return CORES_CONHECIDAS[cor] || classificarCorPorTom(cor);
}

// Recebe a célula do ExcelJS e devolve o status pela cor de preenchimento
function identificarStatus(celula) {
    const preenchimento = celula && celula.fill;

    if (!preenchimento || preenchimento.type !== "pattern") {
        return "";
    }

    const cor =
        (preenchimento.fgColor && preenchimento.fgColor.argb) || (preenchimento.bgColor && preenchimento.bgColor.argb);

    return identificarStatusPorCor(cor);
}

// Converte um texto de status ("Carregada", "atrasado"...) no código interno
function identificarStatusPorTexto(texto) {
    const valor = normalizarTexto(texto);

    if (!valor) {
        return "";
    }

    if (valor.startsWith("CARREG")) {
        return "CARREGADO";
    }

    if (valor.includes("PRAZO")) {
        return "DENTRO DO PRAZO";
    }

    if (valor.startsWith("ATRAS")) {
        return "ATRASADO";
    }

    return "";
}

// ======================================================
// COLUNAS DA PLANILHA
// ======================================================

// Nomes aceitos no cabeçalho de cada coluna.
// "posicao" é a coluna usada quando a planilha não tem cabeçalho reconhecível.
const COLUNAS = {
    oc: { nomes: ["OC", "ORDEM DE CARGA", "ORDEM"], posicao: 1 },
    rota: { nomes: ["ROTA"], posicao: 2 },
    transportadora: { nomes: ["TRANSPORTADORA", "TRANSP", "TRANSPORTE"], posicao: 3 },
    gr: { nomes: ["GR"], posicao: 4 },
    venda: { nomes: ["VENDA", "VALOR", "VALOR VENDA", "VALOR DA VENDA"], posicao: 5 },
    doca: { nomes: ["DOCA"], posicao: 6 },
    peso: { nomes: ["PESO", "PESO KG", "PESO (KG)"], posicao: 7 },
    data: { nomes: ["DATA", "DATA CARREGAMENTO", "DATA DE CARREGAMENTO"], posicao: 8 },
    status: { nomes: ["STATUS", "SITUACAO"], posicao: null },
};

// Recebe os textos do cabeçalho (índice 1 = coluna A) e
// devolve { colunas: { campo: numeroColuna }, ausentes, porPosicao }
function mapearColunas(cabecalhos) {
    const posicoes = {};

    cabecalhos.forEach((texto, indice) => {
        const nome = normalizarTexto(texto);

        if (!nome) {
            return;
        }

        Object.entries(COLUNAS).forEach(([campo, definicao]) => {
            if (posicoes[campo] === undefined && definicao.nomes.includes(nome)) {
                posicoes[campo] = indice;
            }
        });
    });

    // Sem a coluna OC no cabeçalho: usa o layout fixo (A..H)
    if (posicoes.oc === undefined) {
        const colunas = {};

        Object.entries(COLUNAS).forEach(([campo, definicao]) => {
            if (definicao.posicao) {
                colunas[campo] = definicao.posicao;
            }
        });

        return { colunas, ausentes: [], porPosicao: true };
    }

    const ausentes = Object.entries(COLUNAS)
        .filter(([campo, definicao]) => definicao.posicao && posicoes[campo] === undefined)
        .map(([campo]) => campo);

    return { colunas: posicoes, ausentes, porPosicao: false };
}

// ======================================================
// CARGAS
// ======================================================

function normalizarDoca(valor) {
    return converterTexto(valor);
}

// Monta a carga a partir dos valores lidos da linha
// valores: { oc, rota, transportadora, gr, venda, doca, peso, data, status }
function criarCarga(valores) {
    const status = valores.status || "";
    const doca = normalizarDoca(valores.doca);

    return {
        oc: converterTexto(valores.oc),
        rota: converterTexto(valores.rota),
        transportadora: converterTexto(valores.transportadora),
        status,
        statusPlanilha: status,
        gr: converterTexto(valores.gr),
        venda: converterNumero(valores.venda),
        doca,
        docaPlanilha: doca,
        peso: converterNumero(valores.peso),
        data: converterData(valores.data),
        observacao: "",
    };
}

// Guarda apenas o que difere da planilha.
// statusPlanilha / docaPlanilha registram o valor da planilha
// no momento da alteração, para saber se a planilha mudou depois.
function montarAlteracao(carga) {
    const alteracao = {};

    if (carga.statusPlanilha === undefined || carga.status !== carga.statusPlanilha) {
        alteracao.status = carga.status;
        alteracao.statusPlanilha = carga.statusPlanilha;
    }

    if (carga.docaPlanilha === undefined || carga.doca !== carga.docaPlanilha) {
        alteracao.doca = carga.doca;
        alteracao.docaPlanilha = carga.docaPlanilha;
    }

    if (carga.observacao) {
        alteracao.observacao = carga.observacao;
    }

    return Object.keys(alteracao).length > 0 ? alteracao : null;
}

function aplicarAlteracao(carga, alteracao) {
    if (!alteracao) {
        return carga;
    }

    if (alteracao.status !== undefined) {
        carga.status = alteracao.status;
    }

    if (alteracao.doca !== undefined) {
        carga.doca = normalizarDoca(alteracao.doca);
    }

    if (alteracao.observacao !== undefined) {
        carga.observacao = alteracao.observacao;
    }

    return carga;
}

// Junta a base atual com as cargas importadas, preservando
// as alterações manuais. Se a planilha mudou um campo que tinha
// alteração manual, o valor novo da planilha prevalece.
// Não altera os parâmetros recebidos.
function mesclarImportacao(cargasAtuais, cargasImportadas, alteracoesSalvas) {
    const alteracoes = JSON.parse(JSON.stringify(alteracoesSalvas || {}));
    const atuaisPorOC = new Map(cargasAtuais.map((carga) => [String(carga.oc), carga]));
    const ocsImportadas = new Set();
    const eventos = [];

    let novas = 0;
    let atualizadas = 0;
    let duplicadas = 0;

    const novaBase = [];

    cargasImportadas.forEach((cargaImportada) => {
        const oc = String(cargaImportada.oc);

        // Mantém a primeira ocorrência de cada OC
        if (ocsImportadas.has(oc)) {
            duplicadas++;
            return;
        }

        ocsImportadas.add(oc);

        const carga = { ...cargaImportada };
        const cargaAntiga = atuaisPorOC.get(oc);

        if (cargaAntiga) {
            atualizadas++;
        } else {
            novas++;
        }

        const alteracao = alteracoes[oc];

        if (alteracao) {
            // Status: a planilha mudou desde a alteração manual?
            if (
                alteracao.status !== undefined &&
                alteracao.statusPlanilha !== undefined &&
                alteracao.statusPlanilha !== carga.statusPlanilha
            ) {
                eventos.push({
                    oc,
                    mensagem:
                        `Status atualizado pela planilha: ` +
                        `${obterTextoStatus(alteracao.status)} → ` +
                        `${obterTextoStatus(carga.statusPlanilha)}`,
                });

                delete alteracao.status;
                delete alteracao.statusPlanilha;
            }

            // Doca: mesma regra
            if (
                alteracao.doca !== undefined &&
                alteracao.docaPlanilha !== undefined &&
                normalizarDoca(alteracao.docaPlanilha) !== carga.docaPlanilha
            ) {
                eventos.push({
                    oc,
                    mensagem:
                        `Doca atualizada pela planilha: ` +
                        `${alteracao.doca || "Sem doca"} → ` +
                        `${carga.docaPlanilha || "Sem doca"}`,
                });

                delete alteracao.doca;
                delete alteracao.docaPlanilha;
            }

            aplicarAlteracao(carga, alteracao);

            if (Object.keys(alteracao).length === 0) {
                delete alteracoes[oc];
            }
        } else if (cargaAntiga && cargaAntiga.observacao) {
            carga.observacao = cargaAntiga.observacao;
        }

        novaBase.push(carga);
    });

    const removidas = cargasAtuais.filter((carga) => !ocsImportadas.has(String(carga.oc))).length;

    return {
        cargas: novaBase,
        alteracoes,
        eventos,
        resumo: {
            novas,
            atualizadas,
            removidas,
            duplicadas,
            total: novaBase.length,
        },
    };
}

// ======================================================
// FILTROS E ORDENAÇÃO
// ======================================================

// filtros: { oc, transportadora, status, data ("aaaa-mm-dd") }
function filtrarCargas(cargas, filtros) {
    const textoOC = normalizarTexto(filtros.oc);

    return cargas.filter((carga) => {
        if (textoOC && !normalizarTexto(carga.oc).includes(textoOC)) {
            return false;
        }

        if (filtros.transportadora && carga.transportadora !== filtros.transportadora) {
            return false;
        }

        if (filtros.status === FILTRO_SEM_STATUS) {
            if (STATUS[carga.status]) {
                return false;
            }
        } else if (filtros.status && carga.status !== filtros.status) {
            return false;
        }

        if (filtros.data && dataBRParaISO(carga.data) !== filtros.data) {
            return false;
        }

        return true;
    });
}

const CAMPOS_NUMERICOS = ["venda", "peso"];

function valorParaOrdenar(carga, campo) {
    if (campo === "data") {
        return dataBRParaISO(carga.data);
    }

    if (campo === "status") {
        return obterTextoStatus(carga.status);
    }

    return carga[campo];
}

// Devolve uma nova lista ordenada. direcao: "asc" | "desc"
function ordenarCargas(cargas, campo, direcao = "asc") {
    if (!campo) {
        return [...cargas];
    }

    const fator = direcao === "desc" ? -1 : 1;

    return [...cargas].sort((a, b) => {
        const valorA = valorParaOrdenar(a, campo);
        const valorB = valorParaOrdenar(b, campo);

        if (CAMPOS_NUMERICOS.includes(campo)) {
            return (Number(valorA || 0) - Number(valorB || 0)) * fator;
        }

        // Vazios sempre no final
        const textoA = String(valorA ?? "");
        const textoB = String(valorB ?? "");

        if (!textoA && textoB) {
            return 1;
        }

        if (textoA && !textoB) {
            return -1;
        }

        return textoA.localeCompare(textoB, "pt-BR", { numeric: true, sensitivity: "base" }) * fator;
    });
}

// ======================================================
// INDICADORES
// ======================================================

function calcularIndicadores(cargas) {
    const resultado = {
        total: cargas.length,
        porStatus: { CARREGADO: 0, "DENTRO DO PRAZO": 0, ATRASADO: 0, SEM_STATUS: 0 },
        peso: 0,
        venda: 0,
    };

    cargas.forEach((carga) => {
        if (STATUS[carga.status]) {
            resultado.porStatus[carga.status]++;
        } else {
            resultado.porStatus.SEM_STATUS++;
        }

        resultado.peso += Number(carga.peso || 0);
        resultado.venda += Number(carga.venda || 0);
    });

    return resultado;
}

function contarPorTransportadora(cargas) {
    const contagem = new Map();

    cargas.forEach((carga) => {
        const nome = carga.transportadora || "Sem transportadora";

        contagem.set(nome, (contagem.get(nome) || 0) + 1);
    });

    return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
}

// ======================================================
// FORMATAÇÃO
// ======================================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatarNumero(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatarPeso(valor) {
    return `${formatarNumero(valor)} kg`;
}

// Aceita ISO (formato atual) ou texto já formatado (histórico antigo)
function formatarDataHora(valor) {
    if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}T/.test(valor)) {
        const data = new Date(valor);

        if (!Number.isNaN(data.getTime())) {
            return data.toLocaleString("pt-BR");
        }
    }

    return String(valor ?? "");
}

// ======================================================
// EXPORTAÇÃO CSV
// ======================================================

function campoCSV(valor) {
    let texto = String(valor ?? "");

    // Evita que o Excel interprete o conteúdo como fórmula
    if (/^[=+\-@\t\r]/.test(texto)) {
        texto = `'${texto}`;
    }

    if (/[";\n\r]/.test(texto)) {
        texto = `"${texto.replace(/"/g, '""')}"`;
    }

    return texto;
}

// CSV com ";" e vírgula decimal, que o Excel em português abre direto
function gerarCSV(cargas) {
    const cabecalho = [
        "OC",
        "Rota",
        "Transportadora",
        "Status",
        "GR",
        "Venda",
        "Doca",
        "Peso (kg)",
        "Data",
        "Observação",
    ];

    const linhas = cargas.map((carga) =>
        [
            carga.oc,
            carga.rota,
            carga.transportadora,
            obterTextoStatus(carga.status),
            carga.gr,
            formatarNumero(carga.venda),
            carga.doca,
            formatarNumero(carga.peso),
            carga.data,
            carga.observacao,
        ]
            .map(campoCSV)
            .join(";"),
    );

    return [cabecalho.map(campoCSV).join(";"), ...linhas].join("\r\n");
}

// ======================================================
// EXPORTS (Node / testes)
// ======================================================

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        STATUS,
        SEM_STATUS,
        FILTRO_SEM_STATUS,
        COLUNAS,
        obterInfoStatus,
        obterTextoStatus,
        obterClasseStatus,
        normalizarTexto,
        lerValorCelula,
        converterTexto,
        converterNumero,
        converterData,
        dataBRParaISO,
        normalizarCor,
        identificarStatusPorCor,
        identificarStatus,
        identificarStatusPorTexto,
        mapearColunas,
        criarCarga,
        montarAlteracao,
        aplicarAlteracao,
        mesclarImportacao,
        filtrarCargas,
        ordenarCargas,
        calcularIndicadores,
        contarPorTransportadora,
        formatarMoeda,
        formatarNumero,
        formatarPeso,
        formatarDataHora,
        campoCSV,
        gerarCSV,
    };
}
