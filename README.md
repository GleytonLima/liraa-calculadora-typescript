[![Node.js CI](https://github.com/GleytonLima/liraa-calculadora-typescript/actions/workflows/node.js.yml/badge.svg)](https://github.com/GleytonLima/liraa-calculadora-typescript/actions/workflows/node.js.yml) [![Coverage Status](https://coveralls.io/repos/github/GleytonLima/liraa-calculadora-typescript/badge.svg?branch=main)](https://coveralls.io/github/GleytonLima/liraa-calculadora-typescript?branch=main) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2FGleytonLima%2Fliraa-calculadora-typescript%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/GleytonLima/liraa-calculadora-typescript/main)

# LIRAa Calculadora

LIRAa Calculadora é uma biblioteca TypeScript de código aberto que permite calcular o índice de infestação do mosquito Aedes aegypti em um determinado local, de acordo com o método estabelecido pelo Ministério da Saúde.

# Instalação

Para instalar a biblioteca, basta executar o seguinte comando:

```
npm install liraa-calculadora
```

# Uso

Consulte a [documentação](https://gleytonlima.github.io/liraa-calculadora-typescript/), feita com o uso do projeto [Typedoc](https://github.com/TypeStrong/typedoc) para detalhes do uso

# Contribuindo

Contribuições são bem-vindas! Se você quiser melhorar esta biblioteca, basta abrir uma issue ou pull request no GitHub.

Antes de enviar sua contribuição, certifique-se de ler as diretrizes de contribuição e de teste para garantir que sua alteração seja compatível com o código existente.

# Licença

Esta biblioteca é distribuída sob a licença MIT. Consulte o arquivo LICENSE para obter mais informações.

## Unit tests - Jest

```
npm test
```

```
--------------|---------|----------|---------|---------|-------------------
File          | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-------------------
All files     |     100 |      100 |     100 |     100 |
 functions.ts |     100 |      100 |     100 |     100 |
 index.ts     |     100 |      100 |     100 |     100 |
--------------|---------|----------|---------|---------|-------------------
```

## Mutation Test - Striker

```
npx stryker run
```

```
--------------|---------|----------|-----------|------------|----------|---------|
File          | % score | # killed | # timeout | # survived | # no cov | # error |
--------------|---------|----------|-----------|------------|----------|---------|
All files     |  100.00 |      101 |         0 |          0 |        0 |       8 |
 functions.ts |  100.00 |      101 |         0 |          0 |        0 |       8 |
--------------|---------|----------|-----------|------------|----------|---------|
```

## Dependências

Este projeto utiliza as seguintes bibliotecas open-source:

-   [jsPDF](https://github.com/MrRio/jsPDF) (versão ^2.5.1) - Biblioteca para criação de arquivos PDF usando JavaScript, desenvolvida por [James Hall](https://github.com/MrRio) e [outros colaboradores](https://github.com/MrRio/jsPDF/graphs/contributors).
-   [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) (versão ^3.5.25) - Plugin para adicionar tabelas ao jsPDF, desenvolvido por [Simon Bengtsson](https://github.com/simonbengtsson) e [outros colaboradores](https://github.com/simonbengtsson/jsPDF-AutoTable/graphs/contributors).
