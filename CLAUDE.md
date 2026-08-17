@AGENTS.md

# propostas-softcode

## Contexto

Site de **propostas comerciais da SoftCode**: apresentação e envio de propostas
para clientes. Este repositório está no estágio de esqueleto — apenas o scaffold
do Next.js, sem features implementadas.

Decisões ainda **em aberto** (não instalar nada disso sem alinhamento prévio):
banco de dados, ORM e biblioteca de animação.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (strict), alias de import `@/*` → `src/*`
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **ESLint 9** (flat config, `eslint-config-next`)
- Código-fonte em `src/`

## Package manager

**O package manager é npm.** Não use bun, pnpm ou yarn neste projeto.
O repositório deve conter apenas `package-lock.json` — qualquer outro lockfile
(`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`) é erro e deve ser removido.

Instalação de dependências: `npm install <pacote>`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento (http://localhost:3000) |
| `npm run build` | Build de produção |
| `npm start` | Roda o build de produção |
| `npm run lint` | ESLint |

## Convenções de commit

[Conventional Commits](https://www.conventionalcommits.org/): `tipo(escopo): descrição`

- Tipos: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `build`, `ci`
- Descrição no imperativo e em minúsculas: `feat(propostas): adiciona listagem`
- Escopo é opcional
- Um commit por unidade lógica de mudança
