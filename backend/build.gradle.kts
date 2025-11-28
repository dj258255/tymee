plugins {
    id("java")
    alias(libs.plugins.spring.boot) apply false
    alias(libs.plugins.spring.dependency.management) apply false
    alias(libs.plugins.lombok) apply false
}

group = "io.github.beom"
version = "1.0-SNAPSHOT"

allprojects {
    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "java")
    apply(plugin = "io.spring.dependency-management")
    apply(plugin = "io.freefair.lombok")

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
    }

    tasks.withType<JavaCompile> {
        options.compilerArgs.addAll(listOf(
            "--add-opens", "jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED"
        ))
    }

    tasks.test {
        useJUnitPlatform()
        jvmArgs(
            "--add-opens", "jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED",
            "--add-opens", "jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED"
        )
    }
}