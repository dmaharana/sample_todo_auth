# Authentication and Authorization Implementation

This application implements authentication using JSON Web Tokens (JWTs) and authorization based on user roles.

## I. Backend (Go)

The Go backend handles user authentication (login, password hashing) and authorization (JWT validation, role-based access control).

1.  **Password Hashing:**
    *   When a new user is created or a user's password is set/updated, the password is not stored directly. Instead, it's hashed using the `bcrypt` algorithm.
    *   `bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)` is used to generate a secure hash.
    *   During login, `bcrypt.CompareHashAndPassword()` is used to compare the provided password with the stored hash without needing to decrypt the hash.

2.  **User Model (`backend/internal/models/user.go`):**
    *   The `User` struct includes a `PasswordHash` field to store the bcrypt hash.
    *   It also has a `RoleID` and a `Role` relationship, linking users to their respective roles (e.g., "admin", "user").

3.  **Authentication Handler (`backend/internal/handlers/auth_handler.go`):**
    *   The `Login` endpoint (`POST /api/login`) is responsible for authenticating users.
    *   It receives a username and password.
    *   It queries the database to find the user by username.
    *   It compares the provided password with the stored `PasswordHash` using `bcrypt.CompareHashAndPassword()`.
    *   If credentials are valid, it generates a JWT using `github.com/golang-jwt/jwt/v5`.
    *   The JWT's claims include `user_id`, `username`, `role`, and `exp` (expiration time).
    *   The token is signed with a secret key (currently hardcoded as "your_secret_key" but should be an environment variable in production).
    *   The signed JWT is returned to the frontend.

4.  **JWT Authentication Middleware (`backend/internal/middleware/auth_middleware.go`):**
    *   The `AuthMiddleware()` function intercepts incoming requests.
    *   It expects a `Bearer` token in the `Authorization` header.
    *   It parses and validates the JWT using the same secret key used for signing.
    *   If the token is valid, it extracts the `user_id` and `user_role` from the token's claims and sets them in the Gin context (`c.Set("user_id", ...)` and `c.Set("user_role", ...)`). This makes user information accessible to subsequent handlers.
    *   If the token is missing or invalid, it returns a `401 Unauthorized` response.

5.  **Role-Based Authorization Middleware (`backend/internal/middleware/auth_middleware.go`):**
    *   The `AuthorizeRoleMiddleware(requiredRole string)` function is used to restrict access to certain routes based on the user's role.
    *   It retrieves the `user_role` from the Gin context (set by `AuthMiddleware`).
    *   It compares the user's role with the `requiredRole` passed to the middleware.
    *   If the user does not have the required role, it returns a `403 Forbidden` response.

6.  **Route Protection (`backend/cmd/server/main.go`):**
    *   The `main.go` file applies these middlewares to protect API routes:
        *   All routes under `/api` (except `/api/login`) are protected by `AuthMiddleware()`.
        *   User management routes (`/api/users`) are further protected by `AuthorizeRoleMiddleware("admin")`, ensuring only users with the "admin" role can access them.

## II. Frontend (React/TypeScript)

The React frontend handles user login, stores the JWT, and uses it to authenticate requests and conditionally render UI elements.

1.  **Login Page (`frontend/src/LoginPage.tsx`):**
    *   Collects username and password from the user.
    *   Sends a `POST` request to `/api/login` using `axios`.
    *   Upon successful login, it receives the JWT from the backend.
    *   The JWT is stored in `localStorage` (`localStorage.setItem('token', response.data.token)`). This makes the token persistent across browser sessions.
    *   The user is then redirected to the `/app` page.

2.  **Protected Routes (`frontend/src/ProtectedRoute.tsx`):**
    *   This component acts as a route guard.
    *   Before rendering any protected route, it checks for the presence of a JWT in `localStorage`.
    *   It uses `jwt-decode` library to decode the JWT on the client-side.
    *   It checks the token's expiration (`exp` claim) to ensure it's still valid. If expired, the token is removed, and the user is redirected to the login page.
    *   It extracts the `user_id`, `username`, and `role` from the decoded token and passes them down to child components via `Outlet` context.
    *   If `allowedRoles` are specified for a route, it checks if the user's role matches. If not, the user is redirected (e.g., to `/app`).

3.  **Layout Component (`frontend/src/components/Layout.tsx`):**
    *   Receives the `userRole` and `username` from the `ProtectedRoute`'s context using `useOutletContext()`.
    *   Uses the `userRole` to conditionally render the "User Management" link in the sidebar (only visible to "admin" users).
    *   Displays the `username` in the sidebar.
    *   The "Logout" button clears the JWT from `localStorage` and redirects the user to the login page.

4.  **API Requests (`axios`):**
    *   For all protected API calls (e.g., fetching tasks, managing users), the JWT is retrieved from `localStorage`.
    *   The token is then included in the `Authorization` header of the `axios` request as a `Bearer` token:
        ```typescript
        headers: {
          Authorization: `Bearer ${token}`,
        },
        ```
    *   This ensures that the backend's `AuthMiddleware` can validate the request.

5.  **User Management Page (`frontend/src/UserManagementPage.tsx`):**
    *   Fetches the list of users from the backend.
    *   The "Delete" button for a user is disabled if the user's ID matches the currently logged-in user's ID or if the username is "admin", preventing self-deletion and deletion of the default admin account.

---