# Stage 1: Build the Spring Boot application
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal JRE runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=builder /app/target/course-enrollment-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 3000

ENV PORT=3000
CMD ["java", "-jar", "app.jar"]
