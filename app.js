const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// URL del backend — el proxy hace las llamadas server-to-server (sin CORS)
const API_BASE = 'http://localhost:3000';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ──────────────────────────────────────────────
   PROXY DE API  — /api/* → http://localhost:3000/*
   El browser llama a :8080/api/...  (mismo origen, sin CORS)
   El servidor Express lo reenvía a :3000/...   (server-to-server)
   ────────────────────────────────────────────── */
app.all('/api/*', async (req, res) => {
  // Quita el prefijo /api del path
  const targetPath = req.path.replace(/^\/api/, '');
  const targetUrl = `${API_BASE}${targetPath}`;

  try {
    // Construir headers a reenviar (Authorization, Content-Type, etc.)
    const forwardHeaders = { 'Content-Type': 'application/json' };
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = req.headers['authorization'];
    }

    // Opciones del fetch server-side
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    // Reenviar body en POST / PUT / PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const apiResponse = await fetch(targetUrl, fetchOptions);
    const text = await apiResponse.text();

    // Reenviar el status y body de vuelta al cliente
    res.status(apiResponse.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);

  } catch (err) {
    console.error(`[Proxy Error] ${req.method} ${targetUrl}:`, err.message);
    res.status(502).json({
      error: 'Bad Gateway',
      message: `No se pudo conectar al backend en ${API_BASE}. ¿Está corriendo?`,
      detail: err.message
    });
  }
});

/* ──────────────────────────────────────────────
   RUTAS DE VISTAS  (EJS pages)
   ────────────────────────────────────────────── */

// El frontend JS usará /api como base — mismo origen, sin CORS
const CLIENT_API_BASE = '/api';

app.get('/', (req, res) => {
  res.render('index', { API_BASE: CLIENT_API_BASE, title: 'Dashboard' });
});

app.get('/activities/create', (req, res) => {
  res.render('create', { API_BASE: CLIENT_API_BASE, title: 'Create Activity' });
});

app.get('/activities/edit/:id', (req, res) => {
  res.render('edit', { API_BASE: CLIENT_API_BASE, title: 'Edit Activity', activityId: req.params.id });
});

app.get('/activities/:id', (req, res) => {
  res.render('details', { API_BASE: CLIENT_API_BASE, title: 'Activity Details', activityId: req.params.id });
});

app.listen(PORT, () => {
  console.log(`\n✅ FitTrack frontend → http://localhost:${PORT}`);
  console.log(`🔀 API proxy activo: /api/* → ${API_BASE}/*\n`);
});
