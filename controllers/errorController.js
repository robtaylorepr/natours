const AppError = require("./../utils/appError");

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  // Regular Expresstion to find text between quotes
  // because the name of the tour we are seeking is found between quotes.
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];                 
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message,400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message =  `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message,400);
};

const handleJWTError = 
  () => new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = 
  () => new AppError('Your token has expired! Please login again',401);
  
const sendErrorDev = (err, req, res) => {
  // A) API
  if(req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });

  }

    // B) RENDERED WEBSITE
    console.error('ERROR *', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
};

const sendErrProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR *', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      message: err.message
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR *', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: "Please try again later."
  });
};

module.exports = (err,req,res,next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.log('We think we are in development');
    sendErrDev(err,req,res);
  } else if (process.env.NODE_ENV === 'production') {
    console.log('We think we are in production');
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') 
      error = handleCastErrorDB(error);

    if (error.code === 11000) 
      error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError') 
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') 
      error = handleJWTError();

    if (error.name === 'TokenExpiredError') 
      error = handleJWTExpiredError();

    sendErrProd(error,req,res);
  }
}