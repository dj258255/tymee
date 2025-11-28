dependencies {
    implementation(project(":common"))

    // Spring Context for DI (optional, for port interfaces)
    compileOnly(libs.spring.context)
}
