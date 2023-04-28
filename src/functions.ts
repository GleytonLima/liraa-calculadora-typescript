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
import { calcularQuarteiraoInicial } from "./sorteioquarteiraoinicial";

/**
 * Calcula o Índice de Infestação Predial (IIP) com base no número total de imóveis e no número de imóveis com Aedes aegypti.
 * @param {number} qtdeImoveisTotal - Número total de imóveis no levantamento.
 * @param {number} qtdeImoveisComAedes - Número de imóveis com Aedes aegypti no levantamento.
 * @returns {number} O valor do IIP calculado.
 */
export const calcularIIP = (qtdeImoveisTotal: number, qtdeImoveisComAedes: number): number =>
    qtdeImoveisComAedes ? customRound((qtdeImoveisComAedes / qtdeImoveisTotal) * 100, 1) : 0;

/**
 * Calcula o Índice de Breteau (IB).
 * @param {number} qtdeImoveisTotal - a quantidade total de imóveis na área.
 * @param {number} qtdRecepientesPositivos - a quantidade de recipientes positivos para o mosquito Aedes aegypti.
 * @returns {number} o valor do Índice de Breteau calculado.
 */
export const calcularIB = (qtdeImoveisTotal: number, qtdRecepientesPositivos: number): number =>
    qtdRecepientesPositivos ? customRound((qtdRecepientesPositivos / qtdeImoveisTotal) * 100, 1) : 0;

/**
 * Classifica os estratos segundo o índice de infestação predial (IIP).
 * @param {EstratoResumo[]} estratos - Array de objetos EstratoResumo contendo informações sobre os estratos.
 * @returns {ClassificacaoEstratoIIP[]} Array de objetos ClassificacaoEstratoIIP contendo informações sobre a classificação de risco dos estratos segundo o IIP.
 */
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

/**
 * Arredonda um número para um número específico de casas decimais.
 *
 * @param {number} value O valor a ser arredondado.
 * @param {number} precision O número de casas decimais a serem consideradas.
 * @returns {number} O valor arredondado.
 */
export const customRound = (value: number, precision: number) => {
    const multiplier = 10 ** (precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

/**
 * Calcula o percentual de cada criadouro em relação ao total de criadouros levantados.
 * @param criadouroLevantamentos - uma lista de objetos do tipo CriadouroLevantamento contendo a quantidade de cada criadouro levantado.
 * @returns uma lista de objetos do tipo CriadouroLevantamento com o percentual de cada criadouro em relação ao total de criadouros levantados.
 */
export const calcularPercentualCriadouroLevantamento = (
    criadouroLevantamentos: CriadouroLevantamento[]
): CriadouroLevantamento[] => {
    const totalCriadouros = criadouroLevantamentos.reduce(
        (quantidadeAcumulada, criadouro) => quantidadeAcumulada + criadouro.quantidade,
        0
    );
    return criadouroLevantamentos.map((criadouro) => ({
        ...criadouro,
        percentual: totalCriadouros ? customRound((criadouro.quantidade / totalCriadouros) * 100, 1) : 0,
    }));
};

/**
 * Função que calcula o tipo de levantamento a ser realizado de acordo com a quantidade de imóveis do município informado.
 * Se a quantidade for menor ou igual a 1999, o levantamento será do tipo LIA (Levantamento de Índice Amostral).
 * Caso contrário, o levantamento será do tipo LIRAa (Levantamento de Índice Rápido do Aedes aegypti).
 * @param municipio O objeto que representa o município a ser avaliado.
 * @returns O objeto que contém o nome do tipo de levantamento a ser realizado.
 */
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

/**
 * Retorna uma lista de bairros com seus respectivos quarteirões sorteados para amostragem.
 * @param bairros - Lista de bairros a serem amostrados.
 * @param quarteiraoInicial - Número do quarteirão inicial para sorteio.
 * @param intervalo - Intervalo de quarteirões entre os sorteios.
 * @returns Lista de bairros com seus respectivos quarteirões sorteados.
 */
export const calcularBairrosAmostra = (
    bairros: Bairro[],
    quarteiraoInicial: number,
    intervalo: number
): BairroAmostra[] =>
    bairros.map((bairro) => {
        const quarteiroesSorteados = [];
        for (let i = quarteiraoInicial; i < bairro.quantidadeQuarteiroes; i = i + intervalo) {
            quarteiroesSorteados.push(customRound(i, 0));
        }
        return {
            bairro,
            quarteiroesSorteados,
        };
    });

/**
 * Essa função recebe como entrada a quantidade total de imóveis em um determinado município ou região,
 * e retorna o número de imóveis que devem ser programados para inspeção. O objetivo é garantir que a
 * amostra seja representativa e proporcional ao tamanho da população de imóveis.
 * O cálculo é feito de acordo com a fórmula proposta pelo Ministério da Saúde para os programas de
 * vigilância entomológica em áreas com presença do mosquito Aedes aegypti. A fórmula leva em consideração a
 * quantidade total de imóveis e retorna um número de imóveis que deve ser inspecionado para garantir
 * a efetividade do programa.
 * Se a quantidade total de imóveis for menor que 8100, a fórmula usada é 250/(1+250/n), onde n é
 *  a quantidade total de imóveis. Se a quantidade total de imóveis for maior ou igual a 8100, a
 * fórmula usada é 450/(1+450/n). O resultado é então arredondado para o número inteiro mais próximo,
 * já que a amostra deve ser composta por um número inteiro de imóveis.
 *
 * @param quantidadeImoveis A quantidade total de imóveis no município ou região.
 * @returns A quantidade de imóveis que serão programados para inspeção.
 */
export const calcularQuantidadeImoveisProgramados = (quantidadeImoveis: number): number => {
    if (quantidadeImoveis < 8100) {
        return customRound(250 / (1 + 250 / quantidadeImoveis), 0);
    }
    return customRound(450 / (1 + 450 / quantidadeImoveis), 0);
};

/**
 * Calcula a estimativa de quantidade de imóveis por quarteirão.
 * @param quantidadeImoveis Quantidade total de imóveis na área.
 * @param quantidadeQuarteiros Quantidade total de quarteirões na área.
 * @returns A estimativa de quantidade de imóveis por quarteirão.
 */
export const calcularEstimativaImoveisPorQuarteirao = (
    quantidadeImoveis: number,
    quantidadeQuarteiros: number
): number => customRound(quantidadeImoveis / quantidadeQuarteiros, 0);

/**
 * Recebe como parâmetros a quantidade de imóveis em um determinado estrato, a quantidade
 * de imóveis programados para serem inspecionados, e a estimativa de imóveis por quarteirão.
 * A função retorna a quantidade de quarteirões necessários para compor a amostra de inspeção,
 * considerando a quantidade de imóveis programados e a estimativa de imóveis por quarteirão.
 * Se a quantidade de imóveis no estrato é menor que 8100, devem ser inspecionados 20% dos imóveis
 * Caso contrário, devem ser inspecionados 50% dos imóveis.
 * @param quantidadeImoveisEstrato A quantidade de imóveis do estrato.
 * @param quantidadeImoveisProgramados A quantidade de imóveis a serem programados para inspeção.
 * @param estimativaImoveisPorQuarteirao A estimativa da quantidade de imóveis por quarteirão.
 * @returns A quantidade de quarteirões que devem ser sorteados para compor a amostra do estrato.
 */
export const calcularQuantidadeQuarteiroesComposicaoAmostra = (
    quantidadeImoveisEstrato: number,
    quantidadeImoveisProgramados: number,
    estimativaImoveisPorQuarteirao: number
): number => {
    if (quantidadeImoveisEstrato < 8100) {
        return customRound(quantidadeImoveisProgramados / (estimativaImoveisPorQuarteirao / 2), 0);
    }
    return customRound(quantidadeImoveisProgramados / (estimativaImoveisPorQuarteirao / 5), 0);
};

/**
 * Calcula o intervalo de quarteirões entre as amostras.
 * @param quantidadeQuarteiroesTotal A quantidade total de quarteirões do município.
 * @param quantidadeQuarteiroesAmostra A quantidade de quarteirões que compõem a amostra.
 * @returns O intervalo entre os quarteirões amostrados.
 */
export const calcularIntervaloQuarteiroes = (
    quantidadeQuarteiroesTotal: number,
    quantidadeQuarteiroesAmostra: number
) => customRound(quantidadeQuarteiroesTotal / quantidadeQuarteiroesAmostra, 5);

/**
 * Calcula os dados da amostra de um estrato.
 * @param estrato - Estrato para o qual serão calculados os dados da amostra.
 * @returns @see DadosAmostraEstrato contendo a quantidade de imóveis programados, estimativa de imóveis por quarteirão,
 * quantidade de quarteirões da composição da amostra, percentual de quarteirões da composição da amostra,
 * intervalo de quarteirões e bairros da amostra.
 */
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
    const percentualQuarteiroes = customRound(
        (quantidadeQuarteiroesComposicaoAmostra / qtdeQuarteiroesEstrato) * 100,
        1
    );
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

/**
 * Adiciona cabeçalhos em todas as páginas do documento PDF.
 * @param doc - O objeto de documento PDF ao qual os cabeçalhos serão adicionados.
 * @param titulo - O título a ser exibido nos cabeçalhos.
 * @param levantamento - O objeto de levantamento contendo as informações do município e período do levantamento.
 */
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

/**
 * Adiciona rodapés em todas as páginas do documento PDF.
 * @param doc - O objeto de documento PDF ao qual os rodapés serão adicionados.
 */
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

/**
 * Formata uma data para o formato 'DD/MM', a partir de uma string no formato 'YYYY-MM-DD'.
 * @param {string|null} data - A data no formato 'YYYY-MM-DD' ou nulo.
 * @returns {string|null} A data formatada no formato 'DD/MM' ou nulo se a data de entrada for nula.
 */
export const formatarDataDiaMes = (data: string | null): string | null => {
    if (!data) {
        return data;
    }
    return data.substring(8, 10) + "/" + data.substring(5, 7);
};

/**
 * Formata uma data para o formato 'DD/MM/YYYY', a partir de uma string no formato 'YYYY-MM-DD'.
 * @param {string|null} dataYYYYMMDD - A data no formato 'YYYY-MM-DD' ou nulo.
 * @returns {string} A data formatada no formato 'DD/MM/YYYY' ou uma string vazia se a data de entrada for nula.
 */
export const formatarDataDDMMYYY = (dataYYYYMMDD: string | null): string => {
    if (!dataYYYYMMDD) {
        return "";
    }
    return dataYYYYMMDD.split("-").reverse().join("/");
};

/**
 * Filtra um array de objetos 'Levantamento' com base em uma string de busca.
 * Retorna um novo array com objetos que contêm a string de busca em um dos seguintes campos:
 * 'municipioNome', 'municipioUF', 'ano', 'periodoInicio' ou 'periodoFim'.
 * @param {Levantamento[]} levantamentos - O array de objetos 'Levantamento' a ser filtrado.
 * @param {string} texto - A string de busca.
 * @returns {Levantamento[]} O novo array de objetos 'Levantamento' que contêm a string de busca em um dos campos mencionados.
 */
export const filtrarLevantamentosPorTexto = (levantamentos: Levantamento[], texto: string): Levantamento[] => {
    return levantamentos.filter(
        (levantamento) =>
            levantamento.municipio.municipioNome.toLowerCase().includes(texto.toLowerCase()) ||
            levantamento.municipio.municipioUF.toLowerCase().includes(texto.toLowerCase()) ||
            `${levantamento.ano}`.toLowerCase().includes(texto.toLowerCase()) ||
            `${levantamento.periodoInicio}`.toLowerCase().includes(texto.toLowerCase()) ||
            `${levantamento.periodoFim}`.toLowerCase().includes(texto.toLowerCase())
    );
};
