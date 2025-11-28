plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":common"))
    implementation(project(":domain"))
    implementation(project(":infrastructure"))
    implementation(project(":user"))

    // Spring Boot Web
    implementation(libs.spring.boot.starter.web)

    // Spring Boot Validation
    implementation(libs.spring.boot.starter.validation)

    // Spring Security
    implementation(libs.spring.boot.starter.security)

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // Spring Transaction
    implementation(libs.spring.tx)

    // Servlet API
    compileOnly("jakarta.servlet:jakarta.servlet-api:6.0.0")
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:3.5.8")
    }
}