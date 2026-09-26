# Stage 1: Build with Maven + JDK 21
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime with slim JDK 21 Alpine
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Cài đặt mysql-client để hỗ trợ backup
RUN apk add --no-cache mysql-client

# Tạo thư mục backups
RUN mkdir -p /app/backups

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]