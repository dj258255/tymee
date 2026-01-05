plugins {
    id("java")
    alias(libs.plugins.spring.boot) apply false
    alias(libs.plugins.spring.dependency.management) apply false
    alias(libs.plugins.lombok) apply false
    alias(libs.plugins.spotless)
    alias(libs.plugins.spotbugs) apply false
    id("checkstyle")
    id("jacoco")
}

group = "io.github.beom"
version = "1.0-SNAPSHOT"

allprojects {
    repositories {
        mavenCentral()
    }
}

// Spotless 설정 (코드 포맷팅)
spotless {
    java {
        target("**/*.java")
        targetExclude("**/build/**")
        googleJavaFormat()
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
    kotlinGradle {
        target("**/*.gradle.kts")
        ktlint()
    }
}

subprojects {
    apply(plugin = "java")
    apply(plugin = "io.spring.dependency-management")
    apply(plugin = "io.freefair.lombok")
    apply(plugin = "checkstyle")
    apply(plugin = "com.github.spotbugs")
    apply(plugin = "jacoco")

    java {
        toolchain {
            languageVersion = JavaLanguageVersion.of(25)
        }
    }

    val libs = rootProject.extensions.getByType<VersionCatalogsExtension>().named("libs")

    dependencies {
        // Testing
        testImplementation(platform(libs.findLibrary("junit-bom").get()))
        testImplementation(libs.findLibrary("junit-jupiter").get())
        testImplementation(libs.findLibrary("mockito-core").get())
        testImplementation(libs.findLibrary("mockito-junit-jupiter").get())

        // SpotBugs annotations (suppress warnings)
        compileOnly(libs.findLibrary("spotbugs-annotations").get())
    }

    // Checkstyle 설정
    checkstyle {
        toolVersion = libs.findVersion("checkstyle").get().toString()
        configFile = rootProject.file("config/checkstyle/checkstyle.xml")
        isIgnoreFailures = false
        maxWarnings = 0
    }

    // SpotBugs 설정
    configure<com.github.spotbugs.snom.SpotBugsExtension> {
        ignoreFailures = false
        showStackTraces = true
        showProgress = true
        effort = com.github.spotbugs.snom.Effort.MAX
        reportLevel = com.github.spotbugs.snom.Confidence.MEDIUM
        excludeFilter = rootProject.file("config/spotbugs/exclude.xml")
    }

    tasks.withType<com.github.spotbugs.snom.SpotBugsTask> {
        reports.create("html") {
            required = true
        }
        reports.create("xml") {
            required = true
        }
    }

    // JaCoCo 설정
    jacoco {
        toolVersion = "0.8.14"
    }

    tasks.test {
        useJUnitPlatform()
        finalizedBy(tasks.named("jacocoTestReport"))
        jvmArgs(
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED",
            "--add-opens",
            "jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED",
        )
    }

    tasks.named<JacocoReport>("jacocoTestReport") {
        dependsOn(tasks.test)
        reports {
            xml.required = true
            html.required = true
            csv.required = false
        }
    }

    tasks.named<JacocoCoverageVerification>("jacocoTestCoverageVerification") {
        violationRules {
            rule {
                limit {
                    minimum = "0.60".toBigDecimal()
                }
            }
            rule {
                element = "CLASS"
                excludes =
                    listOf(
                        "*.config.*",
                        "*.dto.*",
                        "*Application",
                    )
                limit {
                    counter = "LINE"
                    minimum = "0.70".toBigDecimal()
                }
            }
        }
    }

    tasks.withType<JavaCompile> {
        options.compilerArgs.addAll(
            listOf(
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED",
                "--add-opens",
                "jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED",
            ),
        )
    }
}
