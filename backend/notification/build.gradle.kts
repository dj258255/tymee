plugins {
    alias(libs.plugins.spring.dependency.management)
}

dependencies {
    implementation(project(":core"))
    implementation(project(":user"))

    // Spring Boot AMQP (RabbitMQ)
    implementation(libs.spring.boot.starter.amqp)

    // Spring Boot Web (for REST endpoints if needed)
    implementation(libs.spring.boot.starter.web)

    // Spring Transaction
    implementation(libs.spring.tx)

    // Firebase Admin SDK
    implementation(libs.firebase.admin)

    // Test
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.spring.rabbit.test)
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
