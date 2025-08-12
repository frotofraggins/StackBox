# 🐳 **StackPro Local Development with Docker**

## 🚀 **Quick Start**

### **Prerequisites**
- Docker Desktop installed and running
- Git repository cloned
- (Optional) Stripe test API keys for payment testing

### **One-Command Setup**
```bash
# Copy environment template
cp .env.dev .env.local

# Start all services
docker-compose -f docker-compose.dev.yml up --build
```

---

## 🏗️ **Architecture Overview**

### **Services Running**
| **Service** | **Port** | **URL** | **Purpose** |
|-------------|----------|---------|-------------|
| Frontend | 3000 | http://localhost:3000 | Next.js React App |
| Backend API | 3002 | http://localhost:3002 | Express API Server |
| PostgreSQL | 5432 | localhost:5432 | Main Database |
| Redis | 6379 | localhost:6379 | Cache & Sessions |
| pgAdmin | 8080 | http://localhost:8080 | Database Admin |
| Amplify Sandbox | 4566 | localhost:4566 | Local GraphQL API |

### **Development Features**
- ✅ **Hot Reload** - Frontend and backend auto-refresh on changes
- ✅ **Database** - PostgreSQL with sample data
- ✅ **Admin Interface** - pgAdmin for database management
- ✅ **Caching** - Redis for session management
- ✅ **GraphQL** - Amplify sandbox for backend development
- ✅ **Volume Mounting** - Code changes reflect immediately

---

## 📋 **Setup Instructions**

### **1. Environment Configuration**
```bash
# Copy the development environment template
cp .env.dev .env.local

# Edit .env.local with your settings (optional)
# - Add real Stripe test keys for payment testing
# - Modify database credentials if needed
```

### **2. Start Development Environment**
```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up --build

# Or start in background
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### **3. Access Services**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002/health
- **pgAdmin**: http://localhost:8080
  - Email: admin@stackpro.local
  - Password: admin123
- **API Documentation**: http://localhost:3002/api-docs (if implemented)

---

## 🗄️ **Database Setup**

### **Automatic Initialization**
The PostgreSQL container automatically runs `scripts/sql/init-db.sql` which:
- Creates database extensions (uuid-ossp, pgcrypto)
- Sets up basic tables (users, projects, pages, components)
- Inserts sample data for testing

### **Sample Data**
| **Type** | **Details** |
|----------|-------------|
| Admin User | admin@stackpro.local / admin123 |
| Test User | test@stackpro.local / test123 |
| Sample Project | "Sample Website" |
| Sample Page | "Home Page" with basic content |

### **Database Access**
```bash
# Connect via Docker
docker exec -it stackpro_postgres psql -U stackpro -d stackpro_dev

# Or use pgAdmin at http://localhost:8080
```

---

## 🔧 **Development Workflow**

### **Frontend Development**
```bash
# The frontend container automatically:
# - Installs Node.js 22
# - Runs npm ci --include=dev
# - Starts npm run dev
# - Hot reloads on file changes

# To run commands inside frontend container:
docker exec -it stackpro_frontend sh
```

### **Backend Development**
```bash
# The backend container automatically:
# - Installs Node.js 22
# - Runs npm ci --include=dev
# - Starts nodemon api/server.js
# - Auto-restarts on file changes

# To run commands inside backend container:
docker exec -it stackpro_backend sh
```

### **Database Changes**
```bash
# To reset database with fresh data:
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build

# To backup data:
docker exec stackpro_postgres pg_dump -U stackpro stackpro_dev > backup.sql
```

---

## 🧪 **Testing the Setup**

### **Health Checks**
```bash
# Frontend
curl http://localhost:3000

# Backend API
curl http://localhost:3002/health

# Database
docker exec stackpro_postgres pg_isready -U stackpro

# Redis
docker exec stackpro_redis redis-cli ping
```

### **Sample API Calls**
```bash
# Get sample projects
curl http://localhost:3002/api/projects

# Create a new user (if endpoint exists)
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","username":"newuser","password":"test123"}'
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```bash
# If ports 3000, 3002, 5432, 6379, or 8080 are in use:
# 1. Stop conflicting services
# 2. Or modify ports in docker-compose.dev.yml
```

#### **Database Connection Issues**
```bash
# Check if PostgreSQL is ready
docker-compose -f docker-compose.dev.yml logs postgres

# Restart database service
docker-compose -f docker-compose.dev.yml restart postgres
```

#### **File Permission Issues (Windows/WSL)**
```bash
# Ensure Docker has access to your project directory
# In Docker Desktop: Settings > Resources > File Sharing
```

#### **Node Modules Issues**
```bash
# Clear Docker volumes and rebuild
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
docker-compose -f docker-compose.dev.yml up --build
```

### **Viewing Logs**
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f postgres
```

---

## 🛠️ **Advanced Usage**

### **Individual Service Management**
```bash
# Start only database and cache
docker-compose -f docker-compose.dev.yml up postgres redis

# Scale services
docker-compose -f docker-compose.dev.yml up --scale backend=2

# Rebuild specific service
docker-compose -f docker-compose.dev.yml build frontend
```

### **Production-like Testing**
```bash
# Use production build of frontend
docker-compose -f docker-compose.dev.yml exec frontend npm run build
docker-compose -f docker-compose.dev.yml exec frontend npm start
```

### **Database Migrations**
```bash
# Run custom SQL scripts
docker exec -i stackpro_postgres psql -U stackpro -d stackpro_dev < your-migration.sql
```

---

## 🔄 **Cleanup**

### **Stop Services**
```bash
# Stop but keep data
docker-compose -f docker-compose.dev.yml down

# Stop and remove all data
docker-compose -f docker-compose.dev.yml down -v

# Remove all images
docker-compose -f docker-compose.dev.yml down --rmi all -v
```

### **Complete Reset**
```bash
# Nuclear option - removes everything
docker-compose -f docker-compose.dev.yml down -v --rmi all
docker system prune -af
```

---

## 📚 **Next Steps**

1. **Test the frontend** at http://localhost:3000
2. **Verify API connectivity** at http://localhost:3002/health
3. **Explore the database** via pgAdmin at http://localhost:8080
4. **Start developing** - changes will auto-reload!

**Happy coding! 🚀**
