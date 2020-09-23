const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// users must be logged in to proceed past this point
router.use(authController.protect);

router.get(
  '/checkout-session/:tourId', 
  bookingController.getCheckoutSession
);

// only Admin & Lead-Guide can access these routes
router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
.route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
