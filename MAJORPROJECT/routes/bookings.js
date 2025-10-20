const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams for listingId
const { isLoggedIn, saveRedirectUrl } = require("../middleware");
const bookingsController = require("../controllers/bookings");

// Show booking form
router.get("/new", saveRedirectUrl, isLoggedIn, bookingsController.renderNewForm);

// Create booking
router.post("/", saveRedirectUrl, isLoggedIn, bookingsController.createBooking);

module.exports = router;
