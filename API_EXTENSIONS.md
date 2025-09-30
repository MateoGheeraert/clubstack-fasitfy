# API Extensions Documentation

This document describes the new API endpoints that have been added to support organizations, accounts, transactions, and activities.

## New Modules

### 1. Organizations (`/organizations`)

Organizations are the main entities that can have users, accounts, and activities.

#### Endpoints:

- `POST /organizations` - Create organization (Admin only)
- `GET /organizations` - List all organizations (Admin only)
- `GET /organizations/my` - Get current user's organizations
- `GET /organizations/:id` - Get organization by ID
- `PATCH /organizations/:id` - Update organization (Admin only)
- `DELETE /organizations/:id` - Delete organization (Admin only)
- `POST /organizations/:id/users` - Add user to organization (Admin only)
- `DELETE /organizations/:id/users/:userId` - Remove user from organization (Admin only)
- `GET /organizations/users/:userId` - Get user's organizations

#### Key Features:

- Many-to-many relationship between users and organizations
- Admins can manage all organizations
- Users can only see organizations they belong to
- Organization names must be unique

### 2. Accounts (`/accounts`)

Each organization can have one account for financial management (one-to-one relationship).

#### Endpoints:

- `POST /accounts` - Create account (Admin only)
- `GET /accounts` - List accounts with filters
- `GET /accounts/my` - Get current user's organization accounts
- `GET /accounts/:id` - Get account by ID
- `GET /accounts/organization/:organizationId` - Get account by organization
- `PATCH /accounts/:id` - Update account (Admin only)
- `DELETE /accounts/:id` - Delete account (Admin only, if no transactions exist)

#### Key Features:

- One account per organization
- Tracks balance and account type
- Users can only access accounts from their organizations
- Admins can manage all accounts

### 3. Transactions (`/transactions`)

Financial transactions that belong to accounts and automatically update account balances.

#### Endpoints:

- `POST /transactions` - Create transaction
- `GET /transactions` - List transactions with filters
- `GET /transactions/my` - Get current user's transactions
- `GET /transactions/:id` - Get transaction by ID
- `GET /transactions/account/:accountId` - Get transactions for specific account
- `PATCH /transactions/:id` - Update transaction (Admin only)
- `DELETE /transactions/:id` - Delete transaction (Admin only)

#### Transaction Types:

- `DEPOSIT` - Increases account balance
- `INCOME` - Increases account balance
- `WITHDRAWAL` - Decreases account balance
- `PAYMENT` - Decreases account balance

#### Key Features:

- Automatic balance calculation and updates
- Transaction history with summaries
- Date range and amount filtering
- Balance validation (prevents negative balances)
- Atomic operations (transaction + balance update)

### 4. Activities (`/activities`)

Events and activities organized by organizations.

#### Endpoints:

- `POST /activities` - Create activity
- `GET /activities` - List activities with filters
- `GET /activities/my` - Get current user's organization activities
- `GET /activities/upcoming` - Get upcoming activities
- `GET /activities/:id` - Get activity by ID
- `GET /activities/organization/:organizationId` - Get activities for organization
- `PATCH /activities/:id` - Update activity (Admin only)
- `DELETE /activities/:id` - Delete activity (Admin only)
- `POST /activities/:id/attendees` - Add attendee (Admin only)
- `DELETE /activities/:id/attendees/:attendee` - Remove attendee (Admin only)

#### Key Features:

- Date/time scheduling with validation
- Attendee management
- Location tracking
- Upcoming activities view
- Date range filtering

## Enhanced User Module (`/user`)

The user module has been extended with organization-aware endpoints:

#### New Endpoints:

- `GET /user/profile` - Detailed profile with organizations and recent tasks
- `GET /user/stats` - User statistics (task count, organization count)

#### Features:

- Shows user's organizations and join dates
- Recent task summary
- User statistics

## Authorization & Access Control

### User Permissions:

- **Regular Users**: Can only access data from organizations they belong to
- **Admins**: Can access and manage all data across all organizations

### Security Features:

- JWT authentication required for all endpoints
- Role-based authorization (User/Admin)
- Organization membership validation
- Cross-organization access prevention for regular users

## Data Relationships

```
User ←→ UserOrganization ←→ Organization
                              ↓
User → Task               Account (1:1)
                              ↓
                         Transaction

Organization → Activity
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation, insufficient funds, etc.)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `409` - Conflict (duplicate names, etc.)

## Example Usage

### 1. Create Organization and Add Users

```bash
# Create organization (Admin)
POST /organizations
{
  "name": "Acme Corp"
}

# Add user to organization (Admin)
POST /organizations/{id}/users
{
  "userId": "user123"
}
```

### 2. Set up Financial Account

```bash
# Create account for organization (Admin)
POST /accounts
{
  "organizationId": "org123",
  "accountName": "Main Account",
  "type": "Business",
  "balance": 1000.00
}

# Create transaction
POST /transactions
{
  "accountId": "acc123",
  "amount": 500.00,
  "transactionType": "DEPOSIT",
  "transactionDate": "2024-01-01T10:00:00Z",
  "transactionCode": "DEP001",
  "description": "Initial deposit"
}
```

### 3. Schedule Activity

```bash
# Create activity
POST /activities
{
  "organizationId": "org123",
  "title": "Team Meeting",
  "starts_at": "2024-01-15T14:00:00Z",
  "ends_at": "2024-01-15T15:00:00Z",
  "location": "Conference Room A",
  "description": "Weekly team sync"
}
```

All endpoints support proper pagination, filtering, and include comprehensive OpenAPI/Swagger documentation at `/docs`.
