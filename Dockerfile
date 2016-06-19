FROM nodesource/trusty:5.11.0

RUN mkdir /app
WORKDIR /app

ADD package.json /app/package.json
RUN npm install
ADD conf.js /app/conf.js
ADD src /app/src

EXPOSE 10010

CMD ["node", "--harmony_destructuring", "--harmony_default_parameters", "src/index.js"]
