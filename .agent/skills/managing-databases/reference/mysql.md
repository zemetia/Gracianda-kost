# MySQL CLI Reference

Command-line interface usage for MySQL and MariaDB.

## Connection

| Operation | Command |
|-----------|---------|
| **Connect** | `mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME` |
| **Silent Run** | `mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SQL_QUERY"` |
| **Import SQL** | `mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < file.sql` |

### Security Note
- No space after `-p` when providing password directly
- For interactive use, use `-p` without a value to be prompted

## Connection String Format

MySQL connection URLs follow this pattern:
```
mysql://user:password@host:port/database
```

Example:
```
mysql://root:secret@localhost:3306/my_app
```

## Administrative Commands

| Operation | Command |
|-----------|---------|
| List Databases | `SHOW DATABASES;` |
| List Tables | `SHOW TABLES;` |
| Describe Table | `DESC table_name;` |
| Show Create Table | `SHOW CREATE TABLE table_name;` |

## Common Operations

### Select
```bash
mysql -h localhost -u root -p -e "SELECT id, username FROM users WHERE status='active' LIMIT 5;"
```

### Insert
```bash
mysql -h localhost -u root -p -e "INSERT INTO users (name, email) VALUES ('John', 'john@example.com');"
```

### Update
```bash
mysql -h localhost -u root -p -e "UPDATE users SET status='inactive' WHERE last_login < '2024-01-01';"
```

### Delete
```bash
mysql -h localhost -u root -p -e "DELETE FROM sessions WHERE expired_at < NOW();"
```

### JOIN Example
```bash
mysql -h localhost -u root -p -e "
SELECT o.id, c.name, o.total
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at > '2024-01-01';"
```
