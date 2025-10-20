const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
const {isLoggedIn} = require("../middleware.js");


router.route("/signup")
    .get(userController.renderSignupForm) //signup Form
    .post(wrapAsync(userController.signup)); //signup

router.route("/login")
    .get(userController.renderLoginForm) //login Form
    .post(saveRedirectUrl,passport.authenticate("local",{failureRedirect:"/login", failureFlash:true}),userController.login); //login

//logout
router.get("/logout",userController.logout);

router.get("/dashboard", isLoggedIn, userController.dashboard);

module.exports = router;