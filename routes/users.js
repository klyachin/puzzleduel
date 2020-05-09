const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const uniqid = require('uniqid');
const nodemailer = require('nodemailer');
const Recaptcha = require('express-recaptcha').RecaptchaV2;

// Config recaptcha
const recaptchaKeys = require('./../config/keys').recaptcha;
var recaptcha = new Recaptcha(recaptchaKeys.siteKey, recaptchaKeys.secret);
// Config email transporter
const transporter = nodemailer.createTransport(require('./../config/keys').email);


// Load User model
const User = require('../models/User');

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

async function hashWithSalt(password) {
  var salt = await bcrypt.genSalt(10);
  var hash = await bcrypt.hash(password, salt);
  return hash;
}

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, recaptcha.middleware.render, (req, res) => {
  res.render('register', { captcha:res.recaptcha });
});

// Reset password page
router.get('/reset', forwardAuthenticated, recaptcha.middleware.render, (req, res) => {
  res.render('reset_password', { captcha:res.recaptcha });
});

// Reset password page
router.get('/reset/:token', forwardAuthenticated, (req, res) => {
  res.render('reset_password', {token: req.params.token});
});

// Edit Page
router.get('/edit', ensureAuthenticated, (req, res) => {
  if (!req.user) {
    res.sendStatus(403);
    return;
  }
  res.render('edit_user', {
    user: req.user,
    name: req.user.name,
    email: req.user.email
  });
});

// Register
router.post('/register', recaptcha.middleware.verify, recaptcha.middleware.render, async (req, res, next) => {
  try {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Please enter all fields' });
    }

    if (password != password2) {
      errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters' });
    }

    user = await User.findOne({ email: email }, "email");
    if (user) {
      errors.push({ msg: 'This email is already registered. You can reset password for it' });
    }

    user = await User.findOne({ name: name }, "name");
    if (user) {
      errors.push({ msg: 'The user with this name already exists. Choose different name' });
    }

    if (req.recaptcha.error) {
      errors.push({ msg: 'Please confirm that you are not a robot' });
    }

    if (errors.length > 0) {
      res.render('register', {
        errors,
        name,
        email,
        password,
        password2,
        captcha:res.recaptcha
      });
      return;
    }

    const newUser = new User({
      name,
      email,
      password
    });

    var hash = await hashWithSalt(newUser.password);

    newUser.password = hash;
    await newUser.save();

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/users/login');
  } catch (e) {
    next(e);
  }
});

// Edit
router.post('/edit', ensureAuthenticated, async (req, res, next) => {
  try {
    if (!req.user) {
      res.sendStatus(403);
      return;
    }
    const { name, email, password, password2, oldpassword } = req.body;
    let errors = [];

    if (!oldpassword) {
      errors.push({ msg: 'Please enter the current password' });
    }

    if (password) {
      if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
      }
      if (password.length < 6) {
        errors.push({ msg: 'New password must be at least 6 characters' });
      }
    }
    if (email) {
      var user = await User.findOne({ email: email, _id: {$ne: req.user._id} }, "email");
      if (user) {
        errors.push({ msg: 'This email is already registered' });
      }
    }
    if (name) {
      var user = await User.findOne({ name: name, _id: {$ne: req.user._id} }, "name");
      if (user) {
        errors.push({ msg: 'The user with this name already exists. Choose different name' });
      }
    }

    var user = await User.findOne({ _id: req.user._id });

    var isMatch = await bcrypt.compare(oldpassword, user.password);

    if (!isMatch) {
      errors.push({ msg: 'Current password is incorrect' });
    }
    if (errors.length > 0) {
      res.render('edit_user', {
        user: req.user,
        errors: errors,
        name: name,
        email: email,
        password: password,
        password2: password2,
        oldpassword: oldpassword
      });
      return;
    }

    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }


    if (password) {
      var hash = await hashWithSalt(password);
      user.password = hash;
      user.resetToken = null;
      user.resetExpire = null;
    }

    await user.save();

    req.flash('success_msg', 'You are succesfully changed the data');
    res.redirect('/users/edit');
  } catch (e) {
    next(e);
  }
});

// Reset password
router.post('/reset', recaptcha.middleware.verify, recaptcha.middleware.render, async (req, res, next) => {
  try {
    const {email, password, password2, token} = req.body;
    let errors = [];

    if (!email) {
      errors.push({ msg: 'Please enter email' });
    }

    if (password) {
      if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
      }
      if (password.length < 6) {
        errors.push({ msg: 'New password must be at least 6 characters' });
      }
    }

    if (errors.length > 0) {
      res.render('reset_password', {
        errors: errors,
        email: email,
        password: password,
        password2: password2,
        token: token
      });
      return;
    }

    user = await User.findOne({ email: email });

    if (token) {
      if (!user) {
        errors.push({ msg: 'Email is not correct' });
        res.render('reset_password', {
          errors: errors,
          email: email,
          password: password,
          password2: password2,
          token: token
        });
        return;
      } else {
        var isMatch = await bcrypt.compare(token, user.resetToken);
        if (!isMatch) {
          errors.push({ msg: 'Email is not correct' });
        } else {
          if (user.resetExpire < new Date()) {
            errors.push({ msg: 'Token is expired. Please, request password reset again' });
          }
        }
      }

      if (errors.length > 0) {
        res.render('reset_password', {
          errors: errors,
          email: email,
          password: password,
          password2: password2,
          token: token
        });
        return;
      }

      var hash = await hashWithSalt(password);
      user.password = hash;
      user.resetToken = null;
      user.resetExpire = null;
      await user.save();

      req.flash('success_msg', 'Password has changed and you can log in');
      res.redirect('/users/login');
    } else {
      if (req.recaptcha.error) {
        errors.push({ msg: 'Please confirm that you are not a robot' });
      }
      if (errors.length > 0) {
        res.render('reset_password', {
          errors: errors,
          email: email,
          captcha:res.recaptcha
        });
        return;
      }

      if (user) {
        var newToken = uniqid();
        var hash = await hashWithSalt(newToken);

        user.resetToken = hash;
        var d = new Date();
        // Token expire in 2 hours
        d.setHours(d.getHours() + 2);
        user.resetExpire = d;

        var mailOptions = {
          from: "PuzzleDuel<puzzleduel.club@mail.ru>",
          to: email,
          subject: "Reset password for www.PuzzleDuel.club",
          text: "You or somebody else recently requested to reset your password for account " + email
          + " at web site http://www.puzzleduel.club \n\n"
          + "Click the following link http://www.puzzleduel.club/users/reset/" + newToken
          + " and enter the new password. "
          + "The link is valid for the next two hours. \n\n"
          + "If you didn't request a password reset, please just ignore this email. \n\n"
          + "Write to puzzleduel.club@gmail.com if you have any questions. \n\n\n"
          + "Thanks,\n"
          + "Andrey"
        };

        await user.save();

        await transporter.sendMail(mailOptions);

      }

      req.flash('success_msg', 'Email with instructions to reset your password is sent to the provided address');
      res.redirect('/');
    }
  } catch (e) {
    next(e);
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

module.exports = router;
