mongoose.connect('mongodb://localhost:27017/milk_management', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect('mongodb://localhost:27017/milk_management', { useNewUrlParser: true, useUnifiedTopology: true });
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/milk_management', { useNewUrlParser: true, useUnifiedTopology: true });
  const { default: Sale } = await import('../models/Sale.js');
  Sale.deleteMany({})
    .then(() => {
      console.log('All sales deleted');
      mongoose.connection.close();
    })
    .catch(err => {
      console.error('Error deleting sales:', err);
      mongoose.connection.close();
    });
})();
