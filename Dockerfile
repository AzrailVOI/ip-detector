FROM node
LABEL authors="Azraїl"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

CMD [ "pnpm", "start" ]