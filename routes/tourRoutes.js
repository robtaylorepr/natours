const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//router.param('id', tourController.checkID);

// Example "Nested route" where reviews is a child of tour
// POST /tour/2347fad4/reviews              create a review for a specific tour
// GET /tour/234fad4/reviews                get a tour & all its reviews
// GET /tour/234fad4/reviews/93887fda       get a tour & a specific review
        //note above, tourId is in URL
        //userId will come from currently loggedin user

// router
// .route('/:tourId/reviews')
// .post(
//   authController.protect, 
//   authController.restrictTo('user'), 
//   reviewController.createReview
// );

router.use('/:tourId/reviews', reviewRouter);

router
.route('/Top-5-cheap')
.get(tourController.aliasTopTours, tourController.getAllTours);

router
.route('/tour-stats')
.get(tourController.getTourStats);

router
.route('/monthly-plan/:year')
.get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'),
  tourController.getMonthlyPlan
);

router
.route('/tour-within/:distance/center:latlng/unit/:unit')
.get(tourController.getToursWithin);
//  /tours-distance/233/center/-40,45/unit/mi

router
.route('/distances/:latlng/unit:unit')
.get(tourController.getDistances);

router
.route('/')
.get(tourController.getAllTours)
.post(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.createTour
);

router
.route('/:id')
.get(tourController.getTour)
.patch(
  authController.protect, 
  authController.restrictTo('admin', 'lead-guide'),
  tourController.uploadTourImages,
  tourController.resizeTourImaages,
  tourController.updateTour
)
.delete(
  authController.protect, 
  authController.restrictTo('admin', 'lead-guide'), 
  tourController.deleteTour
);

module.exports = router;