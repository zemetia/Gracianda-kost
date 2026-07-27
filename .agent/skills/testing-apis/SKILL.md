---
name: testing-apis
description: Test REST API endpoints like a QA expert. Supports Bearer tokens, connectivity checks, and backend database verification via managing-databases skill.
---

# Testing APIs

Automate and document API endpoint testing with a focus on Quality Assurance.

## Quick Start

1.  **Read Credentials**: Read `resources/credentials.json` in this skill's folder to get authentication details (email, password, roles).
2.  **Connectivity Check**: Before testing, verify the backend is active.
    - Run `curl -I <base_url>` or use the test script on a health endpoint.
    - If it fails, **STOP** and ask the user: "The backend appears to be inactive. Please activate it before proceeding with API tests."
3.  **Login (if needed)**: If the API requires authentication:
    - Use credentials from `resources/credentials.json` to call the login endpoint.
    - Extract the token from the login response.
    - Use that token for subsequent authenticated requests.
4.  **Run Test**:
    ```bash
    python scripts/test_api.py <URL> [METHOD] [DATA_JSON] [BEARER_TOKEN]
    ```
5.  **Database Sync**: If an API call modifies data (POST/PUT/DELETE), use the `managing-databases` skill to verify the database state.

## Core Workflow

### 1. Pre-test Verification
- Read `resources/credentials.json` in this skill's folder for authentication credentials.
- Check for `.env` or configuration files in the target project to find API base URLs.
- Ping the server to ensure it's reachable.
- If authentication is required, login first and obtain a bearer token.

### 2. Execution (QA Expert Persona)
- Test valid inputs, boundary cases, and invalid inputs.
- Verify status codes (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 500 Server Error).
- Validate response body structure and data types.

### 3. Database Verification
- If the API (e.g., `POST /users`) should create a record, trigger the [managing-databases](../managing-databases/SKILL.md) skill to:
  - Connect to the DB.
  - Query the relevant table.
  - Confirm the change exists.

### 4. Reporting
Generate a summary of the results in the following format:
```
<endpoint> => <status (working/error)>
[Additional details if error]
```

## Credentials File

The `resources/credentials.json` file stores authentication details:

```json
{
  "role": ["user", "admin", "super_admin"],
  "token": "",
  "email": "user@example.com",
  "password": "password123"
}
```

- **role**: Available roles to test with (use appropriate credentials per role if needed).
- **token**: Pre-stored token (optional). If empty, login to obtain one.
- **email/password**: Login credentials for authentication endpoints.

## Features
- **Bearer Token Support**: Pass tokens directly to the script.
- **JSON Handling**: Automatically handles JSON payloads and responses.
- **Cross-Skill Integration**: Works with `managing-databases` for end-to-end testing.

## References
- **Usage Examples**: See [examples.md](examples.md)
- **Database Management**: See [managing-databases/SKILL.md](../managing-databases/SKILL.md)
