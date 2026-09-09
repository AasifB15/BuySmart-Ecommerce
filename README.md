# BuySmart E-Commerce Platform

A production-grade, enterprise full-stack e-commerce system built with **Spring Boot 3.3 (Java 17), Spring Security (JWT), Spring Data JPA (Hibernate), MySQL 8, and React 19 / Vite (`BuySmart_Frontend`)**.

---

## 1. Tech Stack

| Layer            | Technology                                   |
|-------------------|-----------------------------------------------|
| Frontend          | React 19 + Vite + Lucide Icons (`BuySmart_Frontend`) |
| Backend API       | Java 17, Spring Boot 3.3.4                    |
| Security          | Spring Security + JWT (jjwt 0.12.6)           |
| Persistence        | Spring Data JPA / Hibernate                   |
| Database           | MySQL 8 (H2 in-memory available for dev/demo) |
| Build Tool         | Maven                                         |
| API Docs           | springdoc-openapi (Swagger UI)                |
| Validation         | Jakarta Bean Validation                       |
| Boilerplate        | Lombok                                        |

## 2. Architecture

```
Controller  →  Service (interface + impl)  →  Repository  →  Entity  →  MySQL
                     ↑
                   DTO (request / response)
```

- **Entity layer** — `User`, `Product`, `Category`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Address`
- **Repository layer** — Spring Data JPA interfaces with custom derived + `@Query` methods
- **Service layer** — business logic, ownership checks, stock management, cart → order conversion
- **Controller layer** — REST endpoints grouped by module (`/api/auth`, `/api/products`, `/api/categories`, `/api/cart`, `/api/orders`, `/api/seller`, `/api/admin`)
- **DTOs** — requests are validated with Jakarta Bean Validation; responses never leak entity internals (passwords, lazy proxies, etc.)
- **Security** — stateless JWT auth; roles `ROLE_ADMIN`, `ROLE_SELLER`, `ROLE_CUSTOMER` enforced with `@PreAuthorize` + URL-based rules
- **Exception handling** — centralized `@RestControllerAdvice` returns a consistent JSON error shape for validation errors, 404s, 401/403s, and unexpected errors

## 3. Modules (as per the resume)

| Module   | Capabilities |
|----------|--------------|
| **Admin**    | Manage all users (enable/disable/delete), manage categories, view **all** orders, update order status |
| **Seller**   | Register with a shop name, create/update/delete **own** products, view orders that contain their products |
| **Customer** | Browse/search products, manage a cart, place orders, view own order history |

## 4. Getting Started

### Option A — Run instantly with H2 (no MySQL setup needed)

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The app starts on `http://localhost:8080` with an in-memory database, a seeded admin account, and 5 starter categories. H2 console: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:ecommerce_db`).

### Option B — Run with MySQL (production-like)

1. Create a MySQL database (or let the app auto-create it):
   ```sql
   CREATE DATABASE shopora_db;
   ```
2. Set environment variables (or edit `application.properties` directly):
   ```bash
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_NAME=shopora_db
   export DB_USERNAME=root
   export DB_PASSWORD=your_password
   export JWT_SECRET=<a-long-base64-encoded-secret>
   ```
3. Build and run:
   ```bash
   mvn clean package -DskipTests
   java -jar target/ecommerce-management-system-1.0.0.jar
   ```

### Default seeded admin account
```
email:    admin@ecommerce.com
password: Admin@123
```
Use this to log in and manage categories/users immediately after startup.

## 5. API Documentation

Once running, open **Swagger UI**:
```
http://localhost:8080/swagger-ui.html
```
This gives you an interactive, ready-to-test view of every endpoint, grouped by module, including request/response schemas.

## 6. Key Endpoints

### Auth (public)
| Method | Endpoint             | Description                     |
|--------|-----------------------|----------------------------------|
| POST   | `/api/auth/register`  | Register as SELLER or CUSTOMER  |
| POST   | `/api/auth/login`     | Login, returns JWT               |

### Products
| Method | Endpoint                          | Access             |
|--------|------------------------------------|---------------------|
| GET    | `/api/products`                    | Public               |
| GET    | `/api/products/{id}`               | Public               |
| GET    | `/api/products/category/{id}`      | Public               |
| GET    | `/api/products/search?keyword=`    | Public               |
| POST   | `/api/products`                    | SELLER / ADMIN       |
| PUT    | `/api/products/{id}`               | Owning SELLER / ADMIN|
| DELETE | `/api/products/{id}`               | Owning SELLER / ADMIN|

### Categories
| Method | Endpoint               | Access  |
|--------|--------------------------|---------|
| GET    | `/api/categories`        | Public  |
| POST   | `/api/categories`        | ADMIN   |
| PUT    | `/api/categories/{id}`   | ADMIN   |
| DELETE | `/api/categories/{id}`   | ADMIN   |

### Cart (Customer)
| Method | Endpoint                    |
|--------|-------------------------------|
| GET    | `/api/cart`                   |
| POST   | `/api/cart/items`              |
| PUT    | `/api/cart/items/{itemId}?quantity=` |
| DELETE | `/api/cart/items/{itemId}`     |
| DELETE | `/api/cart`                    |

### Orders
| Method | Endpoint                | Access             |
|--------|---------------------------|---------------------|
| POST   | `/api/orders`             | CUSTOMER             |
| GET    | `/api/orders/my-orders`   | CUSTOMER             |
| GET    | `/api/orders/{id}`        | Authenticated         |

### Seller dashboard
| Method | Endpoint              |
|--------|--------------------------|
| GET    | `/api/seller/products`   |
| GET    | `/api/seller/orders`     |

### Admin dashboard
| Method  | Endpoint                          |
|---------|-------------------------------------|
| GET     | `/api/admin/users`                  |
| PATCH   | `/api/admin/users/{id}/enable`      |
| PATCH   | `/api/admin/users/{id}/disable`     |
| DELETE  | `/api/admin/users/{id}`             |
| GET     | `/api/admin/orders`                 |
| PATCH   | `/api/admin/orders/{id}/status`     |

## 7. Authentication flow

1. `POST /api/auth/register` with `role: "ROLE_SELLER"` or `"ROLE_CUSTOMER"` (sellers must also send `shopName`)
2. `POST /api/auth/login` → receive `{ "token": "..." }`
3. Send the token on every subsequent request:
   ```
   Authorization: Bearer <token>
   ```

## 8. Sample requests

**Register a customer**
```json
POST /api/auth/register
{
  "fullName": "Aasif Barudwale",
  "email": "customer@example.com",
  "password": "Pass@123",
  "phoneNumber": "9876543210",
  "role": "ROLE_CUSTOMER"
}
```

**Register a seller**
```json
POST /api/auth/register
{
  "fullName": "Shop Owner",
  "email": "seller@example.com",
  "password": "Pass@123",
  "role": "ROLE_SELLER",
  "shopName": "Tech Bazaar"
}
```

**Create a product (as seller)**
```json
POST /api/products
Authorization: Bearer <seller-token>
{
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz wireless mouse",
  "price": 799.00,
  "stockQuantity": 50,
  "categoryId": 1
}
```

**Add to cart (as customer)**
```json
POST /api/cart/items
Authorization: Bearer <customer-token>
{
  "productId": 1,
  "quantity": 2
}
```

**Place order (as customer)**
```json
POST /api/orders
Authorization: Bearer <customer-token>
{
  "shippingAddress": "221B Baker Street, Baramati, Maharashtra, 413102"
}
```

## 9. Postman Collection

Import `postman_collection.json` (included in this project) into Postman. It includes every endpoint pre-configured with a `{{baseUrl}}` variable and automatic token capture after login.

## 10. Deployment Notes

- `spring.jpa.hibernate.ddl-auto=update` is used by default for convenience; switch to `validate` (already set in the `prod` profile) once you manage schema via migrations in a real deployment.
- Always override `app.jwt.secret` via the `JWT_SECRET` environment variable in production — never ship the default secret.
- The app is stateless (JWT, no server-side sessions), so it can be deployed behind a load balancer / scaled horizontally without sticky sessions.
- CORS is open (`*`) for development; restrict `allowedOriginPatterns` in `SecurityConfig` to your real frontend domain before going live.

## 11. Project Structure

```
src/main/java/com/ecommerce/
├── EcommerceApplication.java
├── config/          (SecurityConfig, OpenApiConfig, DataSeeder, ModelMapperConfig)
├── security/        (JwtUtil, JwtAuthFilter, UserDetailsServiceImpl)
├── entity/          (User, Product, Category, Cart, CartItem, Order, OrderItem, Address, enums)
├── dto/request/      (RegisterRequest, LoginRequest, ProductRequest, ...)
├── dto/response/     (AuthResponse, ProductResponse, OrderResponse, ApiResponse, ...)
├── repository/       (JPA repositories)
├── service/          (interfaces)
├── service/impl/     (implementations)
├── controller/        (AuthController, ProductController, CartController, OrderController, SellerController, AdminController, CategoryController)
└── exception/        (GlobalExceptionHandler, custom exceptions)
```

---
Built as **Project 1 of 3** from the resume's Project Experience section. Next up: **Supermarket Billing System**.
