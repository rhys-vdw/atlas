import test from 'tape';
import Atlas from '../../lib/atlas';

const basePath = '../../lib';
const plugins = ['CamelCase']

test('Atlas.plugins exposes all plugins', t => {
  for (const plugin of plugins) {
    t.ok(Atlas.plugins[plugin]);
  }
  t.end();
});

for (const plugin of plugins) {
  test(`all three export methods work for ${plugin} plugin`, t => {
    const directImport = require(`${basePath}/plugins/${plugin}`).default;
    const pluginExport = require(`${basePath}/plugins`)[plugin];
    const attached = Atlas.plugins[plugin];

    // Check that the direct import is defined.
    t.ok(directImport != null);

    // Now check that all three are equal.
    t.equal(directImport, attached);
    t.equal(attached, pluginExport);

    t.end();
  });
}
