import org.gradle.api.tasks.PathSensitivity

/**
 * React Native wireframe coordinate goldens, rendered off-device by Paparazzi (layoutlib).
 *
 * **Why this is a standalone project and not `android/src/test`.** The `android/` module is
 * autolinked into every consumer app, so its `build.gradle` is evaluated by *their* Gradle
 * build — adding the Paparazzi plugin there would force every app that installs this package
 * to resolve it. Nothing here is part of the npm package (see `files` in `package.json`) or of
 * any consumer build.
 *
 * **What it is for.** The SDK's own goldens already pin the walk over plain
 * `TextView`/`EditText`/`ImageView`. These pin it over the *React Native* view tree — real
 * `ReactTextView`, `ReactEditText`, `ReactImageView`, `ReactViewGroup` — which is the part a
 * React Native upgrade can change underneath us. A renamed or restructured view class shows up
 * here and nowhere else.
 */
plugins {
    id("com.android.library") version "8.7.2"
    id("org.jetbrains.kotlin.android") version "2.0.21"
    id("app.cash.paparazzi") version "1.3.5"
}

android {
    namespace = "com.mixpanelreactnativesessionreplay.goldens"

    // One test variant only.
    //
    // `./gradlew test` otherwise runs debug *and* release unit tests, two JVMs against the same
    // golden directory — and the auto-create-if-missing path means both may write the same file
    // while the other is comparing it. Nothing here is build-type dependent, so the second
    // variant buys no coverage and only adds a race. (Suspected cause of one inconsistent
    // reading seen while authoring `declared_glyph_kept`, which three `--rerun-tasks` runs then
    // reproduced identically.)
    @Suppress("UnstableApiUsage")
    testOptions {
        unitTests.all { test -> test.onlyIf { test.name.contains("Debug") } }
    }
    compileSdk = 35

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    // Matches the version in the npm package's peer/dev setup. Bumping React Native means
    // bumping this and re-running the goldens: a diff here is the upgrade's blast radius on
    // the wireframe, which is the whole point of the module.
    testImplementation("com.facebook.react:react-android:0.79.2")
    testImplementation("com.mixpanel.android:mixpanel-android-session-replay:1.4.0-wire15")
    testImplementation("junit:junit:4.13.2")
}

/**
 * Paparazzi 1.3.5's HTML reporter calls a Gradle internal removed in Gradle 9. It runs after
 * the tests pass, so dropping the HTML report is enough — XML results are unaffected.
 */
tasks.withType<Test>().configureEach {
    reports.html.required.set(false)

    // Declare the goldens as task inputs so editing one re-runs the tests. Without this Gradle
    // sees no input change and reports UP-TO-DATE, which reads as a *passing* run against the
    // edited golden — a false green that hides exactly the regression these files exist to catch.
    inputs.dir("src/test/golden")
        .withPropertyName("wireframeGoldens")
        .withPathSensitivity(PathSensitivity.RELATIVE)
}
