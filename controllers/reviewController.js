const Review = require(`./../models/reviewsModel`)
// const catchAsync = require(`./../utilities/catchAsync`)
const factory = require(`./handlerFactory`)
// const AppError = require(`./../utilities/appError`)

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourid;
  req.body.user = req.user.id;
  next();
}

exports.createReview = factory.createOne(Review)

exports.getAllReviews = factory.getAll(Review)

exports.getReview = factory.getOne(Review)

exports.updateReview = factory.updateOne(Review)

exports.deleteReview = factory.deleteOne(Review)