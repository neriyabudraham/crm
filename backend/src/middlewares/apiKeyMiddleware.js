const crypto = require('crypto');
const db = require('../config/db');

// hashing helper - sha256
const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// in-memory rate limit (per key, last 60s)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60; // 60 requests/min/key

const apiKeyAuth = async (req, res, next) => {
    const key = req.headers['x-api-key'] || req.query.api_key;
    if (!key) return res.status(401).json({ error: 'X-API-Key header חסר' });

    try {
        const keyHash = hashKey(key);
        const r = await db.query(
            'SELECT id, account_id, name, permissions, is_active FROM api_keys WHERE key_hash = $1',
            [keyHash]
        );
        const apiKey = r.rows[0];
        if (!apiKey) return res.status(401).json({ error: 'API key לא תקין' });
        if (!apiKey.is_active) return res.status(403).json({ error: 'API key חסום' });

        // rate limit
        const now = Date.now();
        const bucket = rateLimitMap.get(apiKey.id) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
        if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + RATE_LIMIT_WINDOW_MS; }
        bucket.count++;
        rateLimitMap.set(apiKey.id, bucket);
        if (bucket.count > RATE_LIMIT_MAX) {
            res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
            return res.status(429).json({ error: 'יותר מדי בקשות, נסה שוב בעוד דקה' });
        }
        res.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_MAX - bucket.count)));

        // אסינכרוני, לא חוסם
        db.query('UPDATE api_keys SET last_used = NOW(), request_count = request_count + 1 WHERE id = $1', [apiKey.id])
            .catch(err => console.error('api_key usage update failed:', err.message));

        req.accountId = apiKey.account_id;
        req.apiKeyId = apiKey.id;
        req.apiKeyPermissions = apiKey.permissions;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { apiKeyAuth, hashKey };
