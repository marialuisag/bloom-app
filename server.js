require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, creado_en FROM usuarios ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { nombre, email } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ status: 'error', message: 'nombre y email son obligatorios' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING id, nombre, email, creado_en',
      [nombre, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Ya existe una cuenta con ese email' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/habitos', async (req, res) => {
  const { usuario_id } = req.query;
  try {
    const result = usuario_id
      ? await pool.query('SELECT * FROM habitos WHERE usuario_id = $1 ORDER BY id', [usuario_id])
      : await pool.query('SELECT * FROM habitos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/habitos', async (req, res) => {
  const { usuario_id, nombre, descripcion } = req.body;
  if (!usuario_id || !nombre) {
    return res.status(400).json({ status: 'error', message: 'usuario_id y nombre son obligatorios' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO habitos (usuario_id, nombre, descripcion) VALUES ($1, $2, $3) RETURNING *',
      [usuario_id, nombre, descripcion || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/registros', async (req, res) => {
  const { habito_id } = req.query;
  try {
    const result = habito_id
      ? await pool.query('SELECT * FROM registros WHERE habito_id = $1 ORDER BY fecha DESC', [habito_id])
      : await pool.query('SELECT * FROM registros ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/registros', async (req, res) => {
  const { habito_id, fecha, completado } = req.body;
  if (!habito_id || !fecha) {
    return res.status(400).json({ status: 'error', message: 'habito_id y fecha son obligatorios' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO registros (habito_id, fecha, completado) VALUES ($1, $2, $3)
       ON CONFLICT (habito_id, fecha) DO UPDATE SET completado = EXCLUDED.completado
       RETURNING *`,
      [habito_id, fecha, completado !== undefined ? completado : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bloom corriendo en el puerto ${PORT}`);
});
