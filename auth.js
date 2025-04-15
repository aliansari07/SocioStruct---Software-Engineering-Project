const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../Models/user');
const AdminEmail = require('../Models/adminEmail');

const router = express.Router();

module.exports = (req, res, next) => {
  if (req.session && req.session.user) {
      return next();
  }
  res.redirect('/login');
};


// Signup route
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Signup', message: null }); // Render signup.ejs with null message by default
});


// POST Signup route
router.post('/signup', async (req, res) => {
  const { username, password, email, role } = req.body;

  // Regex to validate the email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check if the email format is valid
  if (!emailRegex.test(email)) {
    // req.flash('error_msg', 'Invalid email format');
    
    return res.render('signup', { error_msg: 'Invalid email format' });
  }

  try {
    // Check if the email already exists
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      // req.flash('error_msg', 'Email already registered');
      
      return res.render('signup', { error_msg: 'Email is already registered!' });
    }

    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      // req.flash('error_msg', 'Username already taken');
      return res.render('signup', { error_msg: 'Username already taken' });
   
    }

    // If the role is 'admin', validate the email against the admin email list
    if (role === 'admin') {
      const allowedAdmin = await AdminEmail.findOne({ where: { email } });
      if (!allowedAdmin) {
        // req.flash('error_msg', 'You are not authorized to sign up as an admin.');
        return res.render('signup', { error_msg: 'You are not authorized to sign up as an admin.' });
   
      }
    }

    
     
    const user = await User.create({ username, password, email, role });

    // req.flash('success_msg', 'Signup successful! Please log in.');
    return res.render('signup', { success_msg: 'Signup successful! Please log in.' });
  } catch (error) {
    console.error(error);
    // req.flash('error_msg', 'An error occurred during signup.');
    return res.render('signup', { error_msg: 'An error occurred during signup.' });
   
  }
});






// Login route
router.get('/login', (req, res) => {
  // const error = req.flash('error_msg'); // Fetch any error messages
  // const success = req.flash('success_msg'); // Fetch any success messages
  res.render('login', { title: 'Login', error: null}); // Pass messages to login.ejs
});

// POST Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let error = null;

  try {
      // Check if the email exists
      const user = await User.findOne({ where: { email } });

      if (!user) {
          // Email doesn't exist
          error = 'Invalid email.';
          return res.render('login', { error });
      }

      const isPasswordValid = user.comparePassword(password);
      if (!isPasswordValid) {
          // Password doesn't match
          error = 'Invalid password.';
          return res.render('login', { error });
      }
      
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
  
      // Redirect based on role
      if (user.role === 'admin') {
        return res.redirect('/admin'); // Admin page route
      } else {
        return res.redirect('/'); // Default dashboard for other roles
      }
       
      // req.session.user = user;
      // // If everything is valid, proceed with login
      // req.flash('success_msg', 'Login successful!');
      // res.redirect('/'); // Redirect to the homepage or dashboard
  } catch (err) {
      console.error(err);
      error = 'An error occurred during login.';
      res.render('login', { error });
  }
});



// Logout route
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
  });
});

module.exports = router;
