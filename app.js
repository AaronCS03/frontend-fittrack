const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

const API_BASE = 'https://backend-fittrack-k1ps.onrender.com';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.all('/api/*', async (req, res) => {
  const targetPath = req.path.replace(/^\/api/, '');
  const targetUrl = `${API_BASE}${targetPath}`;

  try {
    const forwardHeaders = { 'Content-Type': 'application/json' };
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = req.headers['authorization'];
    }

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const apiResponse = await fetch(targetUrl, fetchOptions);
    const text = await apiResponse.text();

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
