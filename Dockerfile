# Usa a imagem oficial do Node.js
FROM node:20-alpine

# Instala tzdata para suporte a fuso horário (necessário para o node-cron)
RUN apk add --no-cache tzdata
ENV TZ=America/Sao_Paulo

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Faz a build do Vite (frontend) e do Express (backend)
RUN npm run build

# Configurações de ambiente para Produção
ENV NODE_ENV=production

# Inicia a aplicação usando o script configurado no package.json
CMD ["npm", "start"]