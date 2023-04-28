import { calcularQuarteiraoInicial } from "../sorteioquarteiraoinicial";

describe("sorteioquarteiraoinicial.ts", () => {
    it("retorna um número entre 0.5 e o intervaloQuarteiroes", () => {
        const mockMath = Object.create(global.Math);
        mockMath.random = () => 0.9;
        const intervaloQuarteiroes = 10;
        const quarteiraoInicial = calcularQuarteiraoInicial(intervaloQuarteiroes);
        expect(quarteiraoInicial).toBeGreaterThanOrEqual(0.5);
        expect(quarteiraoInicial).toBeLessThanOrEqual(intervaloQuarteiroes + 0.5);
    });

    it("retorna um número dentro do intervalo [0.5, intervaloQuarteiroes]", () => {
        const intervaloQuarteiroes = 5;
        const mockMath = Object.create(global.Math);
        mockMath.random = () => 0.9;
        global.Math = mockMath;

        const quarteiraoInicial = calcularQuarteiraoInicial(intervaloQuarteiroes);

        expect(quarteiraoInicial).toBeGreaterThanOrEqual(0.5);
        expect(quarteiraoInicial).toBeLessThanOrEqual(intervaloQuarteiroes);
    });

    it("retorna um número inteiro ou meio", () => {
        const intervaloQuarteiroes = 5;
        for (let i = 0; i < 100; i++) {
            const quarteiraoInicial = calcularQuarteiraoInicial(intervaloQuarteiroes);
            const isIntOrHalf = quarteiraoInicial % 1 === 0 || quarteiraoInicial % 0.5 === 0;
            expect(isIntOrHalf).toBe(true);
        }
    });

    it("retorna o mesmo número para o mesmo intervalo de quarteirões", () => {
        const intervaloQuarteiroes = 20;
        const mockMath = Object.create(global.Math);
        mockMath.random = () => 0.5;
        global.Math = mockMath;
        const quarteiraoInicial = calcularQuarteiraoInicial(intervaloQuarteiroes);
        expect(quarteiraoInicial).toBe(10.5);
    });
});
