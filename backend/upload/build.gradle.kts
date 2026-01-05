plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":core"))
    implementation(project(":user"))

    // Spring Boot Web (파일 업로드 처리)
    implementation(libs.spring.boot.starter.web)

    // Spring Boot Validation
    implementation(libs.spring.boot.starter.validation)

    // Spring Data JPA
    implementation(libs.spring.boot.starter.data.jpa)

    // Spring Security (인증된 사용자 정보 조회)
    implementation(libs.spring.boot.starter.security)

    // Spring Transaction
    implementation(libs.spring.tx)
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
