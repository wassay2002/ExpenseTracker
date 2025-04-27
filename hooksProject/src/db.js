import { openDB } from 'idb';

export const initDB = async () => {
    return openDB('auth-db', undefined, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'email' });
        }
  
        if (!db.objectStoreNames.contains('expenses')) {
          db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        }
  
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        }
  
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  };
  
  
  export const createUserSpecificStores = async (userId) => {
    const tempDb = await openDB('auth-db');
    const expenseStore = `expenses_${userId}`;
    const categoryStoreName = `categories_${userId}`;
    const budgetStore = `budget_${userId}`;
  
    let needsUpgrade = false;
  
    if (!tempDb.objectStoreNames.contains(expenseStore)) {
      needsUpgrade = true;
    }
  
    if (!tempDb.objectStoreNames.contains(categoryStoreName)) {
      needsUpgrade = true;
    } else {
      const tx = tempDb.transaction(categoryStoreName);
      const store = tx.objectStore(categoryStoreName);
      try {
        store.index('name');
      } catch (err) {
        needsUpgrade = true;
      }
    }
  
    if (!tempDb.objectStoreNames.contains(budgetStore)) {
      needsUpgrade = true;
    }
  
    const currentVersion = tempDb.version;
    tempDb.close();
  
    if (!needsUpgrade) return;
  
    const newVersion = currentVersion + 1;
  
    await openDB('auth-db', newVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(expenseStore)) {
          db.createObjectStore(expenseStore, { keyPath: 'id', autoIncrement: true });
        }
  
        if (!db.objectStoreNames.contains(categoryStoreName)) {
          const store = db.createObjectStore(categoryStoreName, { keyPath: 'name' });
          store.createIndex('name', 'name', { unique: true });
        } else {
          db.deleteObjectStore(categoryStoreName);
          const store = db.createObjectStore(categoryStoreName, { keyPath: 'name' });
          store.createIndex('name', 'name', { unique: true });
        }
  
        if (!db.objectStoreNames.contains(budgetStore)) {
          db.createObjectStore(budgetStore, { keyPath: 'id' });
        }
      },
    });
  };
  
  
  
  export const addCategory = async (userId, category) => {
    await createUserSpecificStores(userId); 
  
    const db = await openDB('auth-db'); 
    const storeName = `categories_${userId}`;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
  
    let existingCategory;
    try {
      const index = store.index('name');
      existingCategory = await index.get(category);
    } catch (err) {
      console.error("Index 'name' not found in store:", storeName, err);
      const allItems = await store.getAll();
      existingCategory = allItems.find(cat => cat.name === category);
    }
  
    if (existingCategory) {
      console.log('Category already exists.');
      return;
    }
  
    await store.add({ 
        name: category.name || category, 
        amount: category.amount || 0, 
        budget: category.budget || 0, 
        userId 
      });
          await tx.done;
  };
  
  
  
  export const getCategories = async (userId) => {
    await createUserSpecificStores(userId); 
    const db = await initDB();
    const storeName = `categories_${userId}`;
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const categories = await store.getAll(); 
    await transaction.complete;
    return categories;
  };
  
  
  export const updateCategory = async (userId, updatedCategory) => {
    const db = await initDB();
    const storeName = `categories_${userId}`;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
  
    await store.put(updatedCategory);
    await tx.done;
  };
  
  
  
  
  export const handleUserLogin = async (userId) => {
    await createUserSpecificStores(userId);
  };

export const addUser = async (user) => {
    const db = await initDB();
    return db.put('users', user); 
  };
  
  export const getUser = async (email) => {
    const db = await initDB();
    return db.get('users', email);
  };

  export const addExpense = async (userId, expense) => {
    const db = await initDB();
    return db.add("expenses", { ...expense, userId });
  };
  
  export const getExpenses = async (userId) => {
    const db = await initDB();
    const all = await db.getAll("expenses");
    return all.filter(e => e.userId === userId);
  };
  
  
  

export const addTransaction = async (tx) => {
    const db = await initDB();
    return db.add('transactions', tx);
  };
  
  export const getTransactions = async () => {
    const db = await initDB();
    return db.getAll('transactions');
  };
  
  export const getLatestTransactions = async (limit = 3) => {
    const db = await initDB();
    const all = await db.getAll('transactions');
    return all.slice(-limit).reverse(); 
  };
  
  export const getSummary = async () => {
    const db = await initDB();
    const all = await db.getAll('transactions');
  
    const now = new Date().toISOString().slice(0, 10); 
    let totalSpent = 0;
    let todaysSpending = 0;
  
    all.forEach(tx => {
      totalSpent += Number(tx.amount);
      if (tx.date === now) {
        todaysSpending += Number(tx.amount);
      }
    });
  
    const remainingBudget = 1000 - totalSpent; 
  
    return { totalSpent, todaysSpending, remainingBudget };
  };
  
export const setBudget = async (userId, amount) => {
    await createUserSpecificStores(userId);
    const db = await initDB();
    const storeName = `budget_${userId}`;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
  
    await store.put({ id: 'totalBudget', amount });
    await tx.done;
  };
  
  export const getBudget = async (userId) => {
    await createUserSpecificStores(userId);
    const db = await initDB();
    const storeName = `budget_${userId}`;
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
  
    const record = await store.get('totalBudget');
    return record ? record.amount : 0;
  };
  
  export const getCategorySpending = async (userId) => {
    const db = await initDB();
    const allExpenses = await db.getAll('expenses');
    const userExpenses = allExpenses.filter(e => e.userId === userId);
  
    const categoryTotals = {};
  
    for (const exp of userExpenses) {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = 0;
      }
      categoryTotals[exp.category] += Number(exp.amount);
    }
  
    return categoryTotals;
  };
  
  export async function getExpensesByDay(uid) {
    const db = await initDB();
    const tx = db.transaction(`expenses_${uid}`, "readonly");
    const store = tx.objectStore(`expenses_${uid}`);
  
    const allExpenses = await store.getAll();
  
    const dailyTotals = {};
    allExpenses.forEach(exp => {
      const date = new Date(exp.date).toISOString().slice(0, 10); 
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += Number(exp.amount);
    });
  
    return dailyTotals;
  }
  
  export async function getExpensesByRange(uid, startDate, endDate) {
    const db = await initDB();
    const tx = db.transaction(`expenses_${uid}`, "readonly");
    const store = tx.objectStore(`expenses_${uid}`);
  
    const allExpenses = await store.getAll();
  
    return allExpenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= new Date(startDate) && expDate <= new Date(endDate);
    });
  }
  
  export async function getExpensesByCategoryInRange(uid, category, startDate, endDate) {
    const allInRange = await getExpensesByRange(uid, startDate, endDate);
    return allInRange.filter(exp =>
      exp.category === category || exp.category?.name === category
    );
  }
  
  
  export async function getGlobalExpensesByRange(userId, startDate, endDate) {
const db = await initDB();
const tx = db.transaction("expenses", "readonly");
const store = tx.objectStore("expenses");

const allExpenses = await store.getAll();
return allExpenses.filter(exp => {
 const expDate = new Date(exp.date);
 return exp.userId === userId &&
expDate >= new Date(startDate) &&
expDate <= new Date(endDate);
 });
}

export async function getGlobalExpensesByCategoryInRange(userId, category, startDate, endDate) {
 const allInRange = await getGlobalExpensesByRange(userId, startDate, endDate);
 return allInRange.filter(exp =>
  exp.category === category || exp.category?.name === category
 );
}
