/* tslint:disable:max-classes-per-file */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    addFooters,
    addHeaders,
    calcularIB,
    calcularIIP,
    calcularPercentualCriadouroLevantamento,
    calcularTipoLevantamentoDadoMunicipio,
    classificarEstratosSegundoIIP,
    round,
} from "./functions";

export interface EstratoResumo {
    numero: number;
    iip: number;
}

export interface ClassificacaoEstratoIIP {
    ordem: number;
    quantidade: number;
    percentual: number;
    risco: string;
}

export interface Criadouro {
    sigla: string;
    descricao?: string;
}

export interface CriadouroLevantamento {
    criadouro: Criadouro;
    quantidade: number;
    percentual?: number;
}

export interface Bairro {
    numero: number;
    nome: string;
    quantidadeQuarteiroes: number;
}

export interface BairroAmostra {
    bairro: Bairro;
    quarteiroesSorteados: number[];
}

export interface DadosAmostraEstrato {
    quantidadeImoveisProgramados: number;
    estimativaImoveisPorQuarteirao: number;
    quantidadeQuarteiroes: number;
    percentualQuarteiroes: number;
    intervaloQuarteiroes: number;
    quarteiraoInicial: number;
    bairros: BairroAmostra[];
}

export class ExecucaoAedes {
    quantidadeTerrenoBaldio: number;
    outrosImoveis: number;
    criadourosLevantamento: CriadouroLevantamento[];

    deserialize(json: any): ExecucaoAedes {
        this.quantidadeTerrenoBaldio = json.quantidadeTerrenoBaldio;
        this.outrosImoveis = json.outrosImoveis;
        this.criadourosLevantamento = json.criadourosLevantamento.map((c: any) => ({
            criadouro: c.criadouro,
            quantidade: c.quantidade,
            percentual: c.percentual,
        }));
        return this;
    }

    calcularTotalImoveis() {
        return this.quantidadeTerrenoBaldio + this.outrosImoveis;
    }

    calcularTotalRecipientes(): number {
        return this.criadourosLevantamento.reduce((quantidadeAcumulada, c) => quantidadeAcumulada + c.quantidade, 0);
    }

    extrairQuantidade(sigla: string): number {
        return (
            this.criadourosLevantamento.find((c) => c.criadouro.sigla.toLocaleLowerCase() === sigla.toLocaleLowerCase())
                ?.quantidade ?? 0
        );
    }
}

export class Execucao {
    estrato: Estrato;
    imoveisInspecionados: number;
    execucaoAedesAegypti: ExecucaoAedes;
    execucaoAedesAlbopictus: ExecucaoAedes;

    deserialize(json: any): Execucao {
        const criadouros = [
            { criadouro: { sigla: "A1" }, quantidade: json.criadouroA1Aegypti },
            { criadouro: { sigla: "A2" }, quantidade: json.criadouroA2Aegypti },
            { criadouro: { sigla: "B" }, quantidade: json.criadouroBAegypti },
            { criadouro: { sigla: "C" }, quantidade: json.criadouroCAegypti },
            { criadouro: { sigla: "D1" }, quantidade: json.criadouroD1Aegypti },
            { criadouro: { sigla: "D2" }, quantidade: json.criadouroD2Aegypti },
            { criadouro: { sigla: "E" }, quantidade: json.criadouroEAegypti },
        ];
        const criadourosComPercentual = calcularPercentualCriadouroLevantamento(criadouros);
        this.estrato = new Estrato().deserialize(json.estrato);
        this.imoveisInspecionados = json.imoveisInspecionados;
        this.execucaoAedesAegypti = new ExecucaoAedes().deserialize({
            criadourosLevantamento: criadourosComPercentual,
            quantidadeTerrenoBaldio: json.quantidadeTerrenoBaldioAegypti,
            outrosImoveis: json.outrosImoveisAegypti,
        });
        this.execucaoAedesAlbopictus = new ExecucaoAedes().deserialize({
            criadourosLevantamento: [
                { criadouro: { sigla: "TODOS" }, quantidade: json.criadouroAlbopictus, percentual: 100 },
            ],
            quantidadeTerrenoBaldio: json.quantidadeTerrenoBaldioAlbopictus,
            outrosImoveis: json.outrosImoveisAlbopictus,
        });

        return this;
    }

    calcularIIP() {
        return calcularIIP(this.imoveisInspecionados, this.execucaoAedesAegypti.calcularTotalImoveis());
    }
}

export class Estrato {
    numero: number;
    quantidadeImoveis: number;
    bairros: Bairro[];
    dadosAmostra?: DadosAmostraEstrato;

    extrairQuantidadeQuarteiroes() {
        return this.bairros.reduce(
            (quantidadeAcumulada, bairro) => quantidadeAcumulada + bairro.quantidadeQuarteiroes,
            0
        );
    }

    deserialize(json: any): Estrato {
        this.numero = json.numero;
        this.quantidadeImoveis = json.quantidadeImoveis;
        this.bairros = json.bairros;
        this.dadosAmostra = json.dadosAmostra;

        return this;
    }

    definirDadosAmostra(dadosAmostra: DadosAmostraEstrato) {
        this.dadosAmostra = dadosAmostra;
    }
}

export interface Municipio {
    municipioUF: string;
    municipioNome: string;
    municipioIBGE: number;
    quantidadeImoveis: number;
}

export class Levantamento {
    id: string;
    municipio: Municipio;
    ano: number;
    periodoInicio: string;
    periodoFim: string;
    quantidadeImoveisProgramados: number;
    estratos: Estrato[];
    execucoes?: Execucao[];
    levantamentoResumo?: LevantamentoResumo;

    deserialize(levantamento: any): Levantamento {
        this.id = levantamento.id;
        this.municipio = levantamento.municipio;
        this.ano = levantamento.ano;
        this.periodoInicio = levantamento.periodoInicio;
        this.periodoFim = levantamento.periodoFim;
        this.quantidadeImoveisProgramados = levantamento.quantidadeImoveisProgramados;
        this.estratos = levantamento.estratos.map((e: any) =>
            new Estrato().deserialize({
                numero: e.numero,
                quantidadeImoveis: e.quantidadeImoveis,
                dadosAmostra: e.dadosAmostra,
                bairros: e.bairros,
            } as Estrato)
        );
        this.levantamentoResumo = levantamento.levantamentoResumo;
        return this;
    }

    gerarRelatorioSorteioAmostra(nomeRelatorio: string) {
        const doc = new jsPDF({
            orientation: "landscape",
        });
        const titulo = "Sorteio Quarteirões";
        const headers = ["Estrato", "Bairro", "N° de quarteirões", "Quarteirões a trabalhar", "Quarteirões Sorteados"];
        const linhas: any[] = [];
        this.estratos.forEach((estrato) => {
            let linha: any[] = [];
            const estratoAmostra = estrato.dadosAmostra;
            if (estratoAmostra) {
                linha.push({ content: `Estrato ${estrato.numero}`, rowSpan: estrato.bairros.length });
                estratoAmostra.bairros.forEach((bairro) => {
                    linha.push({ content: bairro.bairro.nome, rowSpan: 1 });
                    linha.push({ content: bairro.bairro.quantidadeQuarteiroes, rowSpan: 1 });
                    linha.push({ content: bairro.quarteiroesSorteados.length, rowSpan: 1 });
                    linha.push({ content: bairro.quarteiroesSorteados, rowSpan: 1, styles: { cellWidth: 125 } });
                    linhas.push(linha);
                    linha = [];
                });
            }
        });
        autoTable(doc, {
            head: [headers],
            body: linhas,
            startY: 20,
            theme: "grid",
            headStyles: { lineWidth: 1, halign: "center" },
            bodyStyles: { halign: "center" },
        });
        addHeaders(doc, titulo, this);
        addFooters(doc);
        doc.save(nomeRelatorio);
        return {
            titulo,
            headers,
            linhas,
        };
    }
}

export interface TipoLevantamento {
    nome: string;
}

export interface Cidade {
    i: number;
    n: string;
}

export interface Estado {
    s: string;
    n: string;
    c: Cidade[];
}

export class RelatorioIndice {
    estratoNumero: string;
    totalImoveisProgramados: number;
    totalImoveisInspecionados: number;
    totalTBInspecionadosAegypti: number;
    totalOutrosInspecionadosAegypti: number;
    totalTBInspecionadosAlbopictus: number;
    totalOutrosInspecionadosAlbopictus: number;
    percentualPerda: number;
    iipAegypti: number;
    iipAlbopictus: number;
    ibAegypti: number;
    ibAlbopictus: number;
    totalRecipientesAlbopictus: number;
    totalRecipientesAegypti: number;
    tiposRecipientesAegypti: { [key: string]: { quantidade: number; percentual: number } };

    deserialize(json: any): RelatorioIndice {
        this.estratoNumero = json.estratoNumero;
        this.totalImoveisProgramados = json.totalImoveisProgramados;
        this.totalImoveisInspecionados = json.totalImoveisInspecionados;
        this.totalTBInspecionadosAegypti = json.totalTBInspecionadosAegypti;
        this.totalOutrosInspecionadosAegypti = json.totalOutrosInspecionadosAegypti;
        this.totalTBInspecionadosAlbopictus = json.totalTBInspecionadosAlbopictus;
        this.totalOutrosInspecionadosAlbopictus = json.totalOutrosInspecionadosAlbopictus;
        this.percentualPerda = json.percentualPerda;
        this.iipAegypti = json.iipAegypti;
        this.iipAlbopictus = json.iipAlbopictus;
        this.ibAegypti = json.ibAegypti;
        this.ibAlbopictus = json.ibAlbopictus;
        this.totalRecipientesAegypti = json.totalRecipientesAegypti;
        this.totalRecipientesAlbopictus = json.totalRecipientesAlbopictus;
        this.tiposRecipientesAegypti = json.tiposRecipientesAegypti;
        return this;
    }

    calcularTotalImoveisInspecionadosAegypti(): number {
        return this.totalTBInspecionadosAegypti + this.totalOutrosInspecionadosAegypti;
    }

    calcularTotalImoveisInspecionadosAlbopictus(): number {
        return this.totalTBInspecionadosAlbopictus + this.totalOutrosInspecionadosAlbopictus;
    }

    calcularPercentualPerda() {
        return round(
            ((this.totalImoveisProgramados - this.totalImoveisInspecionados) / this.totalImoveisProgramados) * 100,
            1
        );
    }

    atualizarTipoRecipiente(c: CriadouroLevantamento) {
        if (this.tiposRecipientesAegypti[c.criadouro.sigla.toLowerCase()]) {
            this.tiposRecipientesAegypti[c.criadouro.sigla.toLowerCase()].quantidade += c.quantidade ?? 0;
        }
    }
}

export class LevantamentoResumo {
    iipAegypti: number;
    ibAegypti: number;
    iipAlbopictus: number;
    ibAlbopictus: number;
    classificacoesEstratoIipAegypti: ClassificacaoEstratoIIP[];
    criadourosAegypti: CriadouroLevantamento[];
    relatorioIndice: RelatorioIndice;

    constructor(public levantamento: Levantamento) {}

    serialize(): any {
        const classificacoes: any = this.classificacoesEstratoIipAegypti.map((c) => ({
            quantidade: c.quantidade,
            percentual: c.percentual,
            risco: c.risco,
        }));
        const criadouros: any = this.criadourosAegypti.map((c) => ({
            quantidade: c.quantidade,
            criadouro: {
                sigla: c.criadouro.sigla.toUpperCase(),
            },
        }));
        /* eslint-disable @typescript-eslint/naming-convention */
        return {
            municipio_uf: this.levantamento.municipio.municipioUF,
            municipio_nome: this.levantamento.municipio.municipioNome,
            municipio_ibge: this.levantamento.municipio.municipioIBGE,
            periodo_inicio: this.levantamento.periodoInicio,
            periodo_fim: this.levantamento.periodoFim,
            tipo: calcularTipoLevantamentoDadoMunicipio(this.levantamento.municipio).nome,
            dados: {
                iip_aegypti: this.iipAegypti,
                ib_aegypti: this.ibAegypti,
                iip_albopictus: this.iipAlbopictus,
                ib_albopictus: this.ibAlbopictus,
                classificacoes_estrato_iip_aegypti: classificacoes,
                criadouros_aegypti: criadouros,
            },
        };
        /* eslint-enable */
    }

    gerarLevantamentoResumoTodasExecucoes(execucoes: Execucao[]): LevantamentoResumo {
        const relatorioIndice = new RelatorioIndice().deserialize({
            estratoNumero: "Geral",
            totalImoveisProgramados: 0,
            totalImoveisInspecionados: 0,
            totalTBInspecionadosAegypti: 0,
            totalOutrosInspecionadosAegypti: 0,
            totalTBInspecionadosAlbopictus: 0,
            totalOutrosInspecionadosAlbopictus: 0,
            percentualPerda: 0,
            iipAegypti: 0,
            iipAlbopictus: 0,
            ibAegypti: 0,
            ibAlbopictus: 0,
            totalRecipientesAegypti: 0,
            totalRecipientesAlbopictus: 0,
            tiposRecipientesAegypti: {
                a1: { quantidade: 0 },
                a2: { quantidade: 0 },
                b: { quantidade: 0 },
                c: { quantidade: 0 },
                d1: { quantidade: 0 },
                d2: { quantidade: 0 },
                e: { quantidade: 0 },
            },
        });

        execucoes.forEach((e: Execucao) => {
            relatorioIndice.totalImoveisProgramados += e.estrato.dadosAmostra ? e.estrato.dadosAmostra.quantidadeImoveisProgramados : 0;
            relatorioIndice.totalImoveisInspecionados += e.imoveisInspecionados;
            relatorioIndice.totalTBInspecionadosAegypti += e.execucaoAedesAegypti.quantidadeTerrenoBaldio;
            relatorioIndice.totalOutrosInspecionadosAegypti += e.execucaoAedesAegypti.outrosImoveis;
            relatorioIndice.totalTBInspecionadosAlbopictus += e.execucaoAedesAlbopictus.quantidadeTerrenoBaldio;
            relatorioIndice.totalOutrosInspecionadosAlbopictus += e.execucaoAedesAlbopictus.outrosImoveis;
            relatorioIndice.totalRecipientesAegypti += e.execucaoAedesAegypti.calcularTotalRecipientes();
            relatorioIndice.totalRecipientesAlbopictus += e.execucaoAedesAlbopictus.calcularTotalRecipientes();
            e.execucaoAedesAegypti.criadourosLevantamento.forEach((c) => {
                relatorioIndice.atualizarTipoRecipiente(c);
            });
        });

        this.iipAegypti = calcularIIP(
            relatorioIndice.totalImoveisInspecionados,
            relatorioIndice.calcularTotalImoveisInspecionadosAegypti()
        );
        this.ibAegypti = calcularIB(relatorioIndice.totalImoveisInspecionados, relatorioIndice.totalRecipientesAegypti);
        this.iipAlbopictus = calcularIIP(
            relatorioIndice.totalImoveisInspecionados,
            relatorioIndice.calcularTotalImoveisInspecionadosAlbopictus()
        );
        this.ibAlbopictus = calcularIB(
            relatorioIndice.totalImoveisInspecionados,
            relatorioIndice.totalRecipientesAlbopictus
        );
        this.classificacoesEstratoIipAegypti = classificarEstratosSegundoIIP(
            execucoes.map((e) => ({ iip: e.calcularIIP(), numero: e.estrato.numero }))
        );
        const criadourosAedesAegypti: CriadouroLevantamento[] = Object.keys(
            relatorioIndice.tiposRecipientesAegypti
        ).map((t) => ({
            criadouro: { sigla: t },
            quantidade: relatorioIndice.tiposRecipientesAegypti[t].quantidade,
        }));
        this.criadourosAegypti = calcularPercentualCriadouroLevantamento(criadourosAedesAegypti);
        this.relatorioIndice = relatorioIndice;
        return this;
    }

    gerarLevantamentoResumoUnicaExecucao(e: Execucao): LevantamentoResumo {
        const relatorioIndice = new RelatorioIndice().deserialize({
            estratoNumero: e.estrato.numero,
            totalImoveisProgramados: e.estrato.dadosAmostra ? e.estrato.dadosAmostra.quantidadeImoveisProgramados : 0,
            totalImoveisInspecionados: e.imoveisInspecionados,
            totalTBInspecionadosAegypti: e.execucaoAedesAegypti.quantidadeTerrenoBaldio,
            totalOutrosInspecionadosAegypti: e.execucaoAedesAegypti.outrosImoveis,
            totalTBInspecionadosAlbopictus: e.execucaoAedesAlbopictus.quantidadeTerrenoBaldio,
            totalOutrosInspecionadosAlbopictus: e.execucaoAedesAlbopictus.outrosImoveis,
            percentualPerda: 0,
            iipAegypti: 0,
            iipAlbopictus: 0,
            ibAegypti: 0,
            ibAlbopictus: 0,
            totalRecipientesAegypti: 0,
            totalRecipientesAlbopictus: 0,
            tiposRecipientesAegypti: {
                a1: { quantidade: 0 },
                a2: { quantidade: 0 },
                b: { quantidade: 0 },
                c: { quantidade: 0 },
                d1: { quantidade: 0 },
                d2: { quantidade: 0 },
                e: { quantidade: 0 },
            },
        });
        const resumo = new LevantamentoResumo(this.levantamento);
        e.execucaoAedesAegypti.criadourosLevantamento.forEach((c) => {
            relatorioIndice.tiposRecipientesAegypti[c.criadouro.sigla.toLowerCase()].quantidade += c.quantidade;
        });
        resumo.iipAegypti = calcularIIP(e.imoveisInspecionados, e.execucaoAedesAegypti.calcularTotalImoveis());
        resumo.ibAegypti = calcularIB(e.imoveisInspecionados, e.execucaoAedesAegypti.calcularTotalRecipientes());
        resumo.iipAlbopictus = calcularIIP(e.imoveisInspecionados, e.execucaoAedesAlbopictus.calcularTotalImoveis());
        resumo.ibAlbopictus = calcularIB(e.imoveisInspecionados, e.execucaoAedesAlbopictus.calcularTotalRecipientes());
        resumo.classificacoesEstratoIipAegypti = classificarEstratosSegundoIIP([
            {
                iip: e.calcularIIP(),
                numero: e.estrato.numero,
            },
        ]);
        const criadourosAedesAegypti: CriadouroLevantamento[] = Object.keys(
            relatorioIndice.tiposRecipientesAegypti
        ).map((t) => ({
            criadouro: { sigla: t.toUpperCase() },
            quantidade: relatorioIndice.tiposRecipientesAegypti[t].quantidade,
        }));
        resumo.criadourosAegypti = calcularPercentualCriadouroLevantamento(criadourosAedesAegypti);
        resumo.relatorioIndice = relatorioIndice;
        return resumo;
    }

    extrairLinhaLevantamentoResumo(): any {
        return [
            `${this.relatorioIndice.estratoNumero}`,
            `${this.relatorioIndice.totalImoveisProgramados}`,
            `${this.relatorioIndice.totalImoveisInspecionados}`,
            `${this.relatorioIndice.totalTBInspecionadosAegypti}`,
            `${this.relatorioIndice.totalOutrosInspecionadosAegypti}`,
            `${this.relatorioIndice.totalTBInspecionadosAlbopictus}`,
            `${this.relatorioIndice.totalOutrosInspecionadosAlbopictus}`,
            `${this.relatorioIndice.calcularPercentualPerda()}`,
            `${this.iipAegypti}`,
            `${this.iipAlbopictus}`,
            `${this.ibAegypti}`,
            `${this.ibAlbopictus}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "a1")?.percentual}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "a2")?.percentual}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "b")?.percentual}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "c")?.percentual}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "d1")?.percentual}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "d2")?.percentual}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "e")?.percentual}`,
        ];
    }

    gerarRelatorioExecucao(execucoes: Execucao[], nomeRelatorio: string) {
        const headerPaginas = "Índices por Estrato";
        const headers = [
            [
                { content: "", rowSpan: 2 },
                { content: "Imóveis", colSpan: 7 },
                { content: "Indicadores", colSpan: 11 },
            ],
            [
                { content: "", colSpan: 2 },
                { content: "Ae. aeg (%)", colSpan: 2 },
                { content: "Ae. alb (%)", colSpan: 2 },
                { content: "", colSpan: 1 },
                { content: "IIP (%)", colSpan: 2 },
                { content: "IB (%)", colSpan: 2 },
                { content: "ITR (Ae.aegypti[%])", colSpan: 7 },
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
        ];
        const resumosParaRelatorio = execucoes.map((e) =>
            new LevantamentoResumo(this.levantamento).gerarLevantamentoResumoUnicaExecucao(e)
        );
        const levantamentoResumoGeral = new LevantamentoResumo(this.levantamento).gerarLevantamentoResumoTodasExecucoes(
            execucoes
        );
        const doc = new jsPDF({
            orientation: "landscape",
        });
        const rows = resumosParaRelatorio.map((r) => r.extrairLinhaLevantamentoResumo());
        rows.push(levantamentoResumoGeral.extrairLinhaLevantamentoResumo());
        autoTable(doc, {
            head: headers,
            body: rows,
            startY: 20,
            theme: "grid",
            headStyles: { lineWidth: 1, halign: "center" },
            bodyStyles: { halign: "center" },
        });
        addHeaders(doc, headerPaginas, this.levantamento);
        addFooters(doc);
        doc.save(nomeRelatorio);
        return { headerPaginas, headers, rows };
    }

    extrairPercentualCriadouroAegyptiPorNome(nomeCriadouro: string) {
        const criadouro: CriadouroLevantamento | undefined = this.criadourosAegypti.find(
            (c) => c.criadouro.sigla.toLocaleLowerCase() === nomeCriadouro.toLocaleLowerCase()
        );
        if (criadouro) {
            return `${criadouro.quantidade} / ${criadouro.percentual}%`;
        }
        return "0 / 0%";
    }

    formatarClassificacaoPorNomeRisco(nomeRisco: string) {
        const classificacao: ClassificacaoEstratoIIP | undefined = this.classificacoesEstratoIipAegypti.find(
            (c) => c.risco.toLocaleLowerCase() === nomeRisco.toLocaleLowerCase()
        );
        if (classificacao) {
            return `${classificacao.quantidade} / ${classificacao.percentual}%`;
        }
        return "0 / 0%";
    }
}
