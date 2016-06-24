import { groupBy, isArray, isEmpty, isObject, keyBy } from 'lodash';
import { mapperAttributeRef } from '../naming/default-column';
import { isComposite } from '../arguments';
import { isMapper } from './index';

export default {

  /**
   * @method Mapper#one
   * @summary
   *
   * Set the key attribute for a "one-to-many" or "one-to-one" relation.
   *
   * @param {string|string[]} [attribute]
   * @returns {Mapper}
   */
  one(relationAttribute = this.state.relationAttribute) {
    return this.mutate(mapper =>
      mapper.single().setState({ relationAttribute })
    );
  },

  /**
   * @method Mapper#many
   * @summary
   *
   * Set the key attribute for a "many-to-many" or "many-to-one" relation.
   *
   * @param {string|string[]} [attribute]
   * @returns {Mapper}
   */
  many(relationAttribute = this.state.relationAttribute) {
    return this.mutate(mapper =>
      mapper.all().setState({ relationAttribute })
    );
  },

  /**
   * @method Mapper#to
   * @summary
   *
   * Create a relation.
   *
   * @param {Mapper} Other
   *   The mapper representing the relation table.
   * @returns {Mapper} The new relation.
   */
  to(Other) {

    const selfAttribute = this.getRelationAttribute(Other);
    const otherAttribute = Other.getRelationAttribute(this);

    return Other.setState({
      relationAttribute: otherAttribute,
      relationOther: this.setState({ relationAttribute: selfAttribute })
    });
  },

  through(relation) {

    // Since `through`s can be chained, we must select the previous link in the
    // chain.
    //
    const through = (this.state.through || this).relation(relation);

    return this.mutate(mapper => {

      // Set the `through` state for chaining of through relations.
      // Set the new mappers `isSingle` to that of the `through` relation.
      // TODO: This is probably not smart enough to support `one-to-one-to-one` etc.
      // Set `relationAttribute` to null. This can be changed by chaining a
      // `many` or `one` after `through`.
      //
      mapper.join(through).setState({
        through, isSingle: through.state.isSingle, relationAttribute: null
      });
    });
  },

  of(...records) {

    const Other = this.requireState('relationOther');
    const selfAttribute = this.getRelationAttribute(Other);
    const otherAttribute = Other.getRelationAttribute(this);

    // Get all the IDs.
    const id = Other.identifyBy(otherAttribute, ...records);

    if (!isArray(id)) {
      return this.where(selfAttribute, id);
    }

    // An array is not necessarily more than one target. If this has a
    // composite key then that might be a composite key value...
    if (isComposite(selfAttribute) && isComposite(id[0])) {
      return this.where(selfAttribute, id);
    }

    // Special case for single relations that have multiple targets.
    // The mapper may actually be a 'many-to-*' relation masquerading as
    // a 'one-to-*' eg:
    //
    // const userLatestMessage = User
    //   .relation('messages')
    //   .orderBy('received_at', 'desc')
    //   .as('latest_message')
    //   .one();
    //
    // userLatestMessage.of(samantha, anna).fetch().then(messages =>
    //   // ...
    // )
    //
    // TODO: Generate correct query for the above case.
    //
    // See issue #80
    //
    if (this.state.isSingle) {
      return this.mutate(mapper => {
        mapper.all().whereIn(selfAttribute, id);
      });
    }

    // Simple *-to-one
    return isArray(id) && !isComposite(id[0])
      ? this.whereIn(selfAttribute, id)
      : this.where(selfAttribute, id);
  },

  /**
   * Opposite of `getRelationAttribute`.
   *
   * Get the opposite key in a relation. Eg. The key that belongs to the passed
   * mapper `Other`. This argument will be ignored if this mapper is already a
   * relation.
   *
   * @private
   */
  getOtherRelationAttribute(Other) {
    const { relationOther } = this.state;
    return (relationOther || Other).getRelationAttribute(this);
  },

  /**
   * Get the attribute on this mapper that links this relation to its parent.
   *
   * @private
   */
  getRelationAttribute(Other) {
    if (!isMapper(Other)) throw new TypeError(
      `Expected instance of \`Mapper\`, got: ${Other}`
    );

    const specifiedRelationAttribute = this.state.relationAttribute;

    // If the attribute already specifies a specific table and key,
    // we're done. Nothing left to default.
    if (isObject(specifiedRelationAttribute)) {
      return specifiedRelationAttribute;
    }

    // If this is a 'through' relation, then we need to key this key
    // beneath its relation name.
    const Through = this.state.through;
    if (Through != null) {
      const relationAttribute = specifiedRelationAttribute == null
        ? Through.getDefaultRelationAttribute(Other)
        : specifiedRelationAttribute;

      return { [Through.getName()]: relationAttribute };
    }

    // Otherwise just return the already set relation attribute.
    // If none has been set then generate the default.
    return specifiedRelationAttribute || this.getDefaultRelationAttribute(Other);
  },

  getDefaultRelationAttribute(Other) {

    // Many-to-one.
    if (!this.state.isSingle && Other.state.isSingle) {
      const attribute = Other.requireState('idAttribute');
      return this.columnToAttribute(mapperAttributeRef(Other, attribute));
    }

    // Many-to-many, one-to-one, one-to-many.
    return this.requireState('idAttribute');
  },

  // TODO: This should delegate to a single/plural 'mapRelated' variant
  //       function. it's a bit confusing as it is (and expensive).
  mapRelated(parentRecords, selfRecords) {

    // Handle (parent, child) mapping
    if (!isArray(parentRecords)) {
      return selfRecords || this.none();
    }

    const { isSingle, isRequired } = this.state;
    const Parent = this.requireState('relationOther');
    const selfAttribute = this.getRelationAttribute(Parent);
    const parentAttribute = Parent.getRelationAttribute(this);

    const keyFn = isSingle ? keyBy : groupBy;

    const selfRecordsById = keyFn(selfRecords, record =>
      this.identifyBy(selfAttribute, record)
    );

    return parentRecords.map(parentRecord => {
      const id = Parent.identifyBy(parentAttribute, parentRecord);
      const selfRecord = selfRecordsById[id];
      // TODO: Use a proper `RequirementFailedError` for this and all other
      // required triggered errors.
      if (isRequired && isEmpty(selfRecord)) throw new Error(
        `Failed to retrieve relation "${this.getName()}" with where ` +
        `${parentAttribute} is ${id}`
      );
      return selfRecord || this.none();
    });
  },
};
