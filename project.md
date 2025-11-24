# SocialMediaJS - Backend API

A Node.js backend API for a social media application built with Express.js and MySQL.

## Overview

SocialMediaJS is a RESTful API that provides core social networking functionality including user authentication, profile management, posts, and friend connections.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MySQL (mysql2 driver)
- **Authentication**: JWT (jsonwebtoken v9.0.2)
- **Password Hashing**: bcrypt v5.1.1
- **File Upload**: Multer v1.4.5-lts.2
- **CORS**: cors v2.8.5
- **Environment**: dotenv v16.4.7

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MySQL database connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User profile operations
│   ├── postController.js     # Post management
│   └── friendController.js   # Friend connections
├── routes/
│   ├── auth.js              # Auth endpoints
│   ├── user.js              # User endpoints
│   ├── post.js              # Post endpoints
│   └── friend.js            # Friend endpoints
├── middleware/
│   └── authMiddleware.js    # JWT verification
├── uploads/
│   ├── avatars/             # User profile pictures
│   └── posts/               # Post images
├── server.js                # Main app entry point
└── package.json             # Dependencies & config
```

## Features

### 1. **Authentication** (`/api/auth`)
- **POST /register** - Create a new user account
- **POST /login** - Authenticate user and get JWT token
- JWT token-based session management
- Bcrypt password encryption

### 2. **User Management** (`/api/user`)
- User profile management
- Avatar uploads
- User information retrieval

### 3. **Posts** (`/api/posts`)
- Create posts with images
- Retrieve posts
- Update/delete posts
- Media uploads to `/uploads/posts/`

### 4. **Friends** (`/api/friends`)
- Send/receive friend requests
- Manage friend connections
- View friend list

## API Configuration

The API runs on port **5000** (configurable via `PORT` environment variable).

### Base URL
```
http://localhost:5000
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/user/*` | User operations |
| GET/POST | `/api/posts/*` | Post management |
| GET/POST | `/api/friends/*` | Friend management |
| GET | `/uploads/*` | Static file serving |

## Security Features

✅ **JWT Authentication** - Token-based user verification  
✅ **Password Hashing** - Bcrypt encryption for secure storage  
✅ **CORS Protection** - Cross-origin request handling  
✅ **Protected Routes** - Middleware-based route protection  
✅ **Environment Variables** - Sensitive data configuration  

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
```

## Getting Started

### Installation

```bash
npm install
```

### Running the Server

```bash
node server.js
```

The server will start on the configured port and display:
```
Server is running on port 5000
```

## Database Schema

The application uses MySQL with the following main tables:

- **users** - User accounts with credentials and profiles
- **posts** - User posts and content with metadata
- **friends** - Friend connections and request management
- Additional tables as per controller requirements

## Middleware

### Authentication Middleware (`authMiddleware.js`)
- Verifies JWT tokens from request headers
- Extracts user information (id, username, email, avatar)
- Attaches user data to request object
- Returns 401 for missing tokens
- Returns 403 for invalid/expired tokens

## File Uploads

- **Avatars** - Stored in `/uploads/avatars/`
- **Posts** - Stored in `/uploads/posts/`
- Handled via Multer middleware

## Error Handling

| Status Code | Meaning |
|-------------|---------|
| 401 | Access denied, token missing |
| 403 | Invalid or expired token |
| 404 | User not found |
| 500 | Server errors |

## Repository Information

- **Repository**: SocialMediaJS
- **Owner**: ycvinay
- **Branch**: preFinalBranch
- **License**: ISC

## Testing Status

✅ **ALL FEATURES TESTED AND WORKING**

See the following documents for detailed testing information:

- **TEST_REPORT.md** - Comprehensive feature testing report
- **TESTING_CHECKLIST.md** - Detailed test checklist (100+ test cases)
- **test.js** - Automated test suite for running all tests

### Quick Test Run

```bash
# Terminal 1: Start server
node server.js

# Terminal 2: Run tests
node test.js
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MySQL (v5.7+)
- npm packages: express, bcrypt, jsonwebtoken, cors, multer, mysql2, dotenv

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create Database**
   ```bash
   # Use DATABASE_SETUP.sql file to create tables
   mysql -u root -p < DATABASE_SETUP.sql
   ```

4. **Run Server**
   ```bash
   node server.js
   # Server runs on http://localhost:5000
   ```

5. **Run Tests** (in another terminal)
   ```bash
   node test.js
   ```

## Documentation Files

- **README.md** - Project overview and tech stack
- **project.md** - This file - Detailed API documentation
- **TEST_REPORT.md** - Complete testing report
- **TESTING_CHECKLIST.md** - Test cases and verification
- **DATABASE_SETUP.sql** - MySQL database schema
- **QUICKSTART.bat** - Windows quick start script
- **QUICKSTART.sh** - Linux/Mac quick start script
- **test.js** - Automated test suite

## Next Steps

- [x] Set up MySQL database with required tables
- [x] Configure environment variables
- [x] Test all API endpoints
- [x] Implement comprehensive error handling
- [x] Add input validation
- [ ] Deploy to production environment
- [ ] Implement rate limiting
- [ ] Add caching layer (Redis)
- [ ] Set up CI/CD pipeline
- [ ] Generate API documentation (Swagger)
