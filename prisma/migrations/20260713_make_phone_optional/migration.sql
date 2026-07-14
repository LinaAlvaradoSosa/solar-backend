PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Lead" (
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

INSERT INTO "new_Lead" (
    "id",
    "fullName",
    "email",
    "phone",
    "propertyType",
    "monthlyBill",
    "addressRaw",
    "city",
    "state",
    "zipCode",
    "serviceType",
    "houseSpecs",
    "seriousness",
    "energyProvider",
    "consentGiven",
    "consentText",
    "consentedAt",
    "serviceAreaStatus",
    "leadBucket",
    "status",
    "isHotLead",
    "emailedAt",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "fullName",
    "email",
    "phone",
    "propertyType",
    "monthlyBill",
    "addressRaw",
    "city",
    "state",
    "zipCode",
    "serviceType",
    "houseSpecs",
    "seriousness",
    "energyProvider",
    "consentGiven",
    "consentText",
    "consentedAt",
    "serviceAreaStatus",
    "leadBucket",
    "status",
    "isHotLead",
    "emailedAt",
    "notes",
    "createdAt",
    "updatedAt"
FROM "Lead";

DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
