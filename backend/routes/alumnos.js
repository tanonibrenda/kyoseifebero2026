const express = require("express");
const router = express.Router();
const db = require("../db");

// Ruta para registrar un nuevo alumno
router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, edad, pais, email, whatsapp, curso, pago } = req.body;

    const query = `
      INSERT INTO alumnos (nombre, apellido, edad, pais, email, whatsapp, curso, metodo_pago)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [nombre, apellido, edad, pais, email, whatsapp, curso, pago]);

    res.status(200).json({ mensaje: "Alumno registrado correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar alumno." });
  }
});

// 🔥 Ruta para obtener la lista de alumnos (SEPARADA del POST)
router.get("/", async (req, res) => {
  try {
    const [alumnos] = await db.execute("SELECT * FROM alumnos ORDER BY fecha DESC");
    res.status(200).json(alumnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la lista de alumnos." });
  }
});

module.exports = router;