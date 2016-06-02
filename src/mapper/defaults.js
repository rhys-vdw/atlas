import { keyValueToObject } from '../arguments';

export default {

  /**
   * @callback Mapper~attributeCallback
   * @param {Object} attributes
   * @returns {mixed|undefined}
   *   Either a value to be assigned to an attribute, or `undefined` to mean
   *   none should be set.
   */

  /**
   * @method Mapper#defaultAttribute
   * @summary
   *
   * Set a default value for an attribute.
   *
   * @see {@link Mapper#defaultAttributes defaultAttributes}.
   * @param {string} attribute
   * @param {mixed|Mapper~attributeCallback} value
   * @returns {Mapper}
   *   Mapper with a default attribute.
   */
  defaultAttribute(attribute, value) {
    return this.defaultAttributes(keyValueToObject(attribute, value));
  },

  /**
   * @method Mapper#defaultAttributes
   * @summary
   *
   * Set default values for attributes.
   *
   * @description
   *
   * These values will be used by {@link Mapper#forge forge} and
   * {@link Mapper#insert insert} when no value is provided.
   *
   * ```js
   * const Users = Mapper.table('users').defaultAttributes({
   *   name: 'Anonymous', rank: 0
   * });
   * ```
   *
   * Alternatively values can be callbacks that receive attributes and return a
   * default value. In the below example a new document record is generated with
   * a default name and template.
   *
   * ```js
   * const HtmlDocuments = Mapper.table('documents').defaultAttributes({
   *   title: 'New Document',
   *   content: attributes => (
   *     `<html>
   *       <head>
   *         <title>${ attributes.title || 'New Document'}</title>
   *       </head>
   *       <body>
   *       </body>
   *     </html>`
   *   )
   * });
   *
   * HtmlDocuments.save({ title: 'Atlas Reference' }).then(doc =>
   *   console.dir(doc);
   *   // {
   *   //   title: 'Atlas Reference',
   *   //   content: '<html>\n  <head>\n    <title>Atlas Reference</title>...'
   *   // }
   * );
   * ```
   *
   * @param {Object<string, (mixed|Mapper~attributeCallback)>} attributes
   *   An object mapping values (or callbacks) to attribute names.
   * @returns {Mapper}
   *   Mapper with default attributes.
   */
  defaultAttributes(attributes) {
    return this.setState({ defaultAttributes:
      { ...(this.state.defaultAttributes || {}), ...attributes }
    });
  },

  /**
   * @method Mapper#strictAttribute
   * @summary
   *
   * Set an override value for an attribute.
   *
   * @see Mapper#strictAttributes
   * @param {string} attribute
   * @param {mixed|Mapper~attributeCallback} value
   * @returns {Mapper}
   *   Mapper with strict attributes.
   */
  strictAttribute(attribute, value) {
    return this.strictAttributes(keyValueToObject(attribute, value));
  },

  /**
   * @method Mapper#strictAttributes
   * @summary
   *
   * Set override values for a attributes.
   *
   * @description
   *
   * Set values to override any passed to {@link Mapper#forge forge},
   * {@link Mapper#insert insert} or {@link Mapper#update update}.
   *
   *
   * Alternatively values can be callbacks that receive attributes and
   * return a value.
   *
   * ```
   * Users = Mapper.table('users').strictAttributes({
   *   email: attributes => attributes.email.trim(),
   *   is_admin: false
   * });
   * ```
   *
   * @param {Object<string, (mixed|Mapper~attributeCallback)>} attributes
   *   An object mapping values (or callbacks) to attribute names.
   * @returns {Mapper}
   *   Mapper with default attributes.
   *
   */
  strictAttributes(attributes) {
    return this.setState({ strictAttributes:
      { ...(this.state.strictAttributes || {}), ...attributes }
    });
  },

};
