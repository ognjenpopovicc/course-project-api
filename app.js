const path = require(`path`);
const express = require(`express`);
const morgan = require(`morgan`);
const rateLimit = require(`express-rate-limit`);
const helmet = require(`helmet`);
const mongoSanitize = require(`express-mongo-sanitize`);
const xss = require(`xss-clean`);
const hpp = require(`hpp`);

const AppError = require(`./utilities/appError`);
const globalErrorHandler = require(`./controllers/errorController`);
const tourRouter = require(`./routes/tourRoutes`);
const userRouter = require(`./routes/userRoutes`);
const reviewRouter = require(`./routes/reviewRoutes`);

const app = express();

app.set(`view engine`, `pug`);
app.set(`views`, path.join(__dirname, `views`));

// 1) Global Middlewares
// Serving static files
app.use(express.static(path.join(__dirname, `public`)));

//Set security HTTP headerss
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === `development`) {
  app.use(morgan(`dev`));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: `Too many requests from this IP, please try again in an hour!`,
});
app.use(`/api`, limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: `10kb` }));

// Data sanitization againt NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      `duration`,
      `ratingsQuantity`,
      `ratingsAverage`,
      `maxGroupSize`,
      `difficulty`,
      `price`,
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)

  next();
});

// 3) Route
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/tours`, tourRouter);
app.use(`/api/v1/reviews`, reviewRouter);

app.all(`*`, (req, res, next) => {
  /*
  res.status(404).json({
    status:`fail`,
    message: `Cant find ${req.originalUrl} on this server!`
  })
  */

  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

/*
app.get(`/`, (req, res) => {
  res
  .status(200)
  .json({
    message: `Hello from the serverside!`,
    app: `Natours`
  })
})

app.post(`/`, (req, res) => {
  res.send(`You can post to this URL`)
})
*/

// 2) Route handlers

/*
// Getting all data
app.get(`/api/v1/tours`, getAllTours)

// Getting one data
app.get(`/api/v1/tours/:id`, getTour)

// Sending data
app.post(`/api/v1/tours`, sendTour)

//Update data
app.patch(`/api/v1/tours/:id`, updateTour)

// Delete tour
app.delete(`/api/v1/tours/:id`, deleteTour)
*/

// 4) Start server

module.exports = app;
