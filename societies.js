const express = require('express');
const router = express.Router();
const pool = require('../Models/db'); // Ensure pool is imported from db.js
//const pool = require('../config/db'); // Adjust the path to your db.js file


// List all societies
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM society'); // Use pool.execute directly
   // console.log('Database Result:', rows); // Log the result to verify the structure
    res.render('societies', { title: 'List of Societies', Societies: rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving societies');
  }
});


// Add new society

// Route to render 'add society' form
router.get('/add', (req, res) => {
  res.render('addSociety', { title: 'Add Society',adminEmail: req.session.user.email });
});


router.post('/add', async (req, res) => {
  const { society_id, society_name, society_description,president } = req.body;
  try {
    const query = 'INSERT INTO society (society_id, society_name, society_description,president) VALUES (?, ?, ?,?)';
    await pool.execute(query, [society_id, society_name, society_description, president]);
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding society');
  }
});



// Edit Society 
router.get('/:id/edit', async (req, res) => {
  const society_id = req.params.id;
  try {
    // Fetch the society details from the database
    const query = 'SELECT * FROM society WHERE society_id = ?';
    const [rows] = await pool.execute(query, [society_id]);

    if (rows.length === 0) {
      return res.status(404).send('Society not found');
    }

    // Render the edit form with the society data
    const society = rows[0]; // Assuming only one society is returned
    res.render('editSociety', { society, title: 'Edit Society' });
  } catch (error) {
    console.error('Error fetching society:', error);
    res.status(500).send('Error retrieving society details');
  }
});

// Edit Society (POST route)
router.post('/:id/edit', async (req, res) => {
  const { society_name, society_description, president } = req.body;
  const society_id = req.params.id;

  try {
    // Correct order of parameters for the UPDATE query
    const query = 'UPDATE society SET society_name = ?, society_description = ?, president = ? WHERE society_id = ?';
    await pool.execute(query, [society_name, society_description, president, society_id]); // Move `society_id` to the end
    res.redirect('/admin');
  } catch (error) {
    console.error('Error updating society:', error);
    res.status(500).send('Error updating society');
  }
});




// Delete Society
router.get('/delete/:id', async (req, res) => {
  const society_id = req.params.id;
  try {
    const query = 'DELETE FROM society WHERE society_id = ?';
    await pool.execute(query, [society_id]);
    res.redirect('/societies');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting society');
  }
});

// Delete Society route
router.post('/delete/:id', async (req, res) => {
  const society_id = req.params.id;
  try {
    const query = 'DELETE FROM society WHERE society_id = ?';
    const [result] = await pool.execute(query, [society_id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Society not found');
    }

    res.redirect('/admin'); // Redirect to societies list after deletion
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting society');
  }
});



module.exports = router;
