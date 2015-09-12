const defaultOptions = {
  idAttribute: 'idAttribute'
}

const methods = {
  idAttribute(idAttribute) {
    return this.setOption('idAttribute', idAttribute);
  }
}

export { defaultOptions, methods };
