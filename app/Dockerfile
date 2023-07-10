FROM node
WORKDIR /app
RUN  apt-get update
RUN  apt-get install -y nano
COPY . .
RUN npm i
CMD ["node","server.js"]