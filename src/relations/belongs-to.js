import { isArray, keyBy, head } from 'lodash';
import { mapperAttributeRef } from '../naming/default-column';
import { isComposite, assertKeysCompatible } from '../arguments';

export default class BelongsTo {
  constructor(Self, Other, { selfRef, otherKey } = {}) {

    const otherAttribute = otherKey || Other.requireState('idAttribute');
    const selfAttribute = selfRef || Other.columnToAttribute(
      mapperAttributeRef(Other, otherAttribute)
    );

    assertKeysCompatible({ selfAttribute, otherAttribute });

    this.Self = Self;
    this.Other = Other;
    this.selfAttribute = selfAttribute;
    this.otherAttribute = otherAttribute;
  }

  of(...targetIds) {
    const { Self, Other, selfAttribute, otherAttribute } = this;

    const id = Self.identifyBy(selfAttribute, ...targetIds);

    const isSingle = !isArray(id) ||
      isComposite(selfAttribute) && !isComposite(head(id));

    return Other.withMutations(mapper => {
      mapper.targetBy(otherAttribute, id);
    });
  }

  mapRelated(records, related) {
    if (!isArray(records)) {
      return related || null;
    }

    const { Self, Other, selfAttribute, otherAttribute } = this;

    const relatedById = keyBy(related, record =>
      Other.identifyBy(otherAttribute, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfAttribute, record);
      return relatedById[id] || null;
    });
  }

}
