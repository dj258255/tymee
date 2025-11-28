plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":common"))
    implementation(project(":domain"))

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
        mavenBom("org.springframework.boot:spring-boot-dependencies:3.5.8")
    }
}
