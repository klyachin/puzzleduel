const mongoose = require('mongoose');
const Mixed = mongoose.Schema.Types.Mixed;

const PuzzleTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  rules: {
    type: String,
    required: true
  },
  puzzleJs: {
    type: String,
    required: true
  },
  puzzleObj: {
    type: String,
    required: true
  },
  translations: {
    type: Mixed,
    required: false
  },
  example: {
    puzzleId: {
      type: String,
      required: false
    },
    answerImg: {
      type: String,
      required: false
    }
  }
});

const PuzzleType = mongoose.model('PuzzleType', PuzzleTypeSchema);

module.exports = PuzzleType;
