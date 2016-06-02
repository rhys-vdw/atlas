import Promise from 'bluebird';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import flatten from 'lodash/flatten';
import { NotFoundError, NoRowsFoundError } from '../errors';
import { PIVOT_PREFIX } from '../constants';
import {
  isQueryBuilderSpecifyingColumns,
  isQueryBuilderOrdered
} from './helpers/knex';
import { isComposite } from '../arguments';

export default {

  initialize() {
    this.setState({
      isRequired: false,
      isSingle: false
    });
  },

  /**
   * Set attributes to be retrieved by {@link Mapper#fetch}.
   *
   * ```js
   * // Exclude 'password_hash' and 'salt'.
   * const userWhitelist = ['name', 'avatar_url', 'created_at', 'last_seen'];
   *
   * router.get('/user/:userId', (req, res, next) => {
   *   Users
   *     .attributes(userWhitelist)
   *     .find(req.params.userId)
   *     .then(res.json)
   *     .catch(next);
   * });
   * ```
   *
   * @method Mapper#attributes
   * @param {...string} attributes
   *   One or more attributes to fetch.
   * @returns {Mapper}
   */
  attributes(...attributes) {
    const columns = flatten(attributes).map(attribute =>
      this.attributeToTableColumn(attribute)
    );
    return this.query('select', columns);
  },

  /**
   * Setting `require` will cause {@link Mapper#fetch} and {@link Mapper#find}
   * to throw when a query returns no records.
   *
   * ```js
   * const { NoRowsFoundError } = atlas;
   *
   * User.where('created_at', <, new Date(1500, 0, 1)).fetch()
   *   .then(user => console.log(user.name))
   *   .catch(NoRowsFoundError, error => {
   *     console.log('no rows created before 1500AD!');
   *   });
   * ```
   *
   * @method Mapper#require
   * @returns {Mapper}
   */
  require() {
    return this.setState({ isRequired: true });
  },

  /**
   * @method Mapper#one
   * @summary
   *
   * Query a single row.
   *
   * @description
   *
   * Limit query to a single row. Causes subsequent calls to {@link
   * Mapper#fetch fetch} to resolve to a single record (rather
   * than an array). Opposite of {@link Mapper#all all}.
   *
   * Typically it's simpler to use {@link Mapper#first first}.
   *
   * @example
   *
   * People.one().where('age', '>', 18).fetch().then(adult => {
   *  console.log(`${adult.name} is one adult in the database`);
   * });
   *
   * @returns {Mapper}
   *   Mapper targeting a single row.
   */
  one() {
    return this.setState({ isSingle: true });
  },

  /**
   * @method Mapper#all
   * @summary
   *
   * Query multiple rows. Default behaviour.
   *
   * @description
   *
   * Unlimits query. Opposite of {@link Mapper#one one}.
   *
   * @example
   *
   * const LatestSignUp = Mapper
   *   .table('users')
   *   .orderBy('created_at', 'desc')
   *   .one();
   *
   * const SignUpsLastWeek = NewestUser
   *   .where('created_at', '>', moment().subtract(1, 'week'))
   *   .all();
   *
   * SignUpsLastWeek.count().then(signUpCount => {
   *   console.log(`${signUpCount} users signed in the last week`);
   * });
   *
   * @returns {Mapper}
   *   Mapper targeting a single row.
   */
  all() {
    return this.setState({ isSingle: false });
  },


  /**
   * @method Mapper#first
   * @summary
   *
   * Fetch the first matching record.
   *
   * @description
   *
   * Shorthand for `Mapper.one().fetch()`. If the query has no ordering, it will
   * be sorted by {@link Mapper#idAttribute}.
   *
   * @example
   *
   * Users.first().then(user =>
   * // select * from users order by id
   *
   * Users.orderBy('created_at', 'desc').first().then(newestUser =>
   * // select * from users order by created_at desc
   *
   * @returns {Mapper}
   *   Mapper targeting a single row.
   */
  first() {
    return this.withMutations(mapper => {

      // `first` only makes sesne if the query is ordered, so check.
      if (!isQueryBuilderOrdered(mapper.state.queryBuilder)) {

        // If it hasn't we have to order by ID attribute.
        const idAttribute = this.requireState('idAttribute');
        mapper.orderBy(idAttribute, 'asc');
      }
      mapper.one();
    }).fetch();
  },

  /**
   * @method Mapper#fetchAll
   * @summary
   *
   * Retrieve an array of records.
   *
   * @description
   *
   * Alias for `Mapper.{@link Mapper#all all}.{@link Mapper#fetch fetch}`.
   *
   * @returns {Promise<Object[]>}
   */
  fetchAll() {
    return this.all().fetch();
  },

  /**
   * @method Mapper#find
   * @summary
   *
   * Retrieve records by ID.
   *
   * @description
   *
   * Fetch one or more records by their {@link Mapper#idAttribute idAttribute}.
   *
   * Shorthand for `Mapper.target().fetch()`.
   *
   * @example <caption>Finding a record with a single key</caption>
   *
   * const Vehicles = Mapper.table('vehicles');
   *
   * Vehicles.find(5).then(vehicle =>
   * // select * from vehicles where id = 5
   *
   * Vehicles.find({ id: 3, model: 'Commodore' }).then(vehicle =>
   * // select * from vehicles where id = 3
   *
   * Vehicles.find(1, 2, 3).then(vehicles =>
   * // select * from vehicles where id in (1, 2, 3)
   *
   * @example <caption>Finding a record with a composite key</caption>
   *
   * const AccessPermissions = Mapper
   *   .table('permissions')
   *   .idAttribute(['room_id', 'personnel_id']);
   *
   * AccessPermissions.find([1, 2]).then(trip =>
   * // select * from trips where room_id = 1, personnel_id = 2
   *
   * const personnel = { name: 'Melissa', id: 6 };
   * const office = { id: 2 };
   * AccessPermissions.find([office.id, personnel.id]).then(permission =>
   * // select * from permissions where room_id = 6 and personnel_id = 2
   *
   * const permission = { room_id: 2, personel_id: 6 };
   * AccessPermissions.find(permission).then(permission =>
   * // select * from permissions where room_id = 6 and personnel_id = 2
   *
   * @param {...(mixed|mixed[])} ids
   *   One or more ID values, or arrays of ID values (for composite IDs).
   * @returns {Promise<Object|Object[]>}
   *   One or more records with the given IDs.
   */
  find(...ids) {
    return Promise.try(() =>
      this.target(...ids).fetch()
    );
  },

  /**
   * @method Mapper#findBy
   * @summary
   *
   * Retrieve record(s) by a specific attribute.
   *
   * @description
   *
   * Like `find`, but allows an attribute other than the primary key as its
   * identity. The provided attribute should be unique within the `Mapper`'s
   * {@link Mapper#table table}.
   *
   * @example
   *
   * Users = Mapper.table('users');
   *
   * function validateCredentials(email, password) {
   *   return Users.findBy('email', email).then(user => {
   *     return user != null && verifyPassword(user.password_hash, password);
   *   });
   * }
   *
   * @returns {Promise<Object|Object[]>}
   *   One or more records having the supplied attribute.
   */
  findBy(attribute, ...ids) {
    return Promise.try(() =>
      this.targetBy(attribute, ...ids).fetch()
    );
  },

  /**
   * @method Mapper#fetch
   * @summary
   *
   * Retrieve one or more records.
   *
   * @example
   *
   * // select * from people;
   * People.fetch().then(people =>
   *   const names = people.map(p => p.name).join(', ');
   *   console.log(`All people: ${names}`);
   * );
   *
   * @returns {Promise<Object|Object[]>}
   *   One or more records.
   */
  fetch() {
    const mapper = this.prepareFetch();
    const queryBuilder = mapper.toQueryBuilder();
    return queryBuilder.then(response =>
      mapper.handleFetchResponse({ queryBuilder, response })
    ).then(records => {
      const { related } = this.state;
      return related == null ? records : this.load(related).into(records);
    });
  },

  /** @private */
  prepareFetch() {
    const { isSingle, omitPivot } = this.state;

    return this.query(queryBuilder => {

      if (isSingle) {
        queryBuilder.limit(1);
      }

      // Nothing more to do if columns are already specified.
      if (!isQueryBuilderSpecifyingColumns(queryBuilder)) {

        // Always omit pivot if client has specified columns.
        if (!omitPivot) {
          const { pivotAttributes } = this.state;

          if (!isEmpty(pivotAttributes)) {
            const { pivotRelationName, pivotAlias } = this.state;
            const Pivot = this.getRelation(pivotRelationName).Other;

            const pivotColumns = map(pivotAttributes, attribute => {
              const column = Pivot.attributeToColumn(attribute);
              return `${pivotAlias}.${column} as ${PIVOT_PREFIX}${column}`;
            });

            queryBuilder.select(pivotColumns);
          }
        }

        queryBuilder.select(this.columnToTableColumn('*'));
      }
    });
  },

  /** @private */
  handleFetchResponse({ queryBuilder, response }) {
    const { isRequired, isSingle } = this.state;

    if (isEmpty(response)) {
      if (isRequired) {
        throw isSingle
          ? new NotFoundError(this, queryBuilder, 'fetch')
          : new NoRowsFoundError(this, queryBuilder, 'fetch');
      }
      return isSingle ? null : [];
    }

    const records = response.map(row => this.columnsToRecord(row));
    return isSingle ? records[0] : records;
  }
};
