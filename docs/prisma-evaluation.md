# Prisma ORM Evaluation

**Issue**: [#101](https://github.com/DamageLabs/whiskey-canon/issues/101)
**Date**: 2025-02-13
**Status**: Evaluation complete — not recommended at this time

---

## Executive Summary

Whiskey Canon's backend has **75 `db.prepare()` calls** across 17 files, with **54 model methods** in 5 primary models. Roughly 70% of these are standard CRUD operations that map cleanly to Prisma Client. However, 25% are complex aggregation queries (statistics, analytics) that would require `$queryRaw`, and 5% use SQLite-specific APIs (`db.backup()`, `ATTACH DATABASE`, `PRAGMA`) with no Prisma equivalent.

The highest-risk factor is the **sync-to-async migration**: better-sqlite3 is synchronous by design, and every model method and route handler is written accordingly. Prisma Client is async-only, requiring `async/await` refactoring across all 51 route handlers and 54 model methods.

**Recommendation**: Proceed with a custom migration runner ([#88](https://github.com/DamageLabs/whiskey-canon/issues/88)) for now. Revisit Prisma if/when migrating to PostgreSQL ([#68](https://github.com/DamageLabs/whiskey-canon/issues/68)), where the async penalty is inherent anyway and Prisma's type generation and migration tooling provide stronger value.

---

## Schema Mapping

The following `schema.prisma` maps all 5 existing tables. Notes on limitations follow.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id                         Int       @id @default(autoincrement())
  username                   String    @unique
  email                      String    @unique
  password                   String
  role                       String    // CHECK constraint not supported in Prisma
  firstName                  String?   @map("first_name")
  lastName                   String?   @map("last_name")
  profilePhoto               String?   @map("profile_photo")
  emailVerified              Int       @default(0) @map("email_verified")  // SQLite Boolean
  verificationCode           String?   @map("verification_code")
  verificationCodeExpiresAt  String?   @map("verification_code_expires_at")
  verificationCodeAttempts   Int       @default(0) @map("verification_code_attempts")
  passwordResetToken         String?   @map("password_reset_token")
  passwordResetExpiresAt     String?   @map("password_reset_expires_at")
  isProfilePublic            Int       @default(0) @map("is_profile_public")  // SQLite Boolean
  createdAt                  DateTime  @default(now()) @map("created_at")
  updatedAt                  DateTime  @default(now()) @updatedAt @map("updated_at")

  whiskeys        Whiskey[]
  comments        WhiskeyComment[]
  backups         Backup[]
  backupSchedule  BackupSchedule?

  @@map("users")
}

model Whiskey {
  id                 Int       @id @default(autoincrement())
  name               String
  type               String    // CHECK constraint not supported
  distillery         String
  region             String?
  age                Int?
  abv                Float?
  size               String?
  quantity           Int?
  msrp               Float?
  secondaryPrice     Float?    @map("secondary_price")
  description        String?
  tastingNotes       String?   @map("tasting_notes")
  rating             Float?    // CHECK constraint (0-10) not supported
  purchaseDate       String?   @map("purchase_date")
  purchasePrice      Float?    @map("purchase_price")
  purchaseLocation   String?   @map("purchase_location")
  obtainedFrom       String?   @map("obtained_from")
  bottleCode         String?   @map("bottle_code")
  isOpened           Int       @default(0) @map("is_opened")
  dateOpened         String?   @map("date_opened")
  remainingVolume    Float?    @map("remaining_volume")
  storageLocation    String?   @map("storage_location")
  status             String    @default("in_collection")
  caskType           String?   @map("cask_type")
  caskFinish         String?   @map("cask_finish")
  barrelNumber       String?   @map("barrel_number")
  bottleNumber       String?   @map("bottle_number")
  vintageYear        String?   @map("vintage_year")
  bottledDate        String?   @map("bottled_date")
  color              String?
  noseNotes          String?   @map("nose_notes")
  palateNotes        String?   @map("palate_notes")
  finishNotes        String?   @map("finish_notes")
  timesTasted        Int       @default(0) @map("times_tasted")
  lastTastedDate     String?   @map("last_tasted_date")
  foodPairings       String?   @map("food_pairings")
  currentMarketValue Float?    @map("current_market_value")
  valueGainLoss      Float?    @map("value_gain_loss")
  isInvestmentBottle Int       @default(0) @map("is_investment_bottle")
  country            String?
  mashBill           String?   @map("mash_bill")
  proof              Float?
  limitedEdition     Int       @default(0) @map("limited_edition")
  awards             String?
  chillFiltered      Int?      @map("chill_filtered")
  naturalColor       Int?      @map("natural_color")
  imageUrl           String?   @map("image_url")
  labelImageUrl      String?   @map("label_image_url")
  receiptImageUrl    String?   @map("receipt_image_url")
  isForSale          Int       @default(0) @map("is_for_sale")
  askingPrice        Float?    @map("asking_price")
  isForTrade         Int       @default(0) @map("is_for_trade")
  sharedWith         String?   @map("shared_with")
  privateNotes       String?   @map("private_notes")
  createdBy          Int       @map("created_by")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @default(now()) @updatedAt @map("updated_at")

  user     User             @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  comments WhiskeyComment[]

  @@index([type])
  @@index([distillery])
  @@index([createdBy])
  @@map("whiskeys")
}

model WhiskeyComment {
  id        Int      @id @default(autoincrement())
  whiskeyId Int      @map("whiskey_id")
  userId    Int      @map("user_id")
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  whiskey Whiskey @relation(fields: [whiskeyId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([whiskeyId])
  @@index([userId])
  @@map("whiskey_comments")
}

model BackupSchedule {
  id            Int       @id @default(autoincrement())
  userId        Int       @unique @map("user_id")
  interval      String    @default("weekly")
  format        String    @default("json")
  retentionDays Int?      @default(30) @map("retention_days")
  lastRunAt     DateTime? @map("last_run_at")
  nextRunAt     DateTime? @map("next_run_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("backup_schedules")
}

model Backup {
  id           Int      @id @default(autoincrement())
  userId       Int      @map("user_id")
  filename     String
  format       String
  triggerType  String   @map("trigger_type")
  sizeBytes    Int?     @map("size_bytes")
  whiskeyCount Int?     @map("whiskey_count")
  commentCount Int?     @map("comment_count")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("backups")
}
```

### Schema Limitations

| Feature | Current SQLite | Prisma SQLite |
|---|---|---|
| CHECK constraints | `CHECK(role IN ('admin', 'editor', 'viewer'))` | Not supported — must validate in application layer |
| CHECK constraints | `CHECK(rating >= 0 AND rating <= 10)` | Not supported — must validate in application layer |
| Boolean fields | `INTEGER DEFAULT 0` | Prisma maps `Boolean` to `Int` for SQLite, but existing code uses 0/1 directly |
| `ON DELETE CASCADE` | Supported in raw SQL | Supported via `onDelete: Cascade` in schema |
| Custom defaults | `DEFAULT 'in_collection'` | Supported via `@default()` |

---

## CRUD Migration Assessment

### User Model (21 methods)

| Method | Prisma Equivalent | Complexity |
|---|---|---|
| `create()` | `prisma.user.create()` | Low — direct mapping |
| `findById()` | `prisma.user.findUnique()` | Low |
| `findByUsername()` | `prisma.user.findUnique()` | Low |
| `findByEmail()` | `prisma.user.findUnique()` | Low |
| `validatePassword()` | N/A — bcrypt logic stays in app | None (no DB change) |
| `findAll()` | `prisma.user.findMany({ orderBy })` | Low |
| `updateRole()` | `prisma.user.update()` | Low |
| `delete()` | `prisma.user.delete()` | Low |
| `updateEmail()` | `prisma.user.update()` | Low |
| `updatePassword()` | `prisma.user.update()` | Low |
| `updateProfile()` | `prisma.user.update()` | Low |
| `updateProfilePhoto()` | `prisma.user.update()` | Low |
| `setVerificationCode()` | `prisma.user.update()` | Low |
| `incrementVerificationAttempts()` | `prisma.user.update()` | Low |
| `markEmailVerified()` | `prisma.user.update()` | Low |
| `setPasswordResetToken()` | `prisma.user.update()` | Low |
| `findByPasswordResetToken()` | `prisma.user.findFirst({ where })` | Low |
| `clearPasswordResetToken()` | `prisma.user.update()` | Low |
| `updateVisibility()` | `prisma.user.update()` | Low |
| `getPublicProfile()` | `prisma.user.findFirst({ where, select })` | Low |
| `findPublicProfiles()` | `prisma.user.findMany({ where, select })` | Low |

### Whiskey Model (15 methods)

| Method | Prisma Equivalent | Complexity |
|---|---|---|
| `create()` | `prisma.whiskey.create()` | Low — 34-field insert maps directly |
| `findById()` | `prisma.whiskey.findFirst({ where })` | Low — user isolation via where clause |
| `findAll()` | `prisma.whiskey.findMany({ where, orderBy })` | Medium — dynamic filters need conditional where |
| `update()` | `prisma.whiskey.update()` | Medium — dynamic field selection |
| `delete()` | `prisma.whiskey.delete()` | Low |
| `search()` | `prisma.whiskey.findMany({ where: { OR } })` | Medium — LIKE queries via `contains` |
| `findAllWithOwners()` | `prisma.whiskey.findMany({ include: { user } })` | Low — Prisma excels at JOINs |
| `deleteMany()` | `prisma.whiskey.deleteMany({ where: { id: { in } } })` | Low |
| `deleteAllByUser()` | `prisma.whiskey.deleteMany({ where })` | Low |
| `getPublicStats()` | `$queryRaw` or mixed | **High** — GROUP BY, COUNT DISTINCT, AVG |

### Comment Model (7 methods)

| Method | Prisma Equivalent | Complexity |
|---|---|---|
| `create()` | `prisma.whiskeyComment.create()` | Low |
| `findById()` | `prisma.whiskeyComment.findUnique({ include })` | Low |
| `findByWhiskeyId()` | `prisma.whiskeyComment.findMany({ where, include })` | Low |
| `countByWhiskeyId()` | `prisma.whiskeyComment.count({ where })` | Low |
| `update()` | `prisma.whiskeyComment.update()` | Low |
| `delete()` | `prisma.whiskeyComment.delete()` | Low |
| `isOwner()` | `prisma.whiskeyComment.findFirst({ where })` | Low |

### Backup & BackupSchedule Models (12 methods)

All 12 methods across both models map cleanly to Prisma CRUD operations (Low complexity). The `upsert()` method in BackupSchedule maps to `prisma.backupSchedule.upsert()`.

---

## Complex Query Assessment

The `statistics.ts` route contains **15 major analytical queries** that would require `$queryRaw` or significant workarounds in Prisma.

### Queries Requiring `$queryRaw`

**1. Financial Statistics** — 8 aggregations with COALESCE and calculated fields
```sql
SELECT
  SUM(quantity) as total_bottles,
  SUM(purchase_price) as total_purchase_cost,
  COALESCE(SUM(current_market_value), 0) as total_market_value,
  (COALESCE(SUM(current_market_value), 0) - SUM(purchase_price)) as total_gain_loss,
  AVG(purchase_price) as avg_purchase_price,
  ...
```
Prisma's `aggregate()` supports SUM/AVG/MIN/MAX but not COALESCE, calculated fields, or multiple aggregations on different columns in a single query.

**2. Inventory Statistics** — 9 CASE WHEN expressions
```sql
SELECT
  SUM(CASE WHEN is_opened = 1 THEN 1 ELSE 0 END) as opened_bottles,
  SUM(CASE WHEN status = 'consumed' THEN 1 ELSE 0 END) as consumed,
  AVG(CASE WHEN remaining_volume IS NOT NULL THEN remaining_volume END) as avg_remaining,
  ...
```
No Prisma equivalent for conditional aggregation.

**3. Age Distribution** — CASE WHEN bucketing with custom sort
```sql
SELECT
  CASE
    WHEN age < 5 THEN 'Under 5'
    WHEN age BETWEEN 5 AND 9 THEN '5-9 years'
    ...
  END as age_range,
  COUNT(*) as count
GROUP BY age_range
ORDER BY CASE age_range WHEN 'Under 5' THEN 1 ... END
```
Complex bucketing and custom ordering — no Prisma equivalent.

**4. Best ROI Bottles** — Calculated fields with NULLIF
```sql
SELECT *, ROUND(((secondary_price - purchase_price) / NULLIF(purchase_price, 0) * 100), 2) as roi_percentage
```
Division-by-zero protection via NULLIF — requires raw SQL.

**5. Special Items** — Inverted boolean logic with NULL checks
```sql
SUM(CASE WHEN chill_filtered = 0 THEN 1 ELSE 0 END) as non_chill_filtered,
SUM(CASE WHEN barrel_number IS NOT NULL THEN 1 ELSE 0 END) as single_barrel
```

### Queries That Could Use Prisma `groupBy()` (with limitations)

- Type Distribution — `prisma.whiskey.groupBy({ by: ['type'] })` + `_count`, `_avg`
- Country Distribution — `prisma.whiskey.groupBy({ by: ['country'] })`
- Storage Locations — `prisma.whiskey.groupBy({ by: ['storageLocation'] })`
- Top Distilleries — `prisma.whiskey.groupBy({ by: ['distillery'] })` + `_count`

However, these still need COALESCE for null handling and would require separate queries for the additional aggregation fields.

### Summary

| Category | Count | Prisma Approach |
|---|---|---|
| Direct CRUD | ~52 methods | Prisma Client (type-safe) |
| Simple groupBy | ~4 queries | Prisma `groupBy()` with caveats |
| Complex analytics | ~11 queries | `$queryRaw` (no type safety) |
| SQLite-specific | ~3 operations | Not possible via Prisma |

---

## SQLite-Specific Operations

These features have no Prisma equivalent and would need to remain as raw operations.

### 1. Database Backup (`db.backup()`)
- **File**: `routes/admin.ts`
- **Usage**: `await db.backup(filePath)` — creates a point-in-time copy of the database
- **Prisma**: No equivalent. Would need to keep a direct better-sqlite3 connection alongside Prisma for this operation, or switch to file-system copying.

### 2. Database Restore (`ATTACH DATABASE`)
- **File**: `routes/admin.ts`
- **Usage**: `ATTACH DATABASE '...' AS backup_db` then copy data between databases
- **Prisma**: No equivalent. `$executeRaw` cannot run ATTACH DATABASE in Prisma's SQLite driver.

### 3. Schema Introspection (`PRAGMA table_info`)
- **File**: `utils/database.ts`
- **Usage**: Reads column metadata to determine which ALTER TABLE migrations to run
- **Prisma**: Replaced entirely by Prisma Migrate — this is actually a point in Prisma's favor, since migrations would be managed declaratively.

---

## Sync vs Async Migration

This is the highest-risk aspect of adopting Prisma.

### Current Architecture

better-sqlite3 is **synchronous by design**. Every model method and route handler is written as synchronous code:

```typescript
// Current pattern — synchronous
static findById(id: number) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

// Route handler — no async/await needed
router.get('/:id', (req, res) => {
  const user = User.findById(req.params.id);
  res.json(user);
});
```

### After Prisma Migration

Every database call becomes async:

```typescript
// Prisma pattern — async required
static async findById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

// Route handler — must be async
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});
```

### Impact Assessment

| Component | Count | Change Required |
|---|---|---|
| Route handlers | 51 | Add `async` + `await` to every handler |
| Model methods | 54 | Convert all to `async` + return Promises |
| Service methods | 6 (backup-service) | Already partially async, but DB calls need `await` |
| Test files | 20 files, 523 tests | Every `db.prepare()` mock must return Promises; all test assertions need `await` |
| Utility scripts | 8 files | Low priority but still need conversion |

**Risk**: This is not a gradual migration. Because Prisma's SQLite connector cannot share a connection with better-sqlite3, you cannot run both side-by-side. It's an all-or-nothing switch for the data access layer.

**Error surface**: Forgetting a single `await` produces a Promise object instead of data. These bugs may not surface until runtime and can be subtle (e.g., a truthy Promise passing an `if` check).

---

## Recommendation

### Do Not Adopt Prisma Now

The cost-benefit ratio is unfavorable for the current SQLite-based architecture:

1. **70% of queries map cleanly** to Prisma, but the remaining 30% (statistics + SQLite-specific ops) would still require raw SQL, negating much of the type-safety benefit.
2. **The sync-to-async migration** touches every file in the backend (51 route handlers, 54 model methods, 523 tests). This is a multi-day effort with high regression risk.
3. **SQLite-specific features** (backup/restore) are core admin functionality that cannot be expressed in Prisma.
4. **Prisma's SQLite support** is the least mature of its database connectors — no native Boolean type, no CHECK constraints, limited migration support for ALTER TABLE.

### Recommended Path Forward

1. **Now**: Implement a custom migration runner ([#88](https://github.com/DamageLabs/whiskey-canon/issues/88)) to replace the current ALTER TABLE blocks in `database.ts`. This addresses the immediate schema management need.
2. **If migrating to PostgreSQL** ([#68](https://github.com/DamageLabs/whiskey-canon/issues/68)): Re-evaluate Prisma at that point. The async penalty is inherent with any PostgreSQL driver (pg, Prisma, Drizzle), and Prisma's PostgreSQL support is mature with proper Boolean types, CHECK constraints, and native migration tooling.
3. **Alternative to consider**: [Drizzle ORM](https://orm.drizzle.team/) supports better-sqlite3 directly with synchronous queries, avoiding the async migration burden entirely. Worth evaluating if type-safe queries are the primary goal.
