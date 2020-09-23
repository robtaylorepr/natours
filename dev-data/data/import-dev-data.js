const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

dotenv.config( { path: `./config.env`} );

const DB = process.env.DATABASE.replace(
    `<PASSWORD>`,
    process.env.DATABASE_PASSWORD);
console.log(DB );

mongoose
  //.connect(process.env.DATABASE_LOCAL,{        this is the local db version
  .connect(DB,{                               // this is the remote (Atlas) version
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  }).then(() => console.log('DB connection successful' ) );

  // Read JSON file
  const tours = JSON.parse(
      fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
      );

  const users = JSON.parse(
    fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
    );

  const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
    );
  

  // Import Data into Database
  const importData = async () => {
      try{
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data successfully loaded!');
      }catch (err) {
        console.log(err);
      }
      process.exit();
  }

  // Delete all data from DB
  const deleteData = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted!');
      }catch (err) {
        console.log(err);
      }
      process.exit();
  }

  const option = process.argv[2];
  if (option === '--import') {
    importData();
  } else if (option === '--delete') {
    deleteData();
  } else {
    console.log ('usage error: only options are --import or --delete');
  }
