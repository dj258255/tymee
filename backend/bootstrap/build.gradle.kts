plugins {
    alias(libs.plugins.spring.boot)
}

configurations {
    all {
        // Logback 제외 (Log4j2 사용)
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-logging")
    }
}

dependencies {
    implementation(project(":core"))
    implementation(project(":user"))
    implementation(project(":auth"))
    implementation(project(":upload"))
    implementation(project(":category"))
    implementation(project(":timeblock"))
    implementation(project(":notification"))

    // Spring Boot Starters
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.data.redis)
    implementation(libs.spring.boot.starter.data.mongodb)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.security)
    implementation(libs.spring.boot.starter.log4j2)
    implementation(libs.spring.boot.starter.amqp)

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // Database
    runtimeOnly(libs.mysql)
    testRuntimeOnly(libs.h2)

    // Flyway
    implementation(libs.flyway.core)
    runtimeOnly(libs.flyway.mysql)

    // API Documentation
    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // Monitoring
    implementation(libs.spring.boot.starter.actuator)
    runtimeOnly(libs.micrometer.registry.prometheus)

    // Spring Boot Test
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.spring.security.test)
}
