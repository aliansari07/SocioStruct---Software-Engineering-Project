const express = require('express');
const router = express.Router();
// const isAuthenticated = require('../middlewares/auth');
const { getConnection } = require('../config/db');

// router.use(isAuthenticated);
// Dashboard route, protected by isAuthenticated middleware

// Route to fetch societies
router.get('/', async (req, res) => {
  try {
    const connection = await getConnection();
    const [societies] = await connection.promise().query('SELECT * FROM society');  // Query the societies table
    connection.release();  // Release the connection back to the pool
    
    
    res.render('dashboard', { societies }); // Pass data to the template
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching societies');
  }
});


module.exports = router;
