'use strict';

const co = require('co');
const Cookies = require('cookies');
const conf = require('../conf');
const log = require('./log');
const {sharedClient: redis} = require('./redis');

function authenticate(socket, next) {
  co(function *() {
    try {
      const cookies = new Cookies(socket.request, null, {
        keys: conf.get('cookies.keys'),
      });

      const sid = cookies.get('koa.sid', {signed: true});

      const str = yield redis.get(`koa:sess:${sid}`);

      const obj = JSON.parse(str);

      if (!obj || obj.passport.user == null) {
        next(new Error('session not found, cannot auth websocket'));
      } else {
        socket.handshake.user = {id: obj.passport.user};
        next();
      }

    } catch (err) {
      log.error(err);
      next(err);
    }
  });
}

module.exports = authenticate;
