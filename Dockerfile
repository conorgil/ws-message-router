FROM node:lts-alpine
COPY ./dist ./app/dist
COPY ./node_modules ./app/node_modules

WORKDIR /app/dist/server
ENTRYPOINT ["node", "server.js"]
