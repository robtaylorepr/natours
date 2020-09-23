const crypto = require('crypto');
const mongoose = require('mongoose');
const catchAsync = require('./../utils/catchAsync');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// Schema w/ five fields
// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String, // schema-type options
    required: [true, 'A user must nave a name'],
    trim: true,
    maxLength: [40, 'A user name cannot exceed 40 characters'],
    minLength: [10, 'A user name must be at least 10 characters'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'A user must have a duration'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provid a valid email']
  },
  photo: {
    type: String,
    default: './img/users/default'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'The passwordConfirm must match the password'],
    validate: {
      // This only works in CREATE and SAVE!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are NOT the same'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field to remove plain text password
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;  // 1second fudge
  next();
});

userSchema.pre(/^find/, function(next) {
  // This points to the current query
  this.find({ active: {$ne: false} });
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt (this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
}

userSchema.methods.createPasswordResetToken = function () {
  const nBytes = 32;
  const resetToken = crypto.randomBytes(nBytes).toString('Hex');
  // mildly encrypt resetToken, since you never want to store unencrypted passwords.
  // and this resetToken is sortof like a password.
  this.passwordResetToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('Hex');

  const tenMinutes = 10 * 60 * 1000 // 60 s/minute * 1000 ms/s
  this.passwordResetExpires = Date.now() + tenMinutes;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;