const express = require('express');
const router = express.Router();

const PuzzleSet = require('../models/PuzzleSet');
const Puzzle = require('../models/Puzzle');
const util = require('../utils/puzzle_util');


router.get('/:setid', async (req, res, next) => {
  try {
    const set = await PuzzleSet.findOne({code: req.params.setid});
    if (!set) {
      res.sendStatus(404);
      return;
    }
    if (set.tag.includes("hidden") && !set.author.equals(req.user._id)) {
      res.sendStatus(404);
      return;
    }
    var typeMap = await util.typeNameMap();
    var userMap = await util.userNameMap();
    var puzzleMap = {};
    const puzzles = await Puzzle.find();
    puzzles.forEach(puzzle => {puzzleMap[puzzle.code] = puzzle.toObject();});
    var setObj = {code: set.code, name: set.name, description: set.description, authorId: set.author, author: userMap[set.author]};
    var locale = req.getLocale();
    if (locale != 'en' && set.translations) {
      if (set.translations[locale] && set.translations[locale].name) {
        setObj.name = set.translations[locale].name;
      }
      if (set.translations[locale] && set.translations[locale].description) {
        setObj.description = set.translations[locale].description;
      }
    }
    var puzzleList = set.puzzles
      .map(puzzle => {
        puzzleObj = puzzleMap[puzzle.puzzleId];
        return {
          num: puzzle.puzzleNum,
          code: puzzle.puzzleId,
          type: typeMap[puzzleObj.type],
          dimension: puzzleObj.dimension,
          difficulty: puzzleObj.difficulty,
        };
      });
    res.render('puzzleset', {user: req.user, set: setObj, puzzles: puzzleList})
  } catch (e) {
    next(e);
  }
});


router.get('/:setid/add/:puzzleid', async (req, res, next) => {
  try {
    const set = await PuzzleSet.findOne({code: req.params.setid});
    if (!set) {
      res.sendStatus(404);
      return;
    }
    if (!set.author.equals(req.user._id)) {
      res.sendStatus(404);
      return;
    }
    if (set.puzzles.filter(puzzle=>puzzle.puzzleId==req.params.puzzleid).length == 0) {
      const puzzle = await Puzzle.findOne({code: req.params.puzzleid});
      if (puzzle) {
        if (set.puzzles.length==0) {
          var nextNum = 1;
        } else {
          var nextNum = Math.max(...set.puzzles.map(puzzle => puzzle.puzzleNum)) + 1;
        }
        set.puzzles.push({puzzleNum: nextNum, puzzleId: puzzle.code})
        await set.save();
      }
    }
    res.redirect('/puzzleset/' + req.params.setid);
  } catch (e) {
    next(e);
  }
});

router.get('/:setid/up/:puzzleid', async (req, res, next) => {
  try {
    const set = await PuzzleSet.findOne({code: req.params.setid});
    if (!set) {
      res.sendStatus(404);
      return;
    }
    if (!set.author.equals(req.user._id)) {
      res.sendStatus(404);
      return;
    }
    if (set.puzzles.filter(puzzle=>puzzle.puzzleId==req.params.puzzleid).length != 0) {
      var num = set.puzzles.filter(puzzle=>puzzle.puzzleId==req.params.puzzleid)[0].puzzleNum;
      var prevNum = num - 1;
      if (set.puzzles.filter(puzzle => puzzle.puzzleNum==prevNum).length != 0) {
        set.puzzles.filter(puzzle => puzzle.puzzleNum==prevNum)[0].puzzleNum = num;
        set.puzzles.filter(puzzle=>puzzle.puzzleId==req.params.puzzleid)[0].puzzleNum = prevNum;
        await set.save();
      }
    }
    res.redirect('/puzzleset/' + req.params.setid);
  } catch (e) {
    next(e);
  }
});

router.get('/:setid/delete/:puzzleid', async (req, res, next) => {
  try {
    const set = await PuzzleSet.findOne({code: req.params.setid});
    if (!set) {
      res.sendStatus(404);
      return;
    }
    if (!set.author.equals(req.user._id)) {
      res.sendStatus(404);
      return;
    }
    if (set.puzzles.filter(puzzle=>puzzle.puzzleId==req.params.puzzleid).length != 0) {
      var num = set.puzzles.filter(puzzle=>puzzle.puzzleId==req.params.puzzleid)[0].puzzleNum;
      for( var i = 0; i < set.puzzles.length; i++){
        if ( set.puzzles[i].puzzleId == req.params.puzzleid) {
          set.puzzles.splice(i, 1);
          i--;
        }
        if (set.puzzles[i].puzzleNum > num) {
          set.puzzles[i].puzzleNum--;
        }
      }
      await set.save();
    }
    res.redirect('/puzzleset/' + req.params.setid);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

