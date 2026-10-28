import test from 'node:test';
import assert from 'node:assert/strict';
import { staleFiles, stamp } from '../../scripts/stamp-version.mjs';

// Fails when code changed without re-stamping: run node scripts/stamp-version.mjs.
test('every script and stylesheet URL carries the current release stamp', () => {
  assert.deepEqual(staleFiles(), []);
});
test('stamps only local script and stylesheet references', () => {
  const html = '<link href="./styles.css"><script src="../preview/app.js?v=abc"></script><img src="../logo.png"><script src="https://www.gstatic.com/x.js"></script>';
  assert.equal(stamp(html, '123'), '<link href="./styles.css?v=123"><script src="../preview/app.js?v=123"></script><img src="../logo.png"><script src="https://www.gstatic.com/x.js"></script>');
  assert.equal(stamp("import { a } from './data.js';\nimport('https://www.gstatic.com/f.js')", '9'), "import { a } from './data.js?v=9';\nimport('https://www.gstatic.com/f.js')");
});
