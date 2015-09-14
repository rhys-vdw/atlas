import Knex from 'knex';
import QueryBuilder from 'knex/lib/query/builder';
import Promise from 'bluebird';
import { assign } from 'lodash/object';

class MockedQueryBuilder extends QueryBuilder {

  then(...args) {
    return Promise.resolve(this.toString())
      .then(this._mockCallback.bind(this));
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

export default function (callback) {

  const knex = Knex({});

  return function(tableName) {
    return new MockedQueryBuilder(knex.client)
      .from(tableName)
      .mockCallback(callback);
  }
}
