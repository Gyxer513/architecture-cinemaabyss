const express = require('express');
const fetch = require('node-fetch');
const { pipeline } = require('stream');
const { promisify } = require('util');

const PORT = process.env.PORT || 8000;
const MOVIES_MIGRATION_PERCENT = parseInt(process.env.MOVIES_MIGRATION_PERCENT || "0", 10);
const MONOLITH_URL = process.env.MONOLITH_URL || "http://monolith:8080";
const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || "http://movies-service:8081";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function chooseMoviesBackend() {
    return Math.random() * 100 < MOVIES_MIGRATION_PERCENT
        ? MOVIES_SERVICE_URL : MONOLITH_URL;
}

// Health-check (Postman ждёт ровно этот путь!)
app.get('/health', (req, res) => {
    res.status(200).json({ status: true });
});

// Прокси для /api/movies с gradual migration (strangler fig)
app.all('/api/movies*', async (req, res) => {
    const target = chooseMoviesBackend();
    const url = target + req.originalUrl;
    console.log(`[proxy] ${req.method} /api/movies* → ${url}`);

    try {
        let body = undefined;
        if (req.method !== "GET" && req.method !== "HEAD") {
            if (req.is('application/json')) body = JSON.stringify(req.body);
            else if (req.is('application/x-www-form-urlencoded')) body = new URLSearchParams(req.body).toString();
        }

        const options = {
            method: req.method,
            headers: { ...req.headers, host: undefined },
            body
        };
        if (!body && req.method !== "GET" && req.method !== "HEAD") {
            options.body = req;
        }

        const proxyRes = await fetch(url, options);
        res.status(proxyRes.status);
        proxyRes.headers.forEach((value, key) => {
            if (key.toLowerCase() !== "transfer-encoding") res.setHeader(key, value);
        });
        await promisify(pipeline)(proxyRes.body, res);
    } catch (err) {
        res.status(502).json({ error: "Proxy error", details: err.message });
    }
});

// Прокси для всех /api/* (например, /api/users) — чисто на монолит!
app.all('/api/*', async (req, res) => {
    const url = MONOLITH_URL + req.originalUrl;
    console.log(`[proxy] ${req.method} ${req.originalUrl} → ${url}`);
    try {
        let body = undefined;
        if (req.method !== "GET" && req.method !== "HEAD") {
            if (req.is('application/json')) body = JSON.stringify(req.body);
            else if (req.is('application/x-www-form-urlencoded')) body = new URLSearchParams(req.body).toString();
        }
        const options = {
            method: req.method,
            headers: { ...req.headers, host: undefined },
            body
        };
        if (!body && req.method !== "GET" && req.method !== "HEAD") {
            options.body = req;
        }
        const proxyRes = await fetch(url, options);
        res.status(proxyRes.status);
        proxyRes.headers.forEach((value, key) => {
            if (key.toLowerCase() !== "transfer-encoding") res.setHeader(key, value);
        });
        await promisify(pipeline)(proxyRes.body, res);
    } catch (err) {
        res.status(502).json({ error: "Proxy error", details: err.message });
    }
});

// На корне просто описание (для удобства)
app.get("/", (req, res) => {
    res.send('Proxy service is running (Node.js)');
});

app.listen(PORT, () => {
    console.log(`[proxy] Listening on port ${PORT}`);
    console.log(`[proxy] MOVIES_MIGRATION_PERCENT: ${MOVIES_MIGRATION_PERCENT}`);
});
