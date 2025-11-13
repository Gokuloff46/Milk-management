FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx", "webpack", "serve", "--config", "webpack.config.cjs", "--host", "0.0.0.0"]

ENV NODE_ENV=production