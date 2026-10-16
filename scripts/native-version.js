/**
 * Keeps the two native `$lib_version` literals in step with `package.json`.
 *
 * Both platforms report the library version from a compile-time constant read once at
 * `initialize` and handed to `APIConstants.setLibVersion(...)`. Nothing in either build
 * derives that constant from the package version, so without this script a release can
 * bump `package.json` and leave the reported version behind.
 *
 * This module is the single owner of the patterns: `prepare-release.yml` runs it to write
 * the literals after bumping `package.json`, and `src/__tests__/version.test.ts` runs the
 * read side so CI fails on drift. Writer and checker share these regexes deliberately —
 * two copies would be free to disagree, which is the failure this is meant to prevent.
 *
 * Usage:
 *   node scripts/native-version.js            write package.json's version into both files
 *   node scripts/native-version.js --check    report only; exit 1 on any mismatch
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/**
 * Lookarounds so the whole match is the version itself and `replace` can swap it without
 * rebuilding the declaration. Each pattern must match exactly once — a renamed or deleted
 * constant has to fail loudly rather than quietly report "in sync".
 */
const NATIVE_VERSION_FILES = [
  {
    platform: 'ios',
    file: 'ios/MixpanelSwiftSessionReplay.swift',
    constant: 'libVersion',
    pattern: /(?<=static let libVersion = ")[^"]*(?=")/g,
  },
  {
    platform: 'android',
    file: 'android/src/main/java/com/mixpanelreactnativesessionreplay/MixpanelReactNativeSessionReplayModule.kt',
    constant: 'LIB_VERSION',
    pattern: /(?<=const val LIB_VERSION = ")[^"]*(?=")/g,
  },
];

function packageVersion() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    .version;
}

/**
 * The version `target`'s constant declares in `contents`.
 *
 * Pure, so the error paths below — the ones that make a renamed or duplicated
 * constant fail instead of passing — are testable without fixture files on disk.
 *
 * @throws if the pattern matches anything other than exactly once.
 */
function extractVersion(contents, target) {
  const matches = contents.match(target.pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(
      `${target.file}: expected exactly one \`${target.constant}\` declaration, found ` +
        `${matches ? matches.length : 0}. If the constant was renamed, update ` +
        'scripts/native-version.js to match.'
    );
  }
  return matches[0];
}

function readFile(target) {
  return fs.readFileSync(path.join(ROOT, target.file), 'utf8');
}

/** @returns {{ios: string, android: string}} the version each platform currently reports. */
function readNativeVersions() {
  return Object.fromEntries(
    NATIVE_VERSION_FILES.map((target) => [
      target.platform,
      extractVersion(readFile(target), target),
    ])
  );
}

/**
 * Rewrites both literals to `version`.
 *
 * @returns {Array<{file: string, from: string, to: string}>} the files actually changed.
 */
function syncNativeVersions(version) {
  const changed = [];
  for (const target of NATIVE_VERSION_FILES) {
    const contents = readFile(target);
    const current = extractVersion(contents, target);
    if (current === version) {
      continue;
    }
    fs.writeFileSync(
      path.join(ROOT, target.file),
      contents.replace(target.pattern, version)
    );
    changed.push({ file: target.file, from: current, to: version });
  }
  return changed;
}

function main(argv) {
  const version = packageVersion();

  if (argv.includes('--check')) {
    const mismatched = Object.entries(readNativeVersions()).filter(
      ([, reported]) => reported !== version
    );
    if (mismatched.length > 0) {
      for (const [platform, reported] of mismatched) {
        const target = NATIVE_VERSION_FILES.find(
          (t) => t.platform === platform
        );
        console.error(
          `${target.file}: ${target.constant} is "${reported}", expected "${version}". ` +
            'Run `node scripts/native-version.js` to fix.'
        );
      }
      process.exitCode = 1;
      return;
    }
    console.log(`Native lib version in sync: ${version}`);
    return;
  }

  const changed = syncNativeVersions(version);
  if (changed.length === 0) {
    console.log(`Native lib version already ${version}; nothing to do.`);
    return;
  }
  for (const { file, from, to } of changed) {
    console.log(`${file}: ${from} -> ${to}`);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  NATIVE_VERSION_FILES,
  extractVersion,
  packageVersion,
  readNativeVersions,
  syncNativeVersions,
};
