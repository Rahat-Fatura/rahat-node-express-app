const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');

const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { tokenModel } = require('../models');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token document to the database
 * @param {string} token - The token string
 * @param {ObjectId} userId - The user id associated with the token
 * @param {DateTime} expiresAt - The moment object when the token expires
 * @param {string} type - The type of the token
 * @param {boolean} [blacklisted=false] - If the token should be blacklisted
 * @returns {Promise<import('@prisma/client').Token>} - A promise that resolves to the saved token document
 */
const saveToken = async (token, userId, expiresAt, type, blacklisted = false) => {
  const tokenDoc = await tokenModel.createToken(userId, expiresAt.toISOString(), type, token, blacklisted);
  return tokenDoc;
};
/**
 * Find a token document based on given parameters
 * @param {import('@prisma/client').Token} whereParams - The parameters to filter the token
 * @returns {Promise<import('@prisma/client').Token>} - A promise that resolves to the token document
 */

const findToken = async (whereParams) => {
  const tokenDoc = await tokenModel.findToken(whereParams);
  return tokenDoc;
};
/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await tokenModel.findToken({
    token,
    type,
    userId: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new Error('Token bulunamadı');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {import('@prisma/client').User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {import('@prisma/client').User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

/**
 * Delete a token by its ID
 * @param {string} id - The ID of the token to be deleted
 * @returns {Promise<Token>} - A promise that resolves to the deleted token document
 */

const deleteToken = async (id) => {
  const tokenDoc = await tokenModel.deleteToken(id);
  return tokenDoc;
};
/**
 * Delete all tokens for a user
 * @param {ObjectId} userId
 * @param {import("@prisma/client").Token} whereParams
 * @returns {Promise<Token[]>}
 */
const deleteTokens = async (userId, whereParams = {}) => {
  const tokenDoc = await tokenModel.deleteTokens(userId, whereParams);
  return tokenDoc;
};
module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  findToken,
  deleteToken,
  deleteTokens,
};
