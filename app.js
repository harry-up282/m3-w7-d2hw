const express               =  require('express'),
      expSession            =  require("express-session"),
      app                   =  express(),
      mongoose              =  require("mongoose"),
      passport              =  require("passport"),
      bodyParser            =  require("body-parser"),
      LocalStrategy         =  require("passport-local"),
      passportLocalMongoose =  require("passport-local-mongoose"),
      mongoSanitize         =  require('express-mongo-sanitize'),
      rateLimit             =  require('express-rate-limit'),
      xss                   =  require('xss-clean'),
      helmet                =  require('helmet'),
      User                  =  require("./models/user")
      
//Connecting database
mongoose.connect("mongodb://localhost/auth_demo");

app.use(expSession({
    secret:"mysecret",       //decode or encode session
    resave: false,          
    saveUninitialized:true,
    cookie:{
        httpOnly: true,
        secure: true,
        maxAge: 1 *60 * 1000
    }
}))

passport.serializeUser(User.serializeUser());       //session encoding
passport.deserializeUser(User.deserializeUser());   //session decoding
passport.use(new LocalStrategy(User.authenticate()));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded(
      { extended:true }
))
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));


//=======================
//      O W A S P
//=======================
app.use(mongoSanitize());

const limit = rateLimit({
    max: 100,
    windowMs: 60*60*1000,
    message: 'Too many requests'
});
app.use('/routename', limit);
app.use(express.json({limit: '10kb'}));
app.use(xss());
app.use(helmet());
//=======================
//      R O U T E S
//=======================
app.get("/", (req,res) =>{
    res.render("home");
})
app.get("/userprofile" ,(req,res) =>{
    res.render("userprofile");
})
//Auth Routes
app.get("/login",(req,res)=>{
    res.render("login");
});
app.post("/login",passport.authenticate("local",{
    successRedirect:"/userprofile",
    failureRedirect:"/login"
}),function (req, res){
});
app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    
    User.register(new User({username: req.body.username,email: req.body.email,phone: req.body.phone}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.render("register");
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/login");
        })    
    })
})

/*Tried but didn't work throwed error everytime: Extra exercise */
// // Route to handle registration
// app.post("/register", (req, res) => {
//     // Validation checks for username and password
//     if (req.body.username.length < 5) {
//         // If username length is less than 5 characters, display an error message
//         return res.render("register", { error: "Username should be at least 5 characters long" });
//     }

//     if (req.body.password.length < 8) {
//         // If password length is less than 8 characters, display an error message
//         return res.render("register", { error: "Password should be at least 8 characters long" });
//     }



//     // If validation passes, proceed with registration
//     User.register(new User({ username: req.body.username, email: req.body.email, phone: req.body.phone }), req.body.password, function (err, user) {
//         if (err) {
//             console.log(err);
//             res.render("register", { error: "An error occurred during registration" });
//         }
//         passport.authenticate("local")(req, res, function () {
//             res.redirect("/login");
//         });
//     });
// });



// Listen on the server
app.listen(process.env.PORT || 3000, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Server Started At Port 3000");
    }
});

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});
function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

//Listen On Server
app.listen(process.env.PORT || 3000,function (err) {
    if(err){
        console.log(err);
    }else {
        console.log("Server Started At Port 7000");  
    }
});

