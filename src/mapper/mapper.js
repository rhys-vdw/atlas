import Chain from '../Chain';

/**
 * @class
 * @extends Chain
 * @classdesc
 *
 * Chainable interface to a subset of your database.
 *
 * Mappers are immutable, so any method that would modify its state will return
 * a copy instead.
 *
 * ```js
 * import Mapper from 'atlas/Mapper';
 *
 * // Create an instance.
 * const mapper = new Mapper();
 *
 * // Create a new mapper for the users table.
 * const users = mapper.table('users').idAttribute('user_id');
 *
 * // Now target a subset of rows.
 * const admins = users.where('is_admin', true);
 *
 * // select * from users where is_admin = true;
 * atlas(admins).fetch().then(admins => {
 *   // ...
 * });
 * ```
 *
 * You can use ES6 inheritance to extend the interface to your needs.
 *
 * ```js
 * class SoftDeleteMapper extends Mapper {
 *
 *   initialize() {
 *     this.defaultAttributes({
 *       is_deleted: false
 *     })
 *   }
 *
 *   // Override
 *   destroy(...records) {
 *     return this.target(...records).updateAll({ is_deleted: true })
 *   }
 *
 *   // Override
 *   destroyAll() {
 *     return this.updateAll({ is_deleted: true })
 *   }
 *
 *   current() {
 *     return this.where({ is_deleted: false })
 *   }
 *
 *   deleted() {
 *     return this.where({ is_deleted: true })
 *   }
 * }
 * ```
 *
 * Or you can use the {@link extend} instance method to include a mixin.
 *
 * ```js
 * const messages = mapper.table('messages').extend({
 *
 *   unread() {
 *     return this.where('seen', false)
 *   },
 *
 *   read() {
 *     return this.where('seen', true);
 *   }
*
 * });
 * ```
 *
 * ```js
 * import { TimeStamp, CamelCase } from 'atlas/plugins';
 *
 * const base = mapper.extend(TimeStamp, CamelCase);
 *
 * const users = base.table('users');
 * const accounts = base.table('accounts');
 *
 * atlas.register(users, accounts);
 * ```
 *
 */
export default class Mapper extends Chain {}
