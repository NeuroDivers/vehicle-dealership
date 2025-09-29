-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "odometer" INTEGER NOT NULL,
    "bodyType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL DEFAULT 'gasoline',
    "description" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Vehicle" ("bodyType", "color", "createdAt", "description", "id", "images", "isSold", "make", "model", "odometer", "price", "updatedAt", "year") SELECT "bodyType", "color", "createdAt", "description", "id", "images", "isSold", "make", "model", "odometer", "price", "updatedAt", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
