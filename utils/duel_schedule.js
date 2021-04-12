const rescheduleDuel = require('../utils/duel').rescheduleDuel;

const mongoose = require('mongoose');

require('dotenv').config();

// DB Config
const db = require('../config/keys').mongoURI;

recount = async function () {
  await rescheduleDuel('11111111');
}

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log('MongoDB Connected')
    recount().then(() => {
      mongoose.disconnect();
    });
  })
  .catch(err => console.log(err));



