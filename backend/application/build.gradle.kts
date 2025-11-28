plugins {
    id("org.springframework.boot")
}

dependencies {
    implementation(project(":common"))
    implementation(project(":domain"))
    implementation(project(":infrastructure"))
    implementation(project(":features"))

    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web:3.4.1")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa:3.4.1")
    implementation("org.springframework.boot:spring-boot-starter-validation:3.4.1")
    implementation("org.springframework.boot:spring-boot-starter-security:3.4.1")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // Database
    runtimeOnly("com.h2database:h2:2.2.224")

    // Spring Boot Test
    testImplementation("org.springframework.boot:spring-boot-starter-test:3.4.1")
    testImplementation("org.springframework.security:spring-security-test:6.2.1")
}
