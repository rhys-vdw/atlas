import ImmutableBase from '../immutable-base';

import Count from './count';
import Defaults from './defaults';
import Destruction from './destruction';
import Forge from './forge';
import Identification from './identification';
import Insert from './insert';
import Joins from './joins';
import KeyConversion from './key-conversion';
import Order from './order';
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

const Mapper = new ImmutableBase().extend(
  Count,
  Defaults,
  Destruction,
  Forge,
  Identification,
  Insert,
  Joins,
  KeyConversion,
  Order,
  Query,
  RecordAdapter,
  Relations,
  Retrieval,
  Save,
  Target,
  Update,
  UpdateAll,
  Where
);

Mapper.constructor.prototype[MAPPER_SENTINEL] = true;

export function isMapper(maybeMapper) {
  return !!(maybeMapper && maybeMapper[MAPPER_SENTINEL]);
}

export default Mapper;
