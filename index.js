import express from "express";
import mongoose, { now } from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
const app = express();


// ==================== DATABASE SECTION ====================

// Connectione to the database using mongoose 

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "Student_Problems",
  })
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.log(err);
  });

// Creating a schema of bundle in which name, email, number, problem will be stored in the database 

const ProblemsSchema = new mongoose.Schema({
  name: String,
  email: String,
  number: Number,
  problem: String,
});

// Creating a Schema of the user in which name and email will be stored in the database 

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const User = mongoose.model("User", UserSchema);

// Creating a model of the Problems Schema 

const Problems = mongoose.model("Problems", ProblemsSchema);

// ==================== USING MIDDLEWARES ====================
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

// ==================== MAKING MIDDLEWARES ====================

const isAuthenticated = async (req, res, next) => {
    const {token} = req.cookies; // we cannot access cookies like that in express js, we need cookie-parser for that.
    if(token){
        const decode = jwt.verify(token, "abcdef")
        req.user = await User.findById(decode._id); // we are storing the user data in req.user so that we can use it in the next middleware. Note that I myself used res in place of req and it workd fine(i.e by using req.user.name i got name of user on the screen and exactly same happen when I used res), I dot't know why. However, I am using req.user.name in the code below, may be it's a good practice to use req instead of res.
        next();
    }else{
        res.redirect("/login");
    }
}

// ==================== GET REQUESTS ====================

app.get("/", isAuthenticated, (req, res) => {

  res.render("logout.ejs", {name: req.user.name});
    // res.send("We are at home page");
});

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    });
    res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
})


// ==================== POST REQUESTS ====================


app.post("/register", async (req, res) => {
    const {name, email, password} = req.body;

    let user = await User.findOne({email});
    if(user){
        return res.redirect("/login")
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({name, email, password: hashedPassword})

    const token = jwt.sign({_id:user._id}, "abcdef")

    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");
  });

  app.post("/login", async (req, res) => {

    const {email, password} = req.body
    let user = await User.findOne({email});
    if(!user){
        return res.redirect("/register");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch){
        return res.render("login.ejs", {email, message: "Invalid Credentials"});
    }

    const token = jwt.sign({_id:user._id}, "abcdef")
    res.cookie("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");
    
  })
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
