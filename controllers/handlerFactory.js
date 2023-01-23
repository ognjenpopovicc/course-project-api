const catchAsync = require(`./../utilities/catchAsync`)
const AppError = require(`./../utilities/appError`)
const APIFeatures = require(`./../utilities/apiFeatures.js`)

exports.deleteOne = Model => catchAsync(async(req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id)

  if(!doc) {
    return next(new AppError(`No document found with that ID`, 404))
  }

  res.status(204).json({
  status: `success`,
  data: null
  })
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if(!doc) {
    return next(new AppError(`No document found with that ID`, 404))
  }

  res.status(200).json({
  status: `sucess`,
  data: {
    data: doc
    }
  })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {

  const doc = await Model.create(req.body)
  
  res
    .status(201)
    .json({
      status: `success`,
      data: {
        data: doc
      }
    })
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

let query = Model.findById(req.params.id)
if(popOptions) query = query.populate(popOptions)
const doc = await query

if(!doc) {
  return next(new AppError(`No document found with that ID`, 404))
}

 res
 .status(200)
 .json({
   status: `success`,
   data: {
     data: doc
   }
 })

})

exports.getAll = Model => catchAsync(async (req, res, next) => {

  // To allow for nested GET reviews on tour (hack)
  let filter = {}
  if (req.params.tourid) filter = {tour: req.params.tourid}

  const features = new APIFeatures(Model.find(filter), req.query)
   .filter()
   .sort()
   .limitFields()
   .pagination()
   const doc = await features.query
  // const doc = await features.query.explain()

   res
  .status(200)
  .json({
    status: `success`,
    results:doc.length,
    data: doc
  })
})

