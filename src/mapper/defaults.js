import { keyValueToObject } from '../arguments';

const options = {
  defaultAttributes: {},
  strictAttributes: {}
};

const methods = {

  defaultAttribute(attribute, value) {
    return this.updateOption('defaultAttributes', previous =>
      ({ ...previous, ...keyValueToObject(attribute, value) })
    );
  },

  defaultAttributes(attributes) {
    return this.updateOption('defaultAttributes', previous =>
      ({ ...previous, ...attributes })
    );
  },

  strictAttribute(attribute, value) {
    return this.updateOption('strictAttributes', previous =>
      ({ ...previous, ...keyValueToObject(attribute, value) })
    );
  },

  strictAttributes(attributes) {
    return this.updateOption('strictAttributes', previous =>
      ({ ...previous, ...attributes })
    );
  },

};

export default { options, methods };
