# Tarkov Search

A comprehensive search and inventory management system for Escape from Tarkov (EFT) items, providing real-time data access and powerful filtering capabilities.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Capabilities
- **Item Search**: Fast, full-text search across all Escape from Tarkov items
- **Advanced Filtering**: Filter items by category, rarity, price, and custom attributes
- **Real-time Data**: Keep your item database updated with live pricing and availability information
- **Inventory Management**: Track and organize items with custom tags and collections
- **Price Tracking**: Monitor price trends and historical data
- **API Access**: RESTful API for programmatic access to item data

### Performance
- **Optimized Queries**: Efficiently indexed database for lightning-fast searches
- **Caching Layer**: Redis-powered caching for frequently accessed data
- **Batch Operations**: Support for bulk item operations and imports

### User Experience
- **Intuitive Interface**: Clean, responsive web interface
- **Export Functionality**: Download search results in JSON, CSV, and XML formats
- **Dark Mode**: Built-in dark theme support

## Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0 or yarn >= 3.0.0
- Docker (optional, for containerized deployment)
- PostgreSQL >= 12.0 (or SQLite for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/isogloss/tarkov-search.git
   cd tarkov-search
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create environment configuration**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment variables** (see [Configuration](#configuration) section)

5. **Initialize the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Installation

### From Source

Follow the steps in [Quick Start](#quick-start) above.

### Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t tarkov-search .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 --env-file .env tarkov-search
   ```

### Using Docker Compose

```bash
docker-compose up -d
```

This will start the application along with PostgreSQL and Redis services.

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/tarkov_search
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# API Configuration
API_KEY=your_api_key_here
API_RATE_LIMIT=1000
API_RATE_WINDOW=3600

# Tarkov Data Source
TARKOV_API_URL=https://api.tarkov.dev
TARKOV_API_KEY=your_tarkov_api_key

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# CORS Configuration
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected endpoints require an API key in the `Authorization` header:
```
Authorization: Bearer YOUR_API_KEY
```

### Items

#### Search Items
```
GET /items/search
```

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by category
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `rarity` (string): Filter by rarity (common, uncommon, rare, legendary)
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)
- `sort` (string): Sort field (name, price, rarity)
- `order` (string): Sort order (asc, desc)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/items/search?q=ak&category=weapon&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "item_123",
      "name": "AK-74N",
      "category": "weapon",
      "rarity": "common",
      "price": 25000,
      "updated_at": "2025-12-12T07:43:46Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 145,
    "pages": 15
  }
}
```

#### Get Item Details
```
GET /items/:id
```

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/items/item_123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "item_123",
    "name": "AK-74N",
    "category": "weapon",
    "rarity": "common",
    "price": 25000,
    "description": "Soviet-era 5.45x39 assault rifle",
    "attributes": {
      "damage": 55,
      "accuracy": 78,
      "ergonomics": 65
    },
    "price_history": [
      {
        "price": 24500,
        "date": "2025-12-11T07:43:46Z"
      }
    ],
    "updated_at": "2025-12-12T07:43:46Z"
  }
}
```

### Categories

#### List All Categories
```
GET /categories
```

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/v1/categories"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_weapon",
      "name": "Weapons",
      "description": "All weapon types"
    },
    {
      "id": "cat_ammo",
      "name": "Ammunition",
      "description": "All ammunition types"
    }
  ]
}
```

### Collections

#### Create Collection
```
POST /collections
```

**Request Body:**
```json
{
  "name": "My AK Build",
  "description": "Parts for my AK-74N",
  "items": ["item_123", "item_456"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "collection_789",
    "name": "My AK Build",
    "description": "Parts for my AK-74N",
    "items": [
      {
        "id": "item_123",
        "name": "AK-74N",
        "price": 25000
      }
    ],
    "created_at": "2025-12-12T07:43:46Z"
  }
}
```

#### Get Collection
```
GET /collections/:id
```

#### List Collections
```
GET /collections
```

#### Update Collection
```
PUT /collections/:id
```

#### Delete Collection
```
DELETE /collections/:id
```

### Health Check

#### System Status
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T07:43:46Z",
  "uptime": 3600,
  "database": "connected",
  "cache": "connected"
}
```

## Deployment

### Heroku Deployment

1. **Create a Heroku app**
   ```bash
   heroku create tarkov-search
   ```

2. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:standard-0
   ```

3. **Add Redis addon**
   ```bash
   heroku addons:create heroku-redis:premium-0
   ```

4. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret_key
   # Set other required variables
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

### AWS Deployment

#### Using Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize your project**
   ```bash
   eb init -p node.js-18 tarkov-search
   ```

3. **Create environment**
   ```bash
   eb create production
   ```

4. **Set environment variables**
   ```bash
   eb setenv NODE_ENV=production JWT_SECRET=your_secret_key
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

### Docker Swarm Deployment

1. **Build and push image**
   ```bash
   docker build -t your-registry/tarkov-search:latest .
   docker push your-registry/tarkov-search:latest
   ```

2. **Deploy service**
   ```bash
   docker service create \
     --name tarkov-search \
     --publish 3000:3000 \
     --env-file .env \
     your-registry/tarkov-search:latest
   ```

### Kubernetes Deployment

A `kubernetes/` directory contains deployment manifests:

```bash
kubectl apply -f kubernetes/
```

Key resources:
- `deployment.yaml`: Application deployment
- `service.yaml`: Service configuration
- `configmap.yaml`: Configuration management
- `ingress.yaml`: Ingress routing

### Production Checklist

- [ ] Use strong, unique JWT secret
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS settings
- [ ] Set up database backups
- [ ] Configure log aggregation
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting
- [ ] Configure auto-scaling
- [ ] Enable database connection pooling
- [ ] Use Redis for caching
- [ ] Set appropriate cache TTLs
- [ ] Configure CDN for static assets

## Development

### Project Structure

```
tarkov-search/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   ├── services/
│   ├── models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── utils/
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docker/
│   └── Dockerfile
├── kubernetes/
├── .env.example
├── package.json
├── README.md
└── docker-compose.yml
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/items.test.js
```

### Database Migrations

```bash
# Create a new migration
npm run db:create-migration -- create_items_table

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Rollback all migrations
npm run db:rollback:all
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Building for Production

```bash
# Create production build
npm run build

# Run production build locally
npm start
```

## Contributing

We welcome contributions to Tarkov Search! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

### Reporting Issues

Please report issues using GitHub Issues with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, Node version, etc.)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ by the Tarkov Search team**

For more information, visit our [documentation](https://docs.example.com) or join our [Discord community](https://discord.gg/example).
