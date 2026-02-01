// Vercel serverless function for generating keys
const fs = require('fs');
const path = require('path');

// In-memory storage (for Vercel serverless - consider using a database for production)
// Note: This resets on server restart. For persistence, use a database or Vercel KV.
let keyStorage = {};

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { userId } = req.body;
        
        if (!userId || typeof userId !== 'string' || isNaN(userId) || parseInt(userId) < 1) {
            return res.status(400).json({ error: 'Invalid User ID' });
        }
        
        const numericUserId = parseInt(userId);
        
        // Check if user has a valid key that's not expired
        const now = Date.now();
        const userKeyData = keyStorage[numericUserId];
        
        if (userKeyData && userKeyData.expiresAt > now) {
            // Return existing valid key
            return res.json({
                key: userKeyData.key,
                generatedAt: userKeyData.generatedAt,
                expiresAt: userKeyData.expiresAt,
                userId: numericUserId,
                message: 'Existing valid key'
            });
        }
        
        // Generate new key
        const timestamp = Math.floor(Date.now() / (10 * 60 * 1000)); // 10-minute blocks
        const hash = require('crypto').createHash('md5')
            .update(`${userId}-${timestamp}-${process.env.SECRET_KEY || 'default-secret'}`)
            .digest('hex')
            .substring(0, 8)
            .toUpperCase();
        
        const key = `${userId}-${timestamp.toString(36).toUpperCase()}-${hash}`;
        
        // Store the key (expires in 10 minutes)
        keyStorage[numericUserId] = {
            key: key,
            generatedAt: now,
            expiresAt: now + (10 * 60 * 1000), // 10 minutes from now
            userId: numericUserId
        };
        
        // Clean up expired keys (optional, to prevent memory buildup)
        for (const storedUserId in keyStorage) {
            if (keyStorage[storedUserId].expiresAt < now) {
                delete keyStorage[storedUserId];
            }
        }
        
        res.json({
            key: key,
            generatedAt: now,
            expiresAt: now + (10 * 60 * 1000),
            userId: numericUserId,
            message: 'New key generated'
        });
        
    } catch (error) {
        console.error('Error generating key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
