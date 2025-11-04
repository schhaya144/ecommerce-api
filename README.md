# Advanced E-Commerce API

A production-ready e-commerce API built with Node.js, Express, and MongoDB featuring complex state management, inventory reservation, and asynchronous processing.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Complex State Management**: Order lifecycle management (PENDING_PAYMENT → PAID → SHIPPED → DELIVERED)
- **Inventory Reservation**: Stock locking mechanism to prevent race conditions
- **Database Transactions**: Multi-step atomic operations across models
- **Asynchronous Processing**: Background job queue for email notifications
- **Robust API Design**: Pagination, filtering, and sorting
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Comprehensive request validation using Joi

## Tech Stack

- Node.js & Express
- MongoDB & Mongoose
- JWT for authentication
- Bull (Redis) for job queues
- Joi for validation
- Bcrypt for password hashing

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ecommerce-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```
PORT=3000
MONGODB_URI=<url>
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
ORDER_EXPIRY_MINUTES=15
```

4. Start MongoDB and Redis
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. Run the server
```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

Base URL: `http://localhost:3000/api`

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Products

#### Get All Products (Public)
```http
GET /products?page=1&limit=10&sortBy=price&order=asc&name=laptop
```

#### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop",
  "price": 999.99,
  "description": "High-performance laptop",
  "availableStock": 50
}
```

#### Update Product (Admin Only)
```http
PUT /products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 899.99,
  "availableStock": 45
}
```

#### Delete Product (Admin Only)
```http
DELETE /products/:id
Authorization: Bearer <token>
```

### Cart

#### Get Cart
```http
GET /cart
Authorization: Bearer <token>
```

#### Add to Cart
```http
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product_id_here",
  "quantity": 2
}
```

#### Remove from Cart
```http
DELETE /cart/items/:productId
Authorization: Bearer <token>
```

### Orders

#### Checkout
```http
POST /orders/checkout
Authorization: Bearer <token>
```

Creates an order from cart items, reserves stock, and sets status to PENDING_PAYMENT.

#### Pay for Order
```http
POST /orders/:id/pay
Authorization: Bearer <token>
```

Completes payment, updates order status to PAID, finalizes stock, and queues confirmation email.

#### Get User Orders
```http
GET /orders?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /orders/:id
Authorization: Bearer <token>
```

### Admin

#### Get All Orders (Admin Only)
```http
GET /admin/orders?page=1&limit=10&status=PAID
Authorization: Bearer <token>
```

#### Update Order Status (Admin Only)
```http
PATCH /admin/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

Valid status transitions:
- PAID → SHIPPED or CANCELLED
- SHIPPED → DELIVERED

## System Workflow

1. User registers and logs in
2. User browses products and adds items to cart
3. User initiates checkout (creates order with PENDING_PAYMENT status)
4. Stock is reserved (moved from availableStock to reservedStock)
5. User completes payment
6. Order status updates to PAID
7. Reserved stock is finalized (decremented from total)
8. Confirmation email job is queued
9. Admin can update order status to SHIPPED/DELIVERED
10. If payment not completed within 15 minutes, order is CANCELLED and stock is released

## Error Handling

All errors return a consistent format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

## Testing with Postman

Import the included Postman collection to test all endpoints. The collection includes:
- Pre-configured requests for all endpoints
- Environment variables for token management
- Sample request bodies
- Test scenarios for the complete order workflow

## License

MIT
*/
