import { keyValueToObject } from '../arguments';

export default {

  defaultAttribute(attribute, value) {
    return this.defaultAttributes(keyValueToObject(attribute, value));
  },

  defaultAttributes(attributes) {
    return this.setState({ defaultAttributes:
      { ...(this.state.defaultAttributes || {}), ...attributes }
    });
  },

  strictAttribute(attribute, value) {
    return this.strictAttributes(keyValueToObject(attribute, value));
  },

  strictAttributes(attributes) {
    return this.setState({ strictAttributes:
      { ...(this.state.strictAttributes || {}), ...attributes }
    });
  },

};
