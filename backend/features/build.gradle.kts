dependencies {
    implementation(project(":common"))
    implementation(project(":domain"))
    implementation(project(":infrastructure"))

    // Spring Boot Web
    implementation("org.springframework.boot:spring-boot-starter-web:3.4.1")

    // Spring Boot Validation
    implementation("org.springframework.boot:spring-boot-starter-validation:3.4.1")

    // Spring Data JPA (for JPA repositories and entities)
    implementation("org.springframework.boot:spring-boot-starter-data-jpa:3.4.1")

    // Spring Security
    implementation("org.springframework.boot:spring-boot-starter-security:3.4.1")

    // Spring Transaction
    implementation("org.springframework:spring-tx:6.2.1")
}
