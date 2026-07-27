# Database Usage Examples (CLI)

Examples of running SQL queries directly via command-line tools.

## 1. MySQL Examples

### Select Data
```bash
mysql -h localhost -u root -p -e "SELECT id, username FROM users WHERE status='active' LIMIT 5;"
```

### Advanced JOIN
```bash
mysql -h localhost -u root -p -e "
SELECT o.id, c.name, o.total 
FROM orders o 
JOIN customers c ON o.customer_id = c.id 
WHERE o.created_at > CURDATE() - INTERVAL 30 DAY;"
```

---

## 2. PostgreSQL Examples

### Insert Data
```bash
psql -h localhost -U postgres -d my_db -c "INSERT INTO logs (message) VALUES ('System start');"
```

### Complex Aggregation
```bash
psql -h localhost -U postgres -d my_db -c "
SELECT category, AVG(price) as avg_price 
FROM products 
GROUP BY category 
HAVING AVG(price) > 50;"
```

---

## 3. Large Queries (SQL Files)

For very advanced SQL with multiple JOINs and subqueries, use a file:

1.  Create `query.sql`:
    ```sql
    WITH high_value_customers AS (
        SELECT customer_id, SUM(amount) as total_spent
        FROM orders
        GROUP BY customer_id
        HAVING SUM(amount) > 1000
    )
    SELECT c.name, hv.total_spent
    FROM customers c
    JOIN high_value_customers hv ON c.id = hv.customer_id
    ORDER BY hv.total_spent DESC;
    ```
2.  Run it:
    - **MySQL**: `mysql ... < query.sql`
    - **PostgreSQL**: `psql ... -f query.sql`
