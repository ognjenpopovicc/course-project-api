const mongoose = require(`mongoose`);
const dotenv = require(`dotenv`);

process.on(`uncaughtException`, (err) => {
  console.log(`UNCAUGHT EXCEPTION! Shutting down...`);
  console.log(err);

  process.exit(1);
});

dotenv.config({ path: `./config.env` });
const app = require(`./app.js`);

const DB = process.env.DATABASE.replace(
  `<PASSWORD>`,
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {});

// console.log(process.env)

const port = process.env.port || 3000;
const server = app.listen(port, () => {});

process.on(`unhandledRejection`, (err) => {
  console.log(err.name, err.message);
  console.log(`UNHANDLER REJECTION! Shutting down...`);

  server.close(() => {
    process.exit(1);
  });
});
