const express = require('express');
const router = express.Router();
const uniqid = require('uniqid');
// Puzzle model
const Puzzle = require('../models/Puzzle');
// PuzzleType model
const PuzzleType = require('../models/PuzzleType');
// User model
const User = require('../models/User');
// UserSolvingTime model
const UserSolvingTime = require('../models/UserSolvingTime');
// UserActionLog model
const UserActionLog = require('../models/UserActionLog');

const ensureAuthenticated = require('../config/auth').ensureAuthenticated;

function timeToString(millis) {
  if (!millis) return "";
  var secs = Math.round(millis/1000);
  var mins = Math.trunc(secs/60);
  var hours = Math.trunc(mins/60);
  secs = secs - 60 * mins;
  mins = mins - 60 * hours;
  return (hours > 0 ? (hours + "h ") : "") +
    ((hours > 0 || mins > 0) ? (mins + "m ") : "") +
    (secs + " s");
}

// Single puzzle page
router.get('/:puzzleid', async (req, res, next) => {
  try {
    var puzzle = await Puzzle.findOne({code: req.params.puzzleid}, "-data");
    if (!puzzle) {
      res.sendStatus(404);
      return;
    }
    var puzzleObj = puzzle.toObject();
    var type = await PuzzleType.findOne({ code: puzzleObj.type });
    if (req.getLocale() != 'en') {
      if (type.translations[req.getLocale()] && type.translations[req.getLocale()].rules) {
        type.rules = type.translations[req.getLocale()].rules;
      }
    }
    if(type) {
      puzzleObj.type = type.toObject();
    }
    if (puzzleObj.author) {
      puzzleObj.authorId = puzzleObj.author;
      var author = await User.findById(puzzleObj.author, "name");
      if(type) {
        puzzleObj.type = type.toObject();
      }
      puzzleObj.author = author.name;
    }
    res.render('single', {
      user: req.user,
      puzzle: puzzleObj
    });
  } catch (e) {
    next(e);
  }
});

// Author puzzle page show
router.get('/:puzzleid/author', ensureAuthenticated, async (req, res, next) => {
  try {
    if (!req.user) {
      res.sendStatus(404);
      return;
    }
    var puzzle = await Puzzle.findOne({code: req.params.puzzleid});
    if (!puzzle) {
      res.sendStatus(404);
      return;
    }
    var puzzleObj = puzzle.toObject();
    if (!puzzleObj.author.equals(req.user._id)) {
      res.sendStatus(404);
      return;
    }
    var type = await PuzzleType.findOne({ code: puzzleObj.type });
    if(type) {
      puzzleObj.type = type.toObject();
    }
    const times = await UserSolvingTime.find({puzzleId: puzzle.code, solvingTime: {$exists: true}}).sort("solvingTime");
    res.render('edit', {
      user: req.user,
      puzzle: puzzleObj,
      times: times.map(time => {
        return {
          userName: time.userName,
          time: timeToString(time.solvingTime),
          errors: time.errCount
        };
      })
    });
  } catch (e) {
    next(e);
  }
});

// Create new puzzle and show author page
router.get('/:typeid/:dimension/new', ensureAuthenticated, async (req, res, next) => {
  try {
    if (!req.user || req.user.role != "author") {
      res.sendStatus(404);
    }
    var type = await PuzzleType.findOne({ code: req.params.typeid });
    if(!type) {
      res.sendStatus(404);
      return;
    }
    var puzzleid = uniqid();
    var puzzle = new Puzzle({
      code: puzzleid,
      type: req.params.typeid,
      dimension: req.params.dimension,
      data: "{}",
      author: req.user._id,
      tag: "daily"
    });
    await puzzle.save();
    res.redirect("/single/" + puzzleid + "/author/");
  } catch (e) {
    next(e);
  }
});

// Author puzzle page show
router.get('/:puzzleid/answers', ensureAuthenticated, async (req, res, next) => {
  try {
    if (!req.user || req.user.role!="admin") {
      res.sendStatus(404);
      return;
    }
    var puzzle = await Puzzle.findOne({code: req.params.puzzleid});
    if (!puzzle) {
      res.sendStatus(404);
      return;
    }
    var puzzleObj = puzzle.toObject();
    var type = await PuzzleType.findOne({ code: puzzleObj.type });
    if(type) {
      puzzleObj.type = type.toObject();
    }
    const log = await UserActionLog.aggregate([{
      $match : {puzzleId: puzzle.code, action: "solved"}
    }, {
      $group: {_id: "$data", count: { $sum: 1 }}
    }]);
    res.render('answers', {
      user: req.user,
      puzzle: puzzleObj,
      answers: log.map(item => {return {data: item._id};})
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
