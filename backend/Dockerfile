# Build stage
FROM eclipse-temurin:25-jdk AS builder

WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
COPY gradle/libs.versions.toml gradle/

# Copy source code
COPY core core
COPY user user
COPY auth auth
COPY upload upload
COPY bootstrap bootstrap

# Make gradlew executable
RUN chmod +x gradlew

# Build the application
RUN ./gradlew :bootstrap:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:25-jre

WORKDIR /app

# Create non-root user
RUN groupadd -r tymee && useradd -r -g tymee tymee

# Copy the built jar from builder stage
COPY --from=builder /app/bootstrap/build/libs/*.jar app.jar

# Change ownership
RUN chown -R tymee:tymee /app

USER tymee

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]