plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    // Validation
    implementation(libs.jakarta.validation)

    // Utilities
    implementation(libs.commons.lang3)

    // Spring Context for DI
    compileOnly(libs.spring.context)

    // Spring Data JPA
    implementation(libs.spring.boot.starter.data.jpa)

    // Database
    runtimeOnly(libs.h2)
    runtimeOnly(libs.postgresql)

    // Spring Transaction
    implementation(libs.spring.tx)
}

dependencyManagement {
    imports {
        mavenBom(libs.spring.boot.dependencies.get().toString())
    }
}
