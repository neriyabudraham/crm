-- Multi-tenant isolation fixes
-- Date: 2026-04-07

-- 1. Backfill system_settings.account_id to the first account
UPDATE system_settings SET account_id = 1 WHERE account_id IS NULL;

-- 2. Make system_settings PK on (key, account_id) instead of just (key)
ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE system_settings ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE system_settings ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key, account_id);

-- 3. Make users.username unique per account, not globally
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users ADD CONSTRAINT users_username_account_key UNIQUE (username, account_id);

-- 4. Add account_id to statuses (was missing)
ALTER TABLE statuses ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE;
UPDATE statuses SET account_id = 1 WHERE account_id IS NULL;

-- 5. Add account_id to client_courses (via FK to clients/courses, but useful for direct queries)
-- Skipping: client_courses inherits scope through joins.

-- 6. Add account_id to signed_documents
ALTER TABLE signed_documents ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE;
UPDATE signed_documents sd SET account_id = c.account_id FROM clients c WHERE sd.client_id = c.id AND sd.account_id IS NULL;

-- 7. Add account_id to questionnaire_sessions and signing_sessions for direct lookups
ALTER TABLE questionnaire_sessions ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE;
UPDATE questionnaire_sessions qs SET account_id = q.account_id FROM questionnaires q WHERE qs.questionnaire_id = q.id AND qs.account_id IS NULL;

ALTER TABLE signing_sessions ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE;
UPDATE signing_sessions ss SET account_id = c.account_id FROM clients c WHERE ss.client_id = c.id AND ss.account_id IS NULL;
