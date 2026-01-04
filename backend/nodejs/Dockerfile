FROM node:25-alpine3.22

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 8000

CMD ["npm", "run", "dev"]
