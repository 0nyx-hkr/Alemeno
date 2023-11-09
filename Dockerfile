FROM node:20

WORKDIR /creditflow
COPY package.json .
RUN npm install
COPY . .
CMD npm start