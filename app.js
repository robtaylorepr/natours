const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const expressSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const reviewRouter = require('./routes/reviewRoutes.js');
const bookingRouter = require('./routes/bookingRoutes.js');
const viewRouter = require('./routes/viewRoutes.js');

const app = express();
const csp = require(`helmet-csp`);

app.set('view engine', 'pug');
const viewPath = path.join(__dirname, 'views');
app.set('views', viewPath);

// 1) Global Middleware
// Serving static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
// Set Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour = 60 min/hour * 60 s/min * 1000 ms/s
  message: 'Too many request from this IP, please try again in an hour',
});
app.use('/api', limiter); // each external IP only gets 100 requests per hour

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL Query injection
// Example of attack:  "email": " { `$gt": ""}, knowing only a password
app.use(expressSanitize()); // filter out $&. from body and paras

// Data sanitization against XSS attacks
app.use(xss()); // convert HTML symbols

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  res.requestTime = new Date().toISOString();
  next();
});

// Add Access Control Allow Origin headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

function getDirectives() {
  const self = `'self' blob:`;
  const unsafeInline = `'unsafe-inline'`;
  const scripts = [
    `https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js`,
    'https://js.stripe.com/'
  ];
  const styles = [
    `https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.css`,
    `https://fonts.googleapis.com/css`,
    `https://fonts.gstatic.com/s/lato/v16/S6u_w4BMUTPHjxsI9w2_FQftx9897sxZ.woff2`,
  ];
  const images = [`https:`, `data:`];
  const connect = [
    `https://api.mapbox.com/`,
    `https://maps.googleapis.com/`,
    `https://fonts.googleapis.com/`,
    `https://fonts.gstatic.com/`,
    `https://events.mapbox.com/`,
    `https://cdnjs.cloudflare.com`,
    'https://js.stripe.com/v3/',
    'http://127.0.0.1:3000/api/v1/users/login',
    'http://127.0.0.1:3000/api/v1/users/logout',
    'http://127.0.0.1:3000/api/v1/users/updateMe',
    'http://127.0.0.1:3000/api/v1/users/updateMyPassword',
    'ws://127.0.0.1:51973/'
  ];
  const fonts = [
    'https://fonts.gstatic.com/s/lato/v17/S6u_w4BMUTPHjxsI9w2_FQftx9897sxZ.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u_w4BMUTPHjxsI9w2_Gwftx9897g.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh7USSwaPGQ3q5d0N7w.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u_w4BMUTPHjxsI9w2_FQftx9897sxZ.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u_w4BMUTPHjxsI9w2_Gwftx9897g.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh7USSwaPGQ3q5d0N7w.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh7USSwiPGQ3q5d0.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2',
    'https://fonts.gstatic.com/s/lato/v17/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2',
  ];
  const frames = [
    'https://js.stripe.com/'
  ];
  return {
    defaultSrc: [self],
    scriptSrc: [self, ...scripts],
    styleSrc: [self, unsafeInline, ...styles],
    imgSrc: [self, ...images],
    fontSrc: [self, ...fonts],
    frameSrc: [self, ...frames],
    connectSrc: [self, ...connect],
  };
}

app.use(
  csp({
    directives: getDirectives(),
  })
);

// 3) Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

app.use(globalErrorHandler);

module.exports = app;
