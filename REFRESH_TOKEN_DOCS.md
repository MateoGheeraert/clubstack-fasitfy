# Refresh Token Implementation

This document explains how to use the refresh token authentication system.

## Overview

The authentication system now supports refresh tokens, which provide better security and user experience:

- **Access tokens** expire after 15 minutes (short-lived)
- **Refresh tokens** expire after 7 days (long-lived)
- Refresh tokens are stored in the database and can be invalidated

## API Endpoints

### 1. Register

**POST** `/register`

Creates a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "id": "clxxx...",
  "email": "user@example.com",
  "role": "USER"
}
```

### 2. Login

**POST** `/login`

Authenticate and receive both access and refresh tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- Store the `token` for API requests (expires in 15 minutes)
- Store the `refreshToken` securely (expires in 7 days)

### 3. Refresh Token

**POST** `/refresh`

Get a new access token using your refresh token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error (401):**

```json
{
  "message": "Invalid or expired refresh token"
}
```

### 4. Logout

**POST** `/logout`

Invalidate a refresh token (logout).

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

## Client-Side Implementation

### Example Flow

```javascript
// 1. Login
const loginResponse = await fetch("/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const { token, refreshToken } = await loginResponse.json();

// Store tokens (use httpOnly cookies in production)
localStorage.setItem("accessToken", token);
localStorage.setItem("refreshToken", refreshToken);

// 2. Make authenticated requests
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry the request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  return response;
}

// 3. Refresh access token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  const response = await fetch("/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem("accessToken", token);
    return token;
  } else {
    // Refresh token expired, redirect to login
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }
}

// 4. Logout
async function logout() {
  const refreshToken = localStorage.getItem("refreshToken");

  await fetch("/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  localStorage.clear();
  window.location.href = "/login";
}
```

## Security Best Practices

1. **Store tokens securely:**

   - Use httpOnly cookies for refresh tokens in production
   - Never expose refresh tokens in URLs or logs
   - Consider using secure storage APIs in mobile apps

2. **Token rotation:**

   - The current implementation doesn't rotate refresh tokens on use
   - Consider implementing rotation for enhanced security

3. **Token cleanup:**

   - Expired tokens are automatically cleaned up when creating new ones
   - Consider adding a scheduled job to clean up old expired tokens

4. **HTTPS only:**
   - Always use HTTPS in production to prevent token interception

## Database Schema

The `RefreshToken` model stores refresh tokens:

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

- Tokens are automatically deleted when the user is deleted (cascade)
- Indexes on `userId` and `token` for fast lookups
- `expiresAt` tracks token expiration
