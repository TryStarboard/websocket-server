'use strict';

const {curry} = require('ramda');
const Bluebird = require('bluebird');
const log = require('./log');
const {Repo, Tag} = require('./models');
const {enqueueSyncStarsJob} = require('./JobQueue');

const {
  subClient,
  subscribe: subscribeRedis,
  unsubscribe: unsubscribeRedis,
} = require('./redis');

const {
  UPDATE_SOME_REPOS,
  REMOVE_REPOS,
  UPDATE_TAGS,
  UPDATE_PROGRESS,
  SYNC_REPOS,
} = require('@starboard/starboard-ui/shared/action-types');

const handleChannelMessage = curry((socket, user_id, channelName, channel, message) => {
  if (channel !== channelName) {
    return;
  }

  const event = JSON.parse(message);

  switch (event.type) {
  case 'UPDATED_ITEM':
    Bluebird
      .props({
        repos: Repo.getReposWithIds(event.repo_ids),
        tags: Tag.getAll(user_id),
      })
      .then((data) => {
        socket.emit(UPDATE_TAGS, data.tags);
        socket.emit(UPDATE_SOME_REPOS, data.repos);
      });
    break;
  case 'DELETED_ITEM':
    socket.emit(REMOVE_REPOS, event.deleted_repo_ids);
    break;
  case 'PROGRESS_DATA_ITEM':
    socket.emit(UPDATE_PROGRESS, event.progress);
    break;
  default:
    // No additional case
  }
});

function handleConnection(socket) {
  const user_id = socket.handshake.user.id;

  log.info({user_id}, 'user connected');

  const channelName = `sync-stars:user_id:${user_id}`;
  const messageHandler = handleChannelMessage(socket, user_id, channelName);

  subClient.on('message', messageHandler);
  subscribeRedis(channelName);
  socket.on(SYNC_REPOS, () => {
    enqueueSyncStarsJob(user_id)
      .catch((err) => {
        log.error({err, user_id}, 'ENQUEUE_JOB_ERROR');
      });
  });

  // Clean up
  socket.on('disconnect', () => {
    unsubscribeRedis(channelName);
    subClient.removeListener('message', messageHandler);
  });
}

module.exports = handleConnection;
