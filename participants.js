const express = require('express');
const router = express.Router();
const pool = require('../Models/db');

// Helper function to validate phone number
const validatePhone = (phone) => /^3\d{9}$/.test(phone);

// List all participants
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM comp_part');
    res.render('participants', { title: 'List of Participants', participants: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching participants');
  }
});

// Add new participant
router.get('/add', (req, res) => {
  res.render('addParticipant', { 
    title: 'Add Participants',
    error: null,
    adminEmail: req.session.user ? req.session.user.email : '', // Safe handling for session
    participant_id: '', // Provide default empty value
    participant_name: '',
    participant_phone: '',
    participant_email: '',
    competition_id: ''
  });
});

// Add new participant
router.post('/add', async (req, res) => {
  const { participant_id, participant_name, participant_email, participant_phone, competition_id } = req.body;

  // Validation
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const errors = {};

  if (!emailRegex.test(participant_email)) {
    errors.email = 'Invalid email format';
  }

  if (!validatePhone(participant_phone)) {
    errors.phone = 'Phone number must start with 3 and have 10 digits';
  }

  try {
    // Check for duplicate participant_id
    const [idCheck] = await pool.execute('SELECT * FROM comp_part WHERE participant_id = ?', [participant_id]);
    if (idCheck.length > 0) {
      errors.participant_id = 'Participant ID already exists';
    }

    // Check for duplicate email or phone in the same competition
    const [duplicateCheck] = await pool.execute(
      'SELECT * FROM comp_part WHERE competition_id = ? AND (participant_email = ? OR participant_phone = ?)',
      [competition_id, participant_email, participant_phone]
    );

    if (duplicateCheck.length > 0) {
      errors.duplicate = 'Email or phone number already exists in the same competition';
    }

    if (Object.keys(errors).length > 0) {
      return res.render('addParticipant', {
        title: 'Add Participant',
        error: errors,
        participant_id, // Preserve values for re-render
        participant_name,
        participant_phone,
        participant_email,
        competition_id,
        adminEmail: req.session.user ? req.session.user.email : '',
      });
    }

    const query = `
      INSERT INTO comp_part (participant_id, participant_name, participant_phone, participant_email, competition_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [participant_id, participant_name, participant_phone, participant_email, competition_id]);
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding participant');
  }
});


// Edit participant
router.get('/:id/edit', async (req, res) => {
  const participant_id = req.params.id;

  try {
    const [rows] = await pool.execute('SELECT * FROM comp_part WHERE participant_id = ?', [participant_id]);
    if (rows.length === 0) {
      return res.status(404).send('Participant not found');
    }
    res.render('editParticipant', {
      // title: 'Edit Participant',
      participant: rows[0],
      error: null,
      adminEmail: req.session.user.email
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching participant details');
  }
});

router.post('/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { participant_name, participant_email, participant_phone, competition_id } = req.body;

  // Validation
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const errors = {};

  if (!emailRegex.test(participant_email)) {
    errors.email = 'Invalid email format';
  }

  if (!validatePhone(participant_phone)) {
    errors.phone = 'Phone number must start with 3 and have 10 digits';
  }

  try {
    

    // Check for duplicate email or phone in the same competition, excluding the current participant
    const [duplicateCheck] = await pool.execute(
      'SELECT * FROM comp_part WHERE competition_id = ? AND (participant_email = ? OR participant_phone = ?) AND participant_id != ?',
      [competition_id, participant_email, participant_phone, id]
    );

    if (duplicateCheck.length > 0) {
      errors.duplicate = 'Email or phone number already exists in the same competition';
    }

    if (Object.keys(errors).length > 0) {
      return res.render('editParticipant', {
        title: 'Edit Participant',
        error: errors,
        participant: { participant_id: id, participant_name, participant_email, participant_phone, competition_id },
        adminEmail: req.session.user.email,
      });
    }

    const query = `
      UPDATE comp_part 
      SET participant_name = ?, participant_email = ?, participant_phone = ?, competition_id = ? 
      WHERE participant_id = ?
    `;
    await pool.execute(query, [participant_name, participant_email, participant_phone, competition_id, id]);
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating participant');
  }
});

// Delete participant
router.get('/delete/:id', async (req, res) => {
  const participant_id = req.params.id;

  try {
    const query = 'DELETE FROM comp_part WHERE participant_id = ?';
    const [result] = await pool.execute(query, [participant_id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Participant not found');
    }
    res.redirect('/participants');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting participant');
  }
});

module.exports = router;
