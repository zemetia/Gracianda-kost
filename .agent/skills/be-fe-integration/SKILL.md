---
name: be-fe-integration
description: Integrate backend APIs with frontend requirements. Prioritizes frontend needs (data fetching, form submissions, CRUD) and connects them to existing backend logic. Use when the backend is largely ready and the frontend needs to be hooked up to real data and actions.
---

# Backend-Frontend Integration (be-fe-integration)

A specialized workflow for connecting frontend components to backend services, focusing on frontend requirements while minimizing backend changes.

## Quick Start
1. **Analyze Frontend**: Identify what the frontend needs (e.g., "User Profile", "Delete Post Form").
2. **Search Backend**: Locate the corresponding API endpoints or service methods.
3. **Map Data**: Ensure frontend props match backend response fields and form data matches backend request parameters.
4. **Hook Up**: Implement the `fetch`/`axios` calls or API client integration in the frontend.
5. **Minimal Backend Patch**: If the backend is missing a specific field or endpoint *required* by the frontend, modify *only* that specific part.

## Workflows

### 1. Frontend Requirement Analysis
- **Identify Data Needs**: What fields are displayed? (e.g., `user.avatar`, `post.title`).
- **Identify User Actions**: What can the user do? (e.g., "Submit Order", "Cancel Subscription").
- **Examine Component Logic**: Check `useEffect`, form handlers, or state management (Redux, Zustand) for pending API integrations.

### 2. Backend Discovery & Alignment
- **Locate Endpoints**: Search for route definitions (e.g., `router.post('/orders')`, `app.get('/api/users')`).
- **Check Controllers/Services**: verify the logic handling those routes.
- **Compare Payloads**: 
  - **Frontend Request**: Does it match the backend's expected JSON body or query params?
  - **Backend Response**: Does it contain all the fields the frontend UI needs to render?

### 3. Integration Implementation
- **Frontend Focus**:
  - Update API client or service functions.
  - Wrap calls in `try/catch` and handle loading/error states.
  - Map backend field names to frontend-friendly names if they differ.
- **Backend Constraints**:
  - **Rule**: Do NOT change the backend unless explicitly asked OR if the frontend requirement cannot be met without a change.
  - **Specific Changes**: If a change is needed, modify ONLY the specific endpoint or field required by the frontend task. Avoid refactoring unrelated backend code.

### 4. Verification
- **Run the App**: Manually trigger the action in the browser.
- **Inspect Network**: Monitor the Network tab to verify correct status codes (2xx, 4xx, 5xx) and payload structures.
- **Check Database**: Use `managing-databases` to verify that POST/PUT/DELETE actions had the intended effect on the data.

## Rules & Principles
- **Frontend Center**: The frontend's UI and UX requirements drive the integration.
- **Stay Surgical**: When modifying the backend, be a "surgeon," not a "renovator."
- **Handle Mismatches**: Use transformation logic on the frontend to bridge minor naming differences between FE and BE.

## Examples

### Scenario: Hooking up a Contact Form
1. **FE Analysis**: Form has `name`, `email`, `message`.
2. **BE Discovery**: Endpoint `POST /api/contact` expects `{ fullName, emailAddress, content }`.
3. **Integration**: Create a mapping in the FE call:
   ```javascript
   const submitForm = async (data) => {
     await api.post('/contact', {
       fullName: data.name,
       emailAddress: data.email,
       content: data.message
     });
   };
   ```

### Scenario: Missing Field in Backend
1. **FE Analysis**: UI needs `user_id` to be returned on login to redirect to profile.
2. **BE Discovery**: `POST /login` currently only returns a `token`.
3. **Action**: Since the UI *requires* `user_id` for its logic, modify *only* the login response to include `user_id`.

## Reference
- **API Testing**: See [testing-apis](../testing-apis/SKILL.md) for verifying integration.
- **Database Management**: See [managing-databases](../managing-databases/SKILL.md) for data verification.
