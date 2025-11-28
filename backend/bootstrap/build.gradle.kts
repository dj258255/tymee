plugins {
    alias(libs.plugins.spring.boot)
}

dependencies {
    implementation(project(":common"))
    implementation(project(":domain"))
    implementation(project(":infrastructure"))
    implementation(project(":user"))
    implementation(project(":auth"))
    implementation(project(":upload"))

    // Spring Boot Starters
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.security)

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // Database
    runtimeOnly(libs.h2)

    // Spring Boot Test
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.spring.security.test)
}
