FROM node:15-alpine

WORKDIR /opt/app

COPY ["package*.json", "tsconfig*.json", "./"]

RUN npm ci

COPY ["src", "./src"]

RUN npm run build && rm -rf src

CMD [ "node", "build/src/main.js" ]
