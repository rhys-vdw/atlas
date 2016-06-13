import { inspect } from 'util';
import {
  keys as objectKeys, flatten, isEmpty, isFunction, isString
} from 'lodash';
import Mapper from './mapper';
import EagerLoader from '../eager-loader';
import { ALL, NONE } from '../constants';

export default {

  /**
   * @method Mapper#relations
   * @summary
   *
   * Define a `Mapper`'s relations.
   *
   * @description
   *
   * ```js
   * const Mapper = atlas('Mapper');
   *
   * const Users = Mapper.table('users').idAttribute('email').relations({
   *   friends: m => m.belongsToMany(Users),
   *   sentMessages: m => m.hasMany(Messages, { otherRef: 'from_id' }),
   *   receivedMessages: m => m.hasMany(Messages, { otherRef: 'to_id' }),
   * }),
   *
   * Messages: Mapper.table('messages').relations({
   *   from: m => m.belongsTo(Users, { selfRef: 'from_id' }),
   *   to: m => m.belongsTo(Users, { selfRef: 'to_id' })
   * }).extend({
   *   unread() { return this.where('is_unread', true); },
   *   read() { return this.where('is_unread', false); }
   * }),
   *
   * Posts: Mapper.table('posts').relations({
   *   author: m => m.belongsTo(Users, { selfRef: 'author_id' }),
   *   comments: m => m.hasMany(Comments)
   * }),
   *
   * Comments: Mapper.table('comments').relations({
   *   author: m => m.belongsTo(Users, { selfRef: 'author_id' }),
   *   post: m => m.belongsTo(Posts)
   * })
   * ```
   *
   * Relation functions are also bound correctly like a method, so
   * you can use `this`.
   *
   * ```js
   * const Users = Mapper.table('users').relations({
   *   friends: function() { return this.belongsToMany(Users) }
   * })
   * ```
   *
   * @see Mapper#load
   * @see Mapper#with
   * @see Atlas#relations
   *
   * @param {Object<string, Mapper~createRelation>} relationFactoryByName
   *   A hash of relations keyed by name.
   * @returns {Mapper}
   *   Mapper with provided relations.
   */
  relations(relations) {
    return this.setState({ relations:
      { ...this.state.relations, ...relations }
    });
  },

  /** @private */
  getRelationNames() {
    return objectKeys(this.state.relations);
  },

  /**
   * @method Mapper#relation
   * @summary
   *
   * Get a named `Relation` instance from a `Mapper`.
   *
   * @description
   *
   * Get a configured `Relation` instance that was defined previously with
   * {@link Mapper#relations}.
   *
   * The relation can be converted into a Mapper matching records in that
   * relation.  Each `Relation` type (`BelongsTo`, `BelongsToMany`, `HasOne`
   * and `HasMany`) provides an `of()` method that accepts one or more records.
   *
   * ```js
   * atlas.register({
   *
   *   Projects: Mapper.table('projects').relations({
   *     owner: m => m.belongsTo('People', { selfRef: 'owner_id' })
   *   }),
   *
   *   People: Mapper.table('people').relations({
   *     projects: m => m.hasMany('Projects', { otherRef: 'owner_id' })
   *   })
   *
   * });
   *
   * // Assuming `req.user` is added by auth middleware (eg. Passport.js).
   *
   * // Simple `GET` route, scoped by user.
   * express.route('/projects').get((req, res) =>
   *   atlas('People').relation('projects').of(req.user).then(projects =>
   *     res.json(projects)
   *   )
   * );
   * ```
   *
   * ```js
   * // Alternative to above - share relation `Mapper` between between `GET` and
   * // `POST`.
   * express.route('/projects').all((req, res) => {
   *   req.Projects = atlas('People').relation('projects').of(req.user)
   *   next();
   * }).get((req, res) =>
   *   req.Projects.fetch().then(res.json)
   * ).post((req, res) =>
   *   req.Projects.save(req.body).then(res.json)
   * );
   *
   * express.route('/projects/:projectId').all((req, res) => {
   *   req.Project = atlas('People').relation('projects').of(req.user).target(
   *     req.params.projectId
   *   ).require();
   *   next();
   * }).get((req, res) =>
   *   req.Project.fetch().then(res.json)
   * ).put((req, res) =>
   *   // Automatically overrides `owner_id` before insert, regardless of `req.body`.
   *   req.Projects.save(req.body).then(res.json)
   * );
   * ```
   *
   * This also allows querying on a relation of multiple parents.
   *
   * ```js
   * const bob = { id: 1, name: 'Bob' };
   * const sue = { id: 2, name: 'Sue' };
   *
   * // select * from projects where owner_id in (1, 2)
   * Users.relation('projects').of(bob, sue).then(projects => {
   *   console.log(
   *     'Projects belonging to either Bob or Sue:\n' +
   *     projects.map(p => p.name)
   *   );
   * });
   * ```
   *
   * @see Mapper#relations
   *
   * @param {string} relationName
   *   The name of the relation to return
   * @returns {Relation}
   */
  relation(relationName) {

    if (relationName instanceof Mapper) {

      // Just return any mapper instance directly. This is so you can pass some
      // relation directly.
      return relationName;
    }

    if (isFunction(relationName)) {

      // Permitting a `createRelation` function allows working with relations
      // that are not registered with `Mapper#relations`.
      return this.callCreateRelation(relationName);
    }

    if (!isString(relationName)) throw new TypeError(
      'Expected `relationName` to be a string, function or Mapper, ' +
      `got: ${inspect(relationName)}`
    );

    const { relations } = this.state;
    if (!(relationName in relations)) throw new TypeError(
      `No relation called '${relationName}'. Make sure you've registered it ` +
      `with '.relations({ ${relationName}: createRelation })'`
    );

    return this.callCreateRelation(relations[relationName], relationName);
  },

  /** @private */
  callCreateRelation(createRelation, name) {

    if (!isFunction(createRelation)) throw new TypeError(
      `Expected 'createRelation' to be a function, ` +
      `got: ${inspect(createRelation)}`
    );

    /**
     * Callback invoked with the `Mapper` instance and returning a `Relation`.
     *
     * @callback Mapper~createRelation
     * @this Mapper
     * @param {Mapper} Mapper
     *   The Mapper upon which this relation is being invoked.
     * @returns {Mapper} A relation instance.
     */
    const relation = createRelation.call(this, this);

    if (!relation instanceof Mapper) throw new TypeError(
      `Expected 'createRelation' function named '${name}' to return
      instance of 'Mapper', got: ${inspect(relation)}`
    );

    return name == null ? relation : relation.as(name);
  },

  /**
   * @method Mapper#with
   * @summary
   *
   * Specify relations to eager load.
   *
   * @description
   *
   * Specify relations to eager load with {@link Mapper#fetch},
   * {@link Mapper#find} etc. These are declared using the {@link Related}
   * class.
   *
   * ```js
   * // Get all posts created today, eager loading author relation for each.
   * atlas('Posts')
   *   .where('created_at', '>', moment().startOf('day'))
   *   .with(author')
   *   .fetch()
   *   .then(todaysPosts => {
   *     // ...
   *   });
   *
   * const { related } = atlas;
   *
   * // Load user with recent posts and unread messages.
   * atlas('Users').with(
   *
   *   // Eager load last twent posts.
   *   related('posts').with(related('comments').with('author')).mapper({
   *     query: query => query.orderBy('created_at', 'desc').limit(20)
   *   }),
   *
   *   // Eager load unread messages.
   *   related('receivedMessages').mapper('unread').as('unreadMessages')
   *
   * ).findBy('email', 'some.guy@domain.com').then(user => {
   *   console.log(`${user.name} has ${user.unreadMessages.length} unread messages`);
   * });
   * ```
   *
   * *See {@link Mapper#relations} for an example of how to set up this schema.*
   *
   * @todo Support saving relations.
   *
   * @param {...(Related|string|related.ALL|related.NONE)} related
   *   One or more `Related` instances or relation names. Pass
   *   {@link related.ALL} or {@link related.NONE} to select all relations or
   *   clear any previously specific relations.
   * @returns {Mapper}
   *   Mapper configured to eager load related records.
   */
  with(...related) {

    if (related[0] === ALL) {
      return this.setState({ related: this.getRelationNames() });
    }

    if (related[0] === NONE) {
      const previous = this.state.related;
      return isEmpty(previous) ? this : this.setState({ related: [] });
    }

    const previous = this.state.related || [];
    const flattened = flatten(related);

    return this.setState({
      related: [ ...previous, ...flattened ]
    });
  },

  /**
   * @method Mapper#load
   * @summary
   *
   * Eager load relations into existing records.
   *
   * @description
   *
   * Much like `with()`, but attaches relations to an existing record.
   *
   * `load` returns an instance of `EagerLoader`. `EagerLoader` exposes a
   * single method, `into`:
   *
   * ```js
   * const bob = { email: 'bob@thing.com', name: 'Bob', id: 5 };
   * const jane = { email: 'jane@thing.com', name: 'Jane', id: 100 };
   *
   * Users.load('posts').into(bob, jane).then(([bob, jane]) => {
   *   cosole.log(`Bob's posts: ${bob.posts.map(p => p.title)}`);
   *   cosole.log(`Jane's posts: ${jane.posts.map(p => p.title)}`);
   * });
   * ```
   *
   * ```js
   * // Load posts.
   * Posts.fetch(posts => {
   *   // Now load and attach related authors.
   *   return Posts.load('author').into(posts);
   * }).then(postsWithAuthor => {
   *   // ...
   * })
   *
   * // Exactly the same as:
   * Posts.with('author').fetch().then(postsWithAuthor => {
   *  // ...
   * })
   * ```
   *
   * *See `Mapper.relations()` for example of how to set up this schema.*
   *
   * @param {...(Related|string|related.ALL)} related
   *   One or more Related instances or relation names. Or {@link related.ALL}
   *   to select all registered relations.
   * @returns {EagerLoader}
   *   An EagerLoader instance configured to load the given relations into
   *   records.
   */
  load(...relations) {

    if (relations[0] === ALL) {
      relations = this.getRelationNames();
    } else if (relations[0] === NONE) {
      relations = [];
    } else {
      relations = flatten(relations);
    }

    return new EagerLoader(this, relations);
  }

};
