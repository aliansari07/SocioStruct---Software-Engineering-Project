const express = require('express');
const router = express.Router();
const Members = require('../Models/teamMember'); // Import the Members model
const pool = require('../Models/db');
const sequelize = require('../db'); // Import sequelize instance


// Helper function to validate enums
const validateEnum = (value, validValues) => validValues.includes(value);

// Get all team members
router.get('/', async (req, res) => {
  try {
    const teamMembers = await sequelize.query('SELECT * FROM team_member', { type: sequelize.QueryTypes.SELECT });
    res.render('teamMembers', { title: 'Team Members', teamMembers });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error getting team members');
  }
});
// Display the Add Member form
router.get('/add', (req, res) => {
  const validPositions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'General Secretary', 'Event Manager'];
  const validDepartments = [
    'Event Administration',
    'Marketing',
    'Media And Promotions',
    'Guest Relations',
    'Security',
    'SOP',
    'In House Media',
    'Excom',
  ];

  res.render('addMember', {
    adminEmail: req.session.user ? req.session.user.email : '',
    
    title: 'Add Member',
    member_id: '',
    roll_no: '',
    name: '',
    phone: '',
    society_id: '',
    position: '',
    department: '',
    selectedPosition: '', // Default position for the dropdown
    selectedDepartment: '', 
    errors: null,
    validPositions,
    validDepartments,
  });
});

// router.get('/add', (req, res) => {
//   let error=null;
//   res.render('addMember', { title: 'Add Member',error: null, adminEmail: req.session.user.email  });
// });

// Add a new team member
router.post('/add', async (req, res) => {
  const { member_id, roll_no, name, phone, society_id, position, department } = req.body;

  const errors = {};
  const validPositions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'General Secretary', 'Event Manager'];
  const validDepartments = [
    'Event Administration',
    'Marketing',
    'Media And Promotions',
    'Guest Relations',
    'Security',
    'SOP',
    'In House Media',
    'Excom',
  ];

  // Validate fields
  if (!member_id || !roll_no || !name || !phone || !society_id || !position || !department) {
    errors.missingFields = 'All fields are required';
  }
  if (!validateEnum(position, validPositions)) {
    errors.position = `Invalid position. Valid values are: ${validPositions.join(', ')}`;
  }
  if (!validateEnum(department, validDepartments)) {
    errors.department = `Invalid department. Valid values are: ${validDepartments.join(', ')}`;
  }

  if (await Members.findOne({ where: { member_id } })) {
    errors.member_id = 'Member ID already exists';
  }

  if (department === 'Excom') {
    const [existingPosition] = await sequelize.query(
      'SELECT * FROM team_member WHERE department = ? AND position = ?',
      { replacements: ['Excom', position], type: sequelize.QueryTypes.SELECT }
    );
    if (existingPosition) {
      errors.duplicatePosition = `Position "${position}" in department "Excom" is already taken`;
    }
  }

  const [society] = await sequelize.query('SELECT * FROM society WHERE society_id = ?', {
    replacements: [society_id],
    type: sequelize.QueryTypes.SELECT,
  });
  if (!society) {
    errors.society_id = 'Society ID does not exist';
  }

  // If there are errors, re-render the form
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('addMember', {
      title: 'Add Team Member',
      errors,
      member_id,
      roll_no,
      name,
      phone,
      society_id,
      position,
      department,
      adminEmail: req.session.user ? req.session.user.email : '',
      validPositions,
      validDepartments,
      selectedPosition: position || '',  // Default position for the dropdown
      selectedDepartment: department || '',
    });
  }

  try {
    await sequelize.query(
      'INSERT INTO team_member (member_id, roll_no, name, phone, society_id, position, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
      { replacements: [member_id, roll_no, name, phone, society_id, position, department] }
    );
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding team member');
  }
});


// Edit a team member
router.get('/:id/edit', async (req, res) => {
  const { id } = req.params;
  try {
    const [teamMember] = await sequelize.query('SELECT * FROM team_member WHERE member_id = ?', {
      replacements: [id],
      type: sequelize.QueryTypes.SELECT,
    });
    if (!teamMember) {
      return res.status(404).send('Team member not found');
    }
    res.render('editMember', { title: 'Edit Team Member', teamMember, errors: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching team member');
  }
});

router.post('/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { roll_no, name, phone, society_id, position, department } = req.body;

  const errors = {};
  const validPositions = ['President', 'Vice President', 'Secretary', 'Treasurer','General Secretary','Event Maneger'];
  const validDepartments = ['Event Administration', 'Marketing', 'Media And promotions', 'Guest Relations','Secuity','SOP','In House Media','Excom'];

  // Validate fields
  if (!roll_no || !name || !phone || !society_id || !position || !department) {
    errors.missingFields = 'All fields are required';
  }
  if (!validateEnum(position, validPositions)) {
    errors.position = 'Invalid position. Valid values are: ' + validPositions.join(', ');
  }
  if (!validateEnum(department, validDepartments)) {
    errors.department = 'Invalid department. Valid values are: ' + validDepartments.join(', ');
  }
  const [society] = await sequelize.query('SELECT * FROM societies WHERE society_id = ?', {
    replacements: [society_id],
    type: sequelize.QueryTypes.SELECT,
  });
  if (!society) {
    errors.society_id = 'Society ID does not exist';
  }

  // If there are errors, re-render the form
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('editMember', { title: 'Edit Team Member', errors, teamMember: { id, roll_no, name, phone, society_id, position, department } });
  }

  try {
    await sequelize.query(
      'UPDATE team_member SET roll_no = ?, name = ?, phone = ?, society_id = ?, position = ?, department = ? WHERE member_id = ?',
      { replacements: [roll_no, name, phone, society_id, position, department, id] }
    );
    res.redirect('/teamMembers');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating team member');
  }
});

module.exports = router;
