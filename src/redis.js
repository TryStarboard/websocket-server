'use strict'

const createRedisFactory = require('@starboard/redis').createFactory
const conf = require('../conf')
const log = require('./log')

const createClient = createRedisFactory({
  host: conf.get('redis.host'),
  port: conf.get('redis.port'),
  password: conf.get('redis.password'),
  log
})

const sharedClient = createClient()
const subClient = createClient()

const subCounters = new Map()

function subscribe(channelName) {
  const current = subCounters.get(channelName)
  if (!current) {
    subCounters.set(channelName, 1)
    subClient.subscribe(channelName, (err) => {
      if (err) {
        log.error(err, 'SUBSCRIBE_SYNC_STARS_CHANNEL_ERROR')
      }
    })
  } else {
    subCounters.set(channelName, current + 1)
  }
}

function unsubscribe(channelName) {
  const current = subCounters.get(channelName)

  if (!current) {
    throw new Error(`subCounters key "${channelName}" cannot be "${current}"`)
  }

  if (current > 1) {
    subCounters.set(channelName, current - 1)
    return
  }

  subCounters.set(channelName, 0)
  subClient.unsubscribe(channelName, (err) => {
    if (err) {
      log.error(err, 'UNSUBSCRIBE_SYNC_STARS_CHANNEL_ERROR')
    }
  })
}

module.exports = {
  createClient,
  sharedClient,
  subClient,
  subscribe,
  unsubscribe
}
