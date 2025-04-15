const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/adminController");

// Middleware to check if the user is authenticated
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === "admin") {
        next();
    } else {
        res.redirect("/login");
    }
}

router.get("/", isAdmin, adminController.getDashboard);
router.get("/profile", isAdmin, adminController.getProfile);
router.get("/edit-profile", isAdmin, adminController.getEditProfile);
router.get("/societies", isAdmin, adminController.getSocieties);
router.get("/events", isAdmin, adminController.getEvents);
router.get("/participants", isAdmin, adminController.getParticipants);
router.get("/teams", isAdmin, adminController.getTeams);

router.get("/edit-society/:id", isAdmin, adminController.editSociety);
router.get("/delete-society/:id", isAdmin, adminController.deleteSociety);

router.get('/', async (req, res) => {
    try {
        // Query database for counts
        const totalSocieties = await db.Society.count();
        const totalEvents = await db.Event.count();
        const totalParticipants = await db.Participant.count();
        const totalTeams = await db.Team.count();

        // Render adminPortal with queried data
        res.render('adminPortal', {
            totalSocieties,
            totalEvents,
            totalParticipants,
            totalTeams,
            societies: [] // Add this if you also need societies data in the template
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
