# Admin Users Tab Specification

## Overview
This document outlines the requirements and implementation details for adding a Users tab to the Admin Modal, allowing administrators to view, manage, and modify user accounts within the system.

## Current System Analysis

### Existing Infrastructure
The system currently has:
- A role-based access control system with `ADMIN`, `USER`, and `MENTOR` roles defined in `packages/data-provider/src/roles.ts`
- An Admin Modal component (`client/src/components/Admin/AdminModal.tsx`) with tabs for managing mentors, answers, and questions
- Authentication middleware (`api/server/middleware/roles/checkAdmin.js`) that checks for admin privileges
- Comprehensive user management functionality in the backend

### Existing User Management Code
The following user management functionality already exists and can be leveraged:

#### Backend Models & Methods (`api/models/userMethods.js`):
- `getUserById(userId, fieldsToSelect)` - Retrieve user by ID
- `findUser(searchCriteria, fieldsToSelect)` - Search for users
- `updateUser(userId, updateData)` - Update user data
- `deleteUserById(userId)` - Delete user by ID
- `countUsers(filter)` - Count users with optional filter
- `createUser(userData)` - Create new user

#### Existing Routes (`api/server/routes/user.js`):
- `GET /` - Get current user (requireJwtAuth)
- `DELETE /delete` - Delete current user (requireJwtAuth, canDeleteAccount)
- Other user-related endpoints for plugins, verification, etc.

#### User Controller (`api/server/controllers/UserController.js`):
- `getUserController` - Get user data with S3 avatar handling
- `deleteUserController` - Complete user deletion with cleanup
- Comprehensive user deletion that handles files, conversations, presets, messages, sessions, etc.

#### User Model (`api/models/User.js`):
- Uses mongoose with userSchema from `@librechat/data-schemas`
- Direct access to User model for complex queries

#### Admin Table Components Pattern:
The system already has three admin table components that follow a consistent pattern:
- `MentorResponsesTable.tsx` - Shows mentor responses with actions
- `MentorAnswersTable.tsx` - Shows mentor answers with detailed modal view
- `MentorQuestionsTable.tsx` - Shows mentor questions with CRUD operations

These components use:
- `@tanstack/react-query` for data fetching
- `DataTable` component for consistent table UI
- Modal dialogs for detailed views
- Action buttons with icons (Trash2, ExternalLink, Plus, Eye)
- Status badges and truncated text display

## Feature Requirements

### 1. UI Components

#### 1.1 Users Table Component
- Create a new `UsersTable` component in `client/src/components/Admin/UsersTable.tsx`
- Display user information in a table format with columns:
  - Username
  - Email
  - Role
  - Provider (local, ldap, openid)
  - Created Date
  - Last Login
  - Actions (Change Role, Delete)

#### 1.2 Admin Modal Integration
- Add a new "Users" tab to the existing Admin Modal
- Ensure the tab is only visible to users with the ADMIN role
- Follow the existing tab styling and layout patterns

### 2. Backend API Endpoints

#### 2.1 Get All Users
```typescript
GET /api/user/all
Authorization: Bearer <token>
Query Parameters: {
  page?: number;
  limit?: number;
  search?: string;
  role?: SystemRoles;
}
Response: {
  users: Array<{
    _id: string;
    username: string;
    email: string;
    name: string;
    role: SystemRoles;
    provider: string;
    createdAt: Date;
    lastLogin?: Date;
    avatar?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
}
```

#### 2.2 Update User Role
```typescript
PUT /api/user/:userId/role
Authorization: Bearer <token>
Body: {
  role: SystemRoles; // 'ADMIN' | 'USER' | 'MENTOR'
}
Response: {
  user: {
    _id: string;
    role: SystemRoles;
    email: string;
    name: string;
  };
  message: string;
}
```

#### 2.3 Delete User
```typescript
DELETE /api/user/:userId
Authorization: Bearer <token>
Response: {
  message: string;
  deletedUserId: string;
}
```

### 3. Security Requirements

#### 3.1 Access Control
- All endpoints must be protected by the `checkAdmin` middleware
- Only users with the ADMIN role can access the Users tab
- Prevent self-deletion of admin accounts
- Prevent changing the role of the last admin user

#### 3.2 Data Protection
- Do not expose sensitive user information (passwords, tokens)
- Implement rate limiting on user management endpoints
- Log all user management actions for audit purposes

### 4. Implementation Details

#### 4.1 Frontend Implementation

1. **Create new API hooks in `client/src/hooks/Users/`:**
   - `useGetUsers.ts` - Fetch all users with pagination/filtering
   - `useUpdateUserRole.ts` - Update user role mutation
   - `useDeleteUser.ts` - Delete user mutation
   - `index.ts` - Export all hooks

2. **Implement the UsersTable component (`client/src/components/Admin/UsersTable.tsx`):**
   Follow the existing pattern from `MentorResponsesTable.tsx` and `MentorAnswersTable.tsx`:
   - Use `@tanstack/react-query` for data fetching
   - Use existing `DataTable` component for consistent UI
   - Implement pagination with query parameters
   - Add sorting by columns (name, email, role, createdAt)
   - Add search/filter functionality (by name, email, role)
   - Use confirmation dialogs for destructive actions (delete)
   - Show loading states with existing `Spinner` component
   - Handle errors with toast notifications
   - Use existing icon components (Trash2, Edit, etc.)

3. **Add role management features:**
   - Role selection dropdown using existing UI components
   - Current role display with status badges (similar to mentor status badges)
   - Role change confirmation dialog
   - Visual feedback for role changes using toast notifications
   - Prevent self-role changes and last admin protection on frontend

4. **Update AdminModal.tsx:**
   - Add new "Users" tab following existing pattern
   - Import and use the new `UsersTable` component
   - Ensure tab is only visible to admin users (check `user?.role === SystemRoles.ADMIN`)

#### 4.2 Backend Implementation

**Option 1: Extend existing user routes (`api/server/routes/user.js`)**
Add new admin-only endpoints to the existing user routes file:
- `GET /api/user/all` (admin only) - Get all users with pagination
- `PUT /api/user/:userId/role` (admin only) - Update user role
- `DELETE /api/user/:userId` (admin only) - Delete specific user

**Option 2: Create dedicated admin routes (`api/server/routes/admin/users.js`)**
Create a new admin-specific routes file:
- `GET /api/admin/users` - Get all users with pagination
- `PUT /api/admin/users/:userId/role` - Update user role  
- `DELETE /api/admin/users/:userId` - Delete specific user

**Recommended Approach: Option 1** - Extend existing user routes for consistency

**Implementation Details:**

1. **Extend `api/server/routes/user.js`:**
   ```javascript
   // Add new admin-only routes
   router.get('/all', requireJwtAuth, checkAdmin, getAllUsersController);
   router.put('/:userId/role', requireJwtAuth, checkAdmin, updateUserRoleController);
   router.delete('/:userId', requireJwtAuth, checkAdmin, deleteSpecificUserController);
   ```

2. **Create new controllers in `api/server/controllers/UserController.js`:**
   - `getAllUsersController` - Leverage existing User model with pagination
   - `updateUserRoleController` - Use existing `updateUser` method
   - `deleteSpecificUserController` - Use existing `deleteUserController` logic

3. **Leverage existing functionality:**
   - Use existing `User.find()` for getting all users (similar to `config/list-users.js`)
   - Use existing `updateUser()` method for role changes
   - Use existing `deleteUserController` logic for user deletion with full cleanup

4. **Add validation middleware:**
   - Validate role changes against `SystemRoles` enum
   - Prevent invalid operations (self-deletion, last admin protection)
   - Handle edge cases with proper error responses

5. **Implement audit logging:**
   - Log all user management actions using existing logger
   - Include actor, action, target, and timestamp

### 5. Error Handling

#### 5.1 Frontend Error Handling
- Display user-friendly error messages
- Handle network errors gracefully
- Show loading states during operations
- Implement retry mechanisms for failed operations

#### 5.2 Backend Error Handling
- Return appropriate HTTP status codes
- Provide detailed error messages for debugging
- Log errors for monitoring
- Handle edge cases gracefully

### 7. Documentation

#### 7.1 API Documentation
- Document all new endpoints
- Include request/response examples
- Document error codes and messages

#### 7.2 User Documentation
- Document user management features
- Include screenshots
- Provide usage examples

### 8. Performance Considerations

#### 8.1 Frontend Performance
- Implement pagination for large user lists
- Use efficient data fetching
- Optimize re-renders
- Implement proper caching

#### 8.2 Backend Performance
- Optimize database queries
- Implement proper indexing
- Use efficient data structures
- Handle large datasets

### 9. Deployment Considerations

#### 9.1 Database Migrations
- No schema changes required
- Ensure proper indexing

#### 9.2 Configuration
- Add any necessary environment variables
- Update documentation

### 10. Monitoring and Maintenance

#### 10.1 Logging
- Log all user management actions
- Monitor error rates
- Track performance metrics

#### 10.2 Maintenance
- Regular security audits
- Performance monitoring
- Error tracking
- User feedback collection

## Specific Implementation Plan

### Phase 1: Backend Implementation (2 days)
**Files to modify/create:**

1. **`api/server/routes/user.js`** - Add 3 new admin routes:
   ```javascript
   router.get('/all', requireJwtAuth, checkAdmin, getAllUsersController);
   router.put('/:userId/role', requireJwtAuth, checkAdmin, updateUserRoleController);
   router.delete('/:userId', requireJwtAuth, checkAdmin, deleteSpecificUserController);
   ```

2. **`api/server/controllers/UserController.js`** - Add 3 new controllers:
   - `getAllUsersController` - Use existing `User.find()` with pagination
   - `updateUserRoleController` - Use existing `updateUser()` method
   - `deleteSpecificUserController` - Reuse existing `deleteUserController` logic

3. **Leverage existing code:**
   - User model and methods from `api/models/userMethods.js`
   - Admin middleware from `api/server/middleware/roles/checkAdmin.js`
   - SystemRoles enum from `packages/data-provider/src/roles.ts`

### Phase 2: Frontend Implementation (2 days)
**Files to create:**

1. **`client/src/hooks/Users/`** directory:
   - `useGetUsers.ts`
   - `useUpdateUserRole.ts` 
   - `useDeleteUser.ts`
   - `index.ts`

2. **`client/src/components/Admin/UsersTable.tsx`** - Follow pattern from existing admin tables

3. **Modify `client/src/components/Admin/AdminModal.tsx`** - Add Users tab

### Phase 3: Testing & Polish (1 day)
- Test all CRUD operations
- Test admin access control
- Test edge cases (self-deletion, last admin)
- Add error handling and loading states

## Implementation Timeline

1. **Backend Development (2 days)**
   - Extend existing user routes and controllers
   - Add validation and security measures
   - Leverage existing user management infrastructure

2. **Frontend Development (2 days)**
   - Create UsersTable component following existing patterns
   - Implement API integration hooks
   - Add Users tab to AdminModal

3. **Testing and Polish (1 day)**
   - Test all functionality
   - Handle edge cases
   - Code review and security review

**Total estimated time: 5 days** (reduced from 9 days due to extensive existing infrastructure) 