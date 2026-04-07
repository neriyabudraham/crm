-- Multi-user accounts: allow multiple emails to access one workspace
-- Date: 2026-04-07

CREATE TABLE IF NOT EXISTS account_members (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    invited_by INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_account_members_user_email ON account_members(user_email);
CREATE INDEX IF NOT EXISTS idx_account_members_account_id ON account_members(account_id);

-- Backfill: every existing account becomes its own owner-member
INSERT INTO account_members (account_id, user_email, role)
SELECT id, LOWER(email), 'owner' FROM accounts
ON CONFLICT (account_id, user_email) DO NOTHING;
