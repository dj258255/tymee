rootProject.name = "tymee"

enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        google()
        // Maven Central 미러 (GitHub Actions 403 에러 대비)
        maven {
            url = uri("https://maven.aliyun.com/repository/public")
        }
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        google()
        // Maven Central 미러 (GitHub Actions 403 에러 대비)
        maven {
            url = uri("https://maven.aliyun.com/repository/public")
        }
        maven {
            url = uri("https://maven.aliyun.com/repository/gradle-plugin")
        }
    }
}

// Core module (공통 + 도메인 추상화 + 인프라 설정)
include("core")

// Domain modules (Vertical Slice per domain)
include("user")
include("auth")
include("upload")
include("category")
include("timeblock")
include("notification")

// Bootstrap module (실행 진입점)
include("bootstrap")
