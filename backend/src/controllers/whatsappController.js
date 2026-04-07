const axios = require('axios');

exports.getGroups = async (req, res) => {
    const { session } = req.query;
    if (!session) return res.status(400).json({ error: "Session name is required" });

    try {
        const response = await axios.get(`${process.env.WA_BASE_URL}/${encodeURIComponent(session)}/groups`, {
            headers: { 'X-Api-Key': process.env.WA_API_KEY }
        });
        
        // החזרת הנתונים בפורמט שביקשת
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch groups from WhatsApp API" });
    }
};
