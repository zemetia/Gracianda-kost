---
name: be-research
description: Research backend best practices, library recommendations, and database entity integration. Use when start researching or planning backend features like payment gateways, auth systems, or complex API integrations.
---

# Backend Researcher (be-research)

A specialized workflow for researching and documenting backend best practices, ensuring alignment with existing project architecture and database schemas.

## Quick Start
1. Identify the backend feature being researched (e.g., "Tripay Integration").
2. Search the codebase for existing entities/models: `grep -r "entity" .` or `grep -r "entities" .`. search keyword entity / entities*. / schema / migration.
3. Consult `managing-databases` if credentials are available to understand current table structures.
4. Add or edit database columns and tables based on research findings to support implementation.
5. Document findings in `/docs/research/backend/[task-name].md`.

## Workflows

### 1. Project Context Analysis
- **Identify Framework**: Determine if it's Next.js, Express, NestJS, Go, etc.
- **Identify DB Strategy**: Look for TypeORM, Prisma, Sequelize, or raw SQL.
- **Search for Entities**:
  - Run `fd -e ts -e js -e go -e py "entity"` or `fd -e ts -e js -e go -e py "models"`.
  - Read files to understand established patterns (CamelCase vs snake_case, ID types, etc.).

### 2. Best Practice Research
- Search for the specific technology (e.g., "Tripay API best practices Node.js").
- Identify standard libraries:
  - Official SDKs preferred.
  - Well-maintained community libraries as secondary.
- Define Implementation Steps:
  - Configuration (Env vars).
  - Service/Controller layer logic.
  - Webhook handling (CRITICAL for payments).
  - Security (Signature verification).

### 3. Database Schema Design (if needed)
- Don't implement it but just report it
- If new tables are needed, align with existing entities.
- Consult [managing-databases](../managing-databases/SKILL.md) for live database inspection if `.env` exists.
- Propose migrations or new entity files.

## Documentation Template
The research should be saved in `/docs/research/backend/[task-name].md` using the following structure:
- **Title**: [Task Name]
- **Overview**: Brief description of the feature.
- **Recommended Libraries**: List with rationale.
- **Implementation Strategy**: High-level flow.
- **Database Changes**: (Optional) Entities and columns needed.
- **Security Considerations**: Webhooks, auth, etc.

## Reference
- **Architecture Patterns**: See [reference/architecture-patterns.md](reference/architecture-patterns.md)
- **Examples**: See [examples.md](examples.md)
