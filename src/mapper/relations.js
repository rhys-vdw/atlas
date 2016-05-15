import { inspect } from 'util';
import {
  flatten, keys as objectKeys, reject, isEmpty, isFunction, isString
} from 'lodash';
import { isRelated } from '../related';
import EagerLoader from '../eager-loader';

export default {

  relations(relations) {
    return this.setState({ relations:
      { ...this.state.relations, ...relations }
    });
  },

  getRelationNames() {
    return objectKeys(this.state.relations);
  },

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

  load(...related) {
    return new EagerLoader(this, flatten(related));
  }

};
