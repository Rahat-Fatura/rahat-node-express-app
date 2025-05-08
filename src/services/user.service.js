const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const { userModel } = require('../models');
/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  const user = await userModel.getUserById(id);
  return user;
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  const user = await userModel.getUserByEmail(email);
  return user;
};
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<import('@prisma/client').User>}
 */
const createUser = async (userBody) => {
  const existUser = await getUserByEmail(userBody.email);
  if (existUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'e-Posta daha önce alınmış');
  }
  const userdata = Object.assign(userBody, { password: await bcrypt.hash(userBody.password, 8) });
  const user = await userModel.createUser(userdata);
  return user;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<import('@prisma/client').User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Kullanıcı bulunamadı');
  }
  const newBody = updateBody;
  if (newBody.email && (await userModel.findUser({ email: newBody.email, NOT: { id: userId } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'e-Posta daha önce alınmış');
  }
  if (newBody.password) {
    newBody.password = await bcrypt.hash(newBody.password, 8);
  }
  const updatedUser = await userModel.updateUserById(userId, newBody);
  return updatedUser;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (deleteUserId, fromByUserId) => {
  if (deleteUserId === fromByUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Kendi hesabınızı silemezsiniz');
  }
  const user = await userModel.deleteUserById(deleteUserId);

  return user;
};

/**
 * Get users list
 * @returns {Promise<User>}
 */
const getUsersList = async () => {
  const users = await userModel.getUsers();
  return users;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const isPasswordMatch = async (password, user) => {
  return bcrypt.compare(password, user.password);
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUsersList,
  isPasswordMatch,
};
