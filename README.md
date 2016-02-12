# Atlas

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/rhys-vdw/atlas?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Data mapper implementation for JavaScript. Atlas provides a fluent interface for manipulating relational database data.

Atlas utilizes Tim Griesser's excellent query builder and database adapter library [`Knex.js`](http://www.knexjs.org). Currently Atlas is only tested with PostgreSQL, but Knex's portability means that it should (ultimately) work with any Knex supported DBMS.

**Atlas is currently under development and is not ready for production.**

The following document is a work in progress. Posting questions to the issue tracker is encouraged. These will be used to improve documentation and feature implementation.

*Some of the functionality in this document is not fully tested and may not work.*

## Installation

Not yet on npm, install direct from GitHub:

```console
$ npm install github:rhys-vdw/atlas --save
$ npm install knex --save
```

```js
// atlas-instance.js

import Knex from 'knex';
import Atlas from 'atlas';

const knex = Knex({
  client: 'postgres',
  connection: {
    database: 'my_database',
    user: 'user'
  }
});

export default Atlas({ knex });
```

## Usage

```js
// example.js

import atlas from './atlas-instance';

const { NotFoundError, related } = atlas;
const { hasMany, hasOne, belongsToMany } = atlas.relations;

const Mapper = atlas('Mapper');

// Create simple Mappers for logins and posts.
const Logins = Mapper.table('logins');
const Posts = Mapper.table('posts');
const Groups = Mapper.table('groups');

// More complex mapper for `users` table.
const Users = Mapper.table('users').relations({
  posts: hasMany(Posts, { otherRef: 'author_id' }),
  lastLogin: hasOne(Logins.orderBy('created_at', 'desc')),
  groups: belongsToMany(Groups, { pivotTable: 'memberships' }),
});

// Calling `.where` duplicates the immutable `Mapper`.
const Admins = Users.where('is_admin', true);

Users.fetch().then(users =>
// select * from users;

// returns all users
users === [
  { id: 1, name: 'Annie', is_admin: true },
  { id: 2, name: 'Beth', is_admin: false },
  { id: 3, name: 'Chris', is_admin: false }
]

Admins.fetch().then(admins =>
// select * from users where is_admin = true;

Users.find(1, 2).then(([annie, beth] =>
// select * from users where id in (1, 2);

Admins.find(3).then(chris => /* ... */).catch(NotFoundError, err => {
// select * from users where is_admin = true and id in (1, 3);
  err.toString() === 'Error! No record found.'
});

// returns only administrators - Chris is not found.
users === [{ id: 1, name: 'Annie', is_admin: true }];

// Create a new administrator object with defaults.
const david = Admins.forge({ name: 'David' });
david === { name: 'David', is_admin: true };

// Also assigns defaults on insertion.
Admins.save(david, { name: 'Elinor' }).tap(([david, elinor]) => {
  // insert into users (name, is_admin) values (
  //   ('David', true), ('Elinor', true)
  // );

  david === { id: 4, name: 'David', is_admin: true };
  elinor === { id: 5, name: 'Elinor', is_admin: true };
}).then(([david, elinor]) => {

  david.name = 'David J Smith';

  // decides to `update` based on presence of `id` attribute.
  return Admins.save(david, { name: 'Heath' });
  // update users set name = 'David J Smith', is_admin = true where id = 4;
  // insert into users (name, is_admin) values (('Heath', true));
}).then(records =>
  Users.destroy(records);
  // delete from users where id in (4, 6)
).then(() =>

  Users.where({ name: 'Annie' }).with(
    related('groups', 'lastLogin'),
    related('posts').query(query =>
      query.orderBy('created_at', 'desc').limit(2)
    ).as('recentPosts')
  ).fetchOne()

  // Load up Annie and eager load relations.

).then(annie => {

  annie === {
    id: 1,
    name: 'Annie',
    lastLogin: { user_id: 1, created_at: '2015-11-26' },
    groups: [
      { id: 20, name: 'Super Friends', _pivot_user_id: 1 },
    ],
    recentPosts: [
      { id: 120, author_id: 1, created_at: '2015-11-24',
        title: 'Hi', message: 'Hey there!' },
      { id: 110, author_id: 1, created_at: '2015-10-30',
        title: 'Re: Greeting', message: 'Yo', }
    ]
  };

});
```

## API

### `Atlas`

#### `Atlas()`

```
Atlas(knex = null, registry = createRegistry()) -> atlas
```

```js
const atlas = Atlas(knex);
```

Creates a new `atlas` instance using query builder and connection from given `knex` instance.

If `knex` is null the instance can still be used to create an register Mappers, but no queries can be executed (eg. `fetch`, `save` etc will throw). Registry can then be added to a new connected instance of Atlas via the `registry` argument.

```js
// mapper-registry.ja

const atlas = Atlas();
const Mapper = atlas('Mapper');
const { hasMany } = atlas.relations;

const Purchases = Mapper.table('purchases');

const Customers = Mapper.table('customers').relations({
  purchases: hasMany('Purchases'),
  purchasedProducts: belongsToMany('Products', { Pivot: 'Purchases' })
});

const Products = Mapper.table('products').relations({
  sales: hasMany('Purchases');
  owners: belongsToMany('Users', { Pivot: 'Purchases' })
});

atlas.register({ Purchases, Customers, Products });

export default atlas.registry;
```

```js
import Atlas from 'atlas';
import pgKnex from './pg-knex';
import mapperRegistry from './mapper-registry';

const pg = Atlas(pgKnex, mapperRegistry);
const { related } = pg;

pg('Product').with(related('sales', 'owners')).fetch().then(products =>
  // Fetches and related records from PostgreSQL database.
):
```

### `atlas`

#### `atlas()`

```
atlas(mapperName) -> Mapper
```

Retrieve a mapper stored in Atlas's registry. A new `atlas` instance will have
the default Mapper under the key `'Mapper'`. Other mappers can be added via
`atlas.register()`.

```js
// Retrieve default Mapper.
Directors = atlas('Mapper').table('directors');

// Retrieve the previously stored Mapper 'Movies' and perform a query on it.
atlas('Movies').where({ genre: 'horror' }).count().then(count => {
  console.log(`${count} horror movies found.`);
});
```

#### `atlas.register()`

```
atlas.register(name, Mapper) -> atlas
atlas.register({ [name]: Mapper }) -> atlas
```

Adds a `Mapper` instance to Atlas's registry under given `name`. Registered
mappers can be retrieved via `atlas(mapperName)`. Using a registry helps to
break dependancy cycles between modules.

```js
const Mapper = atlas('Mapper');

const Users = Mapper.table('users').idAttribute('user_id');
atlas.register('Users', Users);

atlas.register({
  NewestUser: Users.orderBy({ created_at: 'desc' }).one()
});
```

Mapper names can also be used directly in relationship definitions, for example:

```js
const { belongsTo, hasMany } = atlas.relations;

// Using registry allows either side of the relation to reference the other
// before it is declared.
const Pet = Mapper.table('pets').relations({ owner: belongsTo('Owner') });
const Owner = Mapper.table('owners').relations({ pets: hasMany('Pets') });
atlas.register({ Pet, Owner });
```

#### `atlas.override()`

```
atlas.override(name, Mapper) -> atlas
atlas.override({ [name]: Mapper }) -> atlas
```

```js
import { snakeCase, camelCase } from 'lodash/string';

function camelCasePlugin(atlas) {

  // Override base 'Mapper' with different key parsing methods.
  return atlas.override('Mapper', Mapper.extend({
    columnToAttribute: camelCase,
    attributeToColumn: snakeCase
  });
}
```

Allows reassignment of a given Mapper. Basically exists for the sole purpose of
reassigning `'Mapper'` for a plugin.

#### `atlas.transaction()`

```
atlas.transaction((t, trx) => /* ... */) -> Promise
```

Execute queries in a transaction. Provide a callback argument that returns a
`Promise`. If the promise is resolve the transaction will be commited. If it
is rejected then the commit will be rolled back.

```js
app.post('groups/', (req, res) => {

  const { ...group, members } = req.body;

  atlas.transaction(t => {

    // Create the new group.
    return t('Groups').save(group).then(group =>

      // Insert each user then reattach them to the `group`. If any of these
      // insertions throws then the entire operation will be rolled back.
      t('Groups').related(group, 'members').insert(members)
        .then(members => { ...group, members })
    );

  }).then(group =>
    res.status(200).send(group)
  )).catch(ValidationError, error =>
    // ValidationError is NYI
    res.status(400).send(error.message)
  ).catch(() =>
    res.status(500).send('Server error')
  );
});
```

Callback receives arguments `t` and `trx`. `t` is an instance of Atlas connected
to the knex transaction. If you wish to use the knex transaction directly you
can use the second argument:

```js
atlas.transaction((t, trx) => {
  return trx('users').join('posts', 'posts.author_id', 'users.id')
    .then(usersAndPosts => {
      // ...
    });
}).then(result => // ...
```

See [Knex.js transaction documentation](http://knexjs.org/#Transactions) for
more information.

### Mapper

`Mappers` represent a set of data in your database. A `Mapper` can be scoped or
specialized by chaining calls to its methods.

Mappers are immutable, so any setter method will return a copy of the Mapper
insance with the new settings. A `Mapper` need never be instantiated with
`new`, instead each method call that would mutate the instance returns a
copy.


```js
// Get the base mapper from `atlas`.
const Mapper = atlas('Mapper');

// Create a new Mapper that represents users.
const Users = Mapper.table('users').idAttribute('user_id');

// Create one from `Users` that represents administrators.
const Admins = Users.where('id_admin', true);

// select * from users where is_admin = true;
Admins.fetch().then(admins => {
  // ...
});
```

These docs instead use the convention of naming mappers in `PascalCase` and
records in `camelCase`. This is okay because the `Mapper` constructor never
appears in your code.

```js
Cars.fetch().then(cars => /* ... */
```

#### `Mapper.table()`

```
Mapper.table(tableName:string) -> Mapper
```

Set the table of a `Mapper`.

```js
const { Mapper } = atlas;

const Dogs = Mapper.table('dogs');
const Cats = Mapper.table('cats');
```

#### `Mapper.idAttribute()`

```
Mapper.idAttribute(attribute:string|string[]) -> Mapper
```

Set the primary key(s) for a `Mapper`. Default is `'id'`.

```js
const Accounts = Mapper
  .table('accounts')
  .idAttribute('email');

// select * from accounts where email='username@domain.com';
Accounts.find('username@domain.com').then(user =>
```

```js
const Groups = Mapper
  .table('memberships')
  .idAttribute(['user_id', 'group_id']);
```

#### `Mapper.forge()`

```
Mapper.forge(attributes) -> Mapper
```

Create a new record object. This doesn't persist any data, it just creates an
instance to be manipulated with JavaScript. By default this is an instance of
`Object`.

```js
const record = Mapper.forge()
// {}

const record = Mapper.forge({ name: 'Beatrice' });
// { name: 'Beatrice' }

const Messages = Mapper.tables('messages').defaultAttributes({
  created_at: () => new Date(),
  urgency: 'low'
});

const messages = Messages.forge(
  { message: `How's it goin?` },
  { message: `Out of beer!`, urgency: `critical` }
);
// [
//   { message: 'How's it goin?', created_at: '2015-11-28', urgency: 'low' },
//   { message: 'Out of beer!', created_at: '2015-11-28', urgency: 'critical' }
// ]
```

Forge is not that useful when using plain objects, but it is possible to change
the type of the records that Atlas produces and consumes by overriding the
`createRecord`, `getAttributes`, `setAttributes`, `getRelated` and `setRelated`
methods.

#### `Mapper.defaultAttributes()`

```
Mapper.defaultAttributes({ [attribute]: value }) -> Mapper
```

Change the default values set by a given Mapper. This will be applied whenever
a new record is inserted with `save()` or created by `forge()`.

```js
const User = Mapper.tables.defaultAttributes({
  name: 'Anonymous', is_admin: false
});
```

Alternatively defaults can be supplied as callbacks that yield a default value.
In the below example a new document record is generated with a default name and
template.

```js
const HtmlDocuments = Mapper.table('documents').defaultAttributes({
  title: 'New Document',
  content: attributes => (
`<html>
  <head>
    <title>${ attributes.title || 'New Document'}</title>
  </head>
  <body>
  </body>
</html>`
  )
});

HtmlDocuments.save({ title: 'Atlas Reference' }).then(doc =>
  // doc:
  {
    title: 'Atlas Reference',
    content: '<html>\n  <head>\n    <title>Atlas Reference</title>...'
  }
);
```

#### `Mapper.strictAttributes()`

```js
Mapper.strictAttributes({ [attribute]: value }) -> Mapper
```

Similar to `defaultAttributes`, but overrides attributes.

```js
Users = Mapper.table('users').strictAttributes({
  email: attributes => attributes.email.trim(),
  is_admin: false
});
```

#### `Mapper.fetch()`

```js
Mapper.fetch() -> Promise<Object|Object[]>
```

Retrieve one or more records.

```js
// select * from people;
People.fetch().then(people =>
  // people:
  [{ id: 1, name: 'Tom'   },
   { id: 2, name: 'Dick'  },
   { id: 3, name: 'Harry' }]
);
```

#### `Mapper.one()`

Limit the result of a `fetch` to a single record. Causes `fetch()` to resolve to
a single record. Opposite of `Mapper.all()`.

```js
const People = Mapper.table('people');
const Person = People.one();

// select * from people where name = 'Tom' limit 1;
Person.where({ name: 'Tom'}).fetch().then(person =>
  // person:
  { id: 1, name: 'Tom' }
);
```

#### `Mapper.all()`

Unlimit a query. This causes `Mapper.fetch()` to resolve to an array. This is
default behaviour, and can be used to override `Mapper.one()`.

#### `Mapper.find()`

```
Mapper.find(...ids:mixed)
```

Retrieve a set of records by their `idAttribute` column. Accepts record(s)
as well as IDs. Equivalent to `Mapper.findBy(idAttribute, ...ids)`.

```js
const Rooms = Mapper.table('rooms');

Rooms.find(1).then(rooms =>
```

```js
const Bookings = Mapper
  .table('bookings')
  .idAttribute(['guest_id', 'room_id']);

// select * from bookings where guest_id=5 and room_id=6
Bookings.find([5, 6]).then(booking =>

// select * from bookings where guest_id=5 and room_id=6
Bookings.find({ guest_id: 5, room_id: 6 }).then(booking =>
```

#### `Mapper.findBy()`

```
Mapper.findBy(attribute:string, ...ids:mixed)
```

Fetch a record from the database by attribute.

```js
Users.findBy('email', 'email@domain.com').then(user =>

// equivalent to:

Users.where({ email: 'email@domain.com' }).one().fetch().then(user =>
```

#### `Mapper.require()`

```
Mapper.require().fetch()
```

Setting `require` will cause `fetch` and `find` to throw when a query returns no
records.

```js
const { NotFoundError, NoRowsFoundError } = atlas;

User.where('created_at', <, new Date(1500, 0, 1)).fetch()
  .then(user => console.log(user.name))
  .catch(
```

#### `Mapper.query()`

```
Mapper.query(method:string, ...args:mixed) -> Mapper
Mapper.query(callback:function) -> Mapper
```

Modify the underlying Knex [`QueryBuilder`](http://knexjs.org/#Builder)
instance directly.

#### `Mapper.where()`

```
Mapper.where(attribute:string, value:mixed) -> Mapper
Mapper.where(attribute:string, operator:string, value:mixed) -> Mapper
Mapper.where(attributes:string[], values:mixed[]) -> Mapper
Mapper.where({ attribute: value }) -> Mapper
Mapper.where(callback:function) -> Mapper
```

Passthrough to [`QueryBuilder.where`](http://knexjs.org/#Builder-where) that
respects `Mapper.attributeToColumn` if overridden.

#### `Mapper.whereIn()`

```
Mapper.where(attribute:string, value:mixed[]) -> Mapper
Mapper.where(attributes:string[], values:mixed[][]) -> Mapper
```

Passthrough to [`QueryBuilder.whereIn`](http://knexjs.org/#Builder-whereIn)
that respects `Mapper.attributeToColumn` if overridden.

#### `Mapper.save()`

```
Mapper.save(record:Object) -> Promise<Object>
Mapper.save(...records:Object|Object[]) -> Promise<Object[]>
```

Insert or update one or more records. The decision of whether to insert or
update is based on the result of testing each record with `Mapper.isNew`.

#### `Mapper.update()`

```
Mapper.update(record:Object) -> Promise<Object>
Mapper.update(...records:Object|Object[]) -> Promise<Object[]>
```

Update rows corresponding to one or more records. If the `idAttribute` is not
set on one of the records then the returned promise will be rejected with an
`UnidentifiableRecordError`.

#### `Mapper.insert()`

```
Mapper.insert(record:Object) -> Promise<Object>
Mapper.insert(...records:Object|Object[]) -> Promise<Object[]>
```

Insert a record or an array of records into the `table` assigned to this
`Mapper`. This is useful as an alternative to `save()` if you to insert
a record that already has an ID value.

#### `Mapper.destroy()`

```
Mapper.destroy(...ids:mixed|mixed[]) -> Promise<Number>
```

Delete all corresponding rows. Rows can be specified by supplying one or more
record objects with IDs, or ID values.

```js
const Users = atlas('Mapper').table('users');

Users.destroy(5).then(count =>
  // delete from users where id = 5
  // count === 1
);

Users.destroy(1, 2, 3).then(count =>
  // delete from users where id in (1, 2, 3)
  // count === 3
);

const sam = { id: 5, name: 'Sam' };
const jane = { id: 16, name: 'Jane' };

// Use `require()` to raise an exception if no rows are deleted.
// delete from users where id in (5, 16)
Users.require().destroy(sam, jane).then(count =>
  console.log('deleted sam and jane')
).catch(atlas.NoRowsFoundError, err => /* ... */);
```

#### `Mapper.destroyAll()`

```
Mapper.destroyAll() -> Promise<Number>
```

Delete all rows matching the current query. Returns the number of rows deleted.

```js
Users.where('complaint_count', '>', 10).destroy().then(count =>
  // delete from users where complaint_count > 10;
  // count === 0   :-)
);
```

#### `Mapper.relations()`

```
Mapper.relations(relationsByName:object)
```

Define a `Mapper`'s relations.

```js
const { belongsTo, belongsToMany, hasMany } = atlas.relations;
const Mapper = atlas('Mapper');

atlas.register({

  Users: Mapper.table('users').idAttribute('email').relations({
    friends: belongsToMany('Users'),
    sentMessages: hasMany('Messages', { otherRef: 'from_id' }),
    receivedMessages: hasMany('Messages', { otherRef: 'to_id' }),
  }),

  Messages: Mapper.table('messages').relations({
    from: belongsTo('Users', { selfRef: 'from_id' }),
    to: belongsTo('Users', { selfRef: 'to_id' })
  }).extend({
    unread() { return this.where('is_unread', true); },
    read() { return this.where('is_unread', false); }
  }),

  Posts: Mapper.table('posts').relations({
    author: belongsTo('Users', { selfRef: 'author_id' }),
    comments: hasMany('Comments')
  }),

  Comments: Mapper.table('comments').relations({
    author: belongsTo('Users', { selfRef: 'author_id' }),
    post: belongsTo('Posts')
  })

);
```

See `Mapper.load` and `Mapper.with` for more on relations.

#### `Mapper.with()`

```
Mapper.with(...related:Related|Related[]) -> Mapper
```

Specify relations to eager load with `fetch`, `find` etc. These are declared
using the `Related` class. In future this will also support saving relations.

```js
const { related } = atlas;

// Get all posts created today, eager loading author relation for each.
atlas('Posts')
  .where('created_at', '>', moment().startOf('day'))
  .with(related('author'))
  .fetch()
  .then(todaysPosts => /* ... */);

// Load user with recent posts and unread messages.
atlas('Users').with(

  // Eager load last twent posts.
  related('posts').with(related('comments').with(related('author'))).mapper({
    query: query => query.orderBy('created_at', 'desc').limit(20)
  }),

  // Eager load unread messages.
  related('receivedMessages').mapper('unread').as('unreadMessages')

).find('some.guy@domain.com').then(user =>
  console.log(`${user.name} has `${user.unreadMessages.length} unread messages`)
);
```

*See `Mapper.relations()` for example of how to set up this schema.*

#### `Mapper.load().into()`

```
Mapper.load(...related:Related|Related[]) -> EagerLoader
EagerLoader.into(...records) -> Promise<Object|Object[]>
```

Attach related records to records that already exist. Much like `with()`, but to
be used when records already exist.

`load()` returns an instance of `EagerLoader`. `EagerLoader` exposes a
single method, `into()`. eg:

```js
const bob = { email: 'bob@thing.com', name: 'Bob', id: 5 };
const jane = { email: 'jane@thing.com', name: 'Jane', id: 100 };

Users.load(related('posts')).into(bob, jane)
```

```js
// Load posts.
Posts.fetch(posts =>
  // Now load and attach related authors.
  Posts.load(related('author')).into(posts)
).then(postsWithAuthor => /* ... */ );

// Exactly the same as:
Posts.with(related('author')).fetch().then(postsWithAuthor => /* ... */);
```

*See `Mapper.relations()` for example of how to set up this schema.*

#### `Mapper.getRelation().of()`

```
Mapper.getRelation(relationName:string) -> Relation
Relation.of(...records:Object|Object[]) -> Mapper
```

Get a named `Relation` instance from a `Mapper`.

The relation can be converted into a Mapper matching records in that relation.
Each `Relation` type (`BelongsTo`, `BelongsToMany`, `HasOne` and `HasMany`)
provides an `of()` method that accepts one or more records.

```js
atlas.register({

  Projects: Mapper.table('projects').relations({
    owner: belongsTo('People', { selfRef: 'owner_id' })
  }),

  People: Mapper.table('people').relations({
    projects: hasMany('Projects', { otherRef: 'owner_id' })
  })

});

// Assuming `req.user` is added by auth middleware (eg. Passport.js).

// Simple `GET` route, scoped by user.
express.route('/projects').get((req, res) =>
  atlas('People').getRelation('projects').of(req.user).then(projects =>
    res.json(projects)
  )
);
```

```js
// Alternative to above - share relation `Mapper` between between `GET` and
// `POST`.
express.route('/projects').all((req, res) => {
  req.Projects = atlas('People').getRelation('projects').of(req.user)
  next();
}).get((req, res) =>
  req.Projects.fetch().then(res.json)
).post((req, res) =>
  req.Projects.save(req.body).then(res.json)
);

express.route('/projects/:projectId').all((req, res) => {
  req.Project = atlas('People').getRelation('projects').of(req.user).target(
    req.params.projectId
  ).require();
  next();
}).get((req, res) =>
  req.Project.fetch().then(res.json)
).put((req, res) =>
  // Automatically overrides `owner_id` before insert, regardless of `req.body`.
  req.Projects.save(req.body).then(res.json)
);
```

This also allows querying on a relation of multiple parents.

```js
const bob = { id: 1, name: 'Bob' };
const sue = { id: 2, name: 'Sue' };

// select * from projects where owner_id in (1, 2)
Users.getRelation('projects').of(bob, sue).then(projects => {
  console.log(
    'Projects belonging to either Bob or Sue:\n' +
    projects.map(p => p.name)
  );
});
```

### `Related`

`Related` is a helper user to describe relation trees. Instances are passed to
`Mapper.with` and `Mapper.load` for eager loading.

For brevity, a convenience function `atlas.related` is provided:

```
related(relationName:string) -> Related
related(...relationName:string[]) -> Related[]
```

```js
Book.where({ author: 'Frank Herbert' })
  .with(related('coverImage'))
  .fetch()
  .then(books => books.map(renderThumbnail));

Book.with(
  related('chapters', 'coverImage').map(r => r.require())
).findBy('isbn', '9780575035409').then(book =>
  renderBook(book)
);
```

`Related`, like `Mapper`, inherits from `ImmutableBase`. Subsequent method
invocations return a copy, rather than mutating the `Related` instance.

Reusing a `Related` instance for paginated relation:

```js
const { related } = atlas;
const pageSize = 20;
const postsPage = related('inboxEmails')
  .mapper(m => m.orderBy('created_at').limit(pageSize))
  .require();

express.get('/board/:boardName', (req, res) =>
  const page = req.query.page || 0;
  const posts = postsPage.mapper({ offset: pageSize });
  Board.with(posts).findBy('name', req.params.boardName).then(board => {
    res.html(renderBoard(board));
  }).catch(NoRowFoundError, error =>
    res.status(404).html(render404())
  );
});
```

#### `Related.as`

```
Related.as() -> Related
```

Alias a relation.

Changes the key by which related records are attached to their parents.

```js
Player.with(
  related('inventory').mapper({ where: { type: 'weapon' } }).as('weapons'),
  related('inventory').mapper({ where: { type: 'armor' } }).as('armor')
).findBy('username', username).then(player => {
  game.addPlayer(player);
});
```

#### `Related.mapper`

```
Related.mapper(...initializers:string|Object|function) -> Related
```

Queue up initializers for the `Mapper` instance used to query the relation.
Accepts the same arguments as `Mapper.withMutations`.

```js
Account.with(related('inboxMessages').mapper(m =>
  m.where({ unread: true })
)).fetch().then(account => // ...

Account.with(
  related('inboxMessages').mapper({ where: { unread: true } })
).fetch().then(account => // ...
```

#### `Related.require`

```
Related.require() -> Related
```

Return a new `Related` instance that will throw if no records are returned.
Currently this is just a passthrough to `Mapper.require()`

#### `Related.with`

```
Related.with(...related) -> Related
```

Fetch relations of relations.

```js
atlas('Actors').with(
  related('movies').with(related('director'))
).findBy('name', 'James Spader').then(actor =>
  assert.deepEqual(
    actor,
    { id: 2, name: 'James Spader', movies: [
      { _pivot_actor_id: 2, id: 3, title: 'Stargate', director_id: 2,
        director: { id: 2, name: 'Roland Emmerich' }
      },
      // ...
    ]},
  )
);
```

#### `Related.recursions()`

```
Related.recursions(recursionCount) -> Related
```

Fetch a relation recursively.

```js
Person.with(
  related('father').recursions(3)
).findBy('name', 'Kim Jong-un').then(person => {
 assert.deepEqual(person, {
   id: 4,
   name: 'Kim Jong-un',
   father_id: 3,
   father: {
     id: 3,
     name: 'Kim Jong-il',
     father_id: 2,
     father: {
       id: 2,
       name: 'Kim Il-sung',
       father_id: 1,
       father: {
         id: 1,
         name: 'Kim Hyong-jik',
         father_id: null
       }
     }
   }
 });
})
```

```js
knex('nodes').insert([
    { id: 1, value: 'a', next_id: 2 },
    { id: 2, value: 't', next_id: 3 },
    { id: 3, value: 'l', next_id: 4 },
    { id: 4, value: 'a', next_id: 5 },
    { id: 5, value: 's', next_id: 6 },
    { id: 6, value: '.', next_id: 7 },
    { id: 7, value: 'j', next_id: 8 },
    { id: 8, value: 's', next_id: null }
])

atlas.register({
  Nodes: Mapper.table('nodes').relations({
    next: belongsTo('Nodes', { selfRef: 'next_id' })
  })
});

// Fetch nodes recursively.
atlas('Nodes').with(
  related('next').recursions(Infinity)).find(1)
).then(node =>
  const values = [];
  while (node.next != null) {
    letters.push(node.value);
    node = node.next;
  }
  console.log(values.join('')); // "atlas.js"
);
```

