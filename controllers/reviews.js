const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async(req,res)=>{
    // console.log("RAW BODY FROM HOPPSCOTCH:", req.body);

    // if (!req.body.review) {
    //     throw new ExpressError(400, "Review data is missing!");
    // }
    
    let listing = await Listing.findById(req.params.id);

    // Backend safety: prevent owner from reviewing their own listing
    if (listing.owner.equals(req.user._id)) {
        req.flash("error", "You cannot review your own listing!");
        return res.redirect(`/listings/${listingId}`);
    }
    
    let newReview =  new Review(req.body.review);
    newReview.author = req.user._id;

    // console.log(newReview);
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();

    req.flash("success","New Review Created!");
    res.redirect(`/listings/${listing.id}`);
    // console.log("new review added");
};

module.exports.destroyReview = async(req,res)=>{
    let {id,reviewId}= req.params;

    await Listing.findByIdAndUpdate(id,{$pull: {reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);

    req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);
};