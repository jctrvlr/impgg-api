const mongoose = require('mongoose');

/**
 * PageView Schema
 * @private
 * TODO: Figure out what location data to save based on what geoip-location service used
 */
const pageViewSchema = new mongoose.Schema({
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
    required: true,
  },
  ref: {
    type: String,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: {
    type: Object,
    required: true,
  },
  device: {

  },
  location: {
    city: String,
    country: String,
    postal: String,
    stateRegion: String,
    timeZone: String,
  },
}, {
  timestamps: true,
});

/**
 * @typedef PageView
 */
const PageView = mongoose.model('PageView', pageViewSchema);
module.exports = PageView;
