import Chain from '../Chain';

/**
 * @class
 * @extends Chain
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
export default class Mapper extends Chain {}
