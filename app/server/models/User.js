var mongoose   = require('mongoose'),
    bcrypt     = require('bcrypt-nodejs'),
    validator  = require('validator'),
    jwt        = require('jsonwebtoken');
    JWT_SECRET = process.env.JWT_SECRET;

var profile = {

    foodAllergyLactose: {
      type: Boolean,
      default: false
    },
    foodAllergyGluten: {
      type: Boolean,
      default: false
    },
    foodAllergyGlucose: {
      type: Boolean,
      default: false
    },
    foodAllergyOtherExists: {
      type: Boolean,
      default: false
    },
    foodAllergyOtherText: {
      type: String
    },

  age: {
    type: Number
  },

  country: {
    type: String,
    min: 4,
    maxlength: 120,
  },

  travelReimbursementNeeded: {
    type: Boolean,
    default: false
  },

  findsAccommodation: {
    type: String,
    enum: {
      values: 'yes no help'.split(' ')
    }
  },

  statusStudies: {
    type: String,
    enum: {
      values: [
        "Bachelor",
        "Master",
        "Doctoral Student",
        "Alumni",
        "Other"
      ]
    }
  },

  statusWork: {
    type: String,
    enum: {
      values: [
        "Part-timer / Student worker",
        "Freelancer",
        "Full-timer",
        "Entrepreneur",
        "Unemployed",
        "Other"      ]
    }
  },

  eduInstitution: {
    type: String
  },

  // Basic info
  name: {
    type: String,
    min: 1,
    max: 100,
  },

  adult: {
    type: Boolean,
    required: true,
    default: false,
  },

  school: {
    type: String,
    min: 1,
    max: 150,
  },

  graduationYear: {
    type: String,
    enum: {
      values: '2016 2017 2018 2019'.split(' '),
    }
  },

  description: {
    type: String,
    min: 0,
    max: 300
  },

  essay: {
    type: String,
    min: 0,
    max: 1500
  },

  fieldOfStudy: {
    type: String,
    min: 0,
    max: 150
  },

  specialization: {
    type: String,
    min: 0,
    max: 150
  },

  technology: {
    type: String,
    min: 1,
    max: 150
  },

  profExperienceCount: {
    type: Number
  },

  linkedIn: {
    type: String,
    min: 0,
    max: 150
  },

  projects: {
    type: String,
    min: 0,
    max: 300
  },

  participationCount: {
    type: Number
  },

  experiences: {
    type: String,
    min: 0,
    max: 150
  },

  hearAboutUs: {
    type: String,
    min: 0,
    max: 300
  },

  // Optional info for demographics
  gender: {
    type: String,
    enum : {
      values: 'M F O N'.split(' ')
    }
  },

  secretQuestions: {
    type: Array,
    default: ['', '', '']
  },

};

// Only after confirmed
var confirmation = {
  phoneNumber: String,
  dietaryRestrictions: [String],
  shirtSize: {
    type: String,
    enum: {
      values: 'XS S M L XL XXL WXS WS WM WL WXL WXXL'.split(' ')
    }
  },
  wantsHardware: Boolean,
  hardware: String,

  major: String,
  github: String,
  twitter: String,
  website: String,
  resume: String,

  needsReimbursement: Boolean,
  address: {
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  receipt: String,

  hostNeededFri: Boolean,
  hostNeededSat: Boolean,
  genderNeutral: Boolean,
  catFriendly: Boolean,
  smokingFriendly: Boolean,
  hostNotes: String,

  notes: String,

  signatureLiability: String,
  signaturePhotoRelease: String,
  signatureCodeOfConduct: String,
};

var status = {
  /**
   * Whether or not the user's profile has been completed.
   * @type {Object}
   */
  completedProfile: {
    type: Boolean,
    required: true,
    default: false,
  },
  admitted: {
    type: Boolean,
    required: true,
    default: false,
  },
  admittedBy: {
    type: String,
    validate: [
      validator.isEmail,
      'Invalid Email',
    ],
    select: false
  },
  confirmed: {
    type: Boolean,
    required: true,
    default: false,
  },
  declined: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkedIn: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkInTime: {
    type: Number,
  },
  confirmBy: {
    type: Number
  },
  reimbursementGiven: {
    type: Boolean,
    default: false
  }
};

// define the schema for our admin model
var schema = new mongoose.Schema({

  email: {
      type: String,
      required: true,
      unique: true,
      validate: [
        validator.isEmail,
        'Invalid Email',
      ]
  },

  password: {
    type: String,
    required: false,
    select: false
  },

  admin: {
    type: Boolean,
    required: true,
    default: false,
  },

  timestamp: {
    type: Number,
    required: true,
    default: Date.now(),
  },

  lastUpdated: {
    type: Number,
    default: Date.now(),
  },

  teamCode: {
    type: String,
    min: 0,
    max: 140,
  },

  verified: {
    type: Boolean,
    required: true,
    default: false
  },

  hasGoodID: {
    type: Boolean,
    required: false,
    default: false
  },

  hasNoPassword: {
    type: Boolean,
    required: false,
    default: false
  },

  salt: {
    type: Number,
    required: true,
    default: Date.now(),
    select: false
  },

  /**
   * User Profile.
   *
   * This is the only part of the user that the user can edit.
   *
   * Profile validation will exist here.
   */
  profile: profile,

  /**
   * Confirmation information
   *
   * Extension of the user model, but can only be edited after acceptance.
   */
  confirmation: confirmation,

  status: status,

});

schema.set('toJSON', {
  virtuals: true
});

schema.set('toObject', {
  virtuals: true
});

//=========================================
// Instance Methods
//=========================================

// checking if this password matches
schema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Token stuff
schema.methods.generateEmailVerificationToken = function(){
  return jwt.sign(this.email, JWT_SECRET);
};

schema.methods.generateAuthToken = function(){
  return jwt.sign(this._id, JWT_SECRET);
};

/**
 * Generate a temporary authentication token (for changing passwords)
 * @return JWT
 * payload: {
 *   id: userId
 *   iat: issued at ms
 *   exp: expiration ms
 * }
 */
schema.methods.generateTempAuthToken = function(){
  return jwt.sign({
    id: this._id
  }, JWT_SECRET, {
    expiresInMinutes: 60,
  });
};

//=========================================
// Static Methods
//=========================================

schema.statics.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

/**
 * Verify an an email verification token.
 * @param  {[type]}   token token
 * @param  {Function} cb    args(err, email)
 */
schema.statics.verifyEmailVerificationToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, email){
    return callback(err, email);
  });
};

/**
 * Verify a temporary authentication token.
 * @param  {[type]}   token    temporary auth token
 * @param  {Function} callback args(err, id)
 */
schema.statics.verifyTempAuthToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, payload){

    if (err || !payload){
      return callback(err);
    }

    if (!payload.exp || Date.now() >= payload.exp * 1000){
      return callback({
        message: 'Token has expired.'
      });
    }

    return callback(null, payload.id);
  });
};

schema.statics.findOneByEmail = function(email){
  return this.findOne({
    email: email.toLowerCase()
  });
};

/**
 * Get a single user using a signed token.
 * @param  {String}   token    User's authentication token.
 * @param  {Function} callback args(err, user)
 */
schema.statics.getByToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, id){
    if (err) {
      return callback(err);
    }
    this.findOne({_id: id}, callback);
  }.bind(this));
};

schema.statics.validateProfile = function(profile, cb){
  return cb(!(
    profile.name.length > 0
  ));
};

//=========================================
// Virtuals
//=========================================

/**
 * Has the user completed their profile?
 * This provides a verbose explanation of their furthest state.
 */
schema.virtual('status.name').get(function(){

  if (this.status.checkedIn) {
    return 'checked in';
  }

  if (this.status.declined) {
    return "declined";
  }

  if (this.status.confirmed) {
    return "confirmed";
  }

  if (this.status.admitted) {
    return "admitted";
  }

  if (this.status.completedProfile){
    return "submitted";
  }

  if (!this.verified){
    return "unverified";
  }

  return "incomplete";

});

module.exports = mongoose.model('User', schema);
