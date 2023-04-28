import { calcularDadosAmostraEstrato } from "../functions";
import {
    Estrato,
    DadosAmostraEstrato,
    Levantamento,
    CriadouroLevantamento,
    ClassificacaoEstratoIIP,
    LevantamentoResumo,
    ExecucaoAedes,
    Execucao,
    RelatorioIndice,
} from "../models";

export const gerarDadosEstratoAmostraPadrao = (estrato: Estrato): DadosAmostraEstrato =>
    calcularDadosAmostraEstrato(estrato);

export const gerarLevantamentoPadrao = (): Levantamento => {
    const levantamento: Levantamento = new Levantamento();
    levantamento.id = "1";
    levantamento.ano = 2022;
    levantamento.estratos = [gerarEstratoPadrao()];
    levantamento.municipio = {
        municipioIBGE: 3550308,
        municipioNome: "Manaus",
        municipioUF: "AM",
        quantidadeImoveis: 9000,
    };
    return levantamento;
};

export const gerarCriadourosAedesAegyptiPadrao = (): CriadouroLevantamento[] => [
    {
        criadouro: { sigla: "A1", descricao: "" },
        percentual: 1,
        quantidade: 22,
    },
    {
        criadouro: { sigla: "A2", descricao: "" },
        percentual: undefined,
        quantidade: 24,
    },
    {
        criadouro: { sigla: "B", descricao: "" },
        quantidade: 26,
    },
    {
        criadouro: { sigla: "C", descricao: "" },
        percentual: undefined,
        quantidade: 28,
    },
    {
        criadouro: { sigla: "D1", descricao: "" },
        percentual: undefined,
        quantidade: 30,
    },
    {
        criadouro: { sigla: "D2", descricao: "" },
        percentual: undefined,
        quantidade: 32,
    },
    {
        criadouro: { sigla: "E", descricao: "" },
        percentual: undefined,
        quantidade: 34,
    },
];

export const gerarCriadourosAedesAegyptiQuantidadeZeradas = (): CriadouroLevantamento[] => [
    {
        criadouro: { sigla: "A1", descricao: "" },
        percentual: 1,
        quantidade: 0,
    },
];

export const gerarEstratoPadrao = (): Estrato => {
    const estrato: Estrato = new Estrato();
    estrato.numero = 1;
    estrato.quantidadeImoveis = 9000;
    estrato.bairros = [
        {
            nome: "Alto da Boa Vista",
            quantidadeQuarteiroes: 1,
            numero: 1,
        },
        {
            nome: "Baixo da Boa Vista",
            quantidadeQuarteiroes: 2,
            numero: 2,
        },
    ];
    estrato.dadosAmostra = gerarDadosEstratoAmostraPadrao(estrato);
    return estrato;
};

export const gerarClassificacoesEstratoIipAedesAegyptiPadrao = (): ClassificacaoEstratoIIP[] => [
    { ordem: 1, risco: "Baixo", percentual: 0, quantidade: 0 },
    { ordem: 2, risco: "Médio", percentual: 50, quantidade: 1 },
    { ordem: 3, risco: "Alto", percentual: 100, quantidade: 2 },
];

export const gerarLevantamentoResumoPadrao = (): LevantamentoResumo => {
    const levantamento = gerarLevantamentoPadrao();
    const levantamentoResumo: LevantamentoResumo = new LevantamentoResumo(levantamento);
    levantamentoResumo.relatorioIndice = gerarRelatorioIndicePadrao();
    levantamentoResumo.criadourosAegypti = gerarCriadourosAedesAegyptiPadrao();
    levantamentoResumo.classificacoesEstratoIipAegypti = gerarClassificacoesEstratoIipAedesAegyptiPadrao();
    return levantamentoResumo;
};

export const gerarExecucaoAedesPadrao = (): ExecucaoAedes =>
    new ExecucaoAedes().deserialize({
        quantidadeTerrenoBaldio: 1,
        outrosImoveis: 2,
        criadourosLevantamento: [
            {
                criadouro: { sigla: "A1", descricao: "" },
                quantidade: 5,
                percentual: undefined,
            },
            {
                criadouro: { sigla: "A2", descricao: "" },
                quantidade: 10,
                percentual: undefined,
            },
            {
                criadouro: { sigla: "B", descricao: "" },
                quantidade: 15,
                percentual: undefined,
            },
            {
                criadouro: { sigla: "C", descricao: "" },
                quantidade: 20,
                percentual: undefined,
            },
            {
                criadouro: { sigla: "D1", descricao: "" },
                quantidade: 20,
                percentual: undefined,
            },
            {
                criadouro: { sigla: "D2", descricao: "" },
                quantidade: 30,
                percentual: undefined,
            },
            {
                criadouro: { sigla: "E", descricao: "" },
                quantidade: 0,
                percentual: undefined,
            },
        ],
    });

export const gerarExecucaoPadrao = (): Execucao =>
    new Execucao().deserialize({
        criadouroA1Aegypti: 5,
        criadouroA2Aegypti: 10,
        criadouroBAegypti: 15,
        criadouroCAegypti: 20,
        criadouroD1Aegypti: 20,
        criadouroD2Aegypti: 30,
        criadouroEAegypti: 0,
        estrato: gerarEstratoPadrao(),
        imoveisInspecionados: 210,
        quantidadeTerrenoBaldioAegypti: 55,
        outrosImoveisAegypti: 45,
        quantidadeTerrenoBaldioAlbopictus: 5,
        outrosImoveisAlbopictus: 15,
        criadouroAlbopictus: 20,
    });
export const gerarCriadouroLevantamentoPadrao = (): CriadouroLevantamento => {
    return {
        criadouro: { sigla: "A1", descricao: "" },
        percentual: 1,
        quantidade: 5,
    };
};
export const gerarRelatorioIndicePadrao = (): RelatorioIndice =>
    new RelatorioIndice().deserialize({
        estratoNumero: 1,
        totalImoveisProgramados: 100,
        totalImoveisInspecionados: 75,
        totalTBInspecionadosAegypti: 55,
        totalOutrosInspecionadosAegypti: 45,
        totalTBInspecionadosAlbopictus: 5,
        totalOutrosInspecionadosAlbopictus: 15,
        percentualPerda: 0.5,
        iipAegypti: 1,
        iipAlbopictus: 1,
        ibAegypti: 1,
        ibAlbopictus: 1,
        totalRecipientesAegypti: 1,
        totalRecipientesAlbopictus: 1,
        tiposRecipientesAegypti: { a1: { quantidade: 1, percentual: 1 } },
    });
