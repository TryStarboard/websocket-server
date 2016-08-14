'use strict'

const http = require('http')
const socketio = require('socket.io')
const log = require('./log')
const authenticate = require('./authenticate')
const handleConnection = require('./handleConnection')

const server = http.createServer(function (request, response) {
  // Server readiness check
  response.end()
})

const io = socketio(server, {serveClient: false})

io.use(authenticate)
io.on('connection', handleConnection)

server.listen(10010, '0.0.0.0', () => {
  log.info('server start')
})
