'use strict';

const convict = require('convict');
const pkg = require('../package.json');

convict.addFormat({
  name: 'array',
  validate: notEmpty,
  coerce(val) {
    return val.split(',');
  }
});

const conf = convict({
  env: {
    env: 'NODE_ENV',
    default: 'development',
    format: ['development', 'test', 'production'],
  },
  cookies: {
    keys: {
      env: 'COOKIES_KEYS',
      default: null,
      format: 'array',
    },
  },
  redis: {
    host: {
      env: 'REDIS_HOST',
      default: null,
      format: notEmpty,
    },
    port: {
      env: 'REDIS_PORT',
      default: null,
      format: 'port',
    },
    password: {
      env: 'REDIS_PASS',
      default: null,
    },
  },
  postgres: {
    host: {
      env: 'POSTGRES_HOST',
      default: null,
      format: notEmpty,
    },
    port: {
      env: 'POSTGRES_PORT',
      default: null,
      format: notEmpty,
    },
    database: {
      env: 'POSTGRES_DB',
      default: null,
      format: notEmpty,
    },
    user: {
      env: 'POSTGRES_USER',
      default: null,
      format: notEmpty,
    },
    password: {
      env: 'POSTGRES_PASS',
      default: null,
      format: notEmpty,
    },
  },
  logging: {
    Logentries: {
      token: {
        env: 'LOG_ENTRIES_TOKEN',
        default: null,
      },
    },
    Sentry: {
      dsn: {
        env: 'SENTRY_DSN',
        default: false,
      },
      options: {
        release: pkg.version,
      }
    },
  },
});

conf.validate({strict: true});

function notEmpty(val) {
  if (val == null) {
    throw new Error('must be defined');
  }
}

module.exports = conf;
