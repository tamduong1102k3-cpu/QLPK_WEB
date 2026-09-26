# Docker Deployment Guide for QLPK Backend

## Prerequisites

- Docker and Docker Compose installed on your system
- Git

## Quick Start (Local Development)

### 1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

### 2. Configure environment (optional)

Copy `.env.example` to `.env` and adjust values as needed:

```bash
cp .env.example .env
```

### 3. Build and run with Docker Compose

```bash
docker-compose up -d
```

This will:
- Start a MySQL 8.0 container (port 3306)
- Build and start the Spring Boot backend (port 8080)

### 4. Check logs

```bash
docker-compose logs -f backend
```

### 5. Stop services

```bash
docker-compose down
```

To also remove volumes (WARNING: deletes all data):

```bash
docker-compose down -v
```

## Build and Run Backend Only (Standalone)

If you already have a MySQL instance running (e.g., Aiven cloud):

```bash
# Build the image
docker build -t qlpk-backend .

# Run the container
docker run -d \
  --name qlpk-backend \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL="jdbc:mysql://your-mysql-host:3306/dbphongkham8?useSSL=true&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  -e SPRING_DATASOURCE_USERNAME="your-username" \
  -e SPRING_DATASOURCE_PASSWORD="your-password" \
  qlpk-backend
```

## Deploy to Production (Render / Railway / Fly.io etc.)

### Option 1: Using Docker Compose (VPS)

```bash
# On your VPS
git clone <repository-url>
cd backend
docker-compose up -d
```

### Option 2: Using Dockerfile directly (Render)

1. Connect your GitHub repository to Render
2. Select "Web Service"
3. Set:
   - Build Command: (leave default, Render will use Dockerfile)
   - Start Command: (leave empty)
4. Add environment variables in Render dashboard (see `.env.example`)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | `rootpassword` |
| `MYSQL_DATABASE` | Database name | `dbphongkham8` |
| `MYSQL_USER` | MySQL application user | `qlpk_user` |
| `MYSQL_PASSWORD` | MySQL application password | `qlpk_password` |
| `SPRING_DATASOURCE_URL` | JDBC URL for MySQL | (auto-configured in compose) |
| `SPRING_DATASOURCE_USERNAME` | DB username | (auto-configured in compose) |
| `SPRING_DATASOURCE_PASSWORD` | DB password | (auto-configured in compose) |
| `JWT_SECRET` | JWT signing secret | (built-in default) |
| `JWT_EXPIRATION` | JWT expiration in ms | `86400000` (24h) |
| `VNPAY_TMN_CODE` | VNPay merchant code | `1YNCE3P2` |
| `VNPAY_HASH_SECRET` | VNPay hash secret | (built-in default) |
| `VNPAY_PAY_URL` | VNPay payment URL | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_RETURN_URL` | VNPay return URL | `http://localhost:8080/api/payment/vnpay/return` |

## Notes

- The MySQL container uses a named volume `mysql_data` to persist data
- Backups directory is mounted as a volume `backend_backups` for the backup feature
- For production, always set strong passwords via environment variables
- The Dockerfile uses multi-stage build to keep the final image small