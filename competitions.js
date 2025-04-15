const express = require('express');
const router = express.Router();
const pool = require('../Models/db');

// List all competitions
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM competition');
    res.render('competitions', { title: 'List of Competitions', competitions: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching competitions');
  }
});

// Add new competition
router.get('/add', (req, res) => {
  res.render('addcompetition', { title: 'Add Competition',error:null, adminEmail: req.session.user.email });
});

router.post('/add', async (req, res) => {
  const { competition_id, competition_name, competition_description, competition_date, competition_fee, competition_time, event_event_id } = req.body;

  // Validate parameters
  if (!competition_id || !competition_name || !competition_description || !competition_date || !competition_fee || !competition_time || !event_event_id) {
    return res.status(400).send('All fields are required');
  }

  try {
    // Check if the foreign key exists in the event table
    const [eventExists] = await pool.execute('SELECT 1 FROM event WHERE event_id = ?', [event_event_id]);
    if (eventExists.length === 0) {
      let error= 'The Event with the given ID does not exist.';
      return res.render('addcompetition', { title: 'Add Competition',error,adminEmail: req.session.user.email });

      // return res.status(400).send('Invalid event ID: Event does not exist');
    }

    // Insert the competition into the database
    const query = `
      INSERT INTO competition (competition_id, competition_date, competition_name, competition_fee, competition_time, competition_description, event_event_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [competition_id, competition_date, competition_name, competition_fee, competition_time, competition_description, event_event_id]);
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding competition');
  }
});

// Edit Competition
router.get('/:id/edit', async (req, res) => {
  const competition_id = req.params.id;

  try {
    const [rows] = await pool.execute('SELECT * FROM competition WHERE competition_id = ?', [competition_id]);
    if (rows.length === 0) {
      return res.status(404).send('Competition not found');
    }
    res.render('editCompetition', { title: 'Edit Competition', competition: rows[0],error: null,adminEmail: req.session.user.email });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching competition details');
  }
});

router.post('/:id/edit', async (req, res) => {
  const { competition_name, competition_description, competition_date, competition_fee, competition_time, event_event_id } = req.body;
  const competition_id = req.params.id;

  // Validate parameters
  if (!competition_name || !competition_description || !competition_date || !competition_fee || !competition_time || !event_event_id) {
    return res.status(400).send('All fields are required');
  }

  try {
    // Check if the foreign key exists in the event table
    const [eventExists] = await pool.execute('SELECT 1 FROM event WHERE event_id = ?', [event_event_id]);
    if (eventExists.length === 0) {
      let error= 'The Event with the given ID does not exist.';
      return res.render('addcompetition', { title: 'Add Competition',error,adminEmail: req.session.user.email });
 }

    // Update the competition in the database
    const query = `
      UPDATE competition 
      SET competition_name = ?, competition_description = ?, competition_date = ?, competition_fee = ?, competition_time = ?, event_event_id = ? 
      WHERE competition_id = ?
    `;
    await pool.execute(query, [competition_name, competition_description, competition_date, competition_fee, competition_time, event_event_id, competition_id]);
    res.redirect('/competitions');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating competition');
  }
});

// Delete Competition
router.get('/delete/:id', async (req, res) => {
  const competition_id = req.params.id;
  
  if (!competition_id) {
    return res.status(400).send('Competition ID is required');
  }

  try {
    const query = 'DELETE FROM competition WHERE competition_id = ?';
    await pool.execute(query, [competition_id]);
    res.redirect('/competitions');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting competition');
  }
});

router.post('/delete/:id', async (req, res) => {
  const competition_id = req.params.id;
  try {
    const query = 'DELETE FROM competition WHERE competition_id = ?';
    const [result] = await pool.execute(query, [competition_id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Competition not found');
    }

    res.redirect('/competitions'); // Redirect to competitions list after deletion
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting competition');
  }
});

module.exports = router;
