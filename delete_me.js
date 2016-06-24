const Atlas = require('./lib/index');
const Knex = require('knex');

const atlas = Atlas(Knex({}));
module.exports.atlas = atlas;
module.exports.mapper = atlas('Mapper');
