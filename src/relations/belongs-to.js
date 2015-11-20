import { isArray } from 'lodash/lang';
import { indexBy } from 'lodash/collection';
import { first } from 'lodash/array';
import * as DefaultColumn from '../naming/default-column';
import { isComposite, keysCompatible } from '../arguments';

export default class BelongsTo {
  constructor(Self, Other, { selfRef, otherKey } = {}) {
    if (selfRef == null) {
      selfRef = DefaultColumn.mapperAttributeRef(Other, otherKey);
    }

    if (otherKey == null) {
      otherKey = Other.getOption('idAttribute');
    }

    if (!keysCompatible(selfRef, otherKey)) throw new TypeError(
      `Mismatched key types. selfRef=${selfRef} otherKey=${otherKey}`
    );

    this.Self = Self;
    this.Other = Other;
    this.selfRef = selfRef;
    this.otherKey = otherKey;
  }

  toMapper(...targetIds) {
    const { Self, Other, selfRef, otherKey } = this;

    const id = Self.identifyBy(selfRef, ...targetIds);

    const isSingle = !isArray(id) ||
      isComposite(selfRef) && !isComposite(first(id));

    return Other.withMutations(mapper => {
      mapper.targetBy(otherKey, id);
      if (isSingle) {
        mapper.defaultAttribute(otherKey, id);
      }
    });
  }

  assignRelated(records, relationName, related) {
    const { Self, Other, selfRef, otherKey } = this;

    if (!isArray(records)) {
      return Self.setRelated(records, relationName, related);
    }

    const relatedById = indexBy(related, record =>
      Other.identifyBy(otherKey, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfRef, record);
      const related = relatedById[id] || null;
      return Self.setRelated(record, relationName, related);
    });
  }

}
