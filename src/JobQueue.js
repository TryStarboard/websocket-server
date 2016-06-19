'use strict';

const kue = require('kue');
const {wrap} = require('co');
const log = require('./log');
const {createClient, sharedClient} = require('./redis');

const queue = kue.createQueue({
  redis: {
    createClientFactory: createClient,
  }
});

const enqueueSyncStarsJob = wrap(function *(user_id) {
  const key = `{uniq-job:sync-stars}:user_id:${user_id}`;
  const result = yield sharedClient.getset(key, Date.now().toString());
  log.info({value: result}, 'ENQUEUE_UNIQUE_JOB_CHECK');

  // result will be `null` when first time "getset"
  if (result !== null) {
    return;
  }

  queue.create('sync-stars', {user_id}).save();
  yield sharedClient.expire(key, 30); // 30 sec
});

module.exports = {
  enqueueSyncStarsJob,
};
