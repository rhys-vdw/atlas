import { isArray } from 'lodash/lang';
import { indexBy } from 'lodash/collection';
import Options from '../options';
import * as DefaultColumn from './default-column';
//import { isMapper } from '../mapper';

const OPTIONS = {
  selfKeyAttribute: null,
  otherRefAttribute: null
};

export default class HasOne extends Options {
  constructor() {
    super(OPTIONS);
  }

  // -- Options --

  selfKey(attribute) {
    return this.setOption('selfKeyAttribute', attribute);
  }

  otherRef(attribute) {
    return this.setOption('otherRefAttribute', attribute);
  }

  self(selfMapper) {
    return this.setOption('selfMapper', selfMapper);
  }

  other(otherMapper) {
    return this.setOption('otherMapper', otherMapper);
  }

  // -- Keys --

  getSelfKey(selfMapper) {
    return this.getOption('selfKeyAttribute') ||
      selfMapper.getOption('idAttribute');
  }

  getOtherRef(selfMapper, otherMapper) {
    let otherRef = this.getOption('otherRefAttribute');
    if (!otherRef) {
      const selfKey = this.getSelfKey(selfMapper);
      otherRef = otherMapper.columnToAttribute(
        DefaultColumn.fromMapperAttribute(selfMapper, selfKey)
      );
    }
    return otherRef;
  }

  toMapper(getMapper, targetIds) {
    const selfMapper = getMapper(this.getOption('selfMapper'));
    const otherMapper = getMapper(this.getOption('otherMapper'));

    const selfKey = this.getSelfKey(selfMapper);
    const otherRef = this.getOtherRef(selfMapper, otherMapper);
    const id = selfMapper.identifyBy(selfKey, targetIds);
    return otherMapper.targetBy(otherRef, id).default(otherRef, id);
  }

  load(getMapper, relationName, records) {
    return Promise.try(() => {
      const mapper = this.toMapper();

      if (!isArray(records)) {
        return mapper.fetch().then(related =>
          mapper.setRelated(records, relationName, related)
        );
      }

      return mapper.fetch().then(related =>
        this.assign(getMapper, relationName, records, related)
      );
    });
  }

  assign(getMapper, relationName, records, related) {
    const selfMapper = getMapper(this.getOption('selfMapper'));
    const otherMapper = getMapper(this.getOption('otherMapper'));

    const selfKey = this.getSelfKey(selfMapper);
    const otherRef = this.getOtherRef(selfMapper, otherMapper);
    const relatedById = indexBy(related, record =>
      otherMapper.identifyBy(otherRef, record)
    );

    return records.map(record => {
      const id = selfMapper.identifyBy(record, selfKey);
      const related = relatedById[id] || null;
      return selfMapper.setRelated(record, relationName, related);
    });
  }

}
