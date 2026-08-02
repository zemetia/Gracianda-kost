-- CreateEnum
CREATE TYPE "IncidentPersonRole" AS ENUM ('PELAPOR', 'TERLIBAT', 'SAKSI', 'TERDAMPAK');

-- CreateTable
CREATE TABLE "incident_people" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "role" "IncidentPersonRole" NOT NULL DEFAULT 'TERLIBAT',
    "tenantId" TEXT,
    "occupantId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,

    CONSTRAINT "incident_people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_people_incidentId_idx" ON "incident_people"("incidentId");
CREATE INDEX "incident_people_tenantId_idx" ON "incident_people"("tenantId");
CREATE INDEX "incident_people_occupantId_idx" ON "incident_people"("occupantId");

-- AddForeignKey
ALTER TABLE "incident_people" ADD CONSTRAINT "incident_people_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incident_people" ADD CONSTRAINT "incident_people_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incident_people" ADD CONSTRAINT "incident_people_occupantId_fkey" FOREIGN KEY ("occupantId") REFERENCES "contract_occupants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
