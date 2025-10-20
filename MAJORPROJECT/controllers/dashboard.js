const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.renderDashboard = (req, res) => {
    res.render("dashboard/main.ejs");
};

module.exports.renderUserBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id }).populate("listing");
    res.render("dashboard/bookings.ejs", { bookings });
};

module.exports.renderUserListings = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id });
    res.render("dashboard/listings.ejs", { listings });
};
