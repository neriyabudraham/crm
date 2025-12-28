const axios = require('axios');

const API_KEY = '2e1005a40ef74edda01ffb1ade877fd3';
const BASE_URL = 'https://bot.botomat.co.il/api';

exports.getGroups = async (session) => {
    try {
        const response = await axios.get(`${BASE_URL}/${encodeURIComponent(session)}/groups`, {
            headers: { 'X-Api-Key': API_KEY }
        });
        // מחזירים רק שם ו-JID לשימוש נוח בפרונט
        return response.data.map(g => ({
            id: g.JID,
            name: g.Name || 'קבוצה ללא שם'
        }));
    } catch (err) {
        console.error("WhatsApp API Error:", err.message);
        throw new Error("נכשלה שליפת הקבוצות");
    }
};

exports.sendText = async (session, chatId, text) => {
    try {
        await axios.post(`${BASE_URL}/sendText`, {
            chatId,
            text,
            linkPreview: true,
            session
        }, {
            headers: { 'X-Api-Key': API_KEY }
        });
        return true;
    } catch (err) {
        console.error("WhatsApp Send Error:", err.message);
        return false;
    }
};
