const express = require('express');
const router = express.Router();
const { getConnection } = require('../Models/db');

// List all teams
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM Teams');
    res.render('teams', { title: 'Teams', Teams: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving teams');
  } finally {
    if (connection) connection.release();
  }
});

// Add new team
router.post('/add', async (req, res) => {
  const { team_id, team_name, society_id } = req.body;
  let connection;
  try {
    connection = await getConnection();
    const query = 'INSERT INTO Teams (team_id, team_name, society_id) VALUES (?, ?, ?)';
    await connection.execute(query, [team_id, team_name, society_id]);
    res.redirect('/teams');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding team');
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
