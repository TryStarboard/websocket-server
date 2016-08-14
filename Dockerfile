FROM nodesource/trusty:6.3.1

RUN mkdir /app
WORKDIR /app

ADD package.json /app/package.json
RUN npm install
ADD conf.js /app/conf.js
ADD src /app/src

EXPOSE 10010

CMD ["node", "src/index.js"]
