const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
    lerValorCelula,
    converterTexto,
    converterNumero,
    converterData,
    dataBRParaISO,
    identificarStatus,
    identificarStatusPorCor,
    identificarStatusPorTexto,
    mapearColunas,
    criarCarga,
    montarAlteracao,
    mesclarImportacao,
    filtrarCargas,
    ordenarCargas,
    calcularIndicadores,
    contarPorTransportadora,
    campoCSV,
    gerarCSV,
    formatarDataHora,
    obterTextoStatus,
} = require("../utils.js");

describe("lerValorCelula", () => {
    it("devolve valores simples sem alteração", () => {
        assert.equal(lerValorCelula("abc"), "abc");
        assert.equal(lerValorCelula(10), 10);
        assert.equal(lerValorCelula(null), null);
        assert.equal(lerValorCelula(undefined), null);
    });

    it("lê o resultado de fórmulas", () => {
        assert.equal(lerValorCelula({ formula: "A1*2", result: 50 }), 50);
        assert.equal(lerValorCelula({ sharedFormula: "B2", result: "SP" }), "SP");
        assert.equal(lerValorCelula({ formula: "A1" }), null);
    });

    it("lê texto formatado e hiperlinks", () => {
        assert.equal(lerValorCelula({ richText: [{ text: "Rota " }, { text: "Norte" }] }), "Rota Norte");
        assert.equal(lerValorCelula({ text: "Transp X", hyperlink: "http://x" }), "Transp X");
    });

    it("trata erros do Excel como vazio", () => {
        assert.equal(lerValorCelula({ error: "#N/A" }), null);
    });
});

describe("converterTexto / converterNumero", () => {
    it("nunca devolve [object Object]", () => {
        assert.equal(converterTexto({ richText: [{ text: "ABC" }] }), "ABC");
        assert.equal(converterTexto({ formula: "X", result: 123 }), "123");
        assert.equal(converterTexto(null), "");
    });

    it("converte números em vários formatos", () => {
        assert.equal(converterNumero(1234.5), 1234.5);
        assert.equal(converterNumero("1234.5"), 1234.5);
        assert.equal(converterNumero("1.234,56"), 1234.56);
        assert.equal(converterNumero("R$ 1.234,56"), 1234.56);
        assert.equal(converterNumero({ formula: "A1+B1", result: 99 }), 99);
    });

    it("devolve 0 para valores inválidos (nunca NaN)", () => {
        assert.equal(converterNumero("abc"), 0);
        assert.equal(converterNumero(null), 0);
        assert.equal(converterNumero({ error: "#DIV/0!" }), 0);
        assert.equal(converterNumero(NaN), 0);
    });
});

describe("converterData", () => {
    it("usa UTC: meia-noite UTC não vira o dia anterior", () => {
        // É assim que o ExcelJS entrega a data 24/09/2026
        assert.equal(converterData(new Date(Date.UTC(2026, 8, 24))), "24/09/2026");
    });

    it("converte o número serial do Excel", () => {
        assert.equal(converterData(46289), "24/09/2026");
    });

    it("normaliza textos de data", () => {
        assert.equal(converterData("24/09/2026"), "24/09/2026");
        assert.equal(converterData("4/9/2026"), "04/09/2026");
        assert.equal(converterData("2026-09-24"), "24/09/2026");
        assert.equal(converterData(""), "");
        assert.equal(converterData(null), "");
    });

    it("converte dd/mm/aaaa para ISO", () => {
        assert.equal(dataBRParaISO("24/09/2026"), "2026-09-24");
        assert.equal(dataBRParaISO("texto"), "");
    });
});

describe("status", () => {
    it("reconhece as cores padrão", () => {
        assert.equal(identificarStatusPorCor("FF00B050"), "CARREGADO");
        assert.equal(identificarStatusPorCor("FFFFFF00"), "DENTRO DO PRAZO");
        assert.equal(identificarStatusPorCor("FFFF0000"), "ATRASADO");
    });

    it("reconhece tons próximos pelo matiz", () => {
        assert.equal(identificarStatusPorCor("FF33CC33"), "CARREGADO");
        assert.equal(identificarStatusPorCor("FFFFE033"), "DENTRO DO PRAZO");
        assert.equal(identificarStatusPorCor("FFE53935"), "ATRASADO");
    });

    it("ignora branco, cinza, azul e valores inválidos", () => {
        assert.equal(identificarStatusPorCor("FFFFFFFF"), "");
        assert.equal(identificarStatusPorCor("FF808080"), "");
        assert.equal(identificarStatusPorCor("FF0070C0"), "");
        assert.equal(identificarStatusPorCor(undefined), "");
        assert.equal(identificarStatusPorCor("xyz"), "");
    });

    it("lê a cor de preenchimento da célula", () => {
        const celula = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } } };

        assert.equal(identificarStatus(celula), "CARREGADO");
        assert.equal(identificarStatus({ fill: { type: "pattern", fgColor: { theme: 5 } } }), "");
        assert.equal(identificarStatus({}), "");
        assert.equal(identificarStatus(null), "");
    });

    it("lê o status em texto", () => {
        assert.equal(identificarStatusPorTexto("Carregada"), "CARREGADO");
        assert.equal(identificarStatusPorTexto("dentro do prazo"), "DENTRO DO PRAZO");
        assert.equal(identificarStatusPorTexto("ATRASADO"), "ATRASADO");
        assert.equal(identificarStatusPorTexto("outro"), "");
    });
});

describe("mapearColunas", () => {
    it("encontra as colunas pelo nome, em qualquer ordem", () => {
        const cabecalhos = [undefined, "Data", "OC", "Transportadora", "Rota", "Peso (kg)", "Venda", "GR", "Doca"];
        const { colunas, ausentes, porPosicao } = mapearColunas(cabecalhos);

        assert.equal(porPosicao, false);
        assert.deepEqual(ausentes, []);
        assert.equal(colunas.oc, 2);
        assert.equal(colunas.data, 1);
        assert.equal(colunas.doca, 8);
    });

    it("ignora acentos e informa colunas ausentes", () => {
        const { colunas, ausentes } = mapearColunas([undefined, "oc", "Situação", "Rota"]);

        assert.equal(colunas.status, 2);
        assert.ok(ausentes.includes("peso"));
        assert.ok(!ausentes.includes("rota"));
    });

    it("usa o layout fixo quando não reconhece o cabeçalho", () => {
        const { colunas, porPosicao } = mapearColunas([undefined, "A", "B"]);

        assert.equal(porPosicao, true);
        assert.equal(colunas.oc, 1);
        assert.equal(colunas.data, 8);
    });
});

function carga(dados) {
    return criarCarga({
        oc: "1",
        rota: "Rota",
        transportadora: "Transp A",
        gr: "10",
        venda: 100,
        doca: 1,
        peso: 50,
        data: new Date(Date.UTC(2026, 8, 24)),
        status: "DENTRO DO PRAZO",
        ...dados,
    });
}

describe("criarCarga / montarAlteracao", () => {
    it("guarda os valores da planilha e normaliza a doca como texto", () => {
        const nova = carga({ doca: 3 });

        assert.equal(nova.doca, "3");
        assert.equal(nova.docaPlanilha, "3");
        assert.equal(nova.statusPlanilha, "DENTRO DO PRAZO");
    });

    it("não cria alteração quando nada difere da planilha", () => {
        assert.equal(montarAlteracao(carga()), null);
    });

    it("registra apenas o que foi alterado", () => {
        const alterada = { ...carga(), status: "ATRASADO", observacao: "Aguardando" };

        assert.deepEqual(montarAlteracao(alterada), {
            status: "ATRASADO",
            statusPlanilha: "DENTRO DO PRAZO",
            observacao: "Aguardando",
        });
    });
});

describe("mesclarImportacao", () => {
    it("conta novas, atualizadas, removidas e duplicadas", () => {
        const atuais = [carga({ oc: "1" }), carga({ oc: "2" })];
        const importadas = [carga({ oc: "2" }), carga({ oc: "3" }), carga({ oc: "3" })];

        const { resumo, cargas } = mesclarImportacao(atuais, importadas, {});

        assert.deepEqual(resumo, { novas: 1, atualizadas: 1, removidas: 1, duplicadas: 1, total: 2 });
        assert.deepEqual(
            cargas.map((c) => c.oc),
            ["2", "3"],
        );
    });

    it("mantém a alteração manual quando a planilha não mudou", () => {
        const alteracoes = {
            1: { status: "ATRASADO", statusPlanilha: "DENTRO DO PRAZO", observacao: "Obs" },
        };

        const resultado = mesclarImportacao([], [carga({ oc: "1" })], alteracoes);

        assert.equal(resultado.cargas[0].status, "ATRASADO");
        assert.equal(resultado.cargas[0].observacao, "Obs");
        assert.equal(resultado.eventos.length, 0);
    });

    it("a planilha prevalece quando o status mudou nela", () => {
        const alteracoes = {
            1: { status: "ATRASADO", statusPlanilha: "DENTRO DO PRAZO", observacao: "Obs" },
        };

        const resultado = mesclarImportacao([], [carga({ oc: "1", status: "CARREGADO" })], alteracoes);

        assert.equal(resultado.cargas[0].status, "CARREGADO");
        assert.equal(resultado.cargas[0].observacao, "Obs");
        assert.deepEqual(resultado.alteracoes, { 1: { observacao: "Obs" } });
        assert.equal(resultado.eventos.length, 1);
        assert.match(resultado.eventos[0].mensagem, /Atrasado → Carregado/);
    });

    it("a planilha prevalece quando a doca mudou nela", () => {
        const alteracoes = { 1: { doca: "7", docaPlanilha: "1" } };

        const resultado = mesclarImportacao([], [carga({ oc: "1", doca: 2 })], alteracoes);

        assert.equal(resultado.cargas[0].doca, "2");
        assert.deepEqual(resultado.alteracoes, {});
    });

    it("mantém alterações antigas (sem valor da planilha registrado)", () => {
        const alteracoes = { 1: { status: "ATRASADO", doca: "5", observacao: "" } };

        const resultado = mesclarImportacao([], [carga({ oc: "1", status: "CARREGADO" })], alteracoes);

        assert.equal(resultado.cargas[0].status, "ATRASADO");
        assert.equal(resultado.cargas[0].doca, "5");
    });

    it("não altera os objetos recebidos", () => {
        const alteracoes = { 1: { status: "ATRASADO", statusPlanilha: "DENTRO DO PRAZO" } };
        const importadas = [carga({ oc: "1", status: "CARREGADO" })];

        mesclarImportacao([], importadas, alteracoes);

        assert.equal(alteracoes[1].status, "ATRASADO");
        assert.equal(importadas[0].status, "CARREGADO");
    });
});

describe("filtrarCargas / ordenarCargas", () => {
    const lista = [
        carga({ oc: "100", transportadora: "B", status: "CARREGADO", peso: 10 }),
        carga({ oc: "20", transportadora: "A", status: "", peso: 30, data: "01/01/2026" }),
        carga({ oc: "3", transportadora: "A", status: "ATRASADO", peso: 20 }),
    ];

    it("filtra por OC, transportadora, status e data", () => {
        assert.equal(filtrarCargas(lista, { oc: "0" }).length, 2);
        assert.equal(filtrarCargas(lista, { transportadora: "A" }).length, 2);
        assert.equal(filtrarCargas(lista, { status: "ATRASADO" }).length, 1);
        assert.equal(filtrarCargas(lista, { status: "SEM_STATUS" })[0].oc, "20");
        assert.equal(filtrarCargas(lista, { data: "2026-01-01" })[0].oc, "20");
        assert.equal(filtrarCargas(lista, {}).length, 3);
    });

    it("ordena OC numericamente e peso como número", () => {
        assert.deepEqual(
            ordenarCargas(lista, "oc").map((c) => c.oc),
            ["3", "20", "100"],
        );
        assert.deepEqual(
            ordenarCargas(lista, "peso", "desc").map((c) => c.oc),
            ["20", "3", "100"],
        );
    });

    it("ordena datas cronologicamente", () => {
        assert.deepEqual(ordenarCargas(lista, "data").map((c) => c.oc)[0], "20");
    });

    it("não altera a lista original", () => {
        ordenarCargas(lista, "oc");

        assert.equal(lista[0].oc, "100");
    });
});

describe("indicadores", () => {
    it("soma peso, venda e conta status", () => {
        const resultado = calcularIndicadores([
            carga({ status: "CARREGADO", peso: 10, venda: 5 }),
            carga({ status: "", peso: 2.5, venda: 1 }),
        ]);

        assert.equal(resultado.total, 2);
        assert.equal(resultado.peso, 12.5);
        assert.equal(resultado.venda, 6);
        assert.equal(resultado.porStatus.CARREGADO, 1);
        assert.equal(resultado.porStatus.SEM_STATUS, 1);
    });

    it("conta por transportadora em ordem decrescente", () => {
        const resultado = contarPorTransportadora([
            carga({ transportadora: "B" }),
            carga({ transportadora: "A" }),
            carga({ transportadora: "A" }),
            carga({ transportadora: "" }),
        ]);

        assert.deepEqual(resultado[0], ["A", 2]);
        assert.ok(resultado.some(([nome]) => nome === "Sem transportadora"));
    });
});

describe("CSV", () => {
    it("escapa aspas, separadores e fórmulas", () => {
        assert.equal(campoCSV('a"b'), '"a""b"');
        assert.equal(campoCSV("a;b"), '"a;b"');
        assert.equal(campoCSV('x;"y"'), '"x;""y"""');
        assert.equal(campoCSV("=SOMA(A1)"), "'=SOMA(A1)");
    });

    it("gera cabeçalho e linhas", () => {
        const csv = gerarCSV([carga({ oc: "9", status: "ATRASADO", venda: 1234.5 })]);
        const linhas = csv.split("\r\n");

        assert.equal(linhas.length, 2);
        assert.match(linhas[0], /^OC;Rota;Transportadora;Status/);
        assert.match(linhas[1], /^9;Rota;Transp A;Atrasado;10;"?1\.234,50"?;1;/);
    });
});

describe("formatação", () => {
    it("formata data ISO e mantém texto antigo do histórico", () => {
        assert.notEqual(formatarDataHora("2026-09-24T10:00:00.000Z"), "2026-09-24T10:00:00.000Z");
        assert.equal(formatarDataHora("24/09/2026, 10:00:00"), "24/09/2026, 10:00:00");
    });

    it("textos de status", () => {
        assert.equal(obterTextoStatus("CARREGADO"), "Carregado");
        assert.equal(obterTextoStatus(""), "Sem status");
        assert.equal(obterTextoStatus("QUALQUER"), "Sem status");
    });
});
