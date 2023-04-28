import autoTable from "jspdf-autotable";
import {
    addFooters,
    addHeaders,
    calcularBairrosAmostra,
    calcularDadosAmostraEstrato,
    calcularEstimativaImoveisPorQuarteirao,
    calcularIB,
    calcularIIP,
    calcularIntervaloQuarteiroes,
    calcularPercentualCriadouroLevantamento,
    calcularQuantidadeImoveisProgramados,
    calcularQuantidadeQuarteiroesComposicaoAmostra,
    calcularTipoLevantamentoDadoMunicipio,
    classificarEstratosSegundoIIP,
    filtrarLevantamentosPorTexto,
    formatarDataDDMMYYY,
    formatarDataDiaMes,
    customRound,
} from "../functions";
import {
    Bairro,
    CriadouroLevantamento,
    Estrato,
    EstratoResumo,
    Execucao,
    ExecucaoAedes,
    Levantamento,
    LevantamentoResumo,
    Municipio,
    RelatorioIndice,
} from "../models";
import {
    gerarCriadouroLevantamentoPadrao,
    gerarCriadourosAedesAegyptiPadrao,
    gerarCriadourosAedesAegyptiQuantidadeZeradas,
    gerarEstratoPadrao,
    gerarExecucaoAedesPadrao,
    gerarExecucaoPadrao,
    gerarLevantamentoPadrao,
    gerarLevantamentoResumoPadrao,
    gerarRelatorioIndicePadrao,
} from "./objectmother";
import jsPDF from "jspdf";
import { calcularQuarteiraoInicial } from "../sorteioquarteiraoinicial";

jest.mock("jspdf", () => {
    const originalModule = jest.requireActual("jspdf");
    return {
        __esModule: true,
        ...originalModule,
        default: jest.fn().mockImplementation(() => {
            return {
                save: jest.fn(),
                getNumberOfPages: jest.fn(),
                setFont: jest.fn(),
                setFontSize: jest.fn(),
                setPage: jest.fn(),
                internal: { pageSize: { width: 1 } },
            };
        }),
    };
});
jest.mock("jspdf-autotable");
jest.mock("../sorteioquarteiraoinicial", () => ({
    calcularQuarteiraoInicial: jest.fn(),
}));

describe("levantamento.model.ts", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Deve calcularIIP com sucesso", () => {
        const IIP_1 = calcularIIP(100, 20);
        const IIP_2 = calcularIIP(438, 30);
        const IIP_3 = calcularIIP(438, 38);
        const IIP_4 = calcularIIP(438, 0);

        expect(IIP_1).toEqual(20);
        expect(IIP_2).toEqual(6.8);
        expect(IIP_3).toEqual(8.7);
        expect(IIP_4).toEqual(0);
    });

    it("Deve calcularIB com sucesso", () => {
        const IB_1 = calcularIB(100, 20);
        const IB_2 = calcularIB(438, 196);
        const IB_3 = calcularIB(438, 36);
        const IB_4 = calcularIB(438, 0);

        expect(IB_1).toEqual(20);
        expect(IB_2).toEqual(44.7);
        expect(IB_3).toEqual(8.2);
        expect(IB_4).toEqual(0);
    });

    it("Deve classificar risco estratos segundo IIP Aedes com cálculo de IIP", () => {
        const estratosResumo: EstratoResumo[] = [
            {
                iip: calcularIIP(238, 3),
                numero: 1,
            },
            {
                iip: calcularIIP(200, 27),
                numero: 2,
            },
        ];

        const classificacao = classificarEstratosSegundoIIP(estratosResumo);

        expect(classificacao.length).toEqual(3);
        const classificacaoRiscoBaixo = classificacao.find((c) => c.risco === "Baixo");
        const classificacaoRiscoMedio = classificacao.find((c) => c.risco === "Médio");
        const classificacaoRiscoAlto = classificacao.find((c) => c.risco === "Alto");

        expect(classificacaoRiscoBaixo?.percentual).toEqual(0);
        expect(classificacaoRiscoMedio?.percentual).toEqual(50);
        expect(classificacaoRiscoAlto?.percentual).toEqual(50);
        expect(classificacaoRiscoBaixo?.quantidade).toEqual(0);
        expect(classificacaoRiscoMedio?.quantidade).toEqual(1);
        expect(classificacaoRiscoAlto?.quantidade).toEqual(1);
    });

    it("Deve classificar risco estratos segundo IIP Aedes - LIMITES", () => {
        const estratosResumo: EstratoResumo[] = [
            {
                iip: 0.9,
                numero: 1,
            },
            {
                iip: 0.8,
                numero: 2,
            },
            {
                iip: 1.0,
                numero: 3,
            },
            {
                iip: 1.1,
                numero: 4,
            },
            {
                iip: 3.8,
                numero: 5,
            },
            {
                iip: 3.9,
                numero: 6,
            },
            {
                iip: 4.0,
                numero: 7,
            },
            {
                iip: 4.1,
                numero: 8,
            },
        ];

        const classificacao = classificarEstratosSegundoIIP(estratosResumo);

        expect(classificacao.length).toEqual(3);
        const classificacaoRiscoBaixo = classificacao.find((c) => c.risco === "Baixo");
        const classificacaoRiscoMedio = classificacao.find((c) => c.risco === "Médio");
        const classificacaoRiscoAlto = classificacao.find((c) => c.risco === "Alto");

        expect(classificacaoRiscoBaixo?.percentual).toEqual(25);
        expect(classificacaoRiscoMedio?.percentual).toEqual(50);
        expect(classificacaoRiscoAlto?.percentual).toEqual(25);
        expect(classificacaoRiscoBaixo?.quantidade).toEqual(2);
        expect(classificacaoRiscoMedio?.quantidade).toEqual(4);
        expect(classificacaoRiscoAlto?.quantidade).toEqual(2);
    });

    it("Deve calcular percentual de criadouros", () => {
        const criadouros: CriadouroLevantamento[] = gerarCriadourosAedesAegyptiPadrao();

        const criadourosComPercentual = calcularPercentualCriadouroLevantamento(criadouros);

        const a1 = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "A1");
        const a2 = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "A2");
        const b = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "B");
        const c = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "C");
        const d1 = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "D1");
        const d2 = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "D2");
        const e = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "E");

        expect(criadouros.length).toEqual(7);
        expect(a1?.percentual).toEqual(11.2);
        expect(a2?.percentual).toEqual(12.2);
        expect(b?.percentual).toEqual(13.3);
        expect(c?.percentual).toEqual(14.3);
        expect(d1?.percentual).toEqual(15.3);
        expect(d2?.percentual).toEqual(16.3);
        expect(e?.percentual).toEqual(17.3);
    });

    it("Deve calcular percentual de criadouros zerado dada lista vazia", () => {
        const criadouros: CriadouroLevantamento[] = gerarCriadourosAedesAegyptiQuantidadeZeradas();

        const criadourosComPercentual = calcularPercentualCriadouroLevantamento(criadouros);

        const a1 = criadourosComPercentual.find((cl) => cl.criadouro.sigla === "A1");

        expect(criadouros.length).toEqual(1);
        expect(a1?.percentual).toEqual(0);
    });

    it("Deve calcular tipo levantamento de acordo com a quantidade de imoveis do municipio", () => {
        const municipioLIA1: Municipio = {
            quantidadeImoveis: 1998,
        } as Municipio;
        const municipioLIA2: Municipio = {
            quantidadeImoveis: 1999,
        } as Municipio;
        const municipioLIRAa: Municipio = {
            quantidadeImoveis: 2000,
        } as Municipio;

        const tipoLevantamentoLia1 = calcularTipoLevantamentoDadoMunicipio(municipioLIA1);
        const tipoLevantamentoLia2 = calcularTipoLevantamentoDadoMunicipio(municipioLIA2);
        const tipoLevantamentoLiraa = calcularTipoLevantamentoDadoMunicipio(municipioLIRAa);

        expect(tipoLevantamentoLia1.nome).toEqual("LIA");
        expect(tipoLevantamentoLia2.nome).toEqual("LIA");
        expect(tipoLevantamentoLiraa.nome).toEqual("LIRAa");
    });

    it("Deve calcular quantidade de imoveis a programar (tamanho amostra)", () => {
        const listaQuantidadeImoveis: number[] = [500, 1000, 2000, 8099, 8100, 12000, 15000];
        const listaTamanhoAmostraEsperada: number[] = [167, 200, 222, 243, 426, 434, 437];

        listaQuantidadeImoveis.forEach((q, i) => {
            const tamanhoAmostra = calcularQuantidadeImoveisProgramados(q);

            expect(tamanhoAmostra).toEqual(listaTamanhoAmostraEsperada[i]);
        });
    });

    it("Deve calcular estimativaImoveisPorQuarteirao", () => {
        const listaQtdeQuarteiroes: number[] = [3, 10, 200, 350];
        const listaEstimativaImoveisPorQuarteirao: number[] = [3000, 900, 45, 26];

        listaQtdeQuarteiroes.forEach((q, i) => {
            const tamanhoAmostra = calcularEstimativaImoveisPorQuarteirao(9000, q);

            expect(tamanhoAmostra).toEqual(listaEstimativaImoveisPorQuarteirao[i]);
        });
    });

    it("Deve calcular quantidadeQuarteiroes para estratos com menos de 8100 imóveis", () => {
        const listaQtdeImoveisProgramados: number[] = [243, 238];
        const listaEstimativaQtdeImoveis: number[] = [23, 14];
        const listaEstimativaImoveisPorQuarteirao: number[] = [21, 34];

        listaQtdeImoveisProgramados.forEach((q, i) => {
            const tamanhoAmostra = calcularQuantidadeQuarteiroesComposicaoAmostra(
                8099,
                q,
                listaEstimativaQtdeImoveis[i]
            );

            expect(tamanhoAmostra).toEqual(listaEstimativaImoveisPorQuarteirao[i]);
        });
    });

    it("Deve calcular quantidadeQuarteiroes para estratos com 8100 imóveis", () => {
        const listaQtdeImoveisProgramados: number[] = [429, 429];
        const listaEstimativaQtdeImoveis: number[] = [26, 45];
        const listaEstimativaImoveisPorQuarteirao: number[] = [83, 48];

        listaQtdeImoveisProgramados.forEach((q, i) => {
            const tamanhoAmostra = calcularQuantidadeQuarteiroesComposicaoAmostra(
                8100,
                q,
                listaEstimativaQtdeImoveis[i]
            );

            expect(tamanhoAmostra).toEqual(listaEstimativaImoveisPorQuarteirao[i]);
        });
    });

    it("Deve calcular quantidadeQuarteiroes para estratos com mais de 8101 imóveis", () => {
        const listaQtdeImoveisProgramados: number[] = [429, 429];
        const listaEstimativaQtdeImoveis: number[] = [26, 45];
        const listaEstimativaImoveisPorQuarteirao: number[] = [83, 48];

        listaQtdeImoveisProgramados.forEach((q, i) => {
            const tamanhoAmostra = calcularQuantidadeQuarteiroesComposicaoAmostra(
                8101,
                q,
                listaEstimativaQtdeImoveis[i]
            );

            expect(tamanhoAmostra).toEqual(listaEstimativaImoveisPorQuarteirao[i]);
        });
    });

    it("Deve calcular intervaloQuarteiroes", () => {
        const listaQtdeQuarteiroes: number[] = [83, 21];
        const listaIntervaloQuarteiroes: number[] = [4.21687, 16.66667];

        listaQtdeQuarteiroes.forEach((q, i) => {
            const intervaloQuarteiroes = calcularIntervaloQuarteiroes(350, q);

            expect(intervaloQuarteiroes).toEqual(listaIntervaloQuarteiroes[i]);
        });
    });

    it("Deve calcularBairrosAmostra", () => {
        const bairros: Bairro[][] = [
            [{ numero: 1, nome: "A", quantidadeQuarteiroes: 10 }],
            [{ numero: 1, nome: "A", quantidadeQuarteiroes: 10 }],
            [{ numero: 1, nome: "A", quantidadeQuarteiroes: 300 }],
            [{ numero: 1, nome: "A", quantidadeQuarteiroes: 50 }],
        ];
        const primeirosQuarteiroes = [0.7, 0.7, 0.7, 0.7];
        const intervalosQuarteiroes = [4.2, 4.21687, 4.21687, 4.21687];
        const quarteiroesSorteados = [
            [1, 5, 9],
            [1, 5, 9],
            [
                1, 5, 9, 13, 18, 22, 26, 30, 34, 39, 43, 47, 51, 56, 60, 64, 68, 72, 77, 81, 85, 89, 93, 98, 102, 106,
                110, 115, 119, 123, 127, 131, 136, 140, 144, 148, 153, 157, 161, 165, 169, 174, 178, 182, 186, 190, 195,
                199, 203, 207, 212, 216, 220, 224, 228, 233, 237, 241, 245, 249, 254, 258, 262, 266, 271, 275, 279, 283,
                287, 292, 296,
            ],
            [1, 5, 9, 13, 18, 22, 26, 30, 34, 39, 43, 47],
        ];

        bairros.forEach((b, i) => {
            const bairrosAmostra = calcularBairrosAmostra(b, primeirosQuarteiroes[i], intervalosQuarteiroes[i]);

            expect(bairrosAmostra[0].quarteiroesSorteados.length).toEqual(quarteiroesSorteados[i].length);
            expect(bairrosAmostra[0].quarteiroesSorteados).toEqual(quarteiroesSorteados[i]);
        });
    });

    it("Deve calcularDadosAmostraEstrato", () => {
        const mockCalcularQuarteiraoInicial = calcularQuarteiraoInicial as jest.MockedFunction<
            typeof calcularQuarteiraoInicial
        >;
        mockCalcularQuarteiraoInicial.mockReturnValue(0.5);
        const estrato: Estrato = new Estrato().deserialize({
            bairros: [
                { nome: "A", quantidadeQuarteiroes: 200 },
                { nome: "A", quantidadeQuarteiroes: 150 },
            ],
            numero: 1,
            quantidadeImoveis: 9000,
        });
        const dadosAmostraEstrato = calcularDadosAmostraEstrato(estrato);

        expect(dadosAmostraEstrato).toEqual(
            expect.objectContaining({
                quantidadeImoveisProgramados: 429,
                estimativaImoveisPorQuarteirao: 26,
                quantidadeQuarteiroes: 83,
                percentualQuarteiroes: 23.7,
                intervaloQuarteiroes: 4.21687,
            })
        );
        expect(dadosAmostraEstrato.bairros.length).toEqual(2);
        expect(dadosAmostraEstrato.bairros[0].quarteiroesSorteados.length).toBeGreaterThanOrEqual(2);
        expect(dadosAmostraEstrato.bairros[0].quarteiroesSorteados.length).toBeLessThanOrEqual(48);
    });

    it("Deve  calcular Total Imoveis na ExecucaoAedes", () => {
        const execucaoAedes: ExecucaoAedes = gerarExecucaoAedesPadrao();

        const totalImoveis = execucaoAedes.calcularTotalImoveis();

        expect(totalImoveis).toBe(3);
    });

    it("Deve  calcularTotalRecipientes na ExecucaoAedes", () => {
        const execucaoAedes: ExecucaoAedes = gerarExecucaoAedesPadrao();

        const totalImoveis = execucaoAedes.calcularTotalRecipientes();

        expect(totalImoveis).toBe(100);
    });

    it("Deve  calcularIIP na Execucao", () => {
        const execucaoAedes: Execucao = gerarExecucaoPadrao();

        const iip = execucaoAedes.calcularIIP();

        expect(iip).toBe(47.6);
    });

    it("Deve  definir dados amostra Estrato", () => {
        const estrato: Estrato = gerarEstratoPadrao();
        const estratoAlterado: Estrato = gerarEstratoPadrao();
        estratoAlterado.bairros = [];

        estrato.definirDadosAmostra(calcularDadosAmostraEstrato(estratoAlterado));

        expect(estrato.dadosAmostra?.bairros?.length).toBe(0);
    });

    it("Deve  gerarRelatorioSorteioAmostra em Levantamento", () => {
        const mockCalcularQuarteiraoInicial = calcularQuarteiraoInicial as jest.MockedFunction<
            typeof calcularQuarteiraoInicial
        >;
        mockCalcularQuarteiraoInicial.mockReturnValue(0.5);
        const levantamento: Levantamento = gerarLevantamentoPadrao();
        const headersEsperados = {
            body: [
                [
                    { content: "Estrato 1", rowSpan: 2 },
                    { content: "Alto da Boa Vista", rowSpan: 1 },
                    { content: 1, rowSpan: 1 },
                    { content: 1, rowSpan: 1 },
                    { content: [1], rowSpan: 1, styles: { cellWidth: 125 } },
                ],
                [
                    { content: "Baixo da Boa Vista", rowSpan: 1 },
                    { content: 2, rowSpan: 1 },
                    { content: 1, rowSpan: 1 },
                    { content: [1], rowSpan: 1, styles: { cellWidth: 125 } },
                ],
            ],
            bodyStyles: { halign: "center" },
            head: [["Estrato", "Bairro", "N° de quarteirões", "Quarteirões a trabalhar", "Quarteirões Sorteados"]],
            headStyles: { halign: "center", lineWidth: 1 },
            startY: 20,
            theme: "grid",
        };
        const estratoSemDadosAmostra = gerarEstratoPadrao();
        estratoSemDadosAmostra.dadosAmostra = undefined;
        levantamento.estratos.push(estratoSemDadosAmostra);

        const data = levantamento.gerarRelatorioSorteioAmostra("relatorio-teste.pdf");

        expect(data).toBeTruthy();
        expect(autoTable).toHaveBeenCalledTimes(1);
        expect(autoTable).toHaveBeenCalledWith(expect.anything(), headersEsperados);
        expect(jsPDF).toHaveBeenCalledWith({
            orientation: "landscape",
        });
        expect(data).toEqual({
            titulo: "Sorteio Quarteirões",
            headers: ["Estrato", "Bairro", "N° de quarteirões", "Quarteirões a trabalhar", "Quarteirões Sorteados"],
            linhas: [
                [
                    { content: "Estrato 1", rowSpan: 2 },
                    { content: "Alto da Boa Vista", rowSpan: 1 },
                    { content: 1, rowSpan: 1 },
                    { content: 1, rowSpan: 1 },
                    { content: [1], rowSpan: 1, styles: { cellWidth: 125 } },
                ],
                [
                    { content: "Baixo da Boa Vista", rowSpan: 1 },
                    { content: 2, rowSpan: 1 },
                    { content: 1, rowSpan: 1 },
                    { content: [1], rowSpan: 1, styles: { cellWidth: 125 } },
                ],
            ],
        });
    });

    it("Deve  calcularTotalImoveisInspecionadosAegypti em RelatorioIndice", () => {
        const relatorioIndice: RelatorioIndice = gerarRelatorioIndicePadrao();

        const data = relatorioIndice.calcularTotalImoveisInspecionadosAegypti();

        expect(data).toBe(100);
    });

    it("Deve  calcularTotalImoveisInspecionadosAlbopictus em RelatorioIndice", () => {
        const relatorioIndice: RelatorioIndice = gerarRelatorioIndicePadrao();

        const data = relatorioIndice.calcularTotalImoveisInspecionadosAlbopictus();

        expect(data).toBe(20);
    });

    it("Deve  calcularPercentualPerda em RelatorioIndice", () => {
        const relatorioIndice: RelatorioIndice = gerarRelatorioIndicePadrao();

        const data = relatorioIndice.calcularPercentualPerda();

        expect(data).toBe(25);
    });

    it("Deve executar serialize em LevantamentoResumo", () => {
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();

        const data = levantamentoResumo.serialize();
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(data).toEqual({
            municipio_uf: "AM",
            municipio_nome: "Manaus",
            municipio_ibge: 3550308,
            periodo_inicio: undefined,
            periodo_fim: undefined,
            tipo: "LIRAa",
            dados: {
                iip_aegypti: undefined,
                ib_aegypti: undefined,
                iip_albopictus: undefined,
                ib_albopictus: undefined,
                classificacoes_estrato_iip_aegypti: [
                    { quantidade: 0, percentual: 0, risco: "Baixo" },
                    { quantidade: 1, percentual: 50, risco: "Médio" },
                    { quantidade: 2, percentual: 100, risco: "Alto" },
                ],
                criadouros_aegypti: [
                    { quantidade: 22, criadouro: { sigla: "A1" } },
                    { quantidade: 24, criadouro: { sigla: "A2" } },
                    { quantidade: 26, criadouro: { sigla: "B" } },
                    { quantidade: 28, criadouro: { sigla: "C" } },
                    { quantidade: 30, criadouro: { sigla: "D1" } },
                    { quantidade: 32, criadouro: { sigla: "D2" } },
                    { quantidade: 34, criadouro: { sigla: "E" } },
                ],
            },
        });
        /* eslint-enable */
    });

    it("Deve executar gerarLevantamentoResumoTodasExecucoes em LevantamentoResumo", () => {
        const mockCalcularQuarteiraoInicial = calcularQuarteiraoInicial as jest.MockedFunction<
            typeof calcularQuarteiraoInicial
        >;
        mockCalcularQuarteiraoInicial.mockReturnValue(0.5);
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();

        const data = levantamentoResumo.gerarLevantamentoResumoTodasExecucoes([gerarExecucaoPadrao()]);

        expect(data.levantamento).toBeTruthy();
        expect(data).toEqual({
            classificacoesEstratoIipAegypti: [
                {
                    ordem: 1,
                    percentual: 0,
                    quantidade: 0,
                    risco: "Baixo",
                },
                {
                    ordem: 2,
                    percentual: 0,
                    quantidade: 0,
                    risco: "Médio",
                },
                {
                    ordem: 3,
                    percentual: 100,
                    quantidade: 1,
                    risco: "Alto",
                },
            ],
            criadourosAegypti: [
                {
                    criadouro: {
                        sigla: "a1",
                    },
                    percentual: 5,
                    quantidade: 5,
                },
                {
                    criadouro: {
                        sigla: "a2",
                    },
                    percentual: 10,
                    quantidade: 10,
                },
                {
                    criadouro: {
                        sigla: "b",
                    },
                    percentual: 15,
                    quantidade: 15,
                },
                {
                    criadouro: {
                        sigla: "c",
                    },
                    percentual: 20,
                    quantidade: 20,
                },
                {
                    criadouro: {
                        sigla: "d1",
                    },
                    percentual: 20,
                    quantidade: 20,
                },
                {
                    criadouro: {
                        sigla: "d2",
                    },
                    percentual: 30,
                    quantidade: 30,
                },
                {
                    criadouro: {
                        sigla: "e",
                    },
                    percentual: 0,
                    quantidade: 0,
                },
            ],
            ibAegypti: 47.6,
            ibAlbopictus: 9.5,
            iipAegypti: 47.6,
            iipAlbopictus: 9.5,
            levantamento: {
                ano: 2022,
                estratos: [
                    {
                        bairros: [
                            {
                                nome: "Alto da Boa Vista",
                                numero: 1,
                                quantidadeQuarteiroes: 1,
                            },
                            {
                                nome: "Baixo da Boa Vista",
                                numero: 2,
                                quantidadeQuarteiroes: 2,
                            },
                        ],
                        dadosAmostra: {
                            bairros: [
                                {
                                    bairro: {
                                        nome: "Alto da Boa Vista",
                                        numero: 1,
                                        quantidadeQuarteiroes: 1,
                                    },
                                    quarteiroesSorteados: [1],
                                },
                                {
                                    bairro: {
                                        nome: "Baixo da Boa Vista",
                                        numero: 2,
                                        quantidadeQuarteiroes: 2,
                                    },
                                    quarteiroesSorteados: [1],
                                },
                            ],
                            estimativaImoveisPorQuarteirao: 3000,
                            intervaloQuarteiroes: 3,
                            percentualQuarteiroes: 33.3,
                            quantidadeImoveisProgramados: 429,
                            quantidadeQuarteiroes: 1,
                            quarteiraoInicial: 0.5,
                        },
                        numero: 1,
                        quantidadeImoveis: 9000,
                    },
                ],
                id: "1",
                municipio: {
                    municipioIBGE: 3550308,
                    municipioNome: "Manaus",
                    municipioUF: "AM",
                    quantidadeImoveis: 9000,
                },
            },
            relatorioIndice: {
                estratoNumero: "Geral",
                ibAegypti: 0,
                ibAlbopictus: 0,
                iipAegypti: 0,
                iipAlbopictus: 0,
                percentualPerda: 0,
                tiposRecipientesAegypti: {
                    a1: {
                        quantidade: 5,
                    },
                    a2: {
                        quantidade: 10,
                    },
                    b: {
                        quantidade: 15,
                    },
                    c: {
                        quantidade: 20,
                    },
                    d1: {
                        quantidade: 20,
                    },
                    d2: {
                        quantidade: 30,
                    },
                    e: {
                        quantidade: 0,
                    },
                },
                totalImoveisInspecionados: 210,
                totalImoveisProgramados: 429,
                totalOutrosInspecionadosAegypti: 45,
                totalOutrosInspecionadosAlbopictus: 15,
                totalRecipientesAegypti: 100,
                totalRecipientesAlbopictus: 20,
                totalTBInspecionadosAegypti: 55,
                totalTBInspecionadosAlbopictus: 5,
            },
        });
        expect(data.levantamento.estratos.length).toEqual(1);
    });

    it("Deve desserializar Excecucao com sucesso execucao padrao com ", () => {
        const execucao = gerarExecucaoPadrao();

        expect(execucao.execucaoAedesAlbopictus).toBeTruthy();
        expect(execucao.execucaoAedesAlbopictus).toEqual({
            criadourosLevantamento: [
                {
                    criadouro: {
                        sigla: "TODOS",
                    },
                    percentual: 100,
                    quantidade: 20,
                },
            ],
            outrosImoveis: 15,
            quantidadeTerrenoBaldio: 5,
        });
    });

    it("Deve executar gerarLevantamentoResumoUnicaExecucao em LevantamentoResumo", () => {
        const mockCalcularQuarteiraoInicial = calcularQuarteiraoInicial as jest.MockedFunction<
            typeof calcularQuarteiraoInicial
        >;
        mockCalcularQuarteiraoInicial.mockReturnValue(0.5);
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();

        const data = levantamentoResumo.gerarLevantamentoResumoUnicaExecucao(gerarExecucaoPadrao());

        expect(data.levantamento).toBeTruthy();
        expect(data).toEqual({
            classificacoesEstratoIipAegypti: [
                {
                    ordem: 1,
                    percentual: 0,
                    quantidade: 0,
                    risco: "Baixo",
                },
                {
                    ordem: 2,
                    percentual: 0,
                    quantidade: 0,
                    risco: "Médio",
                },
                {
                    ordem: 3,
                    percentual: 100,
                    quantidade: 1,
                    risco: "Alto",
                },
            ],
            criadourosAegypti: [
                {
                    criadouro: {
                        sigla: "A1",
                    },
                    percentual: 5,
                    quantidade: 5,
                },
                {
                    criadouro: {
                        sigla: "A2",
                    },
                    percentual: 10,
                    quantidade: 10,
                },
                {
                    criadouro: {
                        sigla: "B",
                    },
                    percentual: 15,
                    quantidade: 15,
                },
                {
                    criadouro: {
                        sigla: "C",
                    },
                    percentual: 20,
                    quantidade: 20,
                },
                {
                    criadouro: {
                        sigla: "D1",
                    },
                    percentual: 20,
                    quantidade: 20,
                },
                {
                    criadouro: {
                        sigla: "D2",
                    },
                    percentual: 30,
                    quantidade: 30,
                },
                {
                    criadouro: {
                        sigla: "E",
                    },
                    percentual: 0,
                    quantidade: 0,
                },
            ],
            ibAegypti: 47.6,
            ibAlbopictus: 9.5,
            iipAegypti: 47.6,
            iipAlbopictus: 9.5,
            levantamento: {
                ano: 2022,
                estratos: [
                    {
                        bairros: [
                            {
                                nome: "Alto da Boa Vista",
                                numero: 1,
                                quantidadeQuarteiroes: 1,
                            },
                            {
                                nome: "Baixo da Boa Vista",
                                numero: 2,
                                quantidadeQuarteiroes: 2,
                            },
                        ],
                        dadosAmostra: {
                            bairros: [
                                {
                                    bairro: {
                                        nome: "Alto da Boa Vista",
                                        numero: 1,
                                        quantidadeQuarteiroes: 1,
                                    },
                                    quarteiroesSorteados: [1],
                                },
                                {
                                    bairro: {
                                        nome: "Baixo da Boa Vista",
                                        numero: 2,
                                        quantidadeQuarteiroes: 2,
                                    },
                                    quarteiroesSorteados: [1],
                                },
                            ],
                            estimativaImoveisPorQuarteirao: 3000,
                            intervaloQuarteiroes: 3,
                            percentualQuarteiroes: 33.3,
                            quantidadeImoveisProgramados: 429,
                            quantidadeQuarteiroes: 1,
                            quarteiraoInicial: 0.5,
                        },
                        numero: 1,
                        quantidadeImoveis: 9000,
                    },
                ],
                id: "1",
                municipio: {
                    municipioIBGE: 3550308,
                    municipioNome: "Manaus",
                    municipioUF: "AM",
                    quantidadeImoveis: 9000,
                },
            },
            relatorioIndice: {
                estratoNumero: 1,
                ibAegypti: 0,
                ibAlbopictus: 0,
                iipAegypti: 0,
                iipAlbopictus: 0,
                percentualPerda: 0,
                tiposRecipientesAegypti: {
                    a1: {
                        quantidade: 5,
                    },
                    a2: {
                        quantidade: 10,
                    },
                    b: {
                        quantidade: 15,
                    },
                    c: {
                        quantidade: 20,
                    },
                    d1: {
                        quantidade: 20,
                    },
                    d2: {
                        quantidade: 30,
                    },
                    e: {
                        quantidade: 0,
                    },
                },
                totalImoveisInspecionados: 210,
                totalImoveisProgramados: 429,
                totalOutrosInspecionadosAegypti: 45,
                totalOutrosInspecionadosAlbopictus: 15,
                totalRecipientesAegypti: 0,
                totalRecipientesAlbopictus: 0,
                totalTBInspecionadosAegypti: 55,
                totalTBInspecionadosAlbopictus: 5,
            },
        });
        expect(data.levantamento.estratos.length).toEqual(1);
    });

    it("Deve executar extrairLinhaLevantamentoResumo em LevantamentoResumo com todos depósitos", () => {
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();
        levantamentoResumo.gerarLevantamentoResumoTodasExecucoes([gerarExecucaoPadrao()]);

        const data = levantamentoResumo.extrairLinhaLevantamentoResumo();

        expect(data).toBeTruthy();
        expect(data.length).toEqual(19);
        expect(data).toEqual([
            "Geral",
            "429",
            "210",
            "55",
            "45",
            "5",
            "15",
            "51",
            "47.6",
            "9.5",
            "47.6",
            "9.5",
            "5",
            "10",
            "15",
            "20",
            "20",
            "30",
            "0",
        ]);
    });

    it("Deve executar extrairLinhaLevantamentoResumo em LevantamentoResumo com todos depósitos valores direntes", () => {
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();
        levantamentoResumo.gerarLevantamentoResumoTodasExecucoes([gerarExecucaoPadrao()]);
        (
            levantamentoResumo.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "a1") || {
                percentual: 11,
            }
        ).percentual = 11;
        (
            levantamentoResumo.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "a2") || {
                percentual: 21,
            }
        ).percentual = 21;
        (
            levantamentoResumo.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "b") || {
                percentual: 31,
            }
        ).percentual = 31;
        (
            levantamentoResumo.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "c") || {
                percentual: 41,
            }
        ).percentual = 41;
        (
            levantamentoResumo.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "d1") || {
                percentual: 51,
            }
        ).percentual = 51;
        (
            levantamentoResumo.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "d2") || {
                percentual: 61,
            }
        ).percentual = 61;
        (
            levantamentoResumo.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "e") || {
                percentual: 71,
            }
        ).percentual = 71;
        levantamentoResumo.criadourosAegypti.reverse();

        const data = levantamentoResumo.extrairLinhaLevantamentoResumo();

        expect(data).toBeTruthy();
        expect(data.length).toEqual(19);
        expect(data).toEqual([
            "Geral",
            "429",
            "210",
            "55",
            "45",
            "5",
            "15",
            "51",
            "47.6",
            "9.5",
            "47.6",
            "9.5",
            "11",
            "21",
            "31",
            "41",
            "51",
            "61",
            "71",
        ]);
    });

    it("Deve executar extrairLinhaLevantamentoResumo em LevantamentoResumo sem todos depósitos", () => {
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();
        levantamentoResumo.criadourosAegypti = [];
        const data = levantamentoResumo.extrairLinhaLevantamentoResumo();

        expect(data).toBeTruthy();
        expect(data.length).toEqual(19);
        expect(data).toEqual([
            "1",
            "100",
            "75",
            "55",
            "45",
            "5",
            "15",
            "25",
            "undefined",
            "undefined",
            "undefined",
            "undefined",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
            "0",
        ]);
    });

    it("Deve executar gerarRelatorioExecucao em LevantamentoResumo", () => {
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();
        const headersEsperados = {
            body: [
                [
                    "1",
                    "429",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "51",
                    "47.6",
                    "9.5",
                    "47.6",
                    "9.5",
                    "5",
                    "10",
                    "15",
                    "20",
                    "20",
                    "30",
                    "0",
                ],
                [
                    "Geral",
                    "429",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "51",
                    "47.6",
                    "9.5",
                    "47.6",
                    "9.5",
                    "5",
                    "10",
                    "15",
                    "20",
                    "20",
                    "30",
                    "0",
                ],
            ],
            bodyStyles: {
                halign: "center",
            },
            head: [
                [
                    {
                        content: "",
                        rowSpan: 2,
                    },
                    {
                        colSpan: 7,
                        content: "Imóveis",
                    },
                    {
                        colSpan: 11,
                        content: "Indicadores",
                    },
                ],
                [
                    {
                        colSpan: 2,
                        content: "",
                    },
                    {
                        colSpan: 2,
                        content: "Ae. aeg (%)",
                    },
                    {
                        colSpan: 2,
                        content: "Ae. alb (%)",
                    },
                    {
                        colSpan: 1,
                        content: "",
                    },
                    {
                        colSpan: 2,
                        content: "IIP (%)",
                    },
                    {
                        colSpan: 2,
                        content: "IB (%)",
                    },
                    {
                        colSpan: 7,
                        content: "ITR (Ae.aegypti[%])",
                    },
                ],
                [
                    "Estrato",
                    "Prog.",
                    "Insp.",
                    "TB",
                    "Outros",
                    "TB",
                    "Outros",
                    "% de perda",
                    "aeg",
                    "alb",
                    "aeg",
                    "alb",
                    "A1",
                    "A2",
                    "B",
                    "C",
                    "D1",
                    "D2",
                    "E",
                ],
            ],
            headStyles: {
                halign: "center",
                lineWidth: 1,
            },
            startY: 20,
            theme: "grid",
        };

        const data = levantamentoResumo.gerarRelatorioExecucao([gerarExecucaoPadrao()], "LIRAa");

        expect(data).toBeTruthy();
        expect(autoTable).toHaveBeenCalledTimes(1);
        expect(autoTable).toHaveBeenCalledWith(expect.anything(), headersEsperados);
        expect(jsPDF).toHaveBeenCalledWith({
            orientation: "landscape",
        });
        expect(data).toEqual({
            headerPaginas: "Índices por Estrato",
            headers: [
                [
                    {
                        content: "",
                        rowSpan: 2,
                    },
                    {
                        colSpan: 7,
                        content: "Imóveis",
                    },
                    {
                        colSpan: 11,
                        content: "Indicadores",
                    },
                ],
                [
                    {
                        colSpan: 2,
                        content: "",
                    },
                    {
                        colSpan: 2,
                        content: "Ae. aeg (%)",
                    },
                    {
                        colSpan: 2,
                        content: "Ae. alb (%)",
                    },
                    {
                        colSpan: 1,
                        content: "",
                    },
                    {
                        colSpan: 2,
                        content: "IIP (%)",
                    },
                    {
                        colSpan: 2,
                        content: "IB (%)",
                    },
                    {
                        colSpan: 7,
                        content: "ITR (Ae.aegypti[%])",
                    },
                ],
                [
                    "Estrato",
                    "Prog.",
                    "Insp.",
                    "TB",
                    "Outros",
                    "TB",
                    "Outros",
                    "% de perda",
                    "aeg",
                    "alb",
                    "aeg",
                    "alb",
                    "A1",
                    "A2",
                    "B",
                    "C",
                    "D1",
                    "D2",
                    "E",
                ],
            ],
            rows: [
                [
                    "1",
                    "429",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "51",
                    "47.6",
                    "9.5",
                    "47.6",
                    "9.5",
                    "5",
                    "10",
                    "15",
                    "20",
                    "20",
                    "30",
                    "0",
                ],
                [
                    "Geral",
                    "429",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "51",
                    "47.6",
                    "9.5",
                    "47.6",
                    "9.5",
                    "5",
                    "10",
                    "15",
                    "20",
                    "20",
                    "30",
                    "0",
                ],
            ],
        });
    });

    it("Deve executar formatarDataDiaMes", () => {
        const dataA: string | null = formatarDataDiaMes(null);
        const dataB: string | null = formatarDataDiaMes("2022-12-31");

        expect(dataA).toBeNull();
        expect(dataB).toBe("31/12");
    });

    it("Deve executar formatarDataDDMMYYY", () => {
        const dataA: string = formatarDataDDMMYYY(null);
        const dataB: string = formatarDataDDMMYYY("2022-12-31");

        expect(dataA).toBe("");
        expect(dataB).toBe("31/12/2022");
    });

    it("Deve executar filtrarLevantamentosPorTexto", () => {
        const dataA: Levantamento[] = filtrarLevantamentosPorTexto([] as Levantamento[], "");
        const dataB: Levantamento[] = filtrarLevantamentosPorTexto([] as Levantamento[], "teste");
        const dataC: Levantamento[] = filtrarLevantamentosPorTexto([gerarLevantamentoPadrao()], "teste");
        const dataD: Levantamento[] = filtrarLevantamentosPorTexto([gerarLevantamentoPadrao()], "Manaus");

        expect(dataA).toEqual([]);
        expect(dataB).toEqual([]);
        expect(dataC).toEqual([]);
        expect(dataD.length).toEqual(1);
    });

    it("Deve executar extrairPercentualCriadouroAegyptiPorNome com valor zerado", () => {
        const levantamentoResumo = gerarLevantamentoResumoPadrao();

        const percentual = levantamentoResumo.extrairPercentualCriadouroAegyptiPorNome("NAO_EXISTE");

        expect(percentual).toBe("0 / 0%");
    });

    it("Deve executar extrairPercentualCriadouroAegyptiPorNome com valor presente", () => {
        const levantamentoResumo = gerarLevantamentoResumoPadrao();

        const percentual = levantamentoResumo.extrairPercentualCriadouroAegyptiPorNome("A1");

        expect(percentual).toBe("22 / 1%");
    });

    it("Deve executar formatarClassificacaoPorNomeRisco zerado", () => {
        const levantamentoResumo = gerarLevantamentoResumoPadrao();

        const percentual = levantamentoResumo.formatarClassificacaoPorNomeRisco("NAO_EXISTE");

        expect(percentual).toBe("0 / 0%");
    });

    it("Deve executar formatarClassificacaoPorNomeRisco BAIXO", () => {
        const levantamentoResumo = gerarLevantamentoResumoPadrao();

        const percentual = levantamentoResumo.formatarClassificacaoPorNomeRisco("BAIXO");

        expect(percentual).toBe("0 / 0%");
    });

    it("Deve executar formatarClassificacaoPorNomeRisco MEDIO", () => {
        const levantamentoResumo = gerarLevantamentoResumoPadrao();

        const percentual = levantamentoResumo.formatarClassificacaoPorNomeRisco("MÉDIO");

        expect(percentual).toBe("1 / 50%");
    });

    it("Deve executar formatarClassificacaoPorNomeRisco ALTO", () => {
        const levantamentoResumo = gerarLevantamentoResumoPadrao();

        const percentual = levantamentoResumo.formatarClassificacaoPorNomeRisco("ALTO");

        expect(percentual).toBe("2 / 100%");
    });

    it("Deve executar atualizarTipoRecipiente em RelatorioIndice", () => {
        const levantamentoResumo = gerarRelatorioIndicePadrao();
        const criadouro = gerarCriadouroLevantamentoPadrao();
        criadouro.quantidade = 1;

        levantamentoResumo.atualizarTipoRecipiente(criadouro);

        expect(levantamentoResumo.tiposRecipientesAegypti["a1"].quantidade).toBe(2);
    });

    it("Deve executar atualizarTipoRecipiente em RelatorioIndice criadouro inexistente", () => {
        const levantamentoResumo = gerarRelatorioIndicePadrao();
        const criadouro = gerarCriadouroLevantamentoPadrao();
        criadouro.criadouro.sigla = "inexistente";
        criadouro.quantidade = 1;

        levantamentoResumo.atualizarTipoRecipiente(criadouro);

        expect(levantamentoResumo.tiposRecipientesAegypti["a1"].quantidade).toBe(1);
    });

    it("Deve executar atualizarTipoRecipiente em RelatorioIndice criadouro con quantidade inválida", () => {
        const levantamentoResumo = gerarRelatorioIndicePadrao();
        const criadouro = gerarCriadouroLevantamentoPadrao();
        criadouro.criadouro.sigla = "a1";
        criadouro.quantidade = NaN;

        levantamentoResumo.atualizarTipoRecipiente(criadouro);

        expect(levantamentoResumo.tiposRecipientesAegypti["a1"].quantidade).toBe(NaN);
    });

    it("Deve executar extrairQuantidade em ExecucaoAedes criadouro inexistente", () => {
        const execucaoAedes = gerarExecucaoAedesPadrao();

        const quantidade = execucaoAedes.extrairQuantidade("inexistente");

        expect(quantidade).toBe(0);
    });

    it("Deve executar extrairQuantidade em ExecucaoAedes A1", () => {
        const execucaoAedes = gerarExecucaoAedesPadrao();

        const quantidade = execucaoAedes.extrairQuantidade("a1");

        expect(quantidade).toBe(5);
    });

    it("Deve desserializar Levantamento", () => {
        const levantamento = new Levantamento().deserialize({
            id: "exemplo-levantamento",
            municipio: {
                municipioUF: "SP",
                municipioNome: "São Paulo",
                municipioIBGE: 3550308,
                quantidadeImoveis: 10000,
            },
            ano: 2023,
            periodoInicio: "2023-01-01",
            periodoFim: "2023-01-31",
            quantidadeImoveisProgramados: 5000,
            estratos: [
                {
                    numero: 1,
                    quantidadeImoveis: 2500,
                    bairros: [
                        {
                            numero: 1,
                            nome: "Bairro Exemplo",
                            quantidadeQuarteiroes: 100,
                        },
                    ],
                    dadosAmostra: {
                        quantidadeImoveisProgramados: 1000,
                        estimativaImoveisPorQuarteirao: 10,
                        quantidadeQuarteiroes: 100,
                        percentualQuarteiroes: 10,
                        intervaloQuarteiroes: 5,
                        quarteiraoInicial: 1,
                        bairros: [
                            {
                                bairro: {
                                    numero: 1,
                                    nome: "Bairro Exemplo",
                                    quantidadeQuarteiroes: 100,
                                },
                                quarteiroesSorteados: [1, 6, 11, 16, 21],
                            },
                        ],
                    },
                },
            ],
            execucoes: [
                {
                    estrato: {
                        numero: 1,
                        quantidadeImoveis: 2500,
                        bairros: [
                            {
                                numero: 1,
                                nome: "Bairro Exemplo",
                                quantidadeQuarteiroes: 100,
                            },
                        ],
                    },
                    imoveisInspecionados: 900,
                    execucaoAedesAegypti: {
                        quantidadeTerrenoBaldio: 50,
                        outrosImoveis: 150,
                        criadourosLevantamento: [
                            {
                                criadouro: {
                                    sigla: "A",
                                    descricao: "Criadouro A",
                                },
                                quantidade: 100,
                                percentual: 40,
                            },
                            {
                                criadouro: {
                                    sigla: "B",
                                    descricao: "Criadouro B",
                                },
                                quantidade: 150,
                                percentual: 60,
                            },
                        ],
                    },
                    execucaoAedesAlbopictus: {
                        quantidadeTerrenoBaldio: 30,
                        outrosImoveis: 70,
                        criadourosLevantamento: [
                            {
                                criadouro: {
                                    sigla: "A",
                                    descricao: "Criadouro A",
                                },
                                quantidade: 50,
                                percentual: 25,
                            },
                            {
                                criadouro: {
                                    sigla: "B",
                                    descricao: "Criadouro B",
                                },
                                quantidade: 150,
                                percentual: 75,
                            },
                        ],
                    },
                },
            ],
            levantamentoResumo: {
                iipAegypti: 1.2,
                ibAegypti: 0.6,
                iipAlbopictus: 1.1,
                ibAlbopictus: 0.5,
                classificacoesEstratoIipAegypti: [
                    {
                        ordem: 1,
                        quantidade: 2,
                        percentual: 50,
                        risco: "Baixo",
                    },
                    {
                        ordem: 2,
                        quantidade: 1,
                        percentual: 25,
                        risco: "Médio",
                    },
                    {
                        ordem: 3,
                        quantidade: 1,
                        percentual: 25,
                        risco: "Alto",
                    },
                ],
                criadourosAegypti: [
                    {
                        criadouro: {
                            sigla: "A",
                            descricao: "Criadouro A",
                        },
                        quantidade: 100,
                        percentual: 40,
                    },
                    {
                        criadouro: {
                            sigla: "B",
                            descricao: "Criadouro B",
                        },
                        quantidade: 150,
                        percentual: 60,
                    },
                ],
                relatorioIndice: {
                    estratoNumero: "1",
                    totalImoveisProgramados: 1000,
                    totalImoveisInspecionados: 900,
                    totalTBInspecionadosAegypti: 50,
                    totalOutrosInspecionadosAegypti: 150,
                    totalTBInspecionadosAlbopictus: 30,
                    totalOutrosInspecionadosAlbopictus: 70,
                    percentualPerda: 10,
                    iipAegypti: 1.2,
                    iipAlbopictus: 1.1,
                    ibAegypti: 0.6,
                    ibAlbopictus: 0.5,
                    totalRecipientesAlbopictus: 200,
                    totalRecipientesAegypti: 250,
                    tiposRecipientesAegypti: {
                        A: {
                            quantidade: 100,
                            percentual: 40,
                        },
                        B: {
                            quantidade: 150,
                            percentual: 60,
                        },
                    },
                },
            },
        });
        expect(levantamento).toBeTruthy();
        expect(levantamento.estratos).toEqual([
            {
                bairros: [
                    {
                        nome: "Bairro Exemplo",
                        numero: 1,
                        quantidadeQuarteiroes: 100,
                    },
                ],
                dadosAmostra: {
                    bairros: [
                        {
                            bairro: {
                                nome: "Bairro Exemplo",
                                numero: 1,
                                quantidadeQuarteiroes: 100,
                            },
                            quarteiroesSorteados: [1, 6, 11, 16, 21],
                        },
                    ],
                    estimativaImoveisPorQuarteirao: 10,
                    intervaloQuarteiroes: 5,
                    percentualQuarteiroes: 10,
                    quantidadeImoveisProgramados: 1000,
                    quantidadeQuarteiroes: 100,
                    quarteiraoInicial: 1,
                },
                numero: 1,
                quantidadeImoveis: 2500,
            },
        ]);
    });
});

describe("customRound()", () => {
    it("deve arredondar um valor positivo para o inteiro mais próximo", () => {
        expect(customRound(3.6, 0)).toBe(4);
    });

    it("deve arredondar um valor negativo para o inteiro mais próximo", () => {
        expect(customRound(-3.6, 0)).toBe(-4);
    });

    it("deve arredondar um valor positivo para um número específico de casas decimais", () => {
        expect(customRound(3.14159, 3)).toBe(3.142);
    });

    it("deve arredondar um valor negativo para um número específico de casas decimais", () => {
        expect(customRound(-3.14159, 3)).toBe(-3.142);
    });

    it("deve retornar zero se o valor de entrada for zero", () => {
        expect(customRound(0, 2)).toBe(0);
    });
});

describe("addHeaders()", () => {
    it("deve adicionar headers em todas as paginas do documento", () => {
        const doc = {
            getNumberOfPages: () => 3,
            setPage: jest.fn(),
            text: jest.fn(),
            setFont: jest.fn(),
            setFontSize: jest.fn(),
        };
        const levantamento = {
            municipio: {
                municipioNome: "São Paulo",
                municipioUF: "SP",
            },
            periodoInicio: "2022-01-01",
            periodoFim: "2022-01-31",
        } as Levantamento;
        addHeaders(doc, "Relatório", levantamento);
        expect(doc.setPage).toHaveBeenCalledTimes(3);
        expect(doc.text).toHaveBeenCalledWith("Liraa App", 15, 12);
        expect(doc.text).toHaveBeenCalledWith("Relatório", 125, 12);
        expect(doc.text).toHaveBeenCalledWith("São Paulo/SP", 200, 12);
        expect(doc.text).toHaveBeenCalledWith("01/01/2022 a 31/01/2022", 235, 12);
        expect(doc.setFont).toHaveBeenCalledWith("helvetica");
        expect(doc.setFontSize).toHaveBeenCalledWith(12);
    });
});

describe("addFooters()", () => {
    it("deve adicionar footers em todas as páginas do documento", () => {
        const doc = {
            getNumberOfPages: () => 3,
            setPage: jest.fn(),
            text: jest.fn(),
            setFont: jest.fn(),
            setFontSize: jest.fn(),
            internal: {
                pageSize: {
                    width: 210, // A4 width
                    height: 297, // A4 height
                },
            },
        } as any;
        addFooters(doc);
        expect(doc.setPage).toHaveBeenCalledTimes(3);
        expect(doc.text).toHaveBeenCalledWith("Página 1 de 3", 105, 287, {
            align: "center",
        });
        expect(doc.text).toHaveBeenCalledWith("Página 2 de 3", 105, 287, {
            align: "center",
        });
        expect(doc.text).toHaveBeenCalledWith("Página 3 de 3", 105, 287, {
            align: "center",
        });
        expect(doc.setFont).toHaveBeenCalledWith("helvetica");
        expect(doc.setFontSize).toHaveBeenCalledWith(8);
    });
});

describe("filtrarLevantamentosPorTexto()", () => {
    const levantamentos: any[] = [
        {
            municipio: {
                municipioNome: "São Paulo",
                municipioUF: "SP",
            },
            ano: 2022,
            periodoInicio: "2022-01-01",
            periodoFim: "2022-01-31",
        },
        {
            municipio: {
                municipioNome: "Campinas",
                municipioUF: "SP",
            },
            ano: 2022,
            periodoInicio: "2022-02-01",
            periodoFim: "2022-02-28",
        },
        {
            municipio: {
                municipioNome: "Belo Horizonte",
                municipioUF: "MG",
            },
            ano: 2021,
            periodoInicio: "2021-01-01",
            periodoFim: "2021-12-31",
        },
        {
            municipio: {
                municipioNome: "Belo Horizonte",
                municipioUF: "MG",
            },
            ano: 2023,
            periodoInicio: "2021-01-01",
            periodoFim: "2021-12-31",
        },
    ];

    it("deve retornar todos os levantamentos se nenhum texto for fornecido", () => {
        expect(filtrarLevantamentosPorTexto(levantamentos, "")).toEqual(levantamentos);
    });

    it("deve retornar levantamentos filtrados por nome do município", () => {
        expect(filtrarLevantamentosPorTexto(levantamentos, "são paulo")).toEqual([levantamentos[0]]);
    });

    it("deve retornar levantamentos filtrados por UF do município", () => {
        expect(filtrarLevantamentosPorTexto(levantamentos, "sp")).toEqual([levantamentos[0], levantamentos[1]]);
    });

    it("deve retornar levantamentos filtrados por ano", () => {
        expect(filtrarLevantamentosPorTexto(levantamentos, "2023")).toEqual([levantamentos[3]]);
    });

    it("deve retornar levantamentos filtrados por data de início do período", () => {
        expect(filtrarLevantamentosPorTexto(levantamentos, "2022-01-01")).toEqual([levantamentos[0]]);
    });

    it("deve retornar levantamentos filtrados por data de fim do período", () => {
        expect(filtrarLevantamentosPorTexto(levantamentos, "2022-02-28")).toEqual([levantamentos[1]]);
    });

    it("deve retornar um array vazio se nenhum levantamento corresponder ao texto de filtro", () => {
        expect(filtrarLevantamentosPorTexto(levantamentos, "texto inexistente")).toEqual([]);
    });
});

describe("calcularBairrosAmostra()", () => {
    const bairros: any[] = [
        {
            nome: "Bairro A",
            quantidadeQuarteiroes: 10,
        },
        {
            nome: "Bairro B",
            quantidadeQuarteiroes: 15,
        },
        {
            nome: "Bairro C",
            quantidadeQuarteiroes: 20,
        },
    ];

    it("deve retornar um array vazio quando nenhum bairro é fornecido", () => {
        expect(calcularBairrosAmostra([], 1, 1)).toEqual([]);
    });

    it("deve retornar a amostra correta de quarteirões para um único bairro", () => {
        expect(calcularBairrosAmostra([bairros[0]], 1, 2)).toEqual([
            {
                bairro: bairros[0],
                quarteiroesSorteados: [1, 3, 5, 7, 9],
            },
        ]);
    });

    it("deve retornar a amostra correta de quarteirões para vários bairros", () => {
        expect(calcularBairrosAmostra(bairros, 0, 5)).toEqual([
            {
                bairro: bairros[0],
                quarteiroesSorteados: [0, 5],
            },
            {
                bairro: bairros[1],
                quarteiroesSorteados: [0, 5, 10],
            },
            {
                bairro: bairros[2],
                quarteiroesSorteados: [0, 5, 10, 15],
            },
        ]);
    });

    it("deve arredondar corretamente os números de quarteirão", () => {
        expect(calcularBairrosAmostra([bairros[0]], 1.4, 1.2)).toEqual([
            {
                bairro: bairros[0],
                quarteiroesSorteados: [1, 3, 4, 5, 6, 7, 9, 10],
            },
        ]);
    });
});

describe("Estrato", () => {
    describe("extrairTotalImoveisProgramados", () => {
        it("deve retornar 0 quando dadosAmostra estiver indefinido", () => {
            const estrato = new Estrato();
            const resultado = estrato.extrairTotalImoveisProgramados();
            expect(resultado).toBe(0);
        });

        it("deve retornar 0 quando quantidadeImoveisProgramados estiver indefinido", () => {
            const estrato = new Estrato();
            estrato.dadosAmostra = {} as any;
            const resultado = estrato.extrairTotalImoveisProgramados();
            expect(resultado).toBe(0);
        });

        it("deve retornar a quantidade de imóveis programados corretamente", () => {
            const estrato = new Estrato();
            estrato.dadosAmostra = { quantidadeImoveisProgramados: 5 } as any;
            const resultado = estrato.extrairTotalImoveisProgramados();
            expect(resultado).toBe(5);
        });
    });
});
