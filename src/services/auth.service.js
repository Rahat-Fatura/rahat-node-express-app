const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("@prisma/client").User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await userService.isPasswordMatch(password, user))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Kullanıcı adı veya şifre hatalı');
  }
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await tokenService.findToken({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Böyle bir token bulunamadı');
  }
  await tokenService.deleteToken(refreshTokenDoc.id);
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    await tokenService.deleteToken(refreshTokenDoc.id);
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Lütfen tekrar giriş yapın');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
    await tokenService.deleteTokens(user.id, { type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    logger.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Şifre sıfırlama başarısız oldu');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    await tokenService.deleteTokens(user.id, { type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    logger.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'e-Posta doğrulama başarısız oldu');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
