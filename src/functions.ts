import jsPDF from "jspdf";
import {
    EstratoResumo,
    ClassificacaoEstratoIIP,
    CriadouroLevantamento,
    Municipio,
    TipoLevantamento,
    Bairro,
    BairroAmostra,
    Estrato,
    DadosAmostraEstrato,
    Levantamento,
} from "./models";

/**
 * IIP - Índice de infestação predial
 */
export const calcularIIP = (qtdeImoveisTotal: number, qtdeImoveisComAedes: number): number =>
    qtdeImoveisComAedes ? round((qtdeImoveisComAedes / qtdeImoveisTotal) * 100, 1) : 0;

/**
 * IB - Índice de Breteau
 */
export const calcularIB = (qtdeImoveisTotal: number, qtdRecepientesPositivos: number): number =>
    qtdRecepientesPositivos ? round((qtdRecepientesPositivos / qtdeImoveisTotal) * 100, 1) : 0;

export const classificarEstratosSegundoIIP = (estratos: EstratoResumo[]): ClassificacaoEstratoIIP[] => {
    const estratosRiscoBaixo = estratos.filter((e) => e.iip <= 0.9);
    const estratosRiscoMedio = estratos.filter((e) => 1 <= e.iip && e.iip <= 3.9);
    const estratosRiscoAlto = estratos.filter((e) => e.iip >= 4.0);
    const classificacaoRiscoBaixo: ClassificacaoEstratoIIP = {
        ordem: 1,
        quantidade: estratosRiscoBaixo.length,
        percentual: (estratosRiscoBaixo.length / estratos.length) * 100,
        risco: "Baixo",
    };
    const classificacaoRiscoMedio: ClassificacaoEstratoIIP = {
        ordem: 2,
        quantidade: estratosRiscoMedio.length,
        percentual: (estratosRiscoMedio.length / estratos.length) * 100,
        risco: "Médio",
    };
    const classificacaoRiscoAlto: ClassificacaoEstratoIIP = {
        ordem: 3,
        quantidade: estratosRiscoAlto.length,
        percentual: (estratosRiscoAlto.length / estratos.length) * 100,
        risco: "Alto",
    };
    return [classificacaoRiscoBaixo, classificacaoRiscoMedio, classificacaoRiscoAlto];
};

export const round = (value: number, precision: number) => {
    const multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

export const calcularPercentualCriadouroLevantamento = (
    criadouroLevantamentos: CriadouroLevantamento[]
): CriadouroLevantamento[] => {
    const totalCriadouros = criadouroLevantamentos.reduce(
        (quantidadeAcumulada, criadouro) => quantidadeAcumulada + criadouro.quantidade,
        0
    );
    return criadouroLevantamentos.map((criadouro) => ({
        ...criadouro,
        percentual: totalCriadouros ? round((criadouro.quantidade / totalCriadouros) * 100, 1) : 0,
    }));
};

export const calcularTipoLevantamentoDadoMunicipio = (municipio: Municipio): TipoLevantamento => {
    if (municipio.quantidadeImoveis <= 1999) {
        return {
            nome: "LIA",
        };
    }
    return {
        nome: "LIRAa",
    };
};

export const calcularBairrosAmostra = (
    bairros: Bairro[],
    quarteiraoInicial: number,
    intervalo: number
): BairroAmostra[] =>
    bairros.map((bairro) => {
        const quarteiroesSorteados = [];
        for (let i = quarteiraoInicial; i < bairro.quantidadeQuarteiroes; i = i + intervalo) {
            quarteiroesSorteados.push(round(i, 0));
        }
        return {
            bairro,
            quarteiroesSorteados,
        };
    });

export const calcularQuantidadeImoveisProgramados = (quantidadeImoveis: number): number => {
    if (quantidadeImoveis < 8100) {
        return round(250 / (1 + 250 / quantidadeImoveis), 0);
    }
    return round(450 / (1 + 450 / quantidadeImoveis), 0);
};

export const calcularEstimativaImoveisPorQuarteirao = (
    quantidadeImoveis: number,
    quantidadeQuarteiros: number
): number => round(quantidadeImoveis / quantidadeQuarteiros, 0);

export const calcularQuantidadeQuarteiroesComposicaoAmostra = (
    quantidadeImoveisEstrato: number,
    quantidadeImoveisProgramados: number,
    estimativaImoveisPorQuarteirao: number
): number => {
    if (quantidadeImoveisEstrato < 8100) {
        return round(quantidadeImoveisProgramados / (estimativaImoveisPorQuarteirao / 2), 0);
    }
    return round(quantidadeImoveisProgramados / (estimativaImoveisPorQuarteirao / 5), 0);
};

export const calcularIntervaloQuarteiroes = (
    quantidadeQuarteiroesTotal: number,
    quantidadeQuarteiroesAmostra: number
) => round(quantidadeQuarteiroesTotal / quantidadeQuarteiroesAmostra, 5);

export const calcularQuarteiraoInicial = (intervaloQuarteiroes: number) =>
    Math.floor(Math.random() * (intervaloQuarteiroes - 0.5 + 1)) + 0.5;

export const calcularDadosAmostraEstrato = (estrato: Estrato): DadosAmostraEstrato => {
    const qtdeQuarteiroesEstrato = estrato.extrairQuantidadeQuarteiroes();
    const quantidadeImoveisProgramados = calcularQuantidadeImoveisProgramados(estrato.quantidadeImoveis);
    const estimativaImoveisPorQuarteirao = calcularEstimativaImoveisPorQuarteirao(
        estrato.quantidadeImoveis,
        qtdeQuarteiroesEstrato
    );
    const quantidadeQuarteiroesComposicaoAmostra = calcularQuantidadeQuarteiroesComposicaoAmostra(
        estrato.quantidadeImoveis,
        quantidadeImoveisProgramados,
        estimativaImoveisPorQuarteirao
    );
    const percentualQuarteiroes = round((quantidadeQuarteiroesComposicaoAmostra / qtdeQuarteiroesEstrato) * 100, 1);
    const intervaloQuarteiroes = calcularIntervaloQuarteiroes(
        qtdeQuarteiroesEstrato,
        quantidadeQuarteiroesComposicaoAmostra
    );
    const quarteiraoInicial = calcularQuarteiraoInicial(intervaloQuarteiroes);
    const bairros = calcularBairrosAmostra(estrato.bairros, quarteiraoInicial, intervaloQuarteiroes);
    return {
        quantidadeImoveisProgramados,
        estimativaImoveisPorQuarteirao,
        quantidadeQuarteiroes: quantidadeQuarteiroesComposicaoAmostra,
        percentualQuarteiroes,
        intervaloQuarteiroes,
        quarteiraoInicial,
        bairros,
    };
};

export const addHeaders = (doc: any, titulo: any, levantamento: Levantamento) => {
    const pageCount = doc.getNumberOfPages();
    const posYTexto = 12;
    doc.setFont("helvetica");
    doc.setFontSize(12);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text("Liraa App", 15, posYTexto);
        doc.text(titulo, 125, posYTexto);
        doc.text(`${levantamento.municipio.municipioNome}/${levantamento.municipio.municipioUF}`, 200, posYTexto);
        doc.text(
            `${formatarDataDDMMYYY(levantamento.periodoInicio)} a ${formatarDataDDMMYYY(levantamento.periodoFim)}`,
            235,
            posYTexto
        );
    }
};

export const addFooters = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    const posX = doc.internal.pageSize.width / 2;
    const posY = doc.internal.pageSize.height - 10;
    doc.setFont("helvetica");
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${String(i)} de ${String(pageCount)}`, posX, posY, {
            align: "center",
        });
    }
};

export const formatarDataDiaMes = (data: string | null): string | null => {
    if (!data) {
        return data;
    }
    return data.substring(8, 10) + "/" + data.substring(5, 7);
};

export const formatarDataDDMMYYY = (dataYYYYMMDD: string | null) => {
    if (!dataYYYYMMDD) {
        return "";
    }
    return dataYYYYMMDD.split("-").reverse().join("/");
};

export const filtrarLevantamentosPorTexto = (levantamentos: Levantamento[], texto: string): Levantamento[] => {
    if (!texto || !levantamentos) {
        return levantamentos;
    }
    return levantamentos.filter(
        (levantamento) =>
            levantamento.municipio.municipioNome.toLowerCase().includes(texto.toLowerCase()) ||
            levantamento.municipio.municipioUF.toLowerCase().includes(texto.toLowerCase()) ||
            `${levantamento.ano}`.toLowerCase().includes(texto.toLowerCase()) ||
            `${levantamento.periodoInicio}`.toLowerCase().includes(texto.toLowerCase()) ||
            `${levantamento.periodoFim}`.toLowerCase().includes(texto.toLowerCase())
    );
};
