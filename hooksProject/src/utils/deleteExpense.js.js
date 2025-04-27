import { initDB } from '../db';

export const deleteExpenseById = async (userId, id) => {
  const db = await initDB();
  const storeName = `expenses_${userId}`;
  return db.delete(storeName, id);
};
