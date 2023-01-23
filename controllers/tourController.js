const AppError = require('../utilities/appError');

const sharp = require(`sharp`);
const multer = require(`multer`);
const Tour = require(`./../models/tourModel`);
const catchAsync = require(`./../utilities/catchAsync`);
// const AppError = require(`./../utilities/appError`)
const factory = require(`./handlerFactory`);

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith(`image`)) {
    cb(null, true);
  } else {
    cb(new AppError(`Not an image! Please upload only images.`, 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: `imageCover`, maxCount: 1 },
  { name: `images`, maxCount: 3 },
]);

// upload.single(`image`)
// upload.array(`images`, 5)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.imageCover) return next();

  // 1) Cover images
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat(`jpg`)
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Other images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat(`jpg`)
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = `5`;
  req.query.sort = `-ratingsAverage/price`;
  req.query.fields = `name,price,ratingsAverage,summary,difficulty`;
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: `reviews` });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: `$difficulty` },
        numTours: { $sum: 1 },
        numRatings: { $sum: `$ratingsQuantity` },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: `sucess`,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const plan = await Tour.aggregate([
    {
      $unwind: `$startDates`,
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`2021-01-01`),
          $lte: new Date(`2021-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: `$startDates` },
        numTourStarts: { $sum: 1 },
        tours: { $push: `$name` },
      },
    },
    {
      $addFields: { month: `$_id` },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: `sucess`,
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(`,`);

  const radius = unit === `mi` ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        `Please provide latitude and longitude in this format lat,lng`,
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: `success`,
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(`,`);

  if (!lat || !lng) {
    next(
      new AppError(
        `Please provide latitude and longitude in this format lat,lng`,
        400
      )
    );
  }

  const multiplier = unit === `mi` ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: `Point`,
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: `distance`,
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: `success`,
    data: {
      data: distances,
    },
  });
});

/*
exports.getAllTours = catchAsync(async (req, res) => {
  const features = new APIFeatures(Tour.find(), req.query)
   .filter()
   .sort()
   .limitFields()
   .pagination()
   const tours = await features.query

   res
  .status(200)
  .json({
    status: `success`,
    results:tours.length,
    data: {
      tours
    }
  })
})*/

/*
const tours = JSON.parse (
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
)*/

/*
exports.checkID = (req, res, next, val) => {
  
  if(req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: `fail`,
      message: `Invalid ID`
    })
  }

  next()
}
*/

/*
exports.checkBody = (req, res, next) => {

  if(!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: `fail`,
      message: `Missing name`
    })
  }

  next()
}*/

//  try {
// Build query
// Filtering
/*  const queryObject = {...req.query}
    const excludedFields = [`page`,`sort`, `limit`, `fields` ]
    excludedFields.forEach(el => delete queryObject[el])

    console.log(req.query, queryObject) */

// Advamced filtering
// { difficulty: `easy`, duration:  {gte: 5}}
/* let queryStr = JSON.stringify(queryObject)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

     let query = Tour.find(JSON.parse(queryStr))*/

// Sorting
/*
    if(req.query.sort) {
      const sortBy = req.query.sort.split(`/`).join(` `)
      query = query.sort(sortBy) 
    } else {
      query = query.sort(`-createdAt`)
    }*/

// Field limiting
/*
    if(req.query.fields) {
      const fields = req.query.fields.split(`,`).join(` `)
      console.log(fields)
      query = query.select(fields)
    } else {
      query = query.select(`-__v`)
    }*/

// Pagination
/*
    const page = req.query.page * 1 || 1
    const limit = req.query.limit * 1 || 100
    const skip = (page - 1) * limit

    query = query.skip(skip).limit(limit)

    if(req.query.page) {
      const numTours = await Tour.countDocuments()
      if(skip >= numTours) throw new Error(`This page does not exist`)
    }*/

// Execute a query
/*
   const features = new APIFeatures(Tour.find(), req.query)
   .filter()
   .sort()
   .limitFields()
   .pagination()
   const tours = await features.query
    */
/*
    const tours = await Tour.find({
      duration: 5,
      difficulty: `easy`
    })
    */

/*
   const tours = await Tour.find()
   .where(`duration`)
   .equals(5)
   .where(`difficulty`)
   .equals(`easy`)
   */

// Send response
/*
  res
  .status(200)
  .json({
    status: `success`,
    results:tours.length,
    data: {
      tours
    }
  })
  } catch(err) {
    res
    .status(404)
    .json({
      status: `fail`,
      message: err
    })
  }
  */

// exports.getTour = catchAsync(async (req, res, next) => {
// const id = +req.params.id
// const tour = tours.find(el => el.id === id)
/*
 const tour = await Tour.findById(req.params.id).populate(`reviews`)

if(!tour) {
  return next(new AppError(`No tour found with that ID`, 404))
}

 res
 .status(200)
 .json({
   status: `success`,
   data: {
     tour
   }
 })

})*/

// try {
//   const tour = await Tour.findById(req.params.id)
// Tour.findOne({ _id: req.params.id })
/*
    res
  .status(200)
  .json({
    status: `success`,
    data: {
      tour
    }
  })
  } catch(err) {
    res
    .status(404)
    .json({
      status: `fail`,
      message: err
    })
  }*/

/*
  res
  .status(200)
  .json({
    status: `success`,
    data: {
      tour
    }
  })
  
}*/

/*
exports.sendTour = catchAsync(async (req, res, next) => {

  const newTour = await Tour.create(req.body)
  
  res
    .status(201)
    .json({
      status: `success`,
      data: {
        tour: newTour
      }
    })
}); */

/*
  const newId = tours[tours.length - 1].id + 1
  const newTour = Object.assign({ id:newId }, req.body)

  tours.push(newTour)
  fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {
    res
    .status(201)
    .json({
      status: `success`,
      data: {
        tour: newTour
      }
    })
  })
  */
/*
 try {
  const newTour = await Tour.create(req.body)
  res
    .status(201)
    .json({
      status: `success`,
      data: {
        tour: newTour
      }
    })
  } catch(err) {
    res
    .status(400)
    .json({
      status: `fail`,
      message: err
    })
  } */

/*
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if(!tour) {
    return next(new AppError(`No tour found with that ID`, 404))
  }

  res.status(200).json({
  status: `sucess`,
  data: {
    tour
  }
})
})*/

/*
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    res.status(200).json({
    status: `sucess`,
    data: {
      tour
    }
  })
  } catch(err) {
    res
    .status(400)
    .json({
      status: `fail`,
      message: err
    })
  }
}*/

/*
exports.deleteTour = catchAsync(async(req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id)

  if(!tour) {
    return next(new AppError(`No tour found with that ID`, 404))
  }

  res.status(204).json({
  status: `sucess`
})
})
*/

/*
  try {
    await Tour.findByIdAndDelete(req.params.id)

    res.status(204).json({
    status: `sucess`
  })
  } catch(err) {
    res
    .status(400)
    .json({
      status: `fail`,
      message: err
    })
  }
} */

/*
try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte:4.5 } }
      },
      {
        $group: {
          _id: {$toUpper: `$difficulty`}, 
          numTours: {$sum: 1},
          numRatings: {$sum: `$ratingsQuantity`},
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: {$avg: "$price" },
          minPrice: {$min: "$price" },
          maxPrice: {$max: "$price" }
        }
      },
      {
        $sort: {avgPrice: 1}
      },*/
//  {
//    $match: {_id: { $ne: `EASY` }}
//  }
/*  ])

    res.status(200).json({
      status: `sucess`,
      data: {
        stats
      }
    })

  } catch(err) {
    res
    .status(400)
    .json({
      status: `fail`,
      message: err
    })
  }
} */

// try {
//   const year = +req.params.year
/*
    const plan = await Tour.aggregate([
      {
        $unwind: `$startDates`
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`2021-01-01`),
            $lte: new Date(`2021-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: `$startDates` },
          numTourStarts: { $sum: 1},
          tours: {$push: `$name`}
        }
      },
      {
        $addFields: {month: `$_id`}
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $sort: {numTourStarts: -1}
      },
      {
        $limit: 12
      }
    ])

    res.status(200).json({
      status: `sucess`,
      data: {
        plan
      }
    })

  } catch(err) {
    res
    .status(400)
    .json({
      status: `fail`,
      message: err
    })
  }
} */
