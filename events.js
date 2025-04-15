const express = require('express');
const router = express.Router();
const pool = require('../Models/db'); // Ensure pool is imported from db.js

// List all events
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM event'); // Use pool.execute directly
    res.render('events', { title: 'List of Events', Events: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving events');
  }
});

// Add new event
// Route to render 'add event' form
router.get('/add', (req, res) => {
  let error=null;
  res.render('addEvent', { title: 'Add Event',error: null });
});

router.post('/add', async (req, res) => {
  const { event_id, event_name, event_date, event_fee, event_description, society_sid } = req.body;
  
  
  try {

      // Check if the society_id exists in the society table
      const [societyRows] = await pool.execute('SELECT * FROM society WHERE society_id = ?', [society_sid]);
      
      if (societyRows.length === 0) {
        
        let error= 'The Society with the given ID does not exist.';
       return res.render('addEvent', { title: 'Add Event',error });

      // let error = 'Invalid email.';
      // return res.render('login', { error });
    }
    const query = 'INSERT INTO event (event_id, event_name, event_date, event_fee, event_description, society_sid) VALUES (?, ?, ?, ?, ?, ?)';
    await pool.execute(query, [event_id, event_name, event_date, event_fee, event_description, society_sid]);
    res.redirect('/admin'); // Redirect to events list after adding
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding event');
  }
});

// Edit Event
router.get('/:id/edit', async (req, res) => {
  const event_id = req.params.id;
  try {
    // Fetch the event details from the database
    const query = 'SELECT * FROM event WHERE event_id = ?';
    const [rows] = await pool.execute(query, [event_id]);

    if (rows.length === 0) {
      return res.status(404).send('Event not found');
    }

    // Render the edit form with the event data
    const event = rows[0]; // Assuming only one event is returned
    
    res.render('editEvent', { event, title: 'Edit Event',error: null});
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).send('Error retrieving event details');
  }
});

// Edit Event (POST route)
router.post('/:id/edit', async (req, res) => {
  const { event_name, event_date, event_fee, event_description, society_sid } = req.body;
  const event_id = req.params.id;

  try {
    const [societyRows] = await pool.execute('SELECT * FROM society WHERE society_id = ?', [society_sid]);

    if (societyRows.length === 0) {
      const error = 'The Society with the given ID does not exist.';
      // Pass the error and event data back to the view
      return res.render('editEvent', { error, event: req.body, title: 'Edit Event' });
    }

    const query = 'UPDATE event SET event_name = ?, event_date = ?, event_fee = ?, event_description = ?, society_sid = ? WHERE event_id = ?';
    await pool.execute(query, [event_name, event_date, event_fee, event_description, society_sid, event_id]);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).send('Error updating event');
  }
});



// Delete Event
router.get('/delete/:id', async (req, res) => {
  const event_id = req.params.id;
  try {
    const query = 'DELETE FROM event WHERE event_id = ?';
    await pool.execute(query, [event_id]);
    res.redirect('/admin/events');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting event');
  }
});

// Delete Event route (using POST for better practice)
router.post('/delete/:id', async (req, res) => {
  const event_id = req.params.id;
  try {
    const query = 'DELETE FROM event WHERE event_id = ?';
    const [result] = await pool.execute(query, [event_id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Event not found');
    }

    res.redirect('/admin/events'); // Redirect to events list after deletion
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting event');
  }
});

module.exports = router;
