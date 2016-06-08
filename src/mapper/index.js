import Mapper from './mapper';

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
import * as RelationTypes from '../relations';
import Retrieval from './retrieval';
import Save from './save';
import Target from './target';
import Update from './update';
import UpdateAll from './update-all';
import Where from './where';

import { MAPPER_SENTINEL } from '../constants';

const instance = new Mapper().extend(
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
  RelationTypes,
  Retrieval,
  Save,
  Target,
  Update,
  UpdateAll,
  Where
);

instance.constructor.prototype[MAPPER_SENTINEL] = true;

export function isMapper(maybeMapper) {
  return !!(maybeMapper && maybeMapper[MAPPER_SENTINEL]);
}

export default instance;
