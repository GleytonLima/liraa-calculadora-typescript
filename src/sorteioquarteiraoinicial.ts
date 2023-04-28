/**
 * Calcula o número do quarteirão inicial para uma execução do levantamento.
 * @param intervaloQuarteiroes Intervalo de quarteirões da área de atuação do levantamento.
 * @returns Número do quarteirão inicial.
 */
export const calcularQuarteiraoInicial = (intervaloQuarteiroes: number) =>
    Math.floor(Math.random() * (intervaloQuarteiroes - 0.5 + 1)) + 0.5;
