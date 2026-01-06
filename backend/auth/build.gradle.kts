plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":core"))
    implementation(project(":user"))

    // Spring Boot Web
    implementation(libs.spring.boot.starter.web)

    // Spring Boot Validation
    implementation(libs.spring.boot.starter.validation)

    // Spring Security
    implementation(libs.spring.boot.starter.security)

    // Spring Data Redis
    implementation(libs.spring.boot.starter.data.redis)

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // OAuth (Google idToken 검증)
    implementation(libs.google.api.client)

    // Spring Transaction
    implementation(libs.spring.tx)

    // Servlet API (Jakarta EE 11)
    compileOnly("jakarta.servlet:jakarta.servlet-api:6.1.0")

    // Jackson (for Kakao/Apple OAuth)
    implementation("com.fasterxml.jackson.core:jackson-databind")
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
