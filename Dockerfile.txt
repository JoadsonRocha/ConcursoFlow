# Usa a imagem oficial do Node.js
FROM node:20-alpine

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

# O Cloud Run sempre define a variável PORT. Usamos 8080 como fallback padrão.
ENV PORT=8080
ENV NODE_ENV=production

# Expõe a porta (é opcional no Cloud Run, mas bom como documentação)
EXPOSE 8080

# Inicia a aplicação usando o script configurado no package.json
CMD ["npm", "start"]
