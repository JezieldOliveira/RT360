# RT360 — Simulador de Regime Tributário

Simulador do impacto da Reforma Tributária (CBS/IBS, LC 214/2025) por regime tributário, com recomendação de regime, estratégia de preços e projeção 2027–2033.

- **Backend:** NestJS (Node.js) — motor de cálculo no servidor
- **Frontend:** wizard de 3 etapas (design RT360 "Melhoria de Interface") em `public/` — stepper, prévia ao vivo e tela de diagnóstico com exportação PDF; todo cálculo vem da API
- **Banco:** PostgreSQL via Prisma (recomendado: **Neon**, integração nativa da Vercel) — opcional: sem `DATABASE_URL` o app funciona normalmente, apenas sem salvar histórico
- **Deploy:** Vercel (função serverless em `api/index.js` + estáticos pela CDN)

## Rodando localmente

```bash
npm install
npm run build
npm run start:prod        # http://localhost:3000
# ou, em desenvolvimento:
npm run start:dev
```

Para habilitar o histórico, copie `.env.example` para `.env`, preencha `DATABASE_URL` e rode:

```bash
npm run db:push           # cria a tabela Simulation no banco
```

## API

| Método | Rota                   | Descrição                                          |
| ------ | ---------------------- | -------------------------------------------------- |
| POST   | `/api/simulations/preview` | Calcula a prévia ao vivo (não salva) — usado a cada alteração no wizard |
| POST   | `/api/simulations`     | Executa a simulação e salva no histórico (se houver banco) |
| GET    | `/api/simulations`     | Lista as simulações recentes (`?limit=50`)         |
| GET    | `/api/simulations/:id` | Retorna uma simulação salva                        |
| GET    | `/api/health`          | Status do serviço e do banco                       |

Exemplo de payload do POST:

```json
{
  "regime": "LP",
  "receita": 31110794,
  "tributos": 7481792,
  "csp": 372465,
  "adm": 300736,
  "irpj": 3644940,
  "cbs": 10,
  "ibs": 18,
  "aliqSN": 11.67,
  "pctRegular": 60,
  "pctSN": 40,
  "margemDesejada": 30
}
```

## Deploy na Vercel

1. Suba o projeto para um repositório Git e importe na Vercel (ou use `vercel` CLI). Nenhuma configuração extra de framework é necessária — o `vercel.json` já define build, output e rewrites.
2. **Banco (opcional, para histórico):** no dashboard da Vercel, aba *Storage* → *Create Database* → **Neon (Postgres)**. A variável `DATABASE_URL` é criada automaticamente no projeto. Use a connection string **pooled** do Neon.
3. Crie a tabela uma única vez, localmente, apontando para o banco:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:push
   ```
4. Redeploy. Pronto: `https://seu-projeto.vercel.app`.

### Como funciona na Vercel

- `public/` é servido como estático pela CDN.
- Toda rota `/api/*` é reescrita para a função serverless `api/index.js`, que inicializa o app NestJS compilado em `dist/` (cacheado entre invocações).
- `npm run vercel-build` roda `prisma generate` + `nest build`.

## Metodologia do cálculo

Cronograma de transição IBS (LC 214/2025): 0,1% em 2027–2028 → 1,8% (2029) → 3,6% (2030) → 5,4% (2031) → 7,2% (2032) → alíquota plena em 2033. CBS: 9,9%/10% na transição → alíquota informada em 2033. São comparados três cenários — **Lucro Presumido/Real**, **Simples Nacional Padrão** e **SN Regime Regular** — e recomendado o de maior lucro líquido em 2033. Créditos de CBS/IBS estimados sobre insumos (fator 3,43%, crescente na transição). Valide com o contador responsável antes de qualquer mudança de regime.
