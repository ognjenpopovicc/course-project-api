const express = require(`express`);
const userController = require(`./../controllers/userController.js`);
const authController = require(`./../controllers/authController.js`);
// const { route } = require("./reviewRoutes.js")

const router = express.Router();

router.post(`/forgotPassword`, authController.forgotPassword);
router.patch(`/resetPassword/:token`, authController.resetPassword);
router.post(`/signup`, authController.signup);
router.post(`/login`, authController.login);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch(
  `/updateMyPassword`,
  authController.protect,
  authController.updatePassword
);

router.get(
  `/me`,
  authController.protect,
  userController.getMe,
  userController.getUser
);

router.patch(
  `/updateMe`,
  authController.protect,
  userController.uploadUserphoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

router.delete(`/deleteMe`, authController.protect, userController.deleteMe);

router.use(authController.restrictTo(`admin`));

router
  .route(`/`)
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route(`/:id`)
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
