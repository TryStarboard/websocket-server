'use strict'

const co = require('co')
const Cookies = require('cookies')
const conf = require('../conf')
const log = require('./log')
const {sharedClient: redis} = require('./redis')
const {User} = require('./models')

function authenticate(socket, next) {
  co(function *() {
    try {
      const cookies = new Cookies(socket.request, null, {
        keys: conf.get('cookies.keys')
      })

      const sid = cookies.get('koa.sid', {signed: true})

      const str = yield redis.get(`koa:sess:${sid}`)

      const obj = JSON.parse(str)

      if (!obj || obj.passport.user == null) {
        next(new Error('session not found, cannot auth websocket'))
        log.info('session not found, cannot auth user')
      } else {
        socket.handshake.user = yield User.findById(obj.passport.user)
        next()
      }
    } catch (err) {
      log.error(err)
      next(err)
    }
  })
}

module.exports = authenticate
