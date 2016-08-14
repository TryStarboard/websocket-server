'use strict'

const create = require('@starboard/models').create
const conf = require('../conf')

module.exports = create(conf.get('postgres'))
