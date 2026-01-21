const router = require('express').Router();
const axios = require('axios');


let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

router.get('/coins', async (req, res) => {
    try {
        const currentTime = Date.now();

        
        if (cachedData && (currentTime - lastFetchTime < CACHE_DURATION)) {
            
            return res.json(cachedData);
        }

        
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=100&page=1&sparkline=true',
            { timeout: 10000 } 
        );

        
        cachedData = response.data;
        lastFetchTime = currentTime;

        res.json(cachedData);

    } catch (err) {
        console.error("CoinGecko API Error:", err.message);
        
        
        if (cachedData) {
            console.log("Serving stale cache due to API error");
            return res.json(cachedData);
        }

        
        res.status(500).json({ error: "Failed to fetch coins" });
    }
});

module.exports = router;