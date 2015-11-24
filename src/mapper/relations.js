import Promise from 'bluebird';
import { reduce } from 'lodash/collection';
import { first } from 'lodash/array';
import { keys, mapValues } from 'lodash/object';
import { isEmpty, isFunction, isString } from 'lodash/lang';
import RelationTree, { compile, mergeTrees, normalize } from '../relation-tree';

const options = {
  relations: {},
  withRelated: new RelationTree(),
};

const methods = {

  relations(relations) {
    return this.updateOption('relations', previous =>
      ({ ...previous, ...relations })
    );
  },

  getRelationNames() {
    return keys(this.getOption('relations'));
  },

  getRelation(relationName) {

    if (!isString(relationName)) throw new TypeError(
      `Expected 'relationName' to be a string, got: ${relationName}`
    );

    const relations = this.getOption('relations');
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
      return this.setOption('withRelated', compile(...relationNames));
    }

    // Include no relations.
    if (allFlag === false) {
      return this.setOption('withRelated', new RelationTree());
    }

    // Otherwise merge in tree.
    return this.updateOption('withRelated', previous =>
      mergeTrees(previous, compile(...relations))
    );
  },

  related(relationName, ...targetIds) {
    return this.getRelation(relationName).toMapper(...targetIds);
  },

  loadInto(records, relationTree) {

    // This is a no-op if no relations are specified.
    if (isEmpty(relationTree)) {
      return Promise.resolve(records);
    }

    const tree = normalize(relationTree);
    const atlas = this.getOption('atlas');
    const relatedPromise = Promise.props(mapValues(tree, (
      { initializer, nested }, name
    ) =>
      atlas(this.getRelation(name).toMapper(records))
      .withMutations({
        withMutations: initializer,
        withRelated: nested
      }).fetch()
    ));
    return relatedPromise.then(relatedByName =>
      reduce(relatedByName, (acc, related, relationName) =>
        this
          .getRelation(relationName)
          .assignRelated(records, relationName, related)
      , records)
    );
  }

};

export default { methods, options };
