const database = require('../utils/database');

/**
 * Create token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} token
 * @returns {Promise<Token>}
 */
const createToken = async (userId, expiresAt, type, token, blacklisted) => {
  const tokenDoc = await database.token.create({
    data: {
      userId,
      type,
      expiresAt,
      token,
      blacklisted,
    },
  });
  return tokenDoc;
};

const findToken = async (whereParams) => {
  const tokenDoc = await database.token.findFirst({
    where: { ...whereParams },
  });
  return tokenDoc;
};

const deleteToken = async (id) => {
  const tokenDoc = await database.token.delete({
    where: { id },
  });
  return tokenDoc;
};
/**
 * Delete all tokens for a user
 * @param {ObjectId} userId
 * @param {import('prisma-client').Prisma.TokenWhereInput} whereParams
 * @returns {Promise<Token[]>}
 */
const deleteTokens = async (userId, whereParams = {}) => {
  const tokenDoc = await database.token.deleteMany({
    where: { userId, ...whereParams },
  });
  return tokenDoc;
};
module.exports = { createToken, findToken, deleteToken, deleteTokens };
