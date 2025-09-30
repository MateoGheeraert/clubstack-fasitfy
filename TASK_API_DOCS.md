# Task API Documentation

## Overview

The Task API provides endpoints for managing tasks with role-based access control. Only admins can create and assign tasks, while both admins and assigned users can update task status and details.

## Endpoints

### 1. Create Task (Admin Only)

- **POST** `/tasks`
- **Authentication**: Required
- **Authorization**: Admin only
- **Body**:
  ```json
  {
    "title": "string (required, 1-255 chars)",
    "description": "string (optional, max 1000 chars)",
    "userId": "string (required)"
  }
  ```
- **Response**: 201 Created with task details including user information

### 2. Get All Tasks

- **GET** `/tasks`
- **Authentication**: Required
- **Authorization**:
  - Admins: Can see all tasks
  - Users: Can only see their own tasks
- **Query Parameters**:
  ```
  ?status=string&userId=string&page=number&limit=number
  ```
- **Response**: Paginated list of tasks

### 3. Get My Tasks

- **GET** `/tasks/my`
- **Authentication**: Required
- **Authorization**: All authenticated users
- **Query Parameters**:
  ```
  ?status=string&page=number&limit=number
  ```
- **Response**: Paginated list of current user's tasks

### 4. Get Task by ID

- **GET** `/tasks/:id`
- **Authentication**: Required
- **Authorization**:
  - Admins: Can view any task
  - Users: Can only view their own tasks
- **Response**: Task details with user information

### 5. Update Task Details

- **PATCH** `/tasks/:id`
- **Authentication**: Required
- **Authorization**:
  - Admins: Can update any task
  - Users: Can only update their own tasks
- **Body**:
  ```json
  {
    "title": "string (optional, 1-255 chars)",
    "description": "string (optional, max 1000 chars)"
  }
  ```
- **Response**: Updated task with user information

### 6. Update Task Status

- **PATCH** `/tasks/:id/status`
- **Authentication**: Required
- **Authorization**:
  - Admins: Can update any task status
  - Users: Can only update their own task status
- **Body**:
  ```json
  {
    "status": "pending | in_progress | completed | cancelled"
  }
  ```
- **Response**: Updated task with user information

### 7. Assign Task to User (Admin Only)

- **PATCH** `/tasks/:id/assign`
- **Authentication**: Required
- **Authorization**: Admin only
- **Body**:
  ```json
  {
    "userId": "string (required)"
  }
  ```
- **Response**: Updated task with new user assignment

### 8. Delete Task

- **DELETE** `/tasks/:id`
- **Authentication**: Required
- **Authorization**:
  - Admins: Can delete any task
  - Users: Can only delete their own tasks
- **Response**: Success message

## Task Status Values

- `pending` (default)
- `in_progress`
- `completed`
- `cancelled`

## Error Responses

### 400 Bad Request

- User not found when creating/assigning tasks

### 401 Unauthorized

- Missing or invalid JWT token

### 403 Forbidden

- Insufficient permissions for the operation

### 404 Not Found

- Task not found

## Example Usage

### Creating a Task (Admin)

```bash
POST /tasks
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "title": "Review user feedback",
  "description": "Analyze user feedback from the last quarter",
  "userId": "user123"
}
```

### Getting My Tasks (User)

```bash
GET /tasks/my?status=pending&page=1&limit=10
Authorization: Bearer <user-jwt-token>
```

### Updating Task Status (User/Admin)

```bash
PATCH /tasks/task123/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "in_progress"
}
```

### Assigning Task (Admin Only)

```bash
PATCH /tasks/task123/assign
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "userId": "newuser456"
}
```
