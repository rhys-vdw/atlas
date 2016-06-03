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
import RelationTypes from '../relations';
import Relations from './relations';
import Retrieval from './retrieval';
import Save from './save';
import Target from './target';
import Update from './update';
import UpdateAll from './update-all';
import Where from './where';

import { MAPPER_SENTINEL } from '../constants';

/**
 * @class
 * @extends ImmutableBase
 * @classdesc
 *
 * Mappers represent a set of data in your database. A mapper can be scoped or
 * specialized by chaining calls to its methods.
 *
 * Mappers are immutable, so any setter method will return a copy of the Mapper
 * insance with the new settings. `Mapper` instances need never be instantiated
 * with `new`, instead each method call that would mutate the instance returns a
 * copy.
 *
 * ```js
 * // Get the base mapper from `atlas`.
 * const Mapper = atlas('Mapper');
 *
 * // Create a new Mapper that represents users.
 * const Users = Mapper.table('users').idAttribute('user_id');
 *
 * // Create one from `Users` that represents administrators.
 * const Admins = Users.where('is_admin', true);
 *
 * // select * from users where is_admin = true;
 * Admins.fetch().then(admins => {
 *   // ...
 * });
 * ```
 *
 * These docs instead use the convention of naming mappers in `PascalCase` and
 * records in `camelCase`. This is okay because the `Mapper` constructor never
 * appears in your code.
 *
 * ```js
 * Cars.fetch().then(cars => // ...
 * ```
 *
 */
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
  RelationTypes,
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
