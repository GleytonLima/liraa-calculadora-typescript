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
    customRound,
} from "./functions";

/**
 * Interface que representa um resumo do estrato.
 * @interface
 */
export interface EstratoResumo {
    /** Número do estrato */
    numero: number;
    /** Índice de infestação predial do estrato */
    iip: number;
}

/**
 * Interface que representa a classificação de um estrato baseado no IIP.
 * @interface
 */
export interface ClassificacaoEstratoIIP {
    /** Ordem da classificação */
    ordem: number;
    /** Quantidade de estratos */
    quantidade: number;
    /** Percentual de estratos nesta classificação */
    percentual: number;
    /** Risco de infestação do estrato */
    risco: string;
}

/**
 * Interface que representa um criadouro.
 * @interface
 */
export interface Criadouro {
    /**
     * Sigla do criadouro.
     * Deve ser uma string com um dos seguintes valores:
     * 'a1', 'a2', 'b', 'c', 'd1', 'd2', 'e'.
     */
    sigla: string;
    /** Descrição do criadouro (opcional) */
    descricao?: string;
}

/**
 * Interface que representa um levantamento de criadouros.
 * @interface
 */
export interface CriadouroLevantamento {
    /** Criadouro registrado no levantamento */
    criadouro: Criadouro;
    /** Quantidade de criadouros encontrados */
    quantidade: number;
    /** Percentual de criadouros encontrados (opcional) */
    percentual?: number;
}

/**
 * Interface que representa um bairro.
 * @interface
 */
export interface Bairro {
    /** Número do bairro */
    numero: number;
    /** Nome do bairro */
    nome: string;
    /** Quantidade de quarteirões no bairro */
    quantidadeQuarteiroes: number;
}

/**
 * Interface que representa um bairro amostra.
 * @interface
 */
export interface BairroAmostra {
    /** Bairro da amostra */
    bairro: Bairro;
    /** Lista com os números dos quarteirões sorteados para a amostra */
    quarteiroesSorteados: number[];
}

/**
 * Interface que representa os dados de uma amostra estratificada.
 * @interface
 */
export interface DadosAmostraEstrato {
    /** Quantidade de imóveis programados para a amostra */
    quantidadeImoveisProgramados: number;
    /** Estimativa de imóveis por quarteirão */
    estimativaImoveisPorQuarteirao: number;
    /** Quantidade de quarteirões na amostra */
    quantidadeQuarteiroes: number;
    /** Percentual de quarteirões na amostra */
    percentualQuarteiroes: number;
    /** Intervalo de seleção de quarteirões */
    intervaloQuarteiroes: number;
    /** Número do primeiro quarteirão selecionado */
    quarteiraoInicial: number;
    /** Lista com os bairros amostra da amostra estratificada */
    bairros: BairroAmostra[];
}

/**
 * Classe que representa a execução do LIRAa para o Aedes.
 * @class
 */
export class ExecucaoAedes {
    /** Quantidade de terrenos baldios */
    quantidadeTerrenoBaldio: number;
    /** Quantidade de outros imóveis */
    outrosImoveis: number;
    /** Lista de criadouros registrados no levantamento */
    criadourosLevantamento: CriadouroLevantamento[];

    /**
     * Método que atualiza os atributos da classe com base em um objeto JSON.
     * @param {any} json - Objeto JSON com os valores a serem atualizados.
     * @returns {ExecucaoAedes} - A própria instância da classe.
     */
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

    /**
     * Método que calcula o total de imóveis para a execução do LIRAa.
     * @returns {number} - Total de imóveis.
     */
    calcularTotalImoveis(): number {
        return this.quantidadeTerrenoBaldio + this.outrosImoveis;
    }

    /**
     * Método que calcula o total de recipientes para a execução do LIRAa.
     * @returns {number} - Total de recipientes.
     */
    calcularTotalRecipientes(): number {
        return this.criadourosLevantamento.reduce((quantidadeAcumulada, c) => quantidadeAcumulada + c.quantidade, 0);
    }

    /**
     * Método que extrai a quantidade de criadouros de um determinado tipo de um levantamento.
     * @param {string} sigla - Sigla do criadouro a ser pesquisado.
     * @returns {number} - Quantidade de criadouros encontrados.
     */
    extrairQuantidade(sigla: string): number {
        return (
            this.criadourosLevantamento.find((c) => c.criadouro.sigla.toLocaleLowerCase() === sigla.toLocaleLowerCase())
                ?.quantidade ?? 0
        );
    }
}

/**
 * Classe que representa a execução do LIRAa.
 * @class
 */
export class Execucao {
    /** Estrato da execução */
    estrato: Estrato;
    /** Quantidade de imóveis inspecionados */
    imoveisInspecionados: number;
    /** Dados da execução para o Aedes aegypti */
    execucaoAedesAegypti: ExecucaoAedes;
    /** Dados da execução para o Aedes albopictus */
    execucaoAedesAlbopictus: ExecucaoAedes;

    /**
     * Método que atualiza os atributos da classe com base em um objeto JSON.
     * @param {any} json - Objeto JSON com os valores a serem atualizados.
     * @returns {Execucao} - A própria instância da classe.
     */
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

    /**
     * Método que calcula o Índice de Infestação Predial (IIP) da execução do LIRAa.
     * @returns {number} - Índice de Infestação Predial (IIP).
     */
    calcularIIP() {
        return calcularIIP(this.imoveisInspecionados, this.execucaoAedesAegypti.calcularTotalImoveis());
    }
}

/**
 * Classe que representa um estrato do LIRAa.
 * @class
 */
export class Estrato {
    /** Número do estrato */
    numero: number;
    /** Quantidade total de imóveis no estrato */
    quantidadeImoveis: number;
    /** Lista de bairros do estrato */
    bairros: Bairro[];
    /** Dados da amostra do estrato */
    dadosAmostra?: DadosAmostraEstrato;

    /**
     * Método que extrai a quantidade total de imóveis programados para o estrato.
     * @returns {number} - Quantidade total de imóveis programados.
     */
    extrairTotalImoveisProgramados(): number {
        if (!this.dadosAmostra) {
            return 0;
        }
        return this.dadosAmostra.quantidadeImoveisProgramados || 0;
    }

    /**
     * Método que extrai a quantidade total de quarteirões do estrato.
     * @returns {number} - Quantidade total de quarteirões.
     */
    extrairQuantidadeQuarteiroes(): number {
        return this.bairros.reduce(
            (quantidadeAcumulada, bairro) => quantidadeAcumulada + bairro.quantidadeQuarteiroes,
            0
        );
    }

    /**
     * Método que atualiza os atributos da classe com base em um objeto JSON.
     * @param {any} json - Objeto JSON com os valores a serem atualizados.
     * @returns {Estrato} - A própria instância da classe.
     */
    deserialize(json: any): Estrato {
        this.numero = json.numero;
        this.quantidadeImoveis = json.quantidadeImoveis;
        this.bairros = json.bairros;
        this.dadosAmostra = json.dadosAmostra;

        return this;
    }

    /**
     * Método que define os dados da amostra do estrato.
     * @param {DadosAmostraEstrato} dadosAmostra - Dados da amostra a serem definidos.
     */
    definirDadosAmostra(dadosAmostra: DadosAmostraEstrato): void {
        this.dadosAmostra = dadosAmostra;
    }
}

/**
 * Interface que representa um município.
 * @interface
 */
export interface Municipio {
    /** UF do município */
    municipioUF: string;
    /** Nome do município */
    municipioNome: string;
    /** Código IBGE do município */
    municipioIBGE: number;
    /** Quantidade total de imóveis no município */
    quantidadeImoveis: number;
}

/**
 * Classe que representa um levantamento do LIRAa.
 * @class
 */
export class Levantamento {
    /** Identificador do levantamento
     * @type {string}
     */
    id: string;
    /** Município do levantamento */
    municipio: Municipio;
    /** Ano do levantamento */
    ano: number;
    /** Data de início do período de levantamento
     * @type {string}
     */
    periodoInicio: string;
    /** Data de fim do período de levantamento
     * @type {string}
     */
    periodoFim: string;
    /** Quantidade total de imóveis programados para o levantamento
     * @type {number}
     */
    quantidadeImoveisProgramados: number;
    /** Lista de estratos do levantamento
     * @type {Estrato}
     */
    estratos: Estrato[];
    /** Lista de execuções do levantamento */
    execucoes?: Execucao[];
    /** Resumo do levantamento */
    levantamentoResumo?: LevantamentoResumo;

    /**
     * Método que atualiza os atributos da classe com base em um objeto JSON.
     * @param {any} levantamento - Objeto JSON com os valores a serem atualizados.
     * @returns {Levantamento} - A própria instância da classe.
     */
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

    /**
     * Método que gera o relatório de sorteio de amostra do levantamento.
     * @param {string} nomeRelatorio - Nome do arquivo do relatório.
     * @returns {object} - Objeto com informações sobre o relatório gerado.
     */
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

/**
 * Tipo de levantamento.
 * @interface
 */
export interface TipoLevantamento {
    /** Nome do tipo de levantamento. */
    nome: string;
}

/**
 * Representação de uma cidade.
 * @interface
 */
export interface Cidade {
    /** Identificador da cidade. */
    i: number;
    /** Nome da cidade. */
    n: string;
}

/**
 * Representação de um estado.
 * @interface
 */
export interface Estado {
    /** Sigla do estado. */
    s: string;
    /** Nome do estado. */
    n: string;
    /** Lista de cidades pertencentes ao estado. */
    c: Cidade[];
}

/**
 * Classe que representa o relatório de índice de infestação do Aedes aegypti e Aedes albopictus.
 * @class
 */
export class RelatorioIndice {
    /**
     * Número do estrato.
     * @type {string}
     */
    estratoNumero: string;
    /**
     * Total de imóveis programados.
     * @type {number}
     */
    totalImoveisProgramados: number;
    /**
     * Total de imóveis inspecionados.
     * @type {number}
     */
    totalImoveisInspecionados: number;
    /**
     * Total de terrenos baldios inspecionados para o Aedes aegypti.
     * @type {number}
     */
    totalTBInspecionadosAegypti: number;
    /**
     * Total de outros imóveis inspecionados para o Aedes aegypti.
     * @type {number}
     */
    totalOutrosInspecionadosAegypti: number;
    /**
     * Total de terrenos baldios inspecionados para o Aedes albopictus.
     * @type {number}
     */
    totalTBInspecionadosAlbopictus: number;
    /**
     * Total de outros imóveis inspecionados para o Aedes albopictus.
     * @type {number}
     */
    totalOutrosInspecionadosAlbopictus: number;
    /**
     * Percentual de perda entre imóveis programados e inspecionados.
     * @type {number}
     */
    percentualPerda: number;
    /**
     * Índice de infestação predial (IIP) do Aedes aegypti.
     * @type {number}
     */
    iipAegypti: number;
    /**
     * Índice de infestação predial (IIP) do Aedes albopictus.
     * @type {number}
     */
    iipAlbopictus: number;
    /**
     * Índice de Breteau (IB) do Aedes aegypti.
     * @type {number}
     */
    ibAegypti: number;
    /**
     * Índice de Breteau (IB) do Aedes albopictus.
     * @type {number}
     */
    ibAlbopictus: number;
    /**
     * Total de recipientes inspecionados para o Aedes aegypti.
     * @type {number}
     */
    totalRecipientesAlbopictus: number;
    /**
     * Total de recipientes inspecionados para o Aedes albopictus.
     * @type {number}
     */
    totalRecipientesAegypti: number;
    /**
     * Tipos de recipientes inspecionados para o Aedes aegypti, com suas quantidades e percentuais.
     * @type {{[key: string]: {quantidade: number, percentual: number}}}
     */
    tiposRecipientesAegypti: { [key: string]: { quantidade: number; percentual: number } };

    /**
     * Desserializa um objeto JSON em um objeto `RelatorioIndice`.
     *
     * @param json - O objeto JSON a ser desserializado.
     * @returns O objeto `RelatorioIndice` desserializado.
     */
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

    /**
     * Calcula o número total de imóveis inspecionados que contêm mosquitos Aedes aegypti.
     *
     * @returns O número total de imóveis inspecionados que contêm mosquitos Aedes aegypti.
     */
    calcularTotalImoveisInspecionadosAegypti(): number {
        return this.totalTBInspecionadosAegypti + this.totalOutrosInspecionadosAegypti;
    }

    /**
     * Calcula o número total de imóveis inspecionados que contêm mosquitos Aedes albopictus.
     *
     * @returns O número total de imóveis inspecionados que contêm mosquitos Aedes albopictus.
     */
    calcularTotalImoveisInspecionadosAlbopictus(): number {
        return this.totalTBInspecionadosAlbopictus + this.totalOutrosInspecionadosAlbopictus;
    }

    /**
     * Calcula a porcentagem de imóveis que não foram inspecionados.
     *
     * @returns A porcentagem de imóveis que não foram inspecionados, arredondada para uma casa decimal.
     */
    calcularPercentualPerda() {
        return customRound(
            ((this.totalImoveisProgramados - this.totalImoveisInspecionados) / this.totalImoveisProgramados) * 100,
            1
        );
    }

    /**
     * Atualiza a propriedade `tiposRecipientesAegypti` com informações sobre a quantidade de um tipo específico de criadouro encontrada durante as inspeções.
     *
     * @param criadouroLevantamento - O objeto `CriadouroLevantamento` contendo as informações a serem atualizadas.
     */
    atualizarTipoRecipiente(criadouroLevantamento: CriadouroLevantamento) {
        const criadouroAtual = this.tiposRecipientesAegypti[criadouroLevantamento.criadouro.sigla.toLowerCase()];
        if (criadouroAtual) {
            criadouroAtual.quantidade += criadouroLevantamento.quantidade;
        }
    }
}

/**
 * Representa um resumo de levantamento de índice de infestação por Aedes Aegypti e Aedes Albopictus,
 * com informações de classificações por estrato e criadouros encontrados durante o levantamento.
 * @class
 */
export class LevantamentoResumo {
    /**
     * Índice de infestação predial do Aedes Aegypti
     * @type {number}
     */
    iipAegypti: number;
    /**
     * Índice Breteau do Aedes Aegypti
     * @type {number}
     */
    ibAegypti: number;
    /**
     * Índice de infestação predial do Aedes Albopictus
     * @type {number}
     */
    iipAlbopictus: number;
    /**
     * Índice Breteau do Aedes Albopictus
     * @type {number}
     */
    ibAlbopictus: number;
    /**
     * Classificações de estrato do índice de infestação predial do Aedes Aegypti
     * @type {ClassificacaoEstratoIIP[]}
     */
    classificacoesEstratoIipAegypti: ClassificacaoEstratoIIP[];
    /**
     * Criadouros do Aedes Aegypti encontrados durante o levantamento
     * @type {CriadouroLevantamento[]}
     */
    criadourosAegypti: CriadouroLevantamento[];
    /**
     * Relatório do índice de infestação
     * @type {RelatorioIndice}
     */
    relatorioIndice: RelatorioIndice;

    /**
     * Constrói um resumo de levantamento de índice de infestação com base no objeto Levantamento.
     * @param levantamento Objeto Levantamento contendo as informações do levantamento.
     */
    constructor(public levantamento: Levantamento) {}

    /**
     * Serializa o objeto em um formato que pode ser enviado para o servidor.
     * @returns Objeto serializado
     */
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

    /**
     * Gera um resumo de levantamento de índice de infestação a partir de um array de execuções.
     * @param execucoes Array de execuções
     * @returns Resumo de levantamento de índice de infestação
     */
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
            relatorioIndice.totalImoveisProgramados += e.estrato.extrairTotalImoveisProgramados();
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

    /**
     * Gera um resumo de levantamento de índice de infestação a partir de uma única execução.
     * @param execucao Execução a ser considerada no levantamento
     * @returns Resumo de levantamento de índice de infestação
     */
    gerarLevantamentoResumoUnicaExecucao(execucao: Execucao): LevantamentoResumo {
        const relatorioIndice = new RelatorioIndice().deserialize({
            estratoNumero: execucao.estrato.numero,
            totalImoveisProgramados: execucao.estrato.extrairTotalImoveisProgramados(),
            totalImoveisInspecionados: execucao.imoveisInspecionados,
            totalTBInspecionadosAegypti: execucao.execucaoAedesAegypti.quantidadeTerrenoBaldio,
            totalOutrosInspecionadosAegypti: execucao.execucaoAedesAegypti.outrosImoveis,
            totalTBInspecionadosAlbopictus: execucao.execucaoAedesAlbopictus.quantidadeTerrenoBaldio,
            totalOutrosInspecionadosAlbopictus: execucao.execucaoAedesAlbopictus.outrosImoveis,
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
        execucao.execucaoAedesAegypti.criadourosLevantamento.forEach((c) => {
            relatorioIndice.tiposRecipientesAegypti[c.criadouro.sigla.toLowerCase()].quantidade += c.quantidade;
        });
        resumo.iipAegypti = calcularIIP(
            execucao.imoveisInspecionados,
            execucao.execucaoAedesAegypti.calcularTotalImoveis()
        );
        resumo.ibAegypti = calcularIB(
            execucao.imoveisInspecionados,
            execucao.execucaoAedesAegypti.calcularTotalRecipientes()
        );
        resumo.iipAlbopictus = calcularIIP(
            execucao.imoveisInspecionados,
            execucao.execucaoAedesAlbopictus.calcularTotalImoveis()
        );
        resumo.ibAlbopictus = calcularIB(
            execucao.imoveisInspecionados,
            execucao.execucaoAedesAlbopictus.calcularTotalRecipientes()
        );
        resumo.classificacoesEstratoIipAegypti = classificarEstratosSegundoIIP([
            {
                iip: execucao.calcularIIP(),
                numero: execucao.estrato.numero,
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

    /**
     * Extrai uma linha com informações do levantamento resumo em formato de array.
     * @returns Um array de strings com as informações do levantamento resumo.
     */
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
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "a1")?.percentual ?? 0}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "a2")?.percentual ?? 0}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "b")?.percentual ?? 0}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "c")?.percentual ?? 0}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "d1")?.percentual ?? 0}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "d2")?.percentual ?? 0}`,
            `${this.criadourosAegypti.find((c) => c.criadouro.sigla.toLocaleLowerCase() === "e")?.percentual ?? 0}`,
        ];
    }

    /**
     * Gera um relatório de execução para o levantamento, com base nas execuções fornecidas.
     * @param execucoes As execuções a serem consideradas no relatório.
     * @param nomeRelatorio O nome do arquivo PDF do relatório a ser gerado.
     * @returns Um objeto contendo o cabeçalho das páginas, os cabeçalhos das colunas e as linhas de dados do relatório.
     */
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

    /**
     * Extrai o percentual de um criadouro do Aedes aegypti pelo nome.
     * @param nomeCriadouro O nome do criadouro a ser procurado.
     * @returns Uma string contendo o número de criadouros encontrados e o seu percentual em relação ao total.
     */
    extrairPercentualCriadouroAegyptiPorNome(nomeCriadouro: string) {
        const criadouro: CriadouroLevantamento | undefined = this.criadourosAegypti.find(
            (c) => c.criadouro.sigla.toLocaleLowerCase() === nomeCriadouro.toLocaleLowerCase()
        );
        if (criadouro) {
            return `${criadouro.quantidade} / ${criadouro.percentual}%`;
        }
        return "0 / 0%";
    }

    /**
     * Formata a quantidade e percentual de estratos classificados com o nome do risco informado.
     * @param nomeRisco O nome do risco a ser formatado.
     * @returns A string formatada contendo a quantidade e percentual de estratos classificados com o nome do risco informado.
     */
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
