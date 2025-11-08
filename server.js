require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
    console.warn('No OPENWEATHER_API_KEY found in environment. Create a .env file with OPENWEATHER_API_KEY=your_key');
}

// Serve static files (index.html + assets) from the current directory
app.use(express.static(path.join(__dirname, '.')));

// Simple proxy endpoint: /forecast?lat=...&lon=...
app.get('/forecast', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon query parameter.' });
    }
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server not configured with OpenWeather API key.' });
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&appid=${API_KEY}`;
        const r = await fetch(url);
        const text = await r.text();
        if (!r.ok) {
            try {
                return res.status(r.status).json(JSON.parse(text));
            } catch {
                return res.status(r.status).send(text);
            }
        }
        const data = JSON.parse(text);
        return res.json(data);
    } catch (err) {
        console.error('Proxy error:', err);
        return res.status(502).json({ error: 'Failed to fetch from OpenWeatherMap', details: err.message });
    }
});

// Fallback to index.html for SPA routing (works reliably)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
