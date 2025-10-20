const { GoogleGenAI } = require("@google/genai"); 
const ai = new GoogleGenAI({});

const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN; //mapboxToken
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req,res)=>{
    try {
        const { category, q } = req.query; // q is search term
        let filter = {};

        // Filter by category if selected
        if (category && category !== "All") {
            filter.category = category;
        }

        // Search by regex if query exists
        if (q) {
            const regex = new RegExp(q, "i"); // case-insensitive
            filter.$or = [
                { title: regex },
                { location: regex },
                { country: regex }
            ];
        }

        let allListings = await Listing.find(filter);

        // Ensure allListings is an array
        if (!Array.isArray(allListings)) {
            allListings = [];
        }

        res.render("listings/index", { allListings });
    } catch (err) {
        console.error(err);
        req.flash("error", "Cannot load listings!");
        res.redirect("/");
    }

};
 
module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListings = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Default summary
    let summary = "No reviews available yet for this listing.";
    if (listing.reviews.length >= 3) {
        const reviewTexts = listing.reviews.map(r => r.comment).join("\n");
        
        console.log("Reviews being sent to Gemini:\n", reviewTexts);

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { role: "user", parts: [{ text: `Summarize these reviews for a listing in 2–3 short, objective sentences:\n${reviewTexts}` }] }
                ],
                config: {
                    systemInstruction: "You are a helpful assistant that summarizes user reviews concisely.",
                    // FIX: Increase maxOutputTokens to give the model room to think AND respond.
                    maxOutputTokens: 900, 
                    temperature: 0.8
                }
            });

            // >>> DEBUGGING LINES <<<
            // console.log("--- GEMINI RESPONSE DEBUG ---");
            // console.log("Response Object:", JSON.stringify(response, null, 2));
            // console.log("Finish Reason:", response.candidates?.[0]?.finishReason);
            // console.log("-----------------------------");
            // >>> END DEBUGGING <<<

            // FIX: Safely extract text. Use (response.text || "") to ensure it's a string.
            summary = (response.text || "").trim();
            
            if (!summary) {
                console.error(`Gemini returned an empty summary with finish reason: ${response.candidates?.[0]?.finishReason}.`);
                // Provide a clearer fallback message if the model failed to generate text.
                summary = "AI summary failed to generate. (Code: Empty response from model).";
            }

        } catch (error) {
            console.error("Error generating review summary with Gemini:", error);
            summary = "We couldn't generate an AI summary at this time, but the listing has reviews.";
        }
    }

    res.render("listings/show.ejs", { listing, summary });
};

module.exports.createListing = async (req,res,next)=>{
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    let url = req.file.path;
    let filename = req.file.filename;


    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    newListing.geometry = response.body.features[0].geometry;

    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req,res)=>{
    let {id}=req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;

    // Check if the URL is from Cloudinary
    if (originalImageUrl.includes("res.cloudinary.com")) {
      originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    } else if (originalImageUrl.includes("images.unsplash.com")) {
      // For Unsplash, just change the width parameter
      originalImageUrl = originalImageUrl.replace(/w=\d+/, "w=250");
    }
    res.render("listings/edit.ejs",{listing,originalImageUrl})
};


module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    if (!req.body.listing) {
        req.flash("error", "Invalid form submission!");
        return res.redirect(`/listings/${id}/edit`);
    }

    // Find listing first
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Update listing fields
    Object.assign(listing, req.body.listing);

    // If location has changed, update geometry using Mapbox
    if (req.body.listing.location) {
        const geoResponse = await geocodingClient
            .forwardGeocode({
                query: req.body.listing.location,
                limit: 1,
            })
            .send();

        if (geoResponse.body.features.length > 0) {
            listing.geometry = geoResponse.body.features[0].geometry;
        } else {
            req.flash("error", "Could not find coordinates for the new location.");
            return res.redirect(`/listings/${id}/edit`);
        }
    }

    // Update image if a new file is uploaded
    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await listing.save();

    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
};



module.exports.destroyListing = async (req,res)=>{
    let {id}=req.params;
    const deleteListing=await Listing.findByIdAndDelete(id);
    // console.log(deleteListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};