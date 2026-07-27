---
name: managing-databases
description: Manage MySQL and PostgreSQL databases with direct CLI commands. Supports CRUD operations, advanced SQL queries, and credential discovery. Use when user mentions database, SQL, MySQL, PostgreSQL, psql, queries, tables, or needs help with database connections.
---

# Managing Databases

Handle database operations for MySQL and PostgreSQL using direct CLI tools (`mysql`, `psql`).

## When to Use

- User asks about MySQL or PostgreSQL operations
- Database CRUD operations needed
- SQL query help requested
- Database connection or credential lookup
- Table schema inspection or modifications

## Quick Start (Credential Discovery)

Before performing any database operation, **locate credentials** using these methods:

### 1. Search for Credential Keywords

Search project files for common database credential patterns:

**Environment variables:**
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
DATABASE_URL, DATABASE_HOST, DATABASE_USER
MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD
POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, PGPASSWORD
```

**Connection string patterns:**
```
mysql://user:password@host:port/database
postgresql://user:password@host:port/database
postgres://user:password@host:port/database
sqlite:///path/to/database.db
sqlite:///:memory:
```

### 2. Common Credential Locations

Check these files in order:
1. `.env` - Primary environment file
2. `.env.local` - Local overrides
3. `config/database.yml` - Rails/Ruby projects
4. `config/database.php` - PHP projects
5. `settings.py` or `config.py` - Python projects
6. `application.properties` - Java/Spring projects
7. `docker-compose.yml` - Docker environments

### 3. Validation

- If credentials found: proceed with CLI commands
- If credentials missing: **STOP** and ask the user. **DO NOT** guess.

## Core Workflow

1. **Find Credentials**: Search for DB/database keywords and connection strings
2. **Select Tool**: Use `mysql` for MySQL/MariaDB, `psql` for PostgreSQL
3. **Execute SQL**: Use direct CLI execution for simple tasks
4. **Complex Queries**: Create a `.sql` file for multi-step operations

## Reference

- **MySQL**: See [reference/mysql.md](reference/mysql.md) - Connection, commands, examples
- **PostgreSQL**: See [reference/postgresql.md](reference/postgresql.md) - Connection, commands, examples
- **Examples**: See [examples.md](examples.md) - Advanced query patterns

## Guidelines

- **Escape Strings**: Be mindful of escaping to avoid SQL injection
- **Explain First**: For `UPDATE` or `DELETE`, show the query before execution
- **Backup Warning**: Recommend backups before destructive operations

## Troubleshooting

- **Connection refused**: Verify host/port, check if database service is running
- **Access denied**: Double-check username/password, verify user permissions
- **Database not found**: Confirm database name exists, check spelling
- **SSL errors**: Try adding `--ssl-mode=DISABLED` (MySQL) or `sslmode=disable` (PostgreSQL) for local dev
