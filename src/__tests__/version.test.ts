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
  NATIVE_VERSION_FILES,
  extractVersion,
  readNativeVersions,
  packageVersion,
} = require('../../scripts/native-version');

type Target = {
  platform: string;
  file: string;
  constant: string;
  pattern: RegExp;
};

const targets: Target[] = NATIVE_VERSION_FILES;
const target = (platform: string) =>
  targets.find((t) => t.platform === platform)!;

/** Minimal stand-ins for the real declarations, so the error paths need no fixture files. */
const SOURCE: Record<string, string> = {
  ios: 'class MixpanelSwiftSessionReplay: NSObject {\n  static let libVersion = "1.2.0"\n  static let mpLib = "react-native-sr"\n}\n',
  android:
    'companion object {\n    const val LIB_VERSION = "1.2.0"\n    const val MP_LIB = "react-native-sr"\n}\n',
};

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

describe('extractVersion', () => {
  it.each(['ios', 'android'])('reads the %s declaration', (platform) => {
    expect(extractVersion(SOURCE[platform], target(platform))).toBe('1.2.0');
  });

  it.each(['ios', 'android'])(
    'throws when the %s constant is renamed away',
    (platform) => {
      // The failure this guards: a silent "no match" would let a release report a
      // stale version while every check still passed.
      const renamed = SOURCE[platform]!.replace(
        target(platform).constant,
        `${target(platform).constant}_RENAMED`
      );
      expect(() => extractVersion(renamed, target(platform))).toThrow(
        /expected exactly one .* declaration, found 0/
      );
    }
  );

  it.each(['ios', 'android'])(
    'throws when the %s constant is declared twice',
    (platform) => {
      // Two declarations mean the writer would rewrite both and the reader could not
      // say which one ships.
      const duplicated = SOURCE[platform]! + SOURCE[platform];
      expect(() => extractVersion(duplicated, target(platform))).toThrow(
        /expected exactly one .* declaration, found 2/
      );
    }
  );
});

describe('the write patterns', () => {
  it.each(['ios', 'android'])(
    'replace only the %s version literal',
    (platform) => {
      const rewritten = SOURCE[platform]!.replace(
        target(platform).pattern,
        '9.9.9'
      );

      expect(extractVersion(rewritten, target(platform))).toBe('9.9.9');
      // The surrounding declaration, and the neighbouring mp_lib constant, are untouched.
      expect(rewritten).toContain('react-native-sr');
      expect(rewritten).toBe(SOURCE[platform]!.replace('1.2.0', '9.9.9'));
    }
  );

  it.each(['ios', 'android'])(
    'are a no-op on %s when the version already matches',
    (platform) => {
      expect(SOURCE[platform]!.replace(target(platform).pattern, '1.2.0')).toBe(
        SOURCE[platform]
      );
    }
  );
});
