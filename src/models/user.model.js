const database = require('../utils/database');

const createUser = async (userData) => {
  const user = await database.user.create({
    data: userData,
  });
  return user;
};

const getUserById = async (id) => {
  const user = await database.user.findUnique({
    where: { id },
  });
  return user;
};
const getUserByEmail = async (email) => {
  const user = await database.user.findFirst({
    where: { email },
  });
  return user;
};

const findUser = async (whereParams) => {
  const user = await database.user.findFirst({
    where: { ...whereParams },
  });
  return user;
};

const updateUserById = async (userId, updateBody) => {
  const updatedUser = await database.user.update({
    where: { id: userId },
    data: updateBody,
  });
  return updatedUser;
};

const deleteUserById = async (userId) => {
  const deletedUser = await database.user.delete({
    where: { id: userId },
  });
  return deletedUser;
};
const getUsers = async (whereParams = {}) => {
  const users = await database.user.findMany({
    where: { ...whereParams },
  });
  return users;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  findUser,
  updateUserById,
  deleteUserById,
  getUsers,
};
