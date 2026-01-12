plugins {
    `java-library`
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

    // Spring Web (for GlobalExceptionHandler)
    implementation(libs.spring.boot.starter.web)

    // Spring Security (for exception handling, @AuthenticationPrincipal)
    implementation(libs.spring.boot.starter.security)

    // Database
    runtimeOnly(libs.mysql)
    testRuntimeOnly(libs.h2)

    // Spring Transaction
    implementation(libs.spring.tx)

    // Redis
    implementation(libs.spring.boot.starter.data.redis)

    // Swagger/OpenAPI (API 문서화) - springdoc이 swagger-annotations를 전이 의존성으로 가져옴
    api(libs.springdoc.openapi.starter.webmvc.ui)
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
