'use strict';

const {curry} = require('ramda');
const Bluebird = require('bluebird');
const log = require('./log');
const {enqueueSyncStarsJob} = require('./JobQueue');
const {Tag} = require('./models');

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

const handleChannelMessage = curry((socket, user, channelName, channel, message) => {
  if (channel !== channelName) {
    return;
  }

  const event = JSON.parse(message);

  switch (event.type) {
  case 'REPOS_TOUCHED':
    Bluebird
      .props({
        repos: user.getRepos({
          where: {
            id: {
              $in: event.repoIds
            }
          },
          include: [Tag],
        }),
        tags: user.getTags(),
      })
      .then(({tags, repos}) => {
        socket.emit(UPDATE_TAGS, tags.map(t => t.toJSON()));
        socket.emit(UPDATE_SOME_REPOS, repos.map(r => {
          const json = r.toJSON();
          json.tags = json.tags.map(t => t.id);
          return json;
        }));
        socket.emit(
          UPDATE_PROGRESS,
          event.currentPage / (Math.min(event.totalPage, 20) + 1)
        );
      });
    break;
  case 'REPOS_DELETED':
    socket.emit(REMOVE_REPOS, event.repoIds);
    socket.emit(UPDATE_PROGRESS, 1);
    break;
  default:
    // No additional case
  }
});

function handleConnection(socket) {
  const user = socket.handshake.user;

  log.info({user_id: user.id}, 'user connected');

  const channelName = `sync-stars:user_id:${user.id}`;
  const messageHandler = handleChannelMessage(socket, user, channelName);

  subClient.on('message', messageHandler);
  subscribeRedis(channelName);
  socket.on(SYNC_REPOS, () => {
    enqueueSyncStarsJob(user.id)
      .catch((err) => {
        log.error({err, user_id: user.id}, 'ENQUEUE_JOB_ERROR');
      });
  });

  // Clean up
  socket.on('disconnect', () => {
    unsubscribeRedis(channelName);
    subClient.removeListener('message', messageHandler);
  });
}

module.exports = handleConnection;
