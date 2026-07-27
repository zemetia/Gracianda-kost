# PostgreSQL CLI Reference

Command-line interface usage for PostgreSQL.

## Connection

| Operation | Command |
|-----------|---------|
| **Connect** | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME` |
| **Direct Run** | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SQL_QUERY"` |
| **Import SQL** | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f file.sql` |

### Password Handling
- Set `PGPASSWORD` environment variable to avoid prompts
- Or use `.pgpass` file for persistent credentials

## Connection String Format

PostgreSQL connection URLs follow this pattern:
```
postgresql://user:password@host:port/database
postgres://user:password@host:port/database
```

Example:
```
postgresql://postgres:secret@localhost:5432/my_app
postgres://admin:pass123@db.example.com:5432/production
```

## Administrative Commands

| Operation | Command |
|-----------|---------|
| List Databases | `\l` or `\list` |
| List Tables | `\dt` |
| Describe Table | `\d table_name` |
| List Schemas | `\dn` |
| Current Database | `SELECT current_database();` |

## Common Operations

### Select
```bash
psql -h localhost -U postgres -d my_db -c "SELECT id, username FROM users WHERE active = true LIMIT 5;"
```

### Insert
```bash
psql -h localhost -U postgres -d my_db -c "INSERT INTO logs (message) VALUES ('System start');"
```

### Update
```bash
psql -h localhost -U postgres -d my_db -c "UPDATE users SET verified = true WHERE email_confirmed_at IS NOT NULL;"
```

### Delete
```bash
psql -h localhost -U postgres -d my_db -c "DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '30 days';"
```

### Aggregation Example
```bash
psql -h localhost -U postgres -d my_db -c "
SELECT category, AVG(price) as avg_price
FROM products
GROUP BY category
HAVING AVG(price) > 50;"
```

### CTE Example
```bash
psql -h localhost -U postgres -d my_db -c "
WITH high_value AS (
    SELECT customer_id, SUM(amount) as total
    FROM orders GROUP BY customer_id HAVING SUM(amount) > 1000
)
SELECT c.name, h.total FROM customers c JOIN high_value h ON c.id = h.customer_id;"
```
