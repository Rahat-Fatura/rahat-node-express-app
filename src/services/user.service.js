const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const User = require('../utils/database').user;

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.findFirst({ where: { email: userBody.email } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'e-Posta daha önce alınmış');
  }
  const userdata = Object.assign(userBody, { password: await bcrypt.hash(userBody.password, 8) });
  const user = await User.create({ data: userdata });
  return user;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  const user = await User.findUnique({ where: { id: Number(id) } });
  return user;
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  const user = await User.findFirst({ where: { email } });
  return user;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Kullanıcı bulunamadı');
  }
  const newBody = updateBody;
  if (newBody.email && (await User.findFirst({ where: { email: newBody.email, NOT: { id: userId } } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'e-Posta daha önce alınmış');
  }
  if (newBody.password) {
    newBody.password = await bcrypt.hash(newBody.password, 8);
  }
  Object.assign(user, newBody);
  await User.update({ where: { id: userId }, data: user });
  return user;
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
  const user = await getUserById(deleteUserId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await User.delete({ where: { id: deleteUserId } });
  return user;
};

/**
 * Get users list
 * @returns {Promise<User>}
 */
const getUsersList = async () => {
  const users = await User.findMany();
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
