const User = require("../models/user.js");
const Listing = require("../models/listing.js");

module.exports.renderSignupForm = (req,res)=>{
    res.render("users/signup.ejs");
};

module.exports.signup = async(req,res)=>{
    try{
        let {username,email,password}=req.body;
        const newUser = new User({email,username});
        const registeredUser = await User.register(newUser,password);
        console.log(registeredUser);
        req.login(registeredUser,(err)=>{
            if(err){
                return next(err);
            }
            req.flash("success","Welcome to Wanderlust!");
            res.redirect("/listings");
        });
    }
    catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req,res)=>{
    res.render("users/login.ejs");
};

module.exports.login = async(req,res)=>{
    req.flash("success","Welcome back");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    delete req.session.redirectUrl; 
    res.redirect(redirectUrl);
};

module.exports.logout = (req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You have logged out successfully!");
        res.redirect("/listings");
    });
};


module.exports.dashboard = async (req, res) => {
    try {
        const myListings = await Listing.find({ owner: req.user._id });
        res.render("users/dashboard.ejs", { myListings });
    } catch (err) {
        console.error(err);
        req.flash("error", "Cannot load your dashboard.");
        res.redirect("/listings");
    }
};