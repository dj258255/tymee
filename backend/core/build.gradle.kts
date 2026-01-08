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

    // Swagger Annotations (API 문서화) - api로 선언하여 의존 모듈에서 사용 가능
    api(libs.swagger.annotations)
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
