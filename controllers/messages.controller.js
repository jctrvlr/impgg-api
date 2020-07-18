const httpStatus = require('http-status');
const ContactMessage = require('../models/contactMessage.model');

exports.saveMessage = async (req, res, next) => {
  try {
    const contactMessage = new ContactMessage(req.body);
    contactMessage.save();

    res.status(httpStatus.OK);
    return res.send({ message: 'OK' });
  } catch (err) {
    return next(err);
  }
};
