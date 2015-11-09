import { isArray } from 'lodash/lang';
import { indexBy } from 'lodash/collection';
import { first } from 'lodash/array';
import * as DefaultColumn from './default-column';
import { isComposite, keysCompatible } from '../arguments';

export default class HasOne {
  constructor(Other, attributes = {}) {
    this.Other = Other;
    this.attributes = attributes;
    this.mappers = {};
  }

  initialize(Self) {
    this.Self = Self;
    return this;
  }

  getAttribute(name, getDefault) {
    return this.attributes[name] || (this.attributes[name] = getDefault());
  }

  getSelfKey(atlas) {
    return this.getAttribute('selfKey', () =>
      atlas(this.Self).getOption('idAttribute')
    );
  }

  getOtherRef(atlas) {
    return this.getAttribute('otherRef', () => {
      const selfKey = this.getSelfKey(atlas);
      const Self = atlas(this.Self);
      const Other = atlas(this.Other);
      const column = DefaultColumn.fromMapperAttribute(Self, selfKey);
      return Other.columnToAttribute(column);
    });
  }

  toMapper(atlas, targetIds) {
    const Self = atlas(this.Self);
    const Other = atlas(this.Other);

    const selfKey = this.getSelfKey(atlas);
    const otherRef = this.getOtherRef(atlas);

    const id = Self.identifyBy(selfKey, targetIds);

    if (!keysCompatible(selfKey, otherRef)) throw new TypeError(
      `Mismatched key types. selfKey=${selfKey} otherRef=${otherRef}`
    );

    const isSingle = !isArray(id) ||
      isComposite(selfKey) && !isComposite(first(id));

    return Other.withMutations(mapper => {
      mapper.targetBy(otherRef, id);
      if (isSingle) {
        mapper.defaultAttribute(otherRef, id);
      }
    });
  }

  load(atlas, relationName, records) {
    const Mapper = this.toMapper(atlas, records);

    if (!isArray(records)) {
      return Mapper.fetch().then(related =>
        Mapper.setRelated(records, relationName, related)
      );
    }

    return Mapper.fetch().then(related =>
      this.assign(atlas, relationName, records, related)
    );
  }

  assignRelated(atlas, relationName, records, related) {
    const Self = atlas(this.Self);
    const Other = atlas(this.Other);

    const selfKey = this.getSelfKey(atlas);
    const otherRef = this.getOtherRef(atlas);

    const relatedById = indexBy(related, record =>
      Other.identifyBy(otherRef, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfKey, record);
      const related = relatedById[id] || null;
      return Self.setRelated(record, relationName, related);
    });
  }

}
