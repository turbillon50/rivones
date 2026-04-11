import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info("Running schema migrations...");

    await client.query("BEGIN");

    // ── cars table ─────────────────────────────────────────────────────────

    // Rename price → price_per_day (if old column exists and new one doesn't)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='price')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='price_per_day')
        THEN
          ALTER TABLE cars RENAME COLUMN price TO price_per_day;
        END IF;
      END $$;
    `);

    // Ensure price_per_day exists with a default if somehow missing
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_per_day NUMERIC(10,2) NOT NULL DEFAULT 0;
    `);

    // deposit_amount
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
    `);

    // Rename seller → host (if old column exists and new one doesn't)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='seller')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='host')
        THEN
          ALTER TABLE cars RENAME COLUMN seller TO host;
        END IF;
      END $$;
    `);

    // Ensure host exists as jsonb
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS host JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);

    // features (new)
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);

    // instant_book
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS instant_book BOOLEAN NOT NULL DEFAULT true;
    `);

    // delivery_available
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN NOT NULL DEFAULT false;
    `);

    // delivery_fee
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(8,2);
    `);

    // min_days / max_days
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS min_days INTEGER NOT NULL DEFAULT 1;
    `);
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS max_days INTEGER NOT NULL DEFAULT 30;
    `);

    // mileage_limit
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS mileage_limit INTEGER;
    `);

    // fuel_policy
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_policy TEXT NOT NULL DEFAULT 'full_to_full';
    `);

    // cleaning_fee
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC(8,2) NOT NULL DEFAULT 0;
    `);

    // rating / review_count / trips_count
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) NOT NULL DEFAULT 5.0;
    `);
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;
    `);
    await client.query(`
      ALTER TABLE cars ADD COLUMN IF NOT EXISTS trips_count INTEGER NOT NULL DEFAULT 0;
    `);

    // ── bookings table ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id          SERIAL PRIMARY KEY,
        car_id      INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
        renter_id   TEXT NOT NULL DEFAULT 'guest',
        start_date  TEXT NOT NULL,
        end_date    TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending',
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        base_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
        service_fee  NUMERIC(12,2) NOT NULL DEFAULT 0,
        cleaning_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
        insurance_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
        delivery_fee  NUMERIC(12,2) NOT NULL DEFAULT 0,
        days         INTEGER NOT NULL DEFAULT 1,
        insurance_added   BOOLEAN NOT NULL DEFAULT false,
        delivery_requested BOOLEAN NOT NULL DEFAULT false,
        notes        TEXT,
        renter_name  TEXT,
        renter_phone TEXT,
        renter_email TEXT,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query("COMMIT");
    logger.info("Schema migrations complete");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err }, "Migration failed — rolling back");
    throw err;
  } finally {
    client.release();
  }
}
