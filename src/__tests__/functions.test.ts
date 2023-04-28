import autoTable from "jspdf-autotable";
import {
    calcularBairrosAmostra,
    calcularDadosAmostraEstrato,
    calcularEstimativaImoveisPorQuarteirao,
    calcularIB,
    calcularIIP,
    calcularIntervaloQuarteiroes,
    calcularPercentualCriadouroLevantamento,
    calcularQuantidadeImoveisProgramados,
    calcularQuantidadeQuarteiroesComposicaoAmostra,
    calcularQuarteiraoInicial,
    calcularTipoLevantamentoDadoMunicipio,
    classificarEstratosSegundoIIP,
    filtrarLevantamentosPorTexto,
    formatarDataDDMMYYY,
    formatarDataDiaMes,
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
        expect(IB_4).toEqual(0);
    });

    it("Deve classificar risco estratos segundo IIP Aedes", () => {
        const estratos: EstratoResumo[] = [
            {
                iip: calcularIIP(238, 3),
                numero: 1,
            },
            {
                iip: calcularIIP(200, 27),
                numero: 2,
            },
        ];

        const classificacao = classificarEstratosSegundoIIP(estratos);

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

    it("Deve calcular intervaloQuarteiroes", () => {
        const intervaloQuarteiroes = 4.2;

        const quarteiraoInicial = calcularQuarteiraoInicial(intervaloQuarteiroes);

        expect(quarteiraoInicial).toBeGreaterThanOrEqual(0.5);
        expect(quarteiraoInicial).toBeLessThanOrEqual(quarteiraoInicial);
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
        const levantamento: Levantamento = gerarLevantamentoPadrao();
        const headersEsperados = {
            body: [
                [
                    { content: "Estrato 1", rowSpan: 2 },
                    { content: "Alto da Boa Vista", rowSpan: 1 },
                    { content: 1, rowSpan: 1 },
                    { content: 0, rowSpan: 1 },
                    { content: [], rowSpan: 1, styles: { cellWidth: 125 } },
                ],
                [
                    { content: "Baixo da Boa Vista", rowSpan: 1 },
                    { content: 2, rowSpan: 1 },
                    { content: 0, rowSpan: 1 },
                    { content: [], rowSpan: 1, styles: { cellWidth: 125 } },
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
                    { content: 0, rowSpan: 1 },
                    { content: [], rowSpan: 1, styles: { cellWidth: 125 } },
                ],
                [
                    { content: "Baixo da Boa Vista", rowSpan: 1 },
                    { content: 2, rowSpan: 1 },
                    { content: 0, rowSpan: 1 },
                    { content: [], rowSpan: 1, styles: { cellWidth: 125 } },
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
                                    quarteiroesSorteados: [],
                                },
                                {
                                    bairro: {
                                        nome: "Baixo da Boa Vista",
                                        numero: 2,
                                        quantidadeQuarteiroes: 2,
                                    },
                                    quarteiroesSorteados: [],
                                },
                            ],
                            estimativaImoveisPorQuarteirao: NaN,
                            intervaloQuarteiroes: NaN,
                            percentualQuarteiroes: NaN,
                            quantidadeImoveisProgramados: NaN,
                            quantidadeQuarteiroes: NaN,
                            quarteiraoInicial: NaN,
                        },
                        numero: 1,
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
                totalImoveisProgramados: NaN,
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
                                    quarteiroesSorteados: [],
                                },
                                {
                                    bairro: {
                                        nome: "Baixo da Boa Vista",
                                        numero: 2,
                                        quantidadeQuarteiroes: 2,
                                    },
                                    quarteiroesSorteados: [],
                                },
                            ],
                            estimativaImoveisPorQuarteirao: NaN,
                            intervaloQuarteiroes: NaN,
                            percentualQuarteiroes: NaN,
                            quantidadeImoveisProgramados: NaN,
                            quantidadeQuarteiroes: NaN,
                            quarteiraoInicial: NaN,
                        },
                        numero: 1,
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
                totalImoveisProgramados: NaN,
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

    it("Deve executar extrairLinhaLevantamentoResumo em LevantamentoResumo", () => {
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();

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
            "1",
            "undefined",
            "undefined",
            "undefined",
            "undefined",
            "undefined",
            "undefined",
        ]);
    });

    it("Deve executar gerarRelatorioExecucao em LevantamentoResumo", () => {
        const levantamentoResumo: LevantamentoResumo = gerarLevantamentoResumoPadrao();
        const headersEsperados = {
            body: [
                [
                    "1",
                    "NaN",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "NaN",
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
                    "NaN",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "NaN",
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
                    "NaN",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "NaN",
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
                    "NaN",
                    "210",
                    "55",
                    "45",
                    "5",
                    "15",
                    "NaN",
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
