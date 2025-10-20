const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware.js");
const dashboardController = require("../controllers/dashboard.js");

router.get("/", isLoggedIn, dashboardController.renderDashboard);
router.get("/bookings", isLoggedIn, dashboardController.renderUserBookings);
router.get("/listings", isLoggedIn, dashboardController.renderUserListings);

module.exports = router;
