-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "propertyType" TEXT,
    "monthlyBill" TEXT,
    "addressRaw" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT NOT NULL,
    "serviceType" TEXT,
    "houseSpecs" TEXT,
    "seriousness" INTEGER NOT NULL,
    "energyProvider" TEXT,
    "consentGiven" BOOLEAN NOT NULL,
    "consentText" TEXT,
    "consentedAt" DATETIME,
    "serviceAreaStatus" TEXT NOT NULL,
    "leadBucket" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "isHotLead" BOOLEAN NOT NULL DEFAULT false,
    "emailedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
