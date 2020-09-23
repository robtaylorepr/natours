const express = require('express');
const reviewController = require('../controllers/reviewController');
const tourController = require('../controllers/tourController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// No access to reviews unless you are logged in
router
.use(
  authController.protect
);

router
.route('/')
.get(
  reviewController.getAllReviews)
.post(
  authController.restrictTo('user'),
  reviewController.setTourUserIds,
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
);

// router
// .route('/:id')
// .get(reviewController.getReview)
// .patch(reviewController.updateReview)
// .delete(
//   authController.protect, 
//   authController.restrictTo('admin', 'lead-guide'), 
//   reviewController.deleteReview
// );

module.exports = router;