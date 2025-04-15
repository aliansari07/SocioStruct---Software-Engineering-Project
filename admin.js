const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middlewares/auth');
const Society = require('../Models/societies');
const Event = require('../Models/events');
// const Competition = require('../Models/competition');
const Competition = require('../Models/Competition');
const Participant = require('../Models/participants');
const attendees = require('../Models/attendees');
const Members = require('../Models/teamMember');

// Middleware to ensure the user is an admin
function ensureAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Access denied. Admins only!');
}

// Admin Dashboard
router.get('/', ensureAuthenticated, ensureAdmin, (req, res) => {
  res.render('adminPortal', { adminEmail: req.session.user.email });
});

// Society Routes
router.get('/society', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // Fetch societies and map them for easier rendering
    const societies = await Society.findAll();
    const societyData = societies.map(society => ({
      id: society.dataValues.society_id,
      name: society.dataValues.society_name,
      description: society.dataValues.society_description,
      president: society.dataValues.president,
    }));
    res.render('adminSocieties', { title: 'Societies', data: societyData });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching societies.');
  }
});


router.post('/societies/add', ensureAuthenticated, ensureAdmin, async (req, res) => {
  await Society.create(req.body);
  res.redirect('/admin/societies');
});
// Edit Society
router.post('/societies/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const societyId = req.params.id;  // Correctly reference the :id parameter from the URL
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).send('Name and description are required.');
    }
    await Society.update(
      { society_name: name, society_description: description },
      { where: { society_id: societyId } } // Ensure the correct primary key field here
    );
    res.redirect('/admin/society');
  } catch (err) {
    console.error('Error updating society:', err);
    res.status(500).send('Error updating society.');
  }
});

// Delete Society
router.post('/societies/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const societyId = req.params.id;  // Correctly reference the :id parameter from the URL
    await Society.destroy({ where: { society_id: societyId } });
     res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting society:', err);
    res.status(500).send('Error deleting society.');
  }
});

router.post('/societies', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { name, description } = req.body; // Ensure these match the form field names
    if (!name || !description) {
      return res.status(400).send('Name and description are required.');
    }
    await Society.create({ society_name: name, society_description: description });
    res.redirect('/admin/society'); // Redirect back to the societies page
  } catch (err) {
    console.error('Error adding society:', err);
    res.status(500).send('Error adding society.');
  }
});



// Event Routes
router.get('/Event', async (req, res) => {
  try {
    const events = await Event.findAll();
    res.render('adminEvents', { data: events });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// router.post('/events/add', ensureAuthenticated, ensureAdmin, async (req, res) => {
//   await Event.create(req.body);
//   res.redirect('/admin/events');
// });
// router.post('/events/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
//   await Event.update(req.body, { where: { id: req.params.id } });
//   res.redirect('/admin/events');
// });
router.post('/events/delete/:event_id', async (req, res) => {
  const eventId = req.params.event_id; // Correctly extract the event_id
  try {
    await Event.destroy({
      where: { event_id: eventId }
    });
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting Event:', error);
    res.status(500).send('Error deleting event');
  }
});

// Fetch all competitions
router.get('/competitions', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const competitions = await Competition.findAll();
    
    res.render('adminComp', { title: 'Competitions', data: competitions,error: null });
  } catch (err) {
    console.error('Error fetching competitions:', err);
    res.status(500).send('Error fetching competitions.');
  }
});

// Add a new competition
router.post('/competitions/add', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { competition_name, competition_date, competition_fee, competition_description,event_event_id } = req.body;
    if (!competition_name || !competition_date || !competition_fee || !event_event_id) {
      return res.status(400).send('All fields are required.');
    }
    await Competition.create({
      competition_name,
      competition_date,
      competition_fee,
      competition_description,
      event_event_id,
    });
    res.redirect('/admin/competition');
  } catch (err) {
    console.error('Error adding competition:', err);
    res.status(500).send('Error adding competition.');
  }
});

// Edit a competition
router.post('/competitions/edit/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const competitionId = req.params.id;
    const { competition_name, competition_date, competition_fee, competition_description, event_event_id } = req.body;

    if (!competition_name || !competition_date || !competition_fee || !event_event_id) {
      return res.status(400).send('All fields are required.');
    }

    await Competition.update(
      {
        competition_name,
        competition_date,
        competition_fee,
        competition_description,
        event_event_id,
      },
      { where: { competition_id: competitionId } }
    );

    res.redirect('/admin/competition');
  } catch (err) {
    console.error('Error updating competition:', err);
    res.status(500).send('Error updating competition.');
  }
});

// Delete a competition
router.post('/competitions/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const competitionId = req.params.id;
    await Competition.destroy({ where: { competition_id: competitionId } });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting competition:', err);
    res.status(500).send('Error deleting competition.');
  }
});


// List all participants
router.get('/participants', async (req, res) => {
  try {
    const participants = await Participant.findAll();
    res.render('adminParticipant', { title: 'List of Participants', data: participants,adminEmail: req.session.user.emai });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching participants');
  }
});
router.get('/participants', async (req, res) => {
  try {
    const events = await Event.findAll();
    res.render('adminEvent', { data: events });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Delete participant
router.get('/participants/delete/:id', async (req, res) => {
  const participant_id = req.params.id;
  try {
    const result = await Participant.destroy({
      where: { participant_id }
    });
    if (result === 0) {
      return res.status(404).send('Participant not found');
    }
    res.redirect('/adminParticipant');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting participant');
  }
});
router.post('/participants/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const participantID = req.params.id;
    await Participant.destroy({ where: { participant_id: participantID } });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting competition:', err);
    res.status(500).send('Error deleting competition.');
  }
});

//attendees

router.get('/attendees', async (req, res) => {
  try {
    const attendee = await attendees.findAll();
    res.render('adminAttendee', { data: attendee });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/attendees/delete/:attendee_id', async (req, res) => {
  const attendeeId = req.params.attendee_id; // Correctly extract the event_id
  try {
    await attendees.destroy({
      where: { attendee_id: attendeeId }
    });
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting Event:', error);
    res.status(500).send('Error deleting attendee');
  }
});

//Members
router.get('/members', async (req, res) => {
  try {
    const Member = await Members.findAll();
    res.render('adminMember', { data: Member });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/members/delete/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const memberID = req.params.id;
    await Members.destroy({ where: { member_id: memberID } });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).send('Error deleting member.');
  }
});


router.get('/logout', ensureAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error logging out.');
    }
    res.redirect('/dashboard');
  });
});

// Repeat similar structure for Competitions and Participants...

module.exports = router;
