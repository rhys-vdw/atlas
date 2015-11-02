import _, { assign } from 'lodash';

import Options from '../options';

import Destruction from './destruction';
import Forge from './forge';
import Identification from './identification';
import KeyConversion from './key-conversion';
import Patch from './patch';
import Persistence from './persistence';
import Plurality from './plurality';
import Query from './query';
import RecordAdapter from './record-adapter';
import Retrieval from './retrieval';
import Target from './target';
import Where from './where';

import { MAPPER_SENTINEL } from '../constants';

class Mapper extends Options {
}

const mixins = [
  Destruction,
  Forge,
  Identification,
  KeyConversion,
  Patch,
  Persistence,
  Plurality,
  Query,
  RecordAdapter,
  Retrieval,
  Target,
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
