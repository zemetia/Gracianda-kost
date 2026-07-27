# API Testing Examples

## Basic GET Request
```bash
python scripts/test_api.py https://api.example.com/health
```

## POST Request with Bearer Token
```bash
python scripts/test_api.py https://api.example.com/v1/users POST '{"name": "John Doe", "email": "john@example.com"}' "my-secret-token"
```

## Testing for Errors
When an endpoint returns an unexpected output:
**Input:**
```bash
python scripts/test_api.py https://api.example.com/invalid-route
```
**Output Report:**
```
/invalid-route => the output is not as expected (Status: 404, Body: {"message": "Not Found"})
```

## Full QA Workflow Example
1. **Request:** "Check if the user registration API works."
2. **Action:**
   - Test `POST /api/register` with test data.
   - If status is 201, trigger `managing-databases` to check the `users` table.
3. **Draft Report:**
   ```
   /api/register => working
   (Verified: User 'test_user' successfully added to 'users' table in MySQL)
   ```
