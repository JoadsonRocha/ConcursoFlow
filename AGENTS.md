# Configuração Express Original (Mapeamento)

Caso precisemos retornar para a arquitetura com Express (como estava antes da migração para Vercel Serverless Functions), aqui está o mapeamento da configuração:

## server.ts
O arquivo central utilizava `express`, `cors` e inicializava o Firebase Admin baseado no `DATABASE_ID`. As rotas principais ficavam montadas no Express.

```typescript
import express from 'express';
import cors from 'cors';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// App Base
const app = express();
app.set('trust proxy', true);
app.use(cors());

// Webhook Stripe (usando express.raw)
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Lógica do Webhook (atualizava planId na coleção users do Firestore)
});

// Middlewares JSON globais
app.use(express.json());

// Exemplo de Checkout Session Stripe
app.post('/api/create-checkout-session', async (req, res) => { ... });

// Rotas de AI importadas
// app.use('/api/ai', aiRoutes);

// Em ambiente de desenvolvimento montávamos o app do Vite como middleware
// Em produção, servíamos da pasta dist/
```

## Middlewares da API
As chamadas de API usavam middlewares clássicos como o `auth.ts` do Express para interceptar o Token e setar o `req.user`.

## Pros e Contras (Vercel Serverless Functions VS Express Completo)

**Vantagens do Vercel Serverless (Sem Express):**
- **Cold Starts Menores:** Funções independentes sobem mais rápido por não carregar bibliotecas não utilizadas (só carregam o que a rota precisa).
- **Escala Independente:** Se a rota de Flashcards tiver pico de uso, as outras rotas não são penalizadas.
- **Integração Nativa:** Vercel foi feita para otimizar Serverless Typescript. Funciona maravilhosamente bem sem instanciar um server completo.

**Desvantagens do Vercel Serverless:**
- **Middlewares Globais:** Não existe um `app.use(cors())` fácil global sem usar configurações extras (cors headers no vercel.json ou helpers).
- **Sem Servidor de Longa Duração:** WebSockets não funcionam bem no serverless padrão.

Como pedido, a arquitetura agora foi baseada nas funções individuais dentro de `/api/`.
