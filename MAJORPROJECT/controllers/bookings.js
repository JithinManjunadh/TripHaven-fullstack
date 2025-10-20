const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.renderNewForm = async (req, res) => {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    res.render("bookings/new.ejs", { listing });
};

module.exports.createBooking = async (req, res) => {
    const { listingId } = req.params;
    const { startDate, endDate } = req.body.booking;
    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
        req.flash("error", "End date must be after start date!");
        return res.redirect(`/listings/${listingId}`);
    }

    const totalCost = nights * listing.price;

    const booking = new Booking({
        listing: listing._id,
        user: req.user._id,
        startDate: start,
        endDate: end,
        totalCost,
    });

    await booking.save();
    req.flash("success", `Booking confirmed! Total cost: ₹${totalCost}`);
    res.redirect(`/listings/${listingId}`);
};
