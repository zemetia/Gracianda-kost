# Task: Multi-Property (Multi-Kost / Multi-House) Support

- **Date**: 2026-07-27
- **Status**: In Progress
- **Source**: USER Request (Conversation ID: c7c3cc22-3e90-4bed-bf01-3cf8ec90d139)

## 🎯 Goal

Refactor the application architecture and database schema to support multiple properties (houses, buildings, villas, apartments) rather than a single boarding house (Gracianda Kost). This will enable general-purpose rental management of individual units (rooms, entire houses, apartments) across distinct locations.

## 📋 Implementation Checklist

### 🔍 Phase 1: Research & Discovery
- [ ] **Step 1.1: Schema Integrity Check (Think 3x)**
    - Re-evaluate foreign key constraints and relations for Floor, Room, MaintenanceRecord, and Incident when mapping to a new Property model.
- [ ] **Step 1.2: Codebase Reference Identification**
    - Audit all references to `prisma.room` and `prisma.floor` in components, actions, and services to locate affected areas.

### ⚙️ Phase 2: Setup & Database Migration
- [ ] **Step 2.1: Schema Update**
    - Modify `prisma/schema/property.prisma`, `prisma/schema/maintenance.prisma`, `prisma/schema/incident.prisma`, and `prisma/schema/tenant.prisma` (sequence) to integrate the `Property` and `PropertyType` models and update relations.
- [ ] **Step 2.2: Migration Strategy Execution**
    - Write a migration step or run scripts to insert a default property ("Gracianda Kost") and update existing floors, rooms, maintenance records, and incidents with the new `propertyId`.
    - Regenerate the Prisma Client using `npm run db:generate`.

### 🧠 Phase 3: Core Service Layer Refactoring
- [ ] **Step 3.1: Property Service Creation**
    - Implement a new `property.service.ts` to support property listing, CRUD, and status updates.
- [ ] **Step 3.2: Scoping Rooms and Floors**
    - Refactor `room.service.ts` to require `propertyId` for queries, filtering, creation, and Floor creation.
- [ ] **Step 3.3: Scoping Contracts and Sequences**
    - Refactor `contract.service.ts` to generate `contractCode` using property-specific prefixes and sequences.
- [ ] **Step 3.4: Refactoring Dashboard and Reports**
    - Update `dashboard.service.ts` and `report.service.ts` to calculate metrics either globally or filtered by `propertyId`.

### 🖥️ Phase 4: UI Components and Route Actions
- [ ] **Step 4.1: Property Management UI**
    - Add a Property CRUD management dashboard under Master Data `/admin/master-data/properties`.
- [ ] **Step 4.2: Scoped Room & Floor Management**
    - Update `/admin/master-data/rooms` to require selecting a property before showing or creating floors and rooms/units.
- [ ] **Step 4.3: Forms and Actions Update**
    - Update contract creation, maintenance, and incident logs to select and associate with specific properties.
- [ ] **Step 4.4: Public Page Property Selector**
    - Modify the public landing page `/` to allow users to select from a list of active properties and view the corresponding floor plan or unit list.

### ✅ Phase 5: Testing & Verification
- [ ] **Step 5.1: Database Integrity Audits**
    - Verify that database foreign keys, constraints, and custom sequences function correctly for multiple concurrently managed properties.
- [ ] **Step 5.2: Type-check and Linting**
    - Run `npm run lint` and `npx tsc --noEmit` to ensure TypeScript compilation passes with zero warnings or errors.
- [ ] **Step 5.3: User Handover**
    - Perform a manual walkthrough of the master data, tenant contract lifecycle, and public floor plan.

you must work with .agent/skills/planning-tasks/verify-planning-skill.md

## 🛠️ Technical Details

- **Files affected**:
  - `prisma/schema/property.prisma`
  - `prisma/schema/maintenance.prisma`
  - `prisma/schema/incident.prisma`
  - `prisma/schema/tenant.prisma`
  - `src/services/room.service.ts`
  - `src/services/contract.service.ts`
  - `src/services/dashboard.service.ts`
  - `src/services/report.service.ts`
  - `src/lib/validations/property.ts`
  - `src/app/[locale]/page.tsx`
  - `src/app/[locale]/RoomFloorPlan.tsx`
- **Dependencies**: Prisma client, next-intl, @radix-ui components.

## 📝 Notes & Discoveries

- [2026-07-27 12:26]: Checklist initialized. Applying Overpower mode.
