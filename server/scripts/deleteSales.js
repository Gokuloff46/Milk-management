const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/milk_management', { useNewUrlParser: true, useUnifiedTopology: true });

const Sale = require('../models/Sale');

Sale.deleteMany({})
  .then(() => {
    console.log('All sales deleted');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error deleting sales:', err);
    mongoose.connection.close();
  });
