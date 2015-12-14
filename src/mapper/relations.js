import Promise from 'bluebird';
import { first, zipObject } from 'lodash/array';
import {
  values as objectValues, keys as objectKeys, mapValues
} from 'lodash/object';
import { map, pluck } from 'lodash/collection';
import { isArray, isEmpty, isFunction, isString } from 'lodash/lang';
import RelationTree, { compile, mergeTrees, normalize } from '../relation-tree';

const options = {
  relations: {},
  withRelated: new RelationTree(),
};

const methods = {

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

  withRelated(...relations) {

    // Special case for `withRelated()`, `withRelated(true)` and
    // `withRelated(false)`.
    const allFlag = first(relations);

    // Include all relations defined on model.
    if (isEmpty(relations) || allFlag === true) {
      const relationNames = this.getRelationNames();
      return this.setState({ withRelated: compile(...relationNames) });
    }

    // Include no relations.
    if (allFlag === false) {
      return this.setState({ withRelated: new RelationTree() });
    }

    // Otherwise merge in tree.
    return this.setState({
      withRelated: mergeTrees(this.state.withRelated, compile(...relations))
    });
  },

  related(relationName, ...targetIds) {
    return this.getRelation(relationName).target(...targetIds);
  },

  loadInto(records, relationTree) {

    // This is a no-op if no relations are specified.
    if (isEmpty(relationTree)) {
      return Promise.resolve(records);
    }

    const tree = normalize(relationTree);
    const atlas = this.requireState('atlas');

    return Promise.props(mapValues(tree, ({ initializer, nested }, name) => {
      const relation = this.getRelation(name);
      return atlas(relation.target(records)).withMutations({
        withMutations: initializer, withRelated: nested
      }).fetch().then(related => relation.mapRelated(records, related));
    })).then(relatedByName => {

      if (!isArray(records)) {
        return this.setRelated(records, relatedByName);
      }

      const names = objectKeys(relatedByName);
      const mapped = objectValues(relatedByName);

      return map(records, (record, index) =>
        this.setRelated(record, zipObject(names, pluck(mapped, index)))
      );
    });
  }

};

export default { methods, options };
