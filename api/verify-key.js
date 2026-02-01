// Vercel serverless function for verifying keys
let keyStorage = {}; // Same as above - should be a shared module in production

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { key } = req.body;
        
        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'Invalid key' });
        }
        
        // Extract user ID from key
        const parts = key.split('-');
        if (parts.length < 3) {
            return res.json({ valid: false, reason: 'Invalid key format' });
        }
        
        const userId = parseInt(parts[0]);
        
        // Check if key exists and is valid
        const userKeyData = keyStorage[userId];
        const now = Date.now();
        
        if (!userKeyData) {
            return res.json({ valid: false, reason: 'No key found for this user' });
        }
        
        if (userKeyData.key !== key) {
            return res.json({ valid: false, reason: 'Key mismatch' });
        }
        
        if (userKeyData.expiresAt < now) {
            return res.json({ valid: false, reason: 'Key expired' });
        }
        
        // Key is valid
        const timeLeft = Math.floor((userKeyData.expiresAt - now) / 1000);
        
        res.json({
            valid: true,
            userId: userId,
            timeLeft: timeLeft,
            expiresAt: userKeyData.expiresAt
        });
        
    } catch (error) {
        console.error('Error verifying key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
