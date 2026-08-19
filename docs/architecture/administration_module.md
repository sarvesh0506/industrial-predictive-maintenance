# Administration Panel & System Audit Log Architecture

The **Administration Module** provides centralized user account lifecycle management, role-based authorization control, machine & sensor configuration, sensor threshold boundary management, and system audit logging for administrative actions.

---

## Access Control & Authorization

- All endpoints under `/api/admin/**` are strictly secured with `@PreAuthorize("hasRole('ADMIN')")`.
- Non-admin users calling these endpoints receive an **HTTP 403 Forbidden** response.
- The React Frontend `/admin` tab renders exclusively when the authenticated user possesses `role === "ADMIN"`.

---

## User & Role Lifecycle Management

- **Status Toggle**: Admins can activate or deactivate registered accounts (`status = "ACTIVE"` / `"INACTIVE"`).
- **Role Assignment**: Admins can change user roles dynamically between `ADMIN`, `ENGINEER`, and `OPERATOR`.

---

## Audit Logging Framework (`AuditLog.java`)

Every administrative action automatically records a non-repudiable audit log entry containing:
- `adminUsername`: Username of the performing admin.
- `action`: Categorical tag (`USER_ACTIVATED`, `USER_DEACTIVATED`, `ROLE_CHANGED`, `MACHINE_CONFIGURED`, `SENSOR_CONFIGURED`, `THRESHOLD_UPDATED`).
- `targetEntity`: Target object string (e.g., `"User: op.sarvesh"`, `"Machine: MCH-CNC-001"`).
- `details`: Human-readable summary of old vs. new values.
- `ipAddress`: Request origin IP address.
- `timestamp`: Immutable execution timestamp.

---

## REST API Endpoints

- `GET /api/admin/users` - Fetch user registry.
- `PUT /api/admin/users/{id}/status?enabled={boolean}` - Activate/deactivate user.
- `PUT /api/admin/users/{id}/role?role={ROLE}` - Assign role.
- `GET /api/admin/audit-logs` - Query audit trail with `action` and `search` filters.
