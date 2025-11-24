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

