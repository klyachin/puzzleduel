const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Puzzle = require('../models/Puzzle');
const util = require('../utils/puzzle_util');
const profiler = require('../utils/profiler');
const cache = require('../utils/cache');

// Welcome Page
router.get('/', async (req, res, next) => {
  try {
    const processStart = new Date().getTime();
    var date = new Date();
    var yesterday = new Date(date.getFullYear(), date.getMonth(), date.getDay() - 1);
    const [dailyPuzzle, contest, ratingChange, commenters] = await Promise.all([
      cache.readPuzzleByDate(new Date().toISOString().slice(0,10)),
      cache.readDailyShadowContest(),
      cache.readMonthlyRatingChange(yesterday),
      cache.readMonthlyCommenters(yesterday)
    ]);
    if (dailyPuzzle) {
      var dailyPuzzleObj = await util.puzzleToPresent(dailyPuzzle, req.getLocale());
      if (typeof dailyPuzzleObj.contest != "undefined") {
        dailyPuzzleObj.contest.link = "/contest/" + dailyPuzzleObj.contest.contestId;
        const dailyContest = await cache.readContest(dailyPuzzleObj.contest.contestId);
        dailyPuzzleObj.contest.name = dailyContest.name;
      }
    }
    if (contest) {
      var contestPuzzleId = null;
      contest.puzzles.forEach(puzzle => {
        if (puzzle.revealDate.toISOString().slice(0,10) == new Date().toISOString().slice(0,10)) {
          contestPuzzleId = puzzle.puzzleId;
        }
      })
      if (contestPuzzleId) {
        var contestPuzzle = await cache.readPuzzle(contestPuzzleId);
        if (contestPuzzle) {
          var contestPuzzleObj = await util.puzzleToPresent(contestPuzzle, req.getLocale());
          contestPuzzleObj.contest = {
            name: contest.name,
            link: "/contest/" + contest.code
          };
        }
      }
    }
    topRatingChange = ratingChange.sort((change1, change2)=>(change2.change - change1.change)).slice(0,5);
    topCommenters = commenters.sort((commenter1, commenter2)=>(commenter2.commentCount - commenter1.commentCount)).slice(0,5);
    res.render(res.__('welcome_page'), {
      user: req.user,
      dailyPuzzle: dailyPuzzleObj,
      contestPuzzle: contestPuzzleObj,
      topRatingChange: topRatingChange,
      topCommenters: topCommenters
    });
    profiler.log('welcomePage', processStart);
  } catch (e) {
    next(e);
  }
});

// Help Page
router.get('/help', async (req, res, next) => {
  try {
    const processStart = new Date().getTime();
    res.render(res.__('help_page'), {
      user: req.user,
    });
    profiler.log('helpPage', processStart);
  } catch (e) {
    next(e);
  }
});

// Duel rules
router.get('/help/duelrules', async (req, res, next) => {
  try {
    const processStart = new Date().getTime();
    res.render(res.__('duel_help_page'), {
      user: req.user,
    });
    profiler.log('helpDuel', processStart);
  } catch (e) {
    next(e);
  }
});

// Vide links page
router.get('/help/videos', async (req, res, next) => {
  try {
    const processStart = new Date().getTime();
    var types = await cache.readPuzzleTypes();
    res.render(res.__('video_links'), {
      user: req.user,
      videos: Object.values(types)
        .filter(type => typeof type.properties != "undefined"
                     && Array.isArray(type.properties.youtubeId)
                     && type.properties.youtubeId.length>0)
        .map(type => {
          return {
            category: type.category,
            type: type.code,
            name: type.name,
            youtubeId: type.properties.youtubeId
          }
        })
    });
    profiler.log('videos', processStart);
  } catch (e) {
    next(e);
  }
});

// Authors Page
router.get('/help/authors', async (req, res, next) => {
  try {
    const processStart = new Date().getTime();
    const allPuzzles = await Puzzle.find({tag: {$ne: "example"}}, "-data");
    var byAuthorCountMap = {};
    allPuzzles.filter(puzzle => !puzzle.needLogging).forEach(puzzle => {
      if (typeof byAuthorCountMap[puzzle.author] == 'undefined') {
        byAuthorCountMap[puzzle.author]=0;
      }
      byAuthorCountMap[puzzle.author]++;
    })
    const authors = await User.find({role: "author"}, "_id name about");
    const locale = req.getLocale();
    res.render('contributors', {
      user: req.user,
      contributors: authors.map(author => {
        var text = "";
        if (typeof author.about !="undefined") {
          text = author.about.text;
          if (locale != 'en' && typeof author.about.translations !="undefined") {
            if (author.about.translations[locale] && author.about.translations[locale].text) {
              text = author.about.translations[locale].text;
            }
          }
        }
        return {
          id: author._id,
          name: author.name,
          puzzleCount: byAuthorCountMap[author._id],
          about: author.about,
          realName: typeof author.about!="undefined"?author.about.realName:"",
          picture: typeof author.about!="undefined"?author.about.picture:"",
          text: text
        }
      })
    });
    profiler.log('helpAuthors', processStart);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
