// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a Tour']
      },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a User']
      },
  },
    {
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    }
);

// Query Middleware
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next()
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
// Note: in a static method, (like the one we are in)
// 'this' points to the model (in this case, Review)
  const stats = await this.aggregate([
    {
      $match: {tour: tourId}
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: {$avg: '$rating'} 
      }
    }
  ]);
  // console.log(stats);

  if (stats.length > 0) {   // only update stats if there is are reviews
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,     // default
      ratingsAverage: 4.5     // default
    });
  }
};

reviewSchema.post('save', function() {
  // this points to current review
  // we want -> Review.calcAverageRatings(this.tour);
  // but ! Review is not yet defined, so instead
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // Note: it gets the 'next' keyword because it is PRE middleware
  // we want to get access to the current review DOCUMNENT
  // but 'this' is the current QUERY
  // so we execute a query, and get the document currently being processed
  // that is the workaround.
  // Note: We had to use 'pre' here to get access to the QUERY
  // Note: instead of saving to a const, by saving to 'this', we can pass
  // the 'review' from PRO to POST
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // Note: No next, since we are using POST
  // Note: Now that we have updated the DB, we can access the updated data
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;


