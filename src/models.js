'use strict';

const createModels = require('@starboard/models').createModels;
const conf = require('../conf');

module.exports = createModels({connection: conf.get('postgres')});
