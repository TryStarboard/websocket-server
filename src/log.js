'use strict';

const {createFactory} = require('@starboard/log');
const conf = require('../conf');

const createLogger = createFactory({
  name: 'starboard-websocket',
  env: conf.get('env'),
  logentriesToken: conf.get('logging.Logentries.token'),
  sentryDsn: conf.get('logging.Sentry.dsn'),
  sentryOptions: conf.get('logging.Sentry.options'),
});

module.exports = createLogger();
