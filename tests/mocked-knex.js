import Knex from 'knex';
import QueryBuilder from 'knex/lib/query/builder';
import Promise from 'bluebird';
import isFunction from 'lodash/lang/isFunction';

class MockedQueryBuilder extends QueryBuilder {

  then(...args) {
    return Promise.resolve(this.toString())
      .then(this._mockCallback.bind(this))
      .then(...args);
  }

  mockCallback(callback) {
    this._mockCallback = callback;
    return this;
  }

  clone() {
    const cloned = super.clone();
    cloned._mockCallback = this._mockCallback;
    return cloned;
  }
}

export default function (client, callback) {

  if (isFunction(client)) {
    callback = client;
    client = null;
  }

  const knex = Knex({ client });

  return function(tableName) {
    return new MockedQueryBuilder(knex.client)
      .from(tableName)
      .mockCallback(callback);
  };
}
