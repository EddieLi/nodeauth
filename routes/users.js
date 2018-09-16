var express = require('express');
var router = express.Router();
var multer = require('multer');
var passport = require('passport');
var LocalStrategy= require('passport-local').Strategy;
const { check, validationResult } = require('express-validator/check');
// handle file uploads
var upload = multer({dest: './uploads'});

// User schema
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', {title: 'Register'})
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user){
    done(err, user);
  });
});

// Since we use 'local' in passport
passport.use(new LocalStrategy(function(username, password, done){
  User.getUserByUsername(username, function(err, user){
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'Unknown User'});
    }

    User.comparePassword(password, user.password, function( err, isMatch ){
      if(err) return done(err);
      if(isMatch){
        return done(null, user);
      }else{
        return done(null, false, {message: 'Invalid Password'});
      }
    });
  });
}))

router.get('/login', function(req, res, next) {
  res.render('login', {title: "Login"})
});

router.post('/login', passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid username/password'}), 
  function(req, res){
    console.log(req);
    req.flash('success', 'You are now logged in!');
    res.redirect('/');
  });


// register an user
router.post('/register', 
  [ 
    upload.single('profileimage'),
    check('name', 'Name field needs to have at least 2 characters').isLength( { min: 2 }),
    check('username', 'Username field needs to have at least 2 characters').isLength( { min: 2 }),
    check('email', 'Email field is not valid').isEmail(),
    check('password', 'Password field needs to have at least 5 characters').isLength( { min: 5 }),
    check('password2', 'Passwords don\'t match.').custom( (value, { req } ) => value === req.body.password),
  ], function(req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  if( req.file ){
    console.log( 'Uploading file ... ' );
    var profileimage = req.file.filename;
  } else { 
    console.log ('No File Uploaded...');
    var profileimage = 'noimage.jpg';
  }

  const errors = validationResult(req);

  if( !errors.isEmpty() ) {
    res.render('register', { errors: errors.array() });
  } else {
    var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password,
      profileimage: profileimage
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });

    req.flash('success', 'You are successfully logged in.');

    res.location('/');
    res.redirect('/');
  }
  console.log( errors.array() )

});

router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are now logged out.');
  res.redirect('/users/login');
})
module.exports = router;
