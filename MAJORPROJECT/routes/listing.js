const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema} = require("../schema.js");
const {isLoggedIn,isOwner,saveRedirectUrl} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

const validateListing = (req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
};

router.route("/")
    .get(wrapAsync(listingController.index)) //INDEX ROUTE
    .post(isLoggedIn,upload.single('listing[image]'),validateListing,wrapAsync(listingController.createListing)); //CREATE ROUTE


router.get("/new",saveRedirectUrl,isLoggedIn,listingController.renderNewForm); //NEW ROUTE

router.route("/:id")
    .get(saveRedirectUrl,wrapAsync(listingController.showListings)) //SHOW ROUTE
    .put(isLoggedIn,isOwner,upload.single('listing[image]'),validateListing,wrapAsync(listingController.updateListing)) //UPDATE ROUTE
    .delete(isLoggedIn,isOwner,wrapAsync(listingController.destroyListing)); //DELETE ROUTE

router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm)); //EDIT ROUTE


module.exports = router;