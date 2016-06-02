# Atlas

[![Build Status](https://travis-ci.org/rhys-vdw/atlas.svg?branch=master)](https://travis-ci.org/rhys-vdw/atlas)
[![codecov](https://codecov.io/gh/rhys-vdw/atlas/branch/master/graph/badge.svg)](https://codecov.io/gh/rhys-vdw/atlas)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/rhys-vdw/atlas?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Data mapper implementation for JavaScript. Atlas provides a fluent interface for manipulating a relational database.

Atlas uses [`Knex.js`](http://www.knexjs.org) to build and execute queries.

**Atlas is not yet released**

Atlas is thoroughly tested, but barely used. The API may change (probably not dramatically).  Posting feedback and questions to the issue tracker is encouraged.

Currently Atlas is only tested with PostgreSQL, but Knex's portability means that it should (ultimately) work with any Knex supported DBMS.


## Installation

Not yet on npm, install direct from GitHub:

```console
$ npm install rhys-vdw/atlas --save
$ npm install knex --save
```

## Configuration

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
}).then(records => {

  return Users.destroy(records);
  // delete from users where id in (4, 6)

}).then(() => {

  // Load up Annie and eager load relations.
  return Users.where({ name: 'Annie' }).with(
    related('groups', 'lastLogin'),
    related('posts').query(query =>
      query.orderBy('created_at', 'desc').limit(2)
    ).as('recentPosts')
  ).first();

).then(annie => {

  // annie:
  {
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
  }

});
```

## Classes

<dl>
<dt><a href="#Atlas">Atlas</a></dt>
<dd><p>The <code>atlas</code> instance is a helper function. It wraps a <code>Knex</code> instance and a
mapper registry.</p>
<p>Passing a string to <code>atlas</code> retrieves a registered <a href="#Mapper">Mapper</a> by name.</p>
<pre><code class="language-javascript">// Retrieve a mapper stored in Atlas&#39;s registry.
const Mapper = atlas(&#39;Mapper&#39;);
</code></pre>
<p>A new <code>atlas</code> instance has the default Mapper under the key <code>&#39;Mapper&#39;</code>.
Other mappers can be added via <a href="#Atlas+register">register</a>.</p>
<pre><code class="lang-js">const Movies = atlas(&#39;Mapper&#39;).table(&#39;movies&#39;);
atlas.register({ Movies });
</code></pre>
<p>Retrieve the previously stored Mapper &#39;Movies&#39; and perform a query on it.</p>
<pre><code class="lang-js">atlas(&#39;Movies&#39;).where({ genre: &#39;horror&#39; }).count().then(count =&gt; {
  console.log(`${count || &#39;No&#39;} horror movies found.`);
});
</code></pre>
</dd>
<dt><a href="#EagerLoader">EagerLoader</a></dt>
<dd><p>Eager loads related records into an existing record.</p>
</dd>
<dt><a href="#ImmutableBase">ImmutableBase</a></dt>
<dd><p>Base class for <a href="#Mapper">Mapper</a>.</p>
</dd>
<dt><a href="#Mapper">Mapper</a> ⇐ <code><a href="#ImmutableBase">ImmutableBase</a></code></dt>
<dd><p>Mappers represent a set of data in your database. A mapper can be scoped or
specialized by chaining calls to its methods.</p>
<p>Mappers are immutable, so any setter method will return a copy of the Mapper
insance with the new settings. <code>Mapper</code> instances need never be instantiated
with <code>new</code>, instead each method call that would mutate the instance returns a
copy.</p>
<pre><code class="language-javascript">// Get the base mapper from `atlas`.
const Mapper = atlas(&#39;Mapper&#39;);

// Create a new Mapper that represents users.
const Users = Mapper.table(&#39;users&#39;).idAttribute(&#39;user_id&#39;);

// Create one from `Users` that represents administrators.
const Admins = Users.where(&#39;is_admin&#39;, true);

// select * from users where is_admin = true;
Admins.fetch().then(admins =&gt; {
  // ...
});
</code></pre>
<p>These docs instead use the convention of naming mappers in <code>PascalCase</code> and
records in <code>camelCase</code>. This is okay because the <code>Mapper</code> constructor never
appears in your code.</p>
<pre><code class="lang-js">Cars.fetch().then(cars =&gt; // ...
</code></pre>
</dd>
<dt><a href="#Registry">Registry</a></dt>
<dd><p>A simple map for storing instances of <a href="#Mapper">Mapper</a>. The registry can be
helped to break dependency cycles between mappers defined in different
scripts.</p>
<p>Each <a href="#Atlas">Atlas</a> instance has a <a href="#Atlas+registry">registry property</a>.</p>
<p>All manipulation of the registry can be done via the Atlas instance.</p>
</dd>
<dt><a href="#Related">Related</a> ⇐ <code><a href="#ImmutableBase">ImmutableBase</a></code></dt>
<dd><p><code>Related</code> is a helper to describe relation trees. Instances are passed to
<code>Mapper.with</code> and <code>Mapper.load</code> for eager loading.</p>
</dd>
</dl>

## Objects

<dl>
<dt><a href="#errors">errors</a> : <code>object</code></dt>
<dd><p>Can be accessed via <a href="#Atlas.errors">errors</a> or imported directly.</p>
<pre><code class="language-javascript">const { NotFoundError } = Atlas.errors;
</code></pre>
<pre><code class="lang-js">import { NotFoundError } from &#39;atlas/errors&#39;;
</code></pre>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#related">related(relationName)</a> ⇒ <code><a href="#Related">Related</a></code> | <code><a href="#Related">Array.&lt;Related&gt;</a></code></dt>
<dd><p>Convenience function to help build <a href="#Related">Related</a> instances.</p>
</dd>
</dl>

<a name="Atlas"></a>

## Atlas
_Initialize **Atlas.js**._

The `atlas` instance is a helper function. It wraps a `Knex` instance and a
mapper registry.

Passing a string to `atlas` retrieves a registered [Mapper](#Mapper) by name.

```js
// Retrieve a mapper stored in Atlas's registry.
const Mapper = atlas('Mapper');
```

A new `atlas` instance has the default Mapper under the key `'Mapper'`.
Other mappers can be added via [register](#Atlas+register).

```js
const Movies = atlas('Mapper').table('movies');
atlas.register({ Movies });
```

Retrieve the previously stored Mapper 'Movies' and perform a query on it.

```js
atlas('Movies').where({ genre: 'horror' }).count().then(count => {
  console.log(`${count || 'No'} horror movies found.`);
});
```


* [Atlas](#Atlas)
    * [new Atlas(knex, [registry])](#new_Atlas_new)
    * _instance_
        * [.knex](#Atlas+knex) : <code>Knex</code>
        * [.override(nameOrMappersByName, [mapper])](#Atlas+override) ⇒ <code>[Atlas](#Atlas)</code>
        * [.register(nameOrMappersByName, [mapper])](#Atlas+register) ⇒ <code>[Atlas](#Atlas)</code>
        * [.registry](#Atlas+registry) : <code>[Registry](#Registry)</code>
        * [.related](#Atlas+related) : <code>function</code>
        * [.relations](#Atlas+relations) : <code>Object</code>
        * [.transaction(callback)](#Atlas+transaction) ⇒ <code>Promise</code>
    * _static_
        * [.VERSION](#Atlas.VERSION) : <code>string</code>
        * [.errors](#Atlas.errors) : <code>[errors](#errors)</code>
        * [.plugins](#Atlas.plugins) : <code>Object</code>
    * _inner_
        * [~transactionCallback(t)](#Atlas..transactionCallback)


-

<a name="new_Atlas_new"></a>

### new Atlas(knex, [registry])
Creates a new `atlas` instance using query builder and connection from given
`knex` instance.

If `knex` is null the instance can still be used to create and register
mappers, but no queries can be executed ([fetch](#Mapper+fetch),
[save](#Mapper+save) etc will throw).

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

**Returns**: <code>function</code> - `atlas` function.  

| Param | Type | Description |
| --- | --- | --- |
| knex | <code>Knex</code> | A configured instance of `[Knex](http://knex.js)`. |
| [registry] | <code>[Registry](#Registry)</code> | An existing Mapper registry. If none is passed then one will be   created with the base mapper under key `'Mapper'`. |


-

<a name="Atlas+knex"></a>

### atlas.knex : <code>Knex</code>
Knex instance used by this `Atlas` instance.

**Read only**: true  

-

<a name="Atlas+override"></a>

### atlas.override(nameOrMappersByName, [mapper]) ⇒ <code>[Atlas](#Atlas)</code>
Like [register](#Atlas+register) but allows a registered `Mapper` to be
replaced.

**Returns**: <code>[Atlas](#Atlas)</code> - Self, this method is chainable.  

| Param | Type | Description |
| --- | --- | --- |
| nameOrMappersByName | <code>string</code> &#124; <code>Object</code> | Either the name of a single `Mapper` to register, or a hash of `Mapper`   instances keyed by name. |
| [mapper] | <code>[Mapper](#Mapper)</code> | The mapper to be registered if a name is provided as the first argument. |


-

<a name="Atlas+register"></a>

### atlas.register(nameOrMappersByName, [mapper]) ⇒ <code>[Atlas](#Atlas)</code>
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

Mapper names can also be used directly in relationship definitions, for
example:

```js
const { belongsTo, hasMany } = atlas.relations;

// Using registry allows either side of the relation to reference the other
// before it is declared.
const Pet = Mapper.table('pets').relations({ owner: belongsTo('Owner') });
const Owner = Mapper.table('owners').relations({ pets: hasMany('Pets') });
atlas.register({ Pet, Owner });
```

**Returns**: <code>[Atlas](#Atlas)</code> - Self, this method is chainable.  

| Param | Type | Description |
| --- | --- | --- |
| nameOrMappersByName | <code>string</code> &#124; <code>Object</code> | Either the name of a single `Mapper` to register, or a hash of `Mapper`   instances by name. |
| [mapper] | <code>[Mapper](#Mapper)</code> | The mapper to be registered if a name is provided as the first argument. |


-

<a name="Atlas+registry"></a>

### atlas.registry : <code>[Registry](#Registry)</code>
Registry used by this `Atlas` instance.

**Read only**: true  

-

<a name="Atlas+related"></a>

### atlas.related : <code>function</code>
Accessor for `related` helper function.

**Read only**: true  
**See**: [related](#related)  

-

<a name="Atlas+relations"></a>

### atlas.relations : <code>Object</code>
**Todo**

- [ ] document or change

**Properties**

| Name | Type |
| --- | --- |
| belongsTo | <code>belongsTo</code> | 
| belongsToMany | <code>belongsToMany</code> | 
| hasOne | <code>hasOne</code> | 
| hasMany | <code>hasMany</code> | 


-

<a name="Atlas+transaction"></a>

### atlas.transaction(callback) ⇒ <code>Promise</code>
Execute queries in a transaction. Provide a callback argument that returns
a `Promise`. If the promise is resolved the transaction will be commited. If
it is rejected then the commit will be rolled back.

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

Callback receives argument `t`, an instance of Atlas connected to the knex
transaction. The knex `Transaction` instance is available as
`[t.knex](#Atlas+knex)`:

```js
atlas.transaction(t => {
  return t.knex('users').join('posts', 'posts.author_id', 'users.id')
    .then(usersAndPosts => {
      // ...
    });
}).then(result => // ...
```

**Returns**: <code>Promise</code> - A promise resolving to the value returned from the callback.  
**See**: Knex.js [transaction documentation](http://knexjs.org/#Transactions)
  for more information.  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>[transactionCallback](#Atlas..transactionCallback)</code> | Callback within which to write transacted queries. |


-

<a name="Atlas.VERSION"></a>

### Atlas.VERSION : <code>string</code>
Installed version of Atlas.js

```js
console.log(Atlas.VERSION);
// 1.0.0
```


-

<a name="Atlas.errors"></a>

### Atlas.errors : <code>[errors](#errors)</code>

-

<a name="Atlas.plugins"></a>

### Atlas.plugins : <code>Object</code>
**Properties**

| Name | Type |
| --- | --- |
| CamelCase | <code>CamelCase</code> | 
| FormatAttributes | <code>FormatAttributes</code> | 
| Timestamp | <code>Timestamp</code> | 


-

<a name="Atlas..transactionCallback"></a>

### Atlas~transactionCallback(t)
A callback function that runs the transacted queries.


| Param | Type | Description |
| --- | --- | --- |
| t | <code>[Atlas](#Atlas)</code> | An instance of `Atlas` connected to the transaction. |
| t.knex | <code>Transaction</code> | The Knex.js `Transaction`instace. |


-

<a name="EagerLoader"></a>

## EagerLoader
Eager loads related records into an existing record.

**See**: [load](#Mapper+load)  

* [EagerLoader](#EagerLoader)
    * [new EagerLoader(Self, related)](#new_EagerLoader_new)
    * [.into()](#EagerLoader+into) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>


-

<a name="new_EagerLoader_new"></a>

### new EagerLoader(Self, related)

| Param | Type | Description |
| --- | --- | --- |
| Self | <code>[Mapper](#Mapper)</code> | Mapper of target records. |
| related | <code>[Related](#Related)</code> &#124; <code>[Array.&lt;Related&gt;](#Related)</code> | One or more Related instances describing the relation tree. |


-

<a name="EagerLoader+into"></a>

### eagerLoader.into() ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
Load relations into one or more records.

**Returns**: <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code> - One or more records with relations.  

-

<a name="ImmutableBase"></a>

## ImmutableBase
Base class for [Mapper](#Mapper).


* [ImmutableBase](#ImmutableBase)
    * _instance_
        * [.asImmutable()](#ImmutableBase+asImmutable) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.asMutable()](#ImmutableBase+asMutable) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.extend(...callbackOrMethodsByName)](#ImmutableBase+extend) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.requireState(key)](#ImmutableBase+requireState) ⇒ <code>mixed</code>
        * [.setState(nextState)](#ImmutableBase+setState) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.state](#ImmutableBase+state) : <code>Object</code>
        * [.withMutations(...initializer)](#ImmutableBase+withMutations) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
    * _inner_
        * [~callSuper](#ImmutableBase..callSuper) ⇒ <code>mixed</code>
        * [~extendCallback](#ImmutableBase..extendCallback) ⇒ <code>Object</code>


-

<a name="ImmutableBase+asImmutable"></a>

### immutableBase.asImmutable() ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Prevent this instance from being mutated further._

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - This instance.  

-

<a name="ImmutableBase+asMutable"></a>

### immutableBase.asMutable() ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a mutable copy of this instance._

Calling [setState](#ImmutableBase+setState) usually returns new instace of
`ImmutableBase`. A mutable `ImmutableBase` instance can be modified
in place.

Typically [withMutations](#ImmutableBase+withMutations) is preferable to
`asMutable`.

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - Mutable copy of this instance.  
**See**

- [asImmutable](#ImmutableBase+asImmutable)
- [withMutations](#ImmutableBase+withMutations)


-

<a name="ImmutableBase+extend"></a>

### immutableBase.extend(...callbackOrMethodsByName) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Apply one or more mixins._

Create a new `ImmutableBase` instance with custom methods.

Creates a new class inheriting `ImmutableBase` class with supplied
methods.

Returns an instance of the new class, as it never needs instantiation with
`new`. Copied as instead created via
[setState](#ImmutableBase+setState).

```js
import { ReadOnlyError } from './errors';

const ReadOnlyMapper = Mapper.extend({
  insert() { throw new ReadOnlyError(); },
  update() { throw new ReadOnlyError(); }
});
```

If overriding methods in the parent class, a callback argument can be
passed instead. It will be invoked with the `callSuper` function as an
argument.

```js
function compileRelatedDsl(string) {
  // TODO: implement useful DSL.
  return atlas.related(string.split(', '));
}

const DslMapper = Mapper.extend(callSuper => {
  return {
    with(related) {
      if (isString(related)) {
        return callSuper(this, 'with', compileRelatedDsl(related));
      }
      return callSuper(this, 'with', ...arguments);
    }
  };
});

const Users = DslMapper.table('users').relations({
  account: () => hasOne('Account'),
  projects: () => hasMany('Projects')
});

Users.with('account, projects').fetch().then(users =>
```

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - An instance of the new class inheriting from `ImmutableBase`.  

| Param | Type | Description |
| --- | --- | --- |
| ...callbackOrMethodsByName | <code>Object</code> &#124; <code>[extendCallback](#ImmutableBase..extendCallback)</code> | Object of methods to be mixed into the class. Or a function that returns   such an object. The function is invoked with a `callSuper` helper   function. |


-

<a name="ImmutableBase+requireState"></a>

### immutableBase.requireState(key) ⇒ <code>mixed</code>
_Get a state value or throw if unset._

**Returns**: <code>mixed</code> - Value previously assigned to state key. Do not mutate this value.  
**Throws**:

- UnsetStateError
  If the option has not been set.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | State key to retrieve. |


-

<a name="ImmutableBase+setState"></a>

### immutableBase.setState(nextState) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a new instance with altered state._

Update [state](#ImmutableBase+state). If any provided values differ
from those already set then a copy with updated state will be returned.
Otherwise the same instance is returned.

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - A new instance with updated state, or this one if nothing changed.  

| Param | Type | Description |
| --- | --- | --- |
| nextState | <code>Object</code> | A hash of values to override those already set. |


-

<a name="ImmutableBase+state"></a>

### immutableBase.state : <code>Object</code>
_Hash of values that constitute the object state._

Typically accessed from methods when extending `ImmutableBase`.

`state` should be considered read-only, and should only ever by modified
indirectly via [setState](#ImmutableBase+setState).

**Read only**: true  
**See**: [requireState](#ImmutableBase+requireState)  

-

<a name="ImmutableBase+withMutations"></a>

### immutableBase.withMutations(...initializer) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a mutated copy of this instance._

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - Mutated copy of this instance.  

| Param | Type | Description |
| --- | --- | --- |
| ...initializer | <code>Array</code> &#124; <code>string</code> &#124; <code>Object</code> &#124; <code>function</code> | An initializer callback, taking the ImmutableBase instance as its first  argument. Alternatively an object of {[method]: argument} pairs to be  invoked. |

**Example** *(Using a callback initializer)*  
```js

AustralianWomen = People.withMutations(People => {
 People
   .where({ country: 'Australia', gender: 'female' });
   .with(related('spouse', 'children', 'jobs'))
});
```
**Example** *(Using an object initializer)*  
```js

AustralianWomen = People.withMutations({
  where: { country: 'Australia', gender: 'female' },
  with: related('spouse', 'children', 'jobs')
});
```
**Example** *(Returning an object initializer)*  
```js

AustralianWomen = People.withMutations(() => {
  return {
    where: { country: 'Australia', gender: 'female' },
    with: related('spouse', 'children', 'jobs')
  }
});
```

-

<a name="ImmutableBase..callSuper"></a>

### ImmutableBase~callSuper ⇒ <code>mixed</code>
_Helper method that invokes a super method._

**Returns**: <code>mixed</code> - The return value of invoked method.  

| Param | Type | Description |
| --- | --- | --- |
| self | <code>[ImmutableBase](#ImmutableBase)</code> | Instance invoking the super method (`this` in method). |
| methodName | <code>string</code> | Name of super method to invoke. |

**Example**  
```js
// Invoke super with `callSuper` helper.
const child = parent.extend(callSuper => {
  return {
    method(x, y) {
      return callSuper('method', x, y);
    }
  }
});

// Equivalent manual invocation of super method.
const parentProto = Object.getPrototypeOf(parent);
const child = parent.extend({
  method(x, y) {
    return parentProto.method.call(this, x, y);
  });
});
```

-

<a name="ImmutableBase..extendCallback"></a>

### ImmutableBase~extendCallback ⇒ <code>Object</code>
**Returns**: <code>Object</code> - A hash of methods.  

| Param | Type | Description |
| --- | --- | --- |
| callSuper | <code>[callSuper](#ImmutableBase..callSuper)</code> | Helper function that invokes a super method. |


-

<a name="Mapper"></a>

## Mapper ⇐ <code>[ImmutableBase](#ImmutableBase)</code>
Mappers represent a set of data in your database. A mapper can be scoped or
specialized by chaining calls to its methods.

Mappers are immutable, so any setter method will return a copy of the Mapper
insance with the new settings. `Mapper` instances need never be instantiated
with `new`, instead each method call that would mutate the instance returns a
copy.

```js
// Get the base mapper from `atlas`.
const Mapper = atlas('Mapper');

// Create a new Mapper that represents users.
const Users = Mapper.table('users').idAttribute('user_id');

// Create one from `Users` that represents administrators.
const Admins = Users.where('is_admin', true);

// select * from users where is_admin = true;
Admins.fetch().then(admins => {
  // ...
});
```

These docs instead use the convention of naming mappers in `PascalCase` and
records in `camelCase`. This is okay because the `Mapper` constructor never
appears in your code.

```js
Cars.fetch().then(cars => // ...
```

**Extends:** <code>[ImmutableBase](#ImmutableBase)</code>  

* [Mapper](#Mapper) ⇐ <code>[ImmutableBase](#ImmutableBase)</code>
    * _instance_
        * [.all()](#Mapper+all) ⇒ <code>[Mapper](#Mapper)</code>
        * [.asImmutable()](#ImmutableBase+asImmutable) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.asMutable()](#ImmutableBase+asMutable) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.attributes(...attributes)](#Mapper+attributes) ⇒ <code>[Mapper](#Mapper)</code>
        * [.count()](#Mapper+count) ⇒ <code>Promise.&lt;Number&gt;</code>
        * [.defaultAttribute(attribute, value)](#Mapper+defaultAttribute) ⇒ <code>[Mapper](#Mapper)</code>
        * [.defaultAttributes(attributes)](#Mapper+defaultAttributes) ⇒ <code>[Mapper](#Mapper)</code>
        * [.destroy(ids)](#Mapper+destroy) ⇒ <code>Promise.&lt;Number&gt;</code>
        * [.destroyAll()](#Mapper+destroyAll) ⇒ <code>Promise.&lt;Number&gt;</code>
        * [.extend(...callbackOrMethodsByName)](#ImmutableBase+extend) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.fetch()](#Mapper+fetch) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
        * [.fetchAll()](#Mapper+fetchAll) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.find(...ids)](#Mapper+find) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
        * [.findBy()](#Mapper+findBy) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
        * [.first()](#Mapper+first) ⇒ <code>[Mapper](#Mapper)</code>
        * [.forge(attributes)](#Mapper+forge)
        * [.getRelation(relationName)](#Mapper+getRelation) ⇒ <code>Relation</code>
        * [.idAttribute(idAttribute)](#Mapper+idAttribute) ⇒ <code>[Mapper](#Mapper)</code>
        * [.insert(records)](#Mapper+insert) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
        * [.isNew(record)](#Mapper+isNew) ⇒ <code>bool</code>
        * [.joinMapper(Other, selfAttribute, otherAttribute)](#Mapper+joinMapper) ⇒ <code>[Mapper](#Mapper)</code>
        * [.joinRelation(relationName)](#Mapper+joinRelation) ⇒ <code>[Mapper](#Mapper)</code>
        * [.load(related)](#Mapper+load) ⇒ <code>[EagerLoader](#EagerLoader)</code>
        * [.omitPivot()](#Mapper+omitPivot) ⇒ <code>[Mapper](#Mapper)</code>
        * [.one()](#Mapper+one) ⇒ <code>[Mapper](#Mapper)</code>
        * [.orderBy(attribute, [direction])](#Mapper+orderBy) ⇒ <code>[Mapper](#Mapper)</code>
        * [.pivotAttributes(attributes)](#Mapper+pivotAttributes) ⇒ <code>[Mapper](#Mapper)</code>
        * [.query(method, ...args)](#Mapper+query) ⇒ <code>[Mapper](#Mapper)</code>
        * [.relations(relationByName)](#Mapper+relations) ⇒ <code>[Mapper](#Mapper)</code>
        * [.require()](#Mapper+require) ⇒ <code>[Mapper](#Mapper)</code>
        * [.requireState(key)](#ImmutableBase+requireState) ⇒ <code>mixed</code>
        * [.save(records)](#Mapper+save) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
        * [.setState(nextState)](#ImmutableBase+setState) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
        * [.state](#ImmutableBase+state) : <code>Object</code>
        * [.strictAttribute(attribute, value)](#Mapper+strictAttribute) ⇒ <code>[Mapper](#Mapper)</code>
        * [.strictAttributes(attributes)](#Mapper+strictAttributes) ⇒ <code>[Mapper](#Mapper)</code>
        * [.table(table)](#Mapper+table) ⇒ <code>[Mapper](#Mapper)</code>
        * [.target(ids)](#Mapper+target) ⇒ <code>[Mapper](#Mapper)</code>
        * [.targetBy(attribute, ids)](#Mapper+targetBy) ⇒ <code>[Mapper](#Mapper)</code>
        * [.toQueryBuilder()](#Mapper+toQueryBuilder) ⇒ <code>QueryBuilder</code>
        * [.update(records)](#Mapper+update) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
        * [.updateAll(attributes)](#Mapper+updateAll) ⇒ <code>Promise.&lt;(Array.&lt;Object&gt;\|Number)&gt;</code>
        * [.where()](#Mapper+where) ⇒ <code>[Mapper](#Mapper)</code>
        * [.whereIn()](#Mapper+whereIn) ⇒ <code>[Mapper](#Mapper)</code>
        * [.with(related)](#Mapper+with) ⇒ <code>[Mapper](#Mapper)</code>
        * [.withMutations(...initializer)](#ImmutableBase+withMutations) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
    * _inner_
        * [~attributeCallback](#Mapper..attributeCallback) ⇒ <code>mixed</code> &#124; <code>undefined</code>


-

<a name="Mapper+all"></a>

### mapper.all() ⇒ <code>[Mapper](#Mapper)</code>
_Query multiple rows. Default behaviour._

Unlimits query. Opposite of [one](#Mapper+one).

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper targeting a single row.  
**Example**  
```js
const LatestSignUp = Mapper
  .table('users')
  .orderBy('created_at', 'desc')
  .one();

const SignUpsLastWeek = NewestUser
  .where('created_at', '>', moment().subtract(1, 'week'))
  .all();

SignUpsLastWeek.count().then(signUpCount => {
  console.log(`${signUpCount} users signed in the last week`);
});
```

-

<a name="ImmutableBase+asImmutable"></a>

### mapper.asImmutable() ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Prevent this instance from being mutated further._

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - This instance.  

-

<a name="ImmutableBase+asMutable"></a>

### mapper.asMutable() ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a mutable copy of this instance._

Calling [setState](#ImmutableBase+setState) usually returns new instace of
`ImmutableBase`. A mutable `ImmutableBase` instance can be modified
in place.

Typically [withMutations](#ImmutableBase+withMutations) is preferable to
`asMutable`.

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - Mutable copy of this instance.  
**See**

- [asImmutable](#ImmutableBase+asImmutable)
- [withMutations](#ImmutableBase+withMutations)


-

<a name="Mapper+attributes"></a>

### mapper.attributes(...attributes) ⇒ <code>[Mapper](#Mapper)</code>
Set attributes to be retrieved by [fetch](#Mapper+fetch).

```js
// Exclude 'password_hash' and 'salt'.
const userWhitelist = ['name', 'avatar_url', 'created_at', 'last_seen'];

router.get('/user/:userId', (req, res, next) => {
  Users
    .attributes(userWhitelist)
    .find(req.params.userId)
    .then(res.json)
    .catch(next);
});
```


| Param | Type | Description |
| --- | --- | --- |
| ...attributes | <code>string</code> | One or more attributes to fetch. |


-

<a name="Mapper+count"></a>

### mapper.count() ⇒ <code>Promise.&lt;Number&gt;</code>
Count records.

**Returns**: <code>Promise.&lt;Number&gt;</code> - The number of matching records.  
**Example**  
```js
const Articles = Mapper.table('articles');

Articles.count().then(count => {
  console.log('Total articles:', count);
});

Articles.where('topic', 'JavaScript').count().then(count => {
  console.log('Total JavaScript articles:', count);
});
```

-

<a name="Mapper+defaultAttribute"></a>

### mapper.defaultAttribute(attribute, value) ⇒ <code>[Mapper](#Mapper)</code>
_Set a default value for an attribute._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with a default attribute.  
**See**: [defaultAttributes](#Mapper+defaultAttributes).  

| Param | Type |
| --- | --- |
| attribute | <code>string</code> | 
| value | <code>mixed</code> &#124; <code>[attributeCallback](#Mapper..attributeCallback)</code> | 


-

<a name="Mapper+defaultAttributes"></a>

### mapper.defaultAttributes(attributes) ⇒ <code>[Mapper](#Mapper)</code>
_Set default values for attributes._

These values will be used by [forge](#Mapper+forge) and
[insert](#Mapper+insert) when no value is provided.

```
const Users = Mapper.table('users').defaultAttributes({
  name: 'Anonymous', rank: 0
});
```

Alternatively values can be callbacks that receive attributes and return a
default value. In the below example a new document record is generated with
a default name and template.

```
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
  console.dir(doc);
  // {
  //   title: 'Atlas Reference',
  //   content: '<html>\n  <head>\n    <title>Atlas Reference</title>...'
  // }
);
```

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with default attributes.  

| Param | Type | Description |
| --- | --- | --- |
| attributes | <code>Object.&lt;string, (mixed\|Mapper~attributeCallback)&gt;</code> | An object mapping values (or callbacks) to attribute names. |


-

<a name="Mapper+destroy"></a>

### mapper.destroy(ids) ⇒ <code>Promise.&lt;Number&gt;</code>
_Delete specific rows._

Specify rows to be deleted. Rows can be specified by supplying one or more
record objects or ID values.

**Returns**: <code>Promise.&lt;Number&gt;</code> - Promise resolving to the number of rows deleted.  

| Param | Type | Description |
| --- | --- | --- |
| ids | <code>mixed</code> &#124; <code>Array.&lt;mixed&gt;</code> | ID(s) or record(s) whose corresponding rows will be destroyed. |

**Example**  
```js
const Users = atlas('Mapper').table('users');

Users.destroy(5).then(count =>
// delete from users where id = 5

Users.destroy(1, 2, 3).then(count =>
// delete from users where id in (1, 2, 3)

const sam = { id: 5, name: 'Sam' };
const jane = { id: 16, name: 'Jane' };

Users.destroy(sam, jane).then(count =>
// delete from users where id in (5, 16)
```

-

<a name="Mapper+destroyAll"></a>

### mapper.destroyAll() ⇒ <code>Promise.&lt;Number&gt;</code>
_Delete rows matching query._

Delete all rows matching the current query.

```
Users.where('complaint_count', '>', 10).destroy().then(count =>
```

**Returns**: <code>Promise.&lt;Number&gt;</code> - Count or rows deleted.  

-

<a name="ImmutableBase+extend"></a>

### mapper.extend(...callbackOrMethodsByName) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Apply one or more mixins._

Create a new `ImmutableBase` instance with custom methods.

Creates a new class inheriting `ImmutableBase` class with supplied
methods.

Returns an instance of the new class, as it never needs instantiation with
`new`. Copied as instead created via
[setState](#ImmutableBase+setState).

```js
import { ReadOnlyError } from './errors';

const ReadOnlyMapper = Mapper.extend({
  insert() { throw new ReadOnlyError(); },
  update() { throw new ReadOnlyError(); }
});
```

If overriding methods in the parent class, a callback argument can be
passed instead. It will be invoked with the `callSuper` function as an
argument.

```js
function compileRelatedDsl(string) {
  // TODO: implement useful DSL.
  return atlas.related(string.split(', '));
}

const DslMapper = Mapper.extend(callSuper => {
  return {
    with(related) {
      if (isString(related)) {
        return callSuper(this, 'with', compileRelatedDsl(related));
      }
      return callSuper(this, 'with', ...arguments);
    }
  };
});

const Users = DslMapper.table('users').relations({
  account: () => hasOne('Account'),
  projects: () => hasMany('Projects')
});

Users.with('account, projects').fetch().then(users =>
```

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - An instance of the new class inheriting from `ImmutableBase`.  

| Param | Type | Description |
| --- | --- | --- |
| ...callbackOrMethodsByName | <code>Object</code> &#124; <code>[extendCallback](#ImmutableBase..extendCallback)</code> | Object of methods to be mixed into the class. Or a function that returns   such an object. The function is invoked with a `callSuper` helper   function. |


-

<a name="Mapper+fetch"></a>

### mapper.fetch() ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
_Retrieve one or more records._

**Returns**: <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code> - One or more records.  
**Example**  
```js
// select * from people;
People.fetch().then(people =>
  const names = people.map(p => p.name).join(', ');
  console.log(`All people: ${names}`);
);
```

-

<a name="Mapper+fetchAll"></a>

### mapper.fetchAll() ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
_Retrieve an array of records._

Alias for `Mapper.[all](#Mapper+all).[fetch](#Mapper+fetch)`.


-

<a name="Mapper+find"></a>

### mapper.find(...ids) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
_Retrieve records by ID._

Fetch one or more records by their [idAttribute](#Mapper+idAttribute).

Shorthand for `Mapper.target().fetch()`.

**Returns**: <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code> - One or more records with the given IDs.  

| Param | Type | Description |
| --- | --- | --- |
| ...ids | <code>mixed</code> &#124; <code>Array.&lt;mixed&gt;</code> | One or more ID values, or arrays of ID values (for composite IDs). |

**Example** *(Finding a record with a single key)*  
```js

const Vehicles = Mapper.table('vehicles');

Vehicles.find(5).then(vehicle =>
// select * from vehicles where id = 5

Vehicles.find({ id: 3, model: 'Commodore' }).then(vehicle =>
// select * from vehicles where id = 3

Vehicles.find(1, 2, 3).then(vehicles =>
// select * from vehicles where id in (1, 2, 3)
```
**Example** *(Finding a record with a composite key)*  
```js

const AccessPermissions = Mapper
  .table('permissions')
  .idAttribute(['room_id', 'personnel_id']);

AccessPermissions.find([1, 2]).then(trip =>
// select * from trips where room_id = 1, personnel_id = 2

const personnel = { name: 'Melissa', id: 6 };
const office = { id: 2 };
AccessPermissions.find([office.id, personnel.id]).then(permission =>
// select * from permissions where room_id = 6 and personnel_id = 2

const permission = { room_id: 2, personel_id: 6 };
AccessPermissions.find(permission).then(permission =>
// select * from permissions where room_id = 6 and personnel_id = 2
```

-

<a name="Mapper+findBy"></a>

### mapper.findBy() ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
_Retrieve record(s) by a specific attribute._

Like `find`, but allows an attribute other than the primary key as its
identity. The provided attribute should be unique within the `Mapper`'s
[table](#Mapper+table).

**Returns**: <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code> - One or more records having the supplied attribute.  
**Example**  
```js
Users = Mapper.table('users');

function validateCredentials(email, password) {
  return Users.findBy('email', email).then(user => {
    return user != null && verifyPassword(user.password_hash, password);
  });
}
```

-

<a name="Mapper+first"></a>

### mapper.first() ⇒ <code>[Mapper](#Mapper)</code>
_Fetch the first matching record._

Shorthand for `Mapper.one().fetch()`. If the query has no ordering, it will
be sorted by [idAttribute](#Mapper+idAttribute).

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper targeting a single row.  
**Example**  
```js
Users.first().then(user =>
// select * from users order by id

Users.orderBy('created_at', 'desc').first().then(newestUser =>
// select * from users order by created_at desc
```

-

<a name="Mapper+forge"></a>

### mapper.forge(attributes)
_Create a record._

Create a new record object. This doesn't persist any data, it just creates an
instance to be manipulated with JavaScript.

```
const Messages = Mapper.tables('messages').defaultAttributes({
  created_at: () => new Date(),
  urgency: 'low'
});

const greeting = Messages.forge({ message: `Hi there` });
// { message: 'How's it goin?', created_at: '2015-11-28', urgency: 'low' }
```

By default this is an instance of `Object`, but it is possible to change
the type of the records that Atlas accepts and returns. Override the
`createRecord`, `getAttributes`, `setAttributes`, `getRelated` and
`setRelated` methods.


| Param | Type |
| --- | --- |
| attributes | <code>Object</code> | 


-

<a name="Mapper+getRelation"></a>

### mapper.getRelation(relationName) ⇒ <code>Relation</code>
_Get a named `Relation` instance from a `Mapper`._

Get a configured `Relation` instance that was defined previously with
[relations](#Mapper+relations).

The relation can be converted into a Mapper matching records in that
relation.  Each `Relation` type (`BelongsTo`, `BelongsToMany`, `HasOne`
and `HasMany`) provides an `of()` method that accepts one or more records.

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

**See**: [relations](#Mapper+relations)  

| Param | Type | Description |
| --- | --- | --- |
| relationName | <code>string</code> | The name of the relation to return |


-

<a name="Mapper+idAttribute"></a>

### mapper.idAttribute(idAttribute) ⇒ <code>[Mapper](#Mapper)</code>
_Set primary key._

Set the primary key attribute.

```js
const Accounts = Mapper
  .table('accounts')
  .idAttribute('email');

// select * from accounts where email='username@domain.com';
Accounts.find('username@domain.com').then(user =>
```

Defining a composite key:

```js
const Membeships = Mapper
  .table('memberships')
  .idAttribute(['user_id', 'group_id']);
```

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with primary key attribute set.  

| Param | Type | Description |
| --- | --- | --- |
| idAttribute | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | Name of primary key attribute. |


-

<a name="Mapper+insert"></a>

### mapper.insert(records) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
_Insert one or more records._

Insert a record or an array of records into the [table](#Mapper+table)
assigned to this `Mapper`. Returns a promise resolving the the record
object (or objects) with updated attributes.

This is useful as an alternative to [save](#Mapper+save) to force atlas to
insert a record that already has an ID value.

Using PostgreSQL every record will be updated to the attributes present in
the table after insert. Any other DBMS will only return the primary key
of the first record, which is then assigned to the
[idAttribute](#Mapper+idAttribute).

**Returns**: <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code> - Promise resolving to the record(s) with updated attributes.  
**Todo**

- [ ] Do something better for non-PostgreSQL databases. It could do each insert
as an individual query (allowing update of the `idAttribute`). Or fetch the
rows (`SELECT *`) in range after the insert. For instance, if ten records
were inserted, and the first ID is 5, then select rows 5-15 and return them
as the response. Need to investigate whether this is safe to do in a
transaction (and does not cause performance problems).


| Param | Type | Description |
| --- | --- | --- |
| records | <code>Object</code> &#124; <code>Array.&lt;Object&gt;</code> | One or more records to be inserted. |


-

<a name="Mapper+isNew"></a>

### mapper.isNew(record) ⇒ <code>bool</code>
_Check if the record exists in the database._

By default `isNew` will simply check for the existance of the {@link
Mapper#idAttribute idAttribute} on the given record. This method
can be overridden for custom behavior.

**Returns**: <code>bool</code> - `true` if the model exists in database, otherwise `false`.  

| Param | Type | Description |
| --- | --- | --- |
| record | <code>Object</code> | Record to check. |


-

<a name="Mapper+joinMapper"></a>

### mapper.joinMapper(Other, selfAttribute, otherAttribute) ⇒ <code>[Mapper](#Mapper)</code>
_Join query with another `Mapper`._

Performs an `inner join` between the [table](#Mapper+table) of this
`Mapper` and that of `Other`.

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper joined to Other.  

| Param | Type | Description |
| --- | --- | --- |
| Other | <code>[Mapper](#Mapper)</code> | Mapper with query to join. |
| selfAttribute | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | The attribute(s) on this Mapper to join on. |
| otherAttribute | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | The attribute(s) on Other to join on. |


-

<a name="Mapper+joinRelation"></a>

### mapper.joinRelation(relationName) ⇒ <code>[Mapper](#Mapper)</code>
_Join query with a related `Mapper`._

Performs an inner join between the [table](#Mapper+table) of this
`Mapper`, and that of the named [relation](#Mapper+relations).

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper joined to given relation.  

| Param | Type | Description |
| --- | --- | --- |
| relationName | <code>String</code> | The name of the relation with which to perform an inner join. |


-

<a name="Mapper+load"></a>

### mapper.load(related) ⇒ <code>[EagerLoader](#EagerLoader)</code>
_Eager load relations into existing records._

Much like `with()`, but attaches relations to an existing record.

`load` returns an instance of `EagerLoader`. `EagerLoader` exposes a
single method, `into`:

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
).then(postsWithAuthor => ...);

// Exactly the same as:
Posts.with(related('author')).fetch().then(postsWithAuthor => ...);
```

*See `Mapper.relations()` for example of how to set up this schema.*

**Returns**: <code>[EagerLoader](#EagerLoader)</code> - An EagerLoader instance configured to load the given relations into
  records.  

| Param | Type | Description |
| --- | --- | --- |
| related | <code>[Related](#Related)</code> &#124; <code>[Array.&lt;Related&gt;](#Related)</code> | One or more Related instances describing the relation tree. |


-

<a name="Mapper+omitPivot"></a>

### mapper.omitPivot() ⇒ <code>[Mapper](#Mapper)</code>
_Exclude columns from a joined table._

Columns from a joined table can be added to a [fetch](#Mapper+fetch)
query with [pivotAttributes](#Mapper+pivotAttributes). This chaining this method
will prevent them from appearing in the returned record(s).

In a ([many-to-many relation](Mapper#belongsToMany)), key columns
from the join table are included automatically.  These are necessary to
associate the related records to their parents in an eager load.

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper that will not return pivot attributes in a fetch response.  
**See**: [pivotAttributes](#Mapper+pivotAttributes)  
**Example**  
```js
const bob = { id: 1, name: 'Bob' };
const BobsGroups = Users.getRelation('groups').of(bob).pivotAttributes('is_owner');

BobsGroups.fetch().then(groups => {
  console.log(groups);
  // [{ _pivot_user_id: 1, _pivot_is_owner: false, id: 10, name: 'General' },
  // { _pivot_user_id: 1, _pivot_is_owner: true, id: 11, name: 'Database' }]
});

BobsGroups.omitPivot().fetch().then(groups => {
  console.log(groups);
  // [{ id: 10, name: 'General' }, { id: 11, name: 'Database' }]
});
```

-

<a name="Mapper+one"></a>

### mapper.one() ⇒ <code>[Mapper](#Mapper)</code>
_Query a single row._

Limit query to a single row. Causes subsequent calls to {@link
Mapper#fetch fetch} to resolve to a single record (rather
than an array). Opposite of [all](#Mapper+all).

Typically it's simpler to use [first](#Mapper+first).

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper targeting a single row.  
**Example**  
```js
People.one().where('age', '>', 18).fetch().then(adult => {
 console.log(`${adult.name} is one adult in the database`);
});
```

-

<a name="Mapper+orderBy"></a>

### mapper.orderBy(attribute, [direction]) ⇒ <code>[Mapper](#Mapper)</code>
_Order the records returned by a query._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with query ordered by `attribute`.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| attribute | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> |  | The attribute(s) by which to order the response. |
| [direction] | <code>string</code> | <code>&quot;asc&quot;</code> | The direction by which to order the records. Either `'asc'` for   ascending, or `'desc'` for descending. |

**Example**  
```js
Messages.orderBy('received_at', 'desc').first().then(message => {
  console.log(`${message.sender} says "${message.text}"`);
});
```

-

<a name="Mapper+pivotAttributes"></a>

### mapper.pivotAttributes(attributes) ⇒ <code>[Mapper](#Mapper)</code>
_Fetch columns from a joined table._

Include columns from a table that has been joined with
[joinRelation](#Mapper+joinRelation) or
[joinMapper](#Mapper+joinMapper).

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper that will return pivot attributes in a fetch response.  
**See**: [omitPivot](#Mapper+omitPivot)  

| Param | Type | Description |
| --- | --- | --- |
| attributes | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | Attributes to be included from joined table. |

**Example**  
```js
Customers
  .joinMapper(Receipts, 'id', 'customer_id')
  .pivotAttributes({ 'created_at', 'total_cost' })
  .where('receipts.created_at', >, yesterday)
  .then(receipts => {
    console.log('Purchases today: \n' + receipts.map(r =>
      `${r.name} spent $${r._pivot_total_cost} at ${r._pivot_created_at}`
    ));
  });
```

-

<a name="Mapper+query"></a>

### mapper.query(method, ...args) ⇒ <code>[Mapper](#Mapper)</code>
_Modify the underlying Knex `QueryBuilder` instance directly._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with a modified underlying `QueryBuilder` instance.  
**See**: [http://knexjs.org](http://knexjs.org)  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>function</code> &#124; <code>string</code> | A callback that modifies the underlying `QueryBuilder` instance, or the   name of a `QueryBuilder` method to invoke. |
| ...args | <code>mixed</code> | Arguments to be passed to the `QueryBuilder` method. |


-

<a name="Mapper+relations"></a>

### mapper.relations(relationByName) ⇒ <code>[Mapper](#Mapper)</code>
_Define a `Mapper`'s relations._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with provided relations.  
**See**

- [load](#Mapper+load)
- [with](#Mapper+with)
- [relations](#Atlas+relations)


| Param | Type | Description |
| --- | --- | --- |
| relationByName | <code>Object</code> | A hash of relations keyed by name. |

**Example**  
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

-

<a name="Mapper+require"></a>

### mapper.require() ⇒ <code>[Mapper](#Mapper)</code>
Setting `require` will cause [fetch](#Mapper+fetch) and [find](#Mapper+find)
to throw when a query returns no records.

```js
const { NoRowsFoundError } = atlas;

User.where('created_at', <, new Date(1500, 0, 1)).fetch()
  .then(user => console.log(user.name))
  .catch(NoRowsFoundError, error => {
    console.log('no rows created before 1500AD!');
  });
```


-

<a name="ImmutableBase+requireState"></a>

### mapper.requireState(key) ⇒ <code>mixed</code>
_Get a state value or throw if unset._

**Returns**: <code>mixed</code> - Value previously assigned to state key. Do not mutate this value.  
**Throws**:

- UnsetStateError
  If the option has not been set.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | State key to retrieve. |


-

<a name="Mapper+save"></a>

### mapper.save(records) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
_Persist records._

Insert or update one or more records. The decision of whether to insert or
update is based on the result of testing each record with
[isNew](#Mapper+isNew).

**Returns**: <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code> - A promise resolving to the saved record(s) with updated attributes.  

| Param | Type | Description |
| --- | --- | --- |
| records | <code>Object</code> &#124; <code>Array.&lt;Object&gt;</code> | One or more records to be saved. |


-

<a name="ImmutableBase+setState"></a>

### mapper.setState(nextState) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a new instance with altered state._

Update [state](#ImmutableBase+state). If any provided values differ
from those already set then a copy with updated state will be returned.
Otherwise the same instance is returned.

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - A new instance with updated state, or this one if nothing changed.  

| Param | Type | Description |
| --- | --- | --- |
| nextState | <code>Object</code> | A hash of values to override those already set. |


-

<a name="ImmutableBase+state"></a>

### mapper.state : <code>Object</code>
_Hash of values that constitute the object state._

Typically accessed from methods when extending `ImmutableBase`.

`state` should be considered read-only, and should only ever by modified
indirectly via [setState](#ImmutableBase+setState).

**Read only**: true  
**See**: [requireState](#ImmutableBase+requireState)  

-

<a name="Mapper+strictAttribute"></a>

### mapper.strictAttribute(attribute, value) ⇒ <code>[Mapper](#Mapper)</code>
_Set an override value for an attribute._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with strict attributes.  
**See**: [strictAttributes](#Mapper+strictAttributes)  

| Param | Type |
| --- | --- |
| attribute | <code>string</code> | 
| value | <code>mixed</code> &#124; <code>[attributeCallback](#Mapper..attributeCallback)</code> | 


-

<a name="Mapper+strictAttributes"></a>

### mapper.strictAttributes(attributes) ⇒ <code>[Mapper](#Mapper)</code>
_Set override values for a attributes._

Set values to override any passed to [forge](#Mapper+forge),
[insert](#Mapper+insert) or [update](#Mapper+update).


Alternatively values can be callbacks that receive attributes and
return a value.

```
Users = Mapper.table('users').strictAttributes({
  email: attributes => attributes.email.trim(),
  is_admin: false
});
```

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper with default attributes.  

| Param | Type | Description |
| --- | --- | --- |
| attributes | <code>Object.&lt;string, (mixed\|Mapper~attributeCallback)&gt;</code> | An object mapping values (or callbacks) to attribute names. |


-

<a name="Mapper+table"></a>

### mapper.table(table) ⇒ <code>[Mapper](#Mapper)</code>
_Sets the name of the table targeted by this Mapper._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper instance targeting given table.  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The new name of this table. |

**Example**  
```js
const Mapper = atlas('Mapper');

const Dogs = Mapper.table('dogs');
const Cats = Mapper.table('cats');
```

-

<a name="Mapper+target"></a>

### mapper.target(ids) ⇒ <code>[Mapper](#Mapper)</code>
_Limit query to one or more specific rows._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper targeting rows with given ID value(s).  

| Param | Type | Description |
| --- | --- | --- |
| ids | <code>mixed</code> &#124; <code>Array.&lt;mixed&gt;</code> | ID values for target rows, or records with ID values. |


-

<a name="Mapper+targetBy"></a>

### mapper.targetBy(attribute, ids) ⇒ <code>[Mapper](#Mapper)</code>
_Limit query to one or more rows matching a given attribute._

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper targeting rows matching the attribute value(s).  

| Param | Type | Description |
| --- | --- | --- |
| attribute | <code>string</code> &#124; <code>Array.&lt;string&gt;</code> | Attribute(s) to identify records by. |
| ids | <code>mixed</code> &#124; <code>Array.&lt;mixed&gt;</code> | Values for target rows, or records with values for given attribute(s). |


-

<a name="Mapper+toQueryBuilder"></a>

### mapper.toQueryBuilder() ⇒ <code>QueryBuilder</code>
_Return a copy of the underlying `QueryBuilder` instance._

**Returns**: <code>QueryBuilder</code> - QueryBuilder instance.  
**See**: [http://knexjs.org](http://knexjs.org)  

-

<a name="Mapper+update"></a>

### mapper.update(records) ⇒ <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code>
_Update rows corresponding to one or more records._

Update rows corresponding to one or more records. If the
[idAttribute](#Mapper+idAttribute) is not set on any of the records
then the returned promise will be rejected with an
[UnidentifiableRecordError](UnidentifiableRecordError).

**Returns**: <code>Promise.&lt;(Object\|Array.&lt;Object&gt;)&gt;</code> - A promise resolving to the updated record or records.  

| Param | Type | Description |
| --- | --- | --- |
| records | <code>Object</code> &#124; <code>Array.&lt;Object&gt;</code> | Record, or records, to be updated. |


-

<a name="Mapper+updateAll"></a>

### mapper.updateAll(attributes) ⇒ <code>Promise.&lt;(Array.&lt;Object&gt;\|Number)&gt;</code>
_Update all matching rows._

**Returns**: <code>Promise.&lt;(Array.&lt;Object&gt;\|Number)&gt;</code> - Updated records (if `returning *` is supported), or count of updated
  rows.  

| Param | Type | Description |
| --- | --- | --- |
| attributes | <code>Object</code> | Attributes to be set on all mathed rows. |


-

<a name="Mapper+where"></a>

### mapper.where() ⇒ <code>[Mapper](#Mapper)</code>
Passthrough to [`QueryBuilder#where`](http://knexjs.org/#Builder-where)
that respects [Mapper#attributeToColumn](Mapper#attributeToColumn) if overridden.

```
Mapper.where(attribute:string, value:mixed) -> Mapper
Mapper.where(attribute:string, operator:string, value:mixed) -> Mapper
Mapper.where(attributes:string[], values:mixed[]) -> Mapper
Mapper.where({ attribute: value }) -> Mapper
Mapper.where(callback:function) -> Mapper
```


-

<a name="Mapper+whereIn"></a>

### mapper.whereIn() ⇒ <code>[Mapper](#Mapper)</code>
Passthrough to [`QueryBuilder#whereIn`](http://knexjs.org/#Builder-whereIn)
that respects [Mapper#attributeToColumn](Mapper#attributeToColumn) if overridden.


-

<a name="Mapper+with"></a>

### mapper.with(related) ⇒ <code>[Mapper](#Mapper)</code>
_Specify relations to eager load._

Specify relations to eager load with [fetch](#Mapper+fetch),
[find](#Mapper+find) etc. These are declared using the [Related](#Related)
class.

```js
const { related } = atlas;

// Get all posts created today, eager loading author relation for each.
atlas('Posts')
  .where('created_at', '>', moment().startOf('day'))
  .with(related('author'))
  .fetch()
  .then(todaysPosts => ...);

// Load user with recent posts and unread messages.
atlas('Users').with(

  // Eager load last twent posts.
  related('posts').with(related('comments').with(related('author'))).mapper({
    query: query => query.orderBy('created_at', 'desc').limit(20)
  }),

  // Eager load unread messages.
  related('receivedMessages').mapper('unread').as('unreadMessages')

).find('some.guy@domain.com').then(user => console.log(
  `${user.name} has ${user.unreadMessages.length} unread messages`
));
```

*See [relations](#Mapper+relations) for an example of how to set up this schema.*

**Returns**: <code>[Mapper](#Mapper)</code> - Mapper configured to eager load related records.  
**Todo**

- [ ] Support saving relations.


| Param | Type | Description |
| --- | --- | --- |
| related | <code>[Related](#Related)</code> &#124; <code>[Array.&lt;Related&gt;](#Related)</code> | One or more Related instances describing the relation tree. |


-

<a name="ImmutableBase+withMutations"></a>

### mapper.withMutations(...initializer) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a mutated copy of this instance._

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - Mutated copy of this instance.  

| Param | Type | Description |
| --- | --- | --- |
| ...initializer | <code>Array</code> &#124; <code>string</code> &#124; <code>Object</code> &#124; <code>function</code> | An initializer callback, taking the ImmutableBase instance as its first  argument. Alternatively an object of {[method]: argument} pairs to be  invoked. |

**Example** *(Using a callback initializer)*  
```js

AustralianWomen = People.withMutations(People => {
 People
   .where({ country: 'Australia', gender: 'female' });
   .with(related('spouse', 'children', 'jobs'))
});
```
**Example** *(Using an object initializer)*  
```js

AustralianWomen = People.withMutations({
  where: { country: 'Australia', gender: 'female' },
  with: related('spouse', 'children', 'jobs')
});
```
**Example** *(Returning an object initializer)*  
```js

AustralianWomen = People.withMutations(() => {
  return {
    where: { country: 'Australia', gender: 'female' },
    with: related('spouse', 'children', 'jobs')
  }
});
```

-

<a name="Mapper..attributeCallback"></a>

### Mapper~attributeCallback ⇒ <code>mixed</code> &#124; <code>undefined</code>
**Returns**: <code>mixed</code> &#124; <code>undefined</code> - Either a value to be assigned to an attribute, or `undefined` to mean
  none should be set.  

| Param | Type |
| --- | --- |
| attributes | <code>Object</code> | 


-

<a name="Registry"></a>

## Registry
A simple map for storing instances of [Mapper](#Mapper). The registry can be
helped to break dependency cycles between mappers defined in different
scripts.

Each [Atlas](#Atlas) instance has a [registry property](#Atlas+registry).

All manipulation of the registry can be done via the Atlas instance.

**See**

- [Atlas](#Atlas) instance for retrieving mappers.
- [registry](#Atlas+registry) for an instance of `Registry`.
- [register](#Atlas+register) to add mappers.
- [override](#Atlas+override) to override previously registered mappers.


-

<a name="Related"></a>

## Related ⇐ <code>[ImmutableBase](#ImmutableBase)</code>
`Related` is a helper to describe relation trees. Instances are passed to
`Mapper.with` and `Mapper.load` for eager loading.

**Extends:** <code>[ImmutableBase](#ImmutableBase)</code>  

* [Related](#Related) ⇐ <code>[ImmutableBase](#ImmutableBase)</code>
    * [.as(name)](#Related+as) ⇒ <code>[Related](#Related)</code>
    * [.asImmutable()](#ImmutableBase+asImmutable) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
    * [.asMutable()](#ImmutableBase+asMutable) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
    * [.extend(...callbackOrMethodsByName)](#ImmutableBase+extend) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
    * [.mapper(...initializers)](#Related+mapper) ⇒ <code>[Related](#Related)</code>
    * [.recursions(recursions)](#Related+recursions) ⇒ <code>[Related](#Related)</code>
    * [.require()](#Related+require) ⇒ <code>[Related](#Related)</code>
    * [.requireState(key)](#ImmutableBase+requireState) ⇒ <code>mixed</code>
    * [.setState(nextState)](#ImmutableBase+setState) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
    * [.state](#ImmutableBase+state) : <code>Object</code>
    * [.with(...related)](#Related+with) ⇒ <code>[Related](#Related)</code>
    * [.withMutations(...initializer)](#ImmutableBase+withMutations) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>


-

<a name="Related+as"></a>

### related.as(name) ⇒ <code>[Related](#Related)</code>
Set the name of the relation. Required if constructed with a
[Relation](Relation) instance, or can be used to alias a relation.

**Returns**: <code>[Related](#Related)</code> - Self, this method is chainable.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | The relation name. Used as a key when setting related records. |

**Example**  
```js
// Use `name` to alias the `posts` relation.

const lastWeek = moment().subtract(1, 'week');
const recentPosts = related('posts')
  .mapper({ where: ['created_at', '>', lastWeek] })
  .as('recentPosts');

Users.with(recentPosts).findBy('name', 'Joe Bloggs').then(joe => // ...
```
**Example**  
```js
// Use `name` to provide a relation instance directly.

const posts = hasMany('Post');
Users.with(related(posts).as('posts')).fetch();
```

-

<a name="ImmutableBase+asImmutable"></a>

### related.asImmutable() ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Prevent this instance from being mutated further._

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - This instance.  

-

<a name="ImmutableBase+asMutable"></a>

### related.asMutable() ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a mutable copy of this instance._

Calling [setState](#ImmutableBase+setState) usually returns new instace of
`ImmutableBase`. A mutable `ImmutableBase` instance can be modified
in place.

Typically [withMutations](#ImmutableBase+withMutations) is preferable to
`asMutable`.

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - Mutable copy of this instance.  
**See**

- [asImmutable](#ImmutableBase+asImmutable)
- [withMutations](#ImmutableBase+withMutations)


-

<a name="ImmutableBase+extend"></a>

### related.extend(...callbackOrMethodsByName) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Apply one or more mixins._

Create a new `ImmutableBase` instance with custom methods.

Creates a new class inheriting `ImmutableBase` class with supplied
methods.

Returns an instance of the new class, as it never needs instantiation with
`new`. Copied as instead created via
[setState](#ImmutableBase+setState).

```js
import { ReadOnlyError } from './errors';

const ReadOnlyMapper = Mapper.extend({
  insert() { throw new ReadOnlyError(); },
  update() { throw new ReadOnlyError(); }
});
```

If overriding methods in the parent class, a callback argument can be
passed instead. It will be invoked with the `callSuper` function as an
argument.

```js
function compileRelatedDsl(string) {
  // TODO: implement useful DSL.
  return atlas.related(string.split(', '));
}

const DslMapper = Mapper.extend(callSuper => {
  return {
    with(related) {
      if (isString(related)) {
        return callSuper(this, 'with', compileRelatedDsl(related));
      }
      return callSuper(this, 'with', ...arguments);
    }
  };
});

const Users = DslMapper.table('users').relations({
  account: () => hasOne('Account'),
  projects: () => hasMany('Projects')
});

Users.with('account, projects').fetch().then(users =>
```

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - An instance of the new class inheriting from `ImmutableBase`.  

| Param | Type | Description |
| --- | --- | --- |
| ...callbackOrMethodsByName | <code>Object</code> &#124; <code>[extendCallback](#ImmutableBase..extendCallback)</code> | Object of methods to be mixed into the class. Or a function that returns   such an object. The function is invoked with a `callSuper` helper   function. |


-

<a name="Related+mapper"></a>

### related.mapper(...initializers) ⇒ <code>[Related](#Related)</code>
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

**Returns**: <code>[Related](#Related)</code> - Self, this method is chainable.  

| Param | Type | Description |
| --- | --- | --- |
| ...initializers | <code>mixed</code> | Accepts the same arguments as   [withMutations](#ImmutableBase+withMutations). |


-

<a name="Related+recursions"></a>

### related.recursions(recursions) ⇒ <code>[Related](#Related)</code>
Set the number of recursions.

**Returns**: <code>[Related](#Related)</code> - Self, this method is chainable.  

| Param | Type | Description |
| --- | --- | --- |
| recursions | <code>Number</code> | Either an integer or `Infinity`. |

**Example**  
```js
Person.with(
  related('father').recursions(3)
).findBy('name', 'Kim Jong-un').then(person =>
 // person = {
 //   id: 4,
 //   name: 'Kim Jong-un',
 //   father_id: 3,
 //   father: {
 //     id: 3,
 //     name: 'Kim Jong-il',
 //     father_id: 2,
 //     father: {
 //       id: 2,
 //       name: 'Kim Il-sung',
 //       father_id: 1,
 //       father: {
 //         id: 1,
 //         name: 'Kim Hyong-jik',
 //         father_id: null
 //       }
 //     }
 //   }
 // }
)
```
**Example**  
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

-

<a name="Related+require"></a>

### related.require() ⇒ <code>[Related](#Related)</code>
Raise an error if the relation is not found. Currently this is just a
passthrough to `Mapper.require()`.

**Returns**: <code>[Related](#Related)</code> - Self, this method is chainable.
  Instance that will throw if no records are returned.  

-

<a name="ImmutableBase+requireState"></a>

### related.requireState(key) ⇒ <code>mixed</code>
_Get a state value or throw if unset._

**Returns**: <code>mixed</code> - Value previously assigned to state key. Do not mutate this value.  
**Throws**:

- UnsetStateError
  If the option has not been set.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | State key to retrieve. |


-

<a name="ImmutableBase+setState"></a>

### related.setState(nextState) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a new instance with altered state._

Update [state](#ImmutableBase+state). If any provided values differ
from those already set then a copy with updated state will be returned.
Otherwise the same instance is returned.

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - A new instance with updated state, or this one if nothing changed.  

| Param | Type | Description |
| --- | --- | --- |
| nextState | <code>Object</code> | A hash of values to override those already set. |


-

<a name="ImmutableBase+state"></a>

### related.state : <code>Object</code>
_Hash of values that constitute the object state._

Typically accessed from methods when extending `ImmutableBase`.

`state` should be considered read-only, and should only ever by modified
indirectly via [setState](#ImmutableBase+setState).

**Read only**: true  
**See**: [requireState](#ImmutableBase+requireState)  

-

<a name="Related+with"></a>

### related.with(...related) ⇒ <code>[Related](#Related)</code>
Fetch nested relations.

**Returns**: <code>[Related](#Related)</code> - Self, this method is chainable.  

| Param | Type | Description |
| --- | --- | --- |
| ...related | <code>[Related](#Related)</code> &#124; <code>[Array.&lt;Related&gt;](#Related)</code> | One or more Related instances describing the nested relation tree. |

**Example**  
```js
atlas('Actors').with(
  related('movies').with(related('director', 'cast'))
).findBy('name', 'James Spader').then(actor =>
  assert.deepEqual(
    actor,
    { id: 2, name: 'James Spader', movies: [
      { _pivot_actor_id: 2, id: 3, title: 'Stargate', director_id: 2,
        director: { id: 2, name: 'Roland Emmerich' },
        cast: [
          { id: 2, name: 'James Spader' },
          // ...
        ]
      },
      // ...
    ]},
  )
);
```

-

<a name="ImmutableBase+withMutations"></a>

### related.withMutations(...initializer) ⇒ <code>[ImmutableBase](#ImmutableBase)</code>
_Create a mutated copy of this instance._

**Returns**: <code>[ImmutableBase](#ImmutableBase)</code> - Mutated copy of this instance.  

| Param | Type | Description |
| --- | --- | --- |
| ...initializer | <code>Array</code> &#124; <code>string</code> &#124; <code>Object</code> &#124; <code>function</code> | An initializer callback, taking the ImmutableBase instance as its first  argument. Alternatively an object of {[method]: argument} pairs to be  invoked. |

**Example** *(Using a callback initializer)*  
```js

AustralianWomen = People.withMutations(People => {
 People
   .where({ country: 'Australia', gender: 'female' });
   .with(related('spouse', 'children', 'jobs'))
});
```
**Example** *(Using an object initializer)*  
```js

AustralianWomen = People.withMutations({
  where: { country: 'Australia', gender: 'female' },
  with: related('spouse', 'children', 'jobs')
});
```
**Example** *(Returning an object initializer)*  
```js

AustralianWomen = People.withMutations(() => {
  return {
    where: { country: 'Australia', gender: 'female' },
    with: related('spouse', 'children', 'jobs')
  }
});
```

-

<a name="errors"></a>

## errors : <code>object</code>
Can be accessed via [errors](#Atlas.errors) or imported directly.

```js
const { NotFoundError } = Atlas.errors;
```

```js
import { NotFoundError } from 'atlas/errors';
```


* [errors](#errors) : <code>object</code>
    * [.NoRowsFoundError](#errors.NoRowsFoundError)
    * [.NotFoundError](#errors.NotFoundError)
    * [.RegisteredKeyError](#errors.RegisteredKeyError)
    * [.UnidentifiableRecordError](#errors.UnidentifiableRecordError)
    * [.UnregisteredKeyError](#errors.UnregisteredKeyError)
    * [.UnsetStateError](#errors.UnsetStateError)


-

<a name="errors.NoRowsFoundError"></a>

### errors.NoRowsFoundError
No records returned.

```js
Mapper.require().fetch().then(...).catch(error => {
  console.log(error);
  // ERROR: No rows found!
});
```

**See**: [require](#Mapper+require)  

-

<a name="errors.NotFoundError"></a>

### errors.NotFoundError
A specific record was not found.

```js
Users.require().find(999).then(...).catch(error => {
  console.log(error);
  // ERROR: No row found!
});
```

**See**: [require](#Mapper+require)  

-

<a name="errors.RegisteredKeyError"></a>

### errors.RegisteredKeyError
A [Mapper](#Mapper) was found at this registry key.

```js
atlas.register('Mapper', Mapper.table('users'));
// ERROR: 'Mapper' already registered!
```


-

<a name="errors.UnidentifiableRecordError"></a>

### errors.UnidentifiableRecordError
Record could not be identified.

```js
Users.update({ name: 'Bob' })
// ERROR: Expected record to have ID attribute 'id'!
```


-

<a name="errors.UnregisteredKeyError"></a>

### errors.UnregisteredKeyError
A [Mapper](#Mapper) was not found.

```js
atlas.register('Users', Mapper.table('users'));
atlas('Useers').fetch()
// ERROR: Unknown registry key 'Useers'!
```


-

<a name="errors.UnsetStateError"></a>

### errors.UnsetStateError
Unset state was required, but had not been set.

```js
Mapper.save({ name: 'Bob' });
// ERROR: Tried to retrieve unset state 'table'~
```

**See**: [requireState](#ImmutableBase+requireState)  

-

<a name="related"></a>

## related(relationName) ⇒ <code>[Related](#Related)</code> &#124; <code>[Array.&lt;Related&gt;](#Related)</code>
Convenience function to help build [Related](#Related) instances.


| Param | Type |
| --- | --- |
| relationName | <code>string</code> &#124; <code>Relation</code> | 

**Example**  
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

-

