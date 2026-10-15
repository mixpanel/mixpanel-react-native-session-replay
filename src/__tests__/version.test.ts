/**
 * The `$lib_version` each native bridge reports is a literal, written from `package.json` by
 * `scripts/native-version.js` during the release. This test is the backstop that fails the
 * build if the two ever drift apart.
 *
 * It runs in CI's `test` job and again in `release-npm.yml` before publishing.
 */

// `export {}` keeps this file a module. Without it the `require` destructuring below
// declares globals, which collide with the declarations `yarn prepare` emits into
// `lib/typescript/` for this same file.
export {};

const {
  readNativeVersions,
  packageVersion,
} = require('../../scripts/native-version');

describe('native $lib_version', () => {
  const expected = packageVersion();
  const reported = readNativeVersions();

  it.each(Object.keys(reported))('matches package.json on %s', (platform) => {
    expect(reported[platform]).toBe(expected);
  });

  it('covers both platforms', () => {
    // A pattern silently dropped from scripts/native-version.js would make the checks
    // above vacuously pass.
    expect(Object.keys(reported).sort()).toEqual(['android', 'ios']);
  });
});
