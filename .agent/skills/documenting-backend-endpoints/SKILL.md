---
name: documenting-backend-endpoints
description: Traces and documents backend route implementations from endpoint to controller, creating frontend-readable implementation plans. Use when you need to understand or document a backend route's logic, parameters, and authentication for frontend integration.
---

# Documenting Backend Endpoints

## Quick Start
To document a specific route (e.g. "Add to Cart"):
1. Locate the route definition (e.g., in `routes/cart.routes.ts`).
2. Trace to the controller (e.g., `CartController.addToCart`).
3. Generate the documentation file `docs/implementation/backend/add-to-cart.md`.

## Workflow
1.  **Identify Route**: Find the route file and the specific endpoint definition.
    - Identify method (GET, POST, etc.) and path.
    - Identify middleware (Auth, Validation).
2.  **Trace Controller**: Open the linked controller method.
3.  **Analyze Logic**:
    - **Auth**: Is a token required? What roles?
    - **Input**: What `body`, `query`, or `params` are needed? DTOs?
    - **Flow**: Step-by-step logic (e.g., validation -> db lookup -> calculation -> db update).
    - **Response**: What does success look like? Common errors?
4.  **Create Documentation**: Create a new file at `/docs/implementation/backend/[implementation-name].md` using the template below.

## Documentation Template
Use this structure for the output file:

```markdown
# [Implementation Name] Implementation

## Route Information
- **URL**: `[Method] /api/v1/resource/path` (Update prefix as found in code)
- **Controller**: `[ControllerName].[methodName]`
- **Location**: `[Path to route file]`
- **Auth Required**: [Yes/No - Type (e.g., Bearer Token, Admin Only)]

## Request Requirements
### Headers
- `Authorization`: Bearer [token] (if auth required)

### Arguments (Body/Query/Params)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `field_name` | String | Yes | Description... |

## Implementation Flow
*(Describe the logic step-by-step)*
1.  **Validation**: [Description of validation checks]
2.  **Business Logic**: [Description of what the controller/service does]
3.  **Response**: Returns [HTTP Status] with [Data Structure]

## Visual Flow (Optional)
*(If complex, describe the data flow graph)*

## Best Practices & Frontend Notes
- [Note on error handling]
- [Note on data types or specific quirks]
- [Recommendation for frontend state management]
```

## Tips
- **Be Concise**: Focus on what the frontend developer *needs* to know.
- **Link Files**: Mention the absolute paths of files involved for quick reference.
- **Security**: Explicitly highlight any role-based access control (RBAC).
