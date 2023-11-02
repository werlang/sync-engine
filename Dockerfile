FROM node:16
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

# install mysql for backup and restore schema
RUN apt-get update && apt-get install -y default-mysql-client