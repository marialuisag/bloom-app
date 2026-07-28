require('dotenv').config();
const pool = require('../db');

// Datos de prueba (ficticios) para poder ver la API funcionando con contenido real.
// El dominio "@bloom.test" está reservado para pruebas (RFC 2606) y nunca resuelve a
// una casilla real.
const usuariosFake = [
  { nombre: 'Usuario Demo Uno', email: 'demo1@bloom.test' },
  { nombre: 'Usuario Demo Dos', email: 'demo2@bloom.test' },
  { nombre: 'Usuario Demo Tres', email: 'demo3@bloom.test' },
];

const habitosPorEmail = {
  'demo1@bloom.test': [
    { nombre: 'Orar 10 minutos', descripcion: 'Momento breve de oración al despertar' },
    { nombre: 'Sin pantallas antes de dormir', descripcion: 'Dejar el celular 30 minutos antes de dormir' },
  ],
  'demo2@bloom.test': [
    { nombre: 'Leer 20 minutos', descripcion: 'Lectura en papel o e-reader, no celular' },
  ],
  'demo3@bloom.test': [
    { nombre: 'Caminar 15 minutos', descripcion: 'Pausa activa sin celular' },
    { nombre: 'Journaling', descripcion: 'Reflexión breve sobre el uso del tiempo del día' },
  ],
};

async function seed() {
  for (const usuario of usuariosFake) {
    const { rows: usuarioRows } = await pool.query(
      `INSERT INTO usuarios (nombre, email) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id`,
      [usuario.nombre, usuario.email]
    );
    const usuarioId = usuarioRows[0].id;

    for (const habito of habitosPorEmail[usuario.email] || []) {
      const { rows: habitoRows } = await pool.query(
        `INSERT INTO habitos (usuario_id, nombre, descripcion)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [usuarioId, habito.nombre, habito.descripcion]
      );
      const habitoId = habitoRows[0].id;

      // Registros ficticios de los últimos 5 días, alternando completado/no completado.
      for (let i = 0; i < 5; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const completado = i % 2 === 0;
        await pool.query(
          `INSERT INTO registros (habito_id, fecha, completado)
           VALUES ($1, $2, $3)
           ON CONFLICT (habito_id, fecha) DO UPDATE SET completado = EXCLUDED.completado`,
          [habitoId, fecha.toISOString().slice(0, 10), completado]
        );
      }
    }
  }

  console.log('Usuarios, hábitos y registros de prueba insertados correctamente.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Error al sembrar datos:', err.message);
  process.exit(1);
});
