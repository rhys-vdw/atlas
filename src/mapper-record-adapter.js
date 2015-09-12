import { isArray } from 'lodash/lang';

const methods = {
  getAttribute(attribute, record) {
    return record[attribute];
  }
};

export default { methods };
