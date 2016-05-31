import { inspect } from 'util';
import {
  flatten, keys as objectKeys, reject, isEmpty, isFunction, isString
} from 'lodash';
import { isRelated } from '../related';
import EagerLoader from '../eager-loader';

export default {

  /**
   * @method Mapper#relations
   * @summary
   *
   * Define a `Mapper`'s relations.
   *
   * @example
   *
   * const { belongsTo, belongsToMany, hasMany } = atlas.relations;
   * const Mapper = atlas('Mapper');
   *
   * atlas.register({
   *
   *   Users: Mapper.table('users').idAttribute('email').relations({
   *     friends: belongsToMany('Users'),
   *     sentMessages: hasMany('Messages', { otherRef: 'from_id' }),
   *     receivedMessages: hasMany('Messages', { otherRef: 'to_id' }),
   *   }),
   *
   *   Messages: Mapper.table('messages').relations({
   *     from: belongsTo('Users', { selfRef: 'from_id' }),
   *     to: belongsTo('Users', { selfRef: 'to_id' })
   *   }).extend({
   *     unread() { return this.where('is_unread', true); },
   *     read() { return this.where('is_unread', false); }
   *   }),
   *
   *   Posts: Mapper.table('posts').relations({
   *     author: belongsTo('Users', { selfRef: 'author_id' }),
   *     comments: hasMany('Comments')
   *   }),
   *
   *   Comments: Mapper.table('comments').relations({
   *     author: belongsTo('Users', { selfRef: 'author_id' }),
   *     post: belongsTo('Posts')
   *   })
   *
   * );
   *
   * @see Mapper#load
   * @see Mapper#with
   * @see Atlas#relations
   *
   * @param {Object} relationByName
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
   * @method Mapper#getRelation
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
   *     owner: belongsTo('People', { selfRef: 'owner_id' })
   *   }),
   *
   *   People: Mapper.table('people').relations({
   *     projects: hasMany('Projects', { otherRef: 'owner_id' })
   *   })
   *
   * });
   *
   * // Assuming `req.user` is added by auth middleware (eg. Passport.js).
   *
   * // Simple `GET` route, scoped by user.
   * express.route('/projects').get((req, res) =>
   *   atlas('People').getRelation('projects').of(req.user).then(projects =>
   *     res.json(projects)
   *   )
   * );
   * ```
   *
   * ```js
   * // Alternative to above - share relation `Mapper` between between `GET` and
   * // `POST`.
   * express.route('/projects').all((req, res) => {
   *   req.Projects = atlas('People').getRelation('projects').of(req.user)
   *   next();
   * }).get((req, res) =>
   *   req.Projects.fetch().then(res.json)
   * ).post((req, res) =>
   *   req.Projects.save(req.body).then(res.json)
   * );
   *
   * express.route('/projects/:projectId').all((req, res) => {
   *   req.Project = atlas('People').getRelation('projects').of(req.user).target(
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
   * Users.getRelation('projects').of(bob, sue).then(projects => {
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
  getRelation(relationName) {

    if (!isString(relationName)) throw new TypeError(
      `Expected 'relationName' to be a string, got: ${relationName}`
    );

    const { relations } = this.state;
    if (!(relationName in relations)) throw new TypeError(
      `Unknown relation, got: '${relationName}'`
    );

    const createRelation = relations[relationName];
    if (!isFunction(createRelation)) throw new TypeError(
      `Expected relation '${relationName}' to be a function, ` +
      `got: ${createRelation}`
    );

    return createRelation(this);
  },

  /**
   * @method Mapper#with
   * @summary
   *
   * Specify relations to eager load.
   *
   * @description
   *
   * Specify relations to eager load with {@link Mapper#fetch fetch},
   * {@link Mapper#find find} etc. These are declared using the {@link Related}
   * class.
   *
   * ```js
   * const { related } = atlas;
   *
   * // Get all posts created today, eager loading author relation for each.
   * atlas('Posts')
   *   .where('created_at', '>', moment().startOf('day'))
   *   .with(related('author'))
   *   .fetch()
   *   .then(todaysPosts => ...);
   *
   * // Load user with recent posts and unread messages.
   * atlas('Users').with(
   *
   *   // Eager load last twent posts.
   *   related('posts').with(related('comments').with(related('author'))).mapper({
   *     query: query => query.orderBy('created_at', 'desc').limit(20)
   *   }),
   *
   *   // Eager load unread messages.
   *   related('receivedMessages').mapper('unread').as('unreadMessages')
   *
   * ).find('some.guy@domain.com').then(user => console.log(
   *   `${user.name} has ${user.unreadMessages.length} unread messages`
   * ));
   * ```
   *
   * *See {@link Mapper#relations} for an example of how to set up this schema.*
   *
   * @todo Support saving relations.
   *
   * @param {...Related|Related[]} related
   *   One or more Related instances describing the relation tree.
   * @returns {Mapper}
   *   Mapper configured to eager load related records.
   */
  with(...related) {
    const flattened = flatten(related);

    if (isEmpty(flattened)) {
      return this;
    }

    const invalid = reject(flattened, isRelated);
    if (!isEmpty(invalid)) throw new TypeError(
      `Expected instance(s) of Related, got: ${inspect(invalid)}`
    );

    const previous = this.state.related || [];

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
   * Users.load(related('posts')).into(bob, jane)
   * ```
   *
   * ```js
   * // Load posts.
   * Posts.fetch(posts =>
   *   // Now load and attach related authors.
   *   Posts.load(related('author')).into(posts)
   * ).then(postsWithAuthor => ...);
   *
   * // Exactly the same as:
   * Posts.with(related('author')).fetch().then(postsWithAuthor => ...);
   * ```
   *
   * *See `Mapper.relations()` for example of how to set up this schema.*
   *
   * @param {...Related|Related[]} related
   *   One or more Related instances describing the relation tree.
   * @returns {EagerLoader}
   *   An EagerLoader instance configured to load the given relations into
   *   records.
   */
  load(...related) {
    return new EagerLoader(this, flatten(related));
  }

};
