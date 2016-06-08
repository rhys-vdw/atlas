import { isObject, isString, each } from 'lodash';
import Registry from './registry';
import Mapper from './mapper';
import { related } from './related';
import plugins from './plugins';
import * as errors from './errors';
import * as relations from './relations';
import * as constants from './constants';
import { version as VERSION } from '../package.json';

const createRegistry = () => new Registry({ Mapper });

const createToMapper = registry => mapperOrName => {
  return isString(mapperOrName)
    ? registry.retrieve(mapperOrName)
    : mapperOrName;
};

const createAtlas = (knex, registry) => {
  const toMapper = createToMapper(registry);
  return function atlas(mapperOrName) {
    const mapper = toMapper(mapperOrName);
    return mapper && mapper.withMutations({ atlas, knex });
  };
};

/**
 * @class Atlas
 * @classdesc
 *
 * The `atlas` instance is a helper function. It wraps a `Knex` instance and a
 * mapper registry.
 *
 * Passing a string to `atlas` retrieves a registered {@link Mapper} by name.
 *
 * ```js
 * // Retrieve a mapper stored in Atlas's registry.
 * const Mapper = atlas('Mapper');
 * ```
 *
 * A new `atlas` instance has the default Mapper under the key `'Mapper'`.
 * Other mappers can be added via {@link Atlas#register}.
 *
 * ```js
 * const Movies = atlas('Mapper').table('movies');
 * atlas.register({ Movies });
 * ```
 *
 * Retrieve the previously stored Mapper 'Movies' and perform a query on it.
 *
 * ```js
 * atlas('Movies').where({ genre: 'horror' }).count().then(count => {
 *   console.log(`${count || 'No'} horror movies found.`);
 * });
 * ```
 *
 * @summary
 *
 * Initialize **Atlas**.
 *
 * @description
 *
 * Creates a new `atlas` instance using query builder and connection from given
 * `knex` instance.
 *
 * If `knex` is null the instance can still be used to create and register
 * mappers, but no queries can be executed ({@link Mapper#fetch},
 * {@link Mapper#save} etc will throw).
 *
 * ```js
 * // mapper-registry.ja
 *
 * const atlas = Atlas();
 * const Mapper = atlas('Mapper');
 *
 * const Purchases = Mapper.table('purchases');
 *
 * const Customers = Mapper.table('customers').relations({
 *   purchases: m => m.hasMany('Purchases'),
 *   purchasedProducts: m => m.belongsToMany('Products', { Pivot: 'Purchases' })
 * });
 *
 * const Products = Mapper.table('products').relations({
 *   sales: m => m.hasMany('Purchases');
 *   owners: m => m.belongsToMany('Users', { Pivot: 'Purchases' })
 * });
 *
 * atlas.register({ Purchases, Customers, Products });
 *
 * export default atlas.registry;
 * ```
 *
 * ```js
 * import Atlas from 'atlas';
 * import pgKnex from './pg-knex';
 * import mapperRegistry from './mapper-registry';
 *
 * const pg = Atlas(pgKnex, mapperRegistry);
 * const { related } = pg;
 *
 * pg('Product').with('sales', 'owners').fetch().then(products =>
 *   // Fetches and related records from PostgreSQL database.
 * ):
 * ```
 *
 * @param {Knex} knex
 *   A configured instance of `{@link http://knex.js Knex}`.
 * @param {Registry} [registry]
 *   An existing Mapper registry. If none is passed then one will be
 *   created with the base mapper under key `'Mapper'`.
 * @returns {function}
 *   `atlas` function.
 */
export default function Atlas(knex, registry = createRegistry()) {

  const atlas = createAtlas(knex, registry);

  /**
   * Knex instance used by this `Atlas` instance.
   *
   * @member {Knex} Atlas#knex
   * @readonly
   */
  atlas.knex = knex;

  /**
   * Registry used by this `Atlas` instance.
   *
   * @member {Registry} Atlas#registry
   * @readonly
   */
  atlas.registry = registry;

  /**
   * Adds a `Mapper` instance to Atlas's registry under given `name`. Registered
   * mappers can be retrieved via `atlas(mapperName)`. Using a registry helps to
   * break dependancy cycles between modules.
   *
   * ```js
   * const Mapper = atlas('Mapper');
   *
   * const Users = Mapper.table('users').idAttribute('user_id');
   * atlas.register('Users', Users);
   *
   * atlas.register({
   *   NewestUser: Users.orderBy({ created_at: 'desc' }).one()
   * });
   * ```
   *
   * Mapper names can also be used directly in relationship definitions, for
   * example:
   *
   * ```js
   * // Using registry allows either side of the relation to reference the other
   * // before it is declared.
   * const Pet = Mapper.table('pets').relations({ owner: m => m.belongsTo('Owner') });
   * const Owner = Mapper.table('owners').relations({ pets: m => m.hasMany('Pets') });
   * atlas.register({ Pet, Owner });
   * ```
   *
   * @method Atlas#register
   * @param {string|Object} nameOrMappersByName
   *   Either the name of a single `Mapper` to register, or a hash of `Mapper`
   *   instances by name.
   * @param {Mapper} [mapper]
   *   The mapper to be registered if a name is provided as the first argument.
   * @returns {Atlas}
   *   Self, this method is chainable.
   */
  atlas.register = (name, mapper) => {
    if (isObject(name)) {
      each(name, (value, key) => registry.register(key, value));
    } else {
      registry.register(name, mapper);
    }
    return atlas;
  };

  /**
   * Like {@link Atlas#register} but allows a registered `Mapper` to be
   * replaced.
   *
   * @method Atlas#override
   * @param {string|Object} nameOrMappersByName
   *   Either the name of a single `Mapper` to register, or a hash of `Mapper`
   *   instances keyed by name.
   * @param {Mapper} [mapper]
   *   The mapper to be registered if a name is provided as the first argument.
   * @returns {Atlas}
   *   Self, this method is chainable.
   */
  atlas.override = (name, mapper) => {
    if (isObject(name)) {
      each(name, (value, key) => registry.override(key, value));
    } else {
      registry.override(name, mapper);
    }
    return atlas;
  };

  /**
   * Execute queries in a transaction. Provide a callback argument that returns
   * a `Promise`. If the promise is resolved the transaction will be commited. If
   * it is rejected then the commit will be rolled back.
   *
   * ```js
   * app.post('groups/', (req, res) => {
   *
   *   const { ...group, members } = req.body;
   *
   *   atlas.transaction(t => {
   *
   *     // Create the new group.
   *     return t('Groups').save(group).then(group =>
   *
   *       // Insert each user then reattach them to the `group`. If any of these
   *       // insertions throws then the entire operation will be rolled back.
   *       t('Groups').related(group, 'members').insert(members)
   *         .then(members => { ...group, members })
   *     );
   *
   *   }).then(group =>
   *     res.status(200).send(group)
   *   )).catch(ValidationError, error =>
   *     // ValidationError is NYI
   *     res.status(400).send(error.message)
   *   ).catch(() =>
   *     res.status(500).send('Server error')
   *   );
   * });
   * ```
   *
   * Callback receives argument `t`, an instance of Atlas connected to the knex
   * transaction. The knex `Transaction` instance is available as
   * `{@link Atlas#knex t.knex}`:
   *
   * ```js
   * atlas.transaction(t => {
   *   return t.knex('users').join('posts', 'posts.author_id', 'users.id')
   *     .then(usersAndPosts => {
   *       // ...
   *     });
   * }).then(result => // ...
   * ```
   *
   * @method Atlas#transaction
   * @param {Atlas~transactionCallback} callback
   *   Callback within which to write transacted queries.
   * @returns {Promise}
   *   A promise resolving to the value returned from the callback.
   * @see
   *   Knex.js {@link http://knexjs.org/#Transactions transaction documentation}
   *   for more information.
   */
  atlas.transaction = function transaction(transactionCallback) {

    return knex.transaction(trx =>

      /**
       * A callback function that runs the transacted queries.
       *
       * @callback Atlas~transactionCallback
       * @param {Atlas} t
       *   An instance of `Atlas` connected to the transaction.
       * @param {Transaction} t.knex
       *   The Knex.js `Transaction` instance.
       */
      transactionCallback(createAtlas(trx, registry))
    );
  };

  /**
   * Accessor for `related` helper function.
   * @member {related} Atlas#related
   * @readonly
   * @see related
   */
  atlas.related = related;

  return atlas;
}

/**
 * @member {Object} Atlas.plugins
 * @property {CamelCase} CamelCase
 * @property {FormatAttributes} FormatAttributes
 * @property {Timestamp} Timestamp
 */
Atlas.plugins = plugins;

/**
 * @member {errors} Atlas.errors
 */
Atlas.errors = errors;

/**
 * Select all relations
 * @constant
 */
Atlas.ALL = constants.ALL;

/**
 * Clear all relations
 * @constant
 */
Atlas.NONE = constants.NONE;


/**
 * Installed version of **Atlas**.
 *
 * ```js
 * console.log(Atlas.VERSION);
 * // 1.0.0
 * ```
 *
 * @member {string} Atlas.VERSION
 */
Atlas.VERSION = VERSION;
