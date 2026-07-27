# Backend Architecture Patterns Reference

Understanding the project's architecture is crucial for recommending where new logic should reside.

## Common Patterns

### 1. Clean Architecture / Hexagonal
- **Layers**: Domain (Entities), Use Cases (Services), Infrastructure (Adapters/Controllers).
- **Rule**: Dependencies only point inward.
- **Where to add Tripay?**:
  - `Domain`: `PaymentGateway` interface / `Transaction` entity.
  - `UseCases`: `ProcessPayment` / `HandleWebhook`.
  - `Infrastructure`: `TripayAdapter` (implementing `PaymentGateway`).

### 2. Layered Architecture (MVC)
- **Layers**: Models, Views, Controllers, Services.
- **Where to add Tripay?**:
  - `Service`: `TripayService` for API calls.
  - `Controller`: `TripayController` for webhooks and initiating payments.
  - `Model`: `Payment` or `Order` model updates.

### 3. Middleware-First (Express/Next.js)
- Common in simpler apps or Next.js API routes.
- **Where to add Tripay?**:
  - `lib/`: `tripay.ts` for client initialization.
  - `api/`: Route handlers for checkout and webhooks.

## Database Integration Tips
- **Naming**: Match existing conventions (e.g., `created_at` vs `createdAt`).
- **Entity Identification**:
  - Search for `@Entity` (TypeORM).
  - Search for `model` (Prisma).
  - Search for `Schema` (Mongoose).
