pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        // The Session Replay SDK build that carries wireframe support is not published yet.
        // Publish it first:
        //   cd ../../mixpanel-android-private && ./gradlew :session-replay:publishToMavenLocal
        mavenLocal()
    }
}

rootProject.name = "wireframe-goldens"
