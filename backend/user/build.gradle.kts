plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":core"))

    // Spring Boot Web
    implementation(libs.spring.boot.starter.web)

    // Spring Boot Validation
    implementation(libs.spring.boot.starter.validation)

    // Spring Data JPA (for JPA repositories and entities)
    implementation(libs.spring.boot.starter.data.jpa)

    // Spring Security
    implementation(libs.spring.boot.starter.security)

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // Spring Transaction
    implementation(libs.spring.tx)

    // Test
    testImplementation(libs.spring.boot.starter.test)
    testImplementation("org.springframework.boot:spring-boot-data-jpa-test")
    testImplementation(libs.h2)
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

dependencyManagement {
    imports {
        mavenBom(
            libs.spring.boot.dependencies
                .get()
                .toString(),
        )
    }
}
