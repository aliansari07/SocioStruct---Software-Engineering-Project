const express = require('express');
const router = express.Router();
const pool = require('../Models/db');

// Helper function to validate phone number
const validatePhone = (phone) => /^3\d{9}$/.test(phone);

// Helper function to check if the attendee_id already exists in the database
const checkAttendeeIdDuplication = async (attendee_id) => {
    const [existingAttendee] = await pool.execute('SELECT * FROM eventattendee WHERE attendee_id = ?', [attendee_id]);
    return existingAttendee.length > 0;
};

// List all attendees
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM eventattendee');
        res.render('attendees', { title: 'List of Attendees', attendees: rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching attendees');
    }
});

// Add new attendee
router.get('/add', (req, res) => {
    res.render('addAttendee', {
        title: 'Add Attendee',
        error: null,
        adminEmail: req.session.user ? req.session.user.email : '', // Safe handling for session
        attendee_id: '', // Default empty values
        attendee_name: '',
        attendee_phone: '',
        attendee_email: '',
        event_id: ''
    });
});

router.post('/add', async (req, res) => {
    const { attendee_id, attendee_name, attendee_email, attendee_phone, event_id } = req.body;

    const errors = {};

    // Validation
    if (!attendee_id || !attendee_name || !attendee_email || !attendee_phone || !event_id) {
        errors.missingFields = 'All fields are required';
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(attendee_email)) {
        errors.email = 'Invalid email format';
    }

    // if (!validatePhone(attendee_phone)) {
    //     errors.phone = 'Phone number must start with 3 and have 10 digits';
    // }

    // Check if attendee_id already exists
    const isDuplicate = await checkAttendeeIdDuplication(attendee_id);
    if (isDuplicate) {
        errors.attendee_id = 'Attendee ID already exists';
    }

    if (Object.keys(errors).length > 0) {
        return res.render('addAttendee', {
            title: 'Add Attendee',
            error: errors,
            attendee_id,
            attendee_name,
            attendee_phone,
            attendee_email,
            event_id,
            adminEmail: req.session.user ? req.session.user.email : '',
        });
    }

    try {
        // Check for duplicate email/phone in the same event
        const [duplicateCheck] = await pool.execute(
            'SELECT * FROM eventattendee WHERE event_id = ? AND (attendee_email = ? OR attendee_phone = ?)',
            [event_id, attendee_email, attendee_phone]
        );

        if (duplicateCheck.length > 0) {
            errors.duplicate = 'Email or phone number already exists for this event';
            return res.render('addAttendee', {
                title: 'Add Attendee',
                error: errors,
                attendee_id,
                attendee_name,
                attendee_phone,
                attendee_email,
                event_id,
                adminEmail: req.session.user ? req.session.user.email : '',
            });
        }

        // Validate event ID
        const [eventRows] = await pool.execute('SELECT * FROM event WHERE event_id = ?', [event_id]);
        if (eventRows.length === 0) {
            errors.event_id = 'The event ID does not exist';
            return res.render('addAttendee', {
                title: 'Add Attendee',
                error: errors,
                attendee_id,
                attendee_name,
                attendee_phone,
                attendee_email,
                event_id,
                adminEmail: req.session.user ? req.session.user.email : '',
            });
        }

        // Insert the new attendee
        const query = `
            INSERT INTO eventattendee (attendee_id, attendee_name, attendee_phone, attendee_email, event_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.execute(query, [attendee_id, attendee_name, attendee_phone, attendee_email, event_id]);
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding attendee');
    }
});


// Edit attendee
router.get('/:id/edit', async (req, res) => {
    const attendee_id = req.params.id;

    try {
        // Retrieve attendee details
        const [attendee] = await pool.execute('SELECT * FROM eventattendee WHERE attendee_id = ?', [attendee_id]);
        if (attendee.length === 0) {
            return res.status(404).send('Attendee not found');
        }

        // Get the event_id from the attendee record
        const event_id = attendee[0].event_id;

        // Check for duplication based on email or phone number for the same event
        const [duplicateCheck] = await pool.execute(
            'SELECT * FROM eventattendee WHERE event_id = ? AND (attendee_email = ? OR attendee_phone = ?) AND attendee_id != ?',
            [event_id, attendee[0].attendee_email, attendee[0].attendee_phone, attendee_id]
        );

        if (duplicateCheck.length > 0) {
            return res.status(400).send({ duplicate: 'Email or phone number already exists for this event' });
        }

        res.render('editAttendee', {
            title: 'Edit Attendee',
            attendee: attendee[0],
            error: null,
            adminEmail: req.session.user.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching attendee details');
    }
});

router.post('/:id/edit', async (req, res) => {
    const { attendee_name, attendee_email, attendee_phone, event_id } = req.body;
    const id = req.params.id; // Accessing id from the URL params

    // Validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const errors = {};

    if (!emailRegex.test(attendee_email)) {
        errors.email = 'Invalid email format';
    }

    if (!validatePhone(attendee_phone)) {
        errors.phone = 'Phone number must start with 3 and have 10 digits';
    }

    if (Object.keys(errors).length > 0) {
        // Re-render the form with errors and the current data
        return res.render('editAttendee', {
            title: 'Edit Attendee',
            error: errors,
            attendee: {
                attendee_id: id,
                attendee_name,
                attendee_email,
                attendee_phone,
                event_id,
            },
            adminEmail: req.session.user.email,
        });
    }

    try {
        const [duplicateCheck] = await pool.execute(
            'SELECT * FROM eventattendee WHERE event_id = ? AND (attendee_email = ? OR attendee_phone = ?) AND attendee_id != ?',
            [event_id, attendee_email, attendee_phone, id] // Using id from params here
        );

        if (duplicateCheck.length > 0) {
            errors.duplicate = 'Email or phone number already exists for this event';
            return res.render('editAttendee', {
                title: 'Edit Attendee',
                error: errors,
                attendee: {
                    attendee_id: id,
                    attendee_name,
                    attendee_email,
                    attendee_phone,
                    event_id,
                },
                adminEmail: req.session.user.email,
            });
        }

        // Check if event_id exists
        const [eventRows] = await pool.execute('SELECT * FROM event WHERE event_id = ?', [event_id]);
        if (eventRows.length === 0) {
            errors.event_id = 'Invalid event ID: Event does not exist';
            return res.render('editAttendee', {
                title: 'Edit Attendee',
                error: errors,
                attendee: {
                    attendee_id: id,
                    attendee_name,
                    attendee_email,
                    attendee_phone,
                    event_id,
                },
                adminEmail: req.session.user.email,
            });
        }

        const query = `
            UPDATE eventattendee 
            SET attendee_name = ?, attendee_email = ?, attendee_phone = ?, event_id = ? 
            WHERE attendee_id = ?
        `;
        await pool.execute(query, [attendee_name, attendee_email, attendee_phone, event_id, id]);
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating attendee');
    }
});

// Delete attendee
router.get('/delete/:id', async (req, res) => {
    const attendee_id = req.params.id;

    try {
        const query = 'DELETE FROM eventattendee WHERE attendee_id = ?';
        const [result] = await pool.execute(query, [attendee_id]);
        if (result.affectedRows === 0) {
            return res.status(404).send('Attendee not found');
        }
        res.redirect('/attendees');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting attendee');
    }
});

module.exports = router;
