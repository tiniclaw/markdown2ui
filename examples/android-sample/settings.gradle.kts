pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "markdown2ui-sample"

include(":app")
include(":markdown2ui")

// Point the :markdown2ui module at the library source
project(":markdown2ui").projectDir = file("../../packages/android")
