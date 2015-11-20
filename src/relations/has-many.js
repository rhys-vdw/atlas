import { isArray } from 'lodash/lang';
import { groupBy } from 'lodash/collection';
import { first } from 'lodash/array';
import * as DefaultColumn from './default-column';
import { isComposite, keysCompatible } from '../arguments';

export default class HasMany {
  constructor(Self, Other, { selfKey, otherRef } = {}) {
    if (selfKey == null) {
      selfKey = Self.getOption('idAttribute');
    }

    if (otherRef == null) {
      otherRef = DefaultColumn.fromMapperAttribute(Self, selfKey);
    }

    if (!keysCompatible(selfKey, otherRef)) throw new TypeError(
      `Mismatched key types. selfKey=${selfKey} otherRef=${otherRef}`
    );

    this.Self = Self;
    this.Other = Other;
    this.selfKey = selfKey;
    this.otherRef = otherRef;
  }

  toMapper(...targetIds) {
    const { Self, Other, selfKey, otherRef } = this;

    const id = Self.identifyBy(selfKey, ...targetIds);
    const isSingle = !isArray(id) ||
      isComposite(selfKey) && !isComposite(first(id));

    return Other.withMutations(mapper => {
      if (isSingle) {
        mapper.where(otherRef, id);
        mapper.defaultAttribute(otherRef, id);
      } else {
        mapper.whereIn(otherRef, id);
      }
    });
  }

  assignRelated(records, relationName, related) {
    const { Self, Other, selfKey, otherRef } = this;

    if (!isArray(records)) {
      return Self.setRelated(records, relationName, related);
    }

    const relatedById = groupBy(related, record =>
      Other.identifyBy(otherRef, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfKey, record);
      const related = relatedById[id] || [];
      return Self.setRelated(record, relationName, related);
    });
  }

}
