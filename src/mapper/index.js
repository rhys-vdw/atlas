import _, { assign } from 'lodash';

import Options from '../options';

import Defaults from './defaults';
import Destruction from './destruction';
import Forge from './forge';
import Identification from './identification';
import Insert from './insert';
import Joins from './joins';
import KeyConversion from './key-conversion';
import Query from './query';
import RecordAdapter from './record-adapter';
import Relations from './relations';
import Retrieval from './retrieval';
import Save from './save';
import Target from './target';
import Update from './update';
import UpdateAll from './update-all';
import Where from './where';

import { MAPPER_SENTINEL } from '../constants';

class Mapper extends Options {
}

const mixins = [
  Defaults,
  Destruction,
  Forge,
  Identification,
  Insert,
  Joins,
  KeyConversion,
  Query,
  RecordAdapter,
  Relations,
  Retrieval,
  Save,
  Target,
  Update,
  UpdateAll,
  Where,
];

const combine = (mixins, property) =>
  _(mixins).pluck(property).reduce(assign, {});

const methods = combine(mixins, 'methods');
const options = combine(mixins, 'options');

assign(Mapper.prototype, methods);

Mapper.prototype[MAPPER_SENTINEL] = true;

export function isMapper(maybeMapper) {
  return !!(maybeMapper && maybeMapper[MAPPER_SENTINEL]);
}
export default new Mapper(options);

export { Mapper as constructor, options };
