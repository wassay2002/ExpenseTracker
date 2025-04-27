import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getExpenses,
  addExpense,
  getCategories,
  addCategory,
  getBudget,
  handleUserLogin,
} from "./db";
import { useLocation } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [totalSpent, setTotalSpent] = useState(0);
  const [todaysSpending, setTodaysSpending] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: "",
    category: "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return navigate("/");

    const storedUser = JSON.parse(localStorage.getItem(`user_${userId}`));
    if (!storedUser) return navigate("/");

    setUser(storedUser);
    handleUserLogin(userId);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.fromExpenses) {
      setShowForm(true);
    }
  }, [location.state]);

  const loadData = async () => {
    const userId = user?.email;
    if (!userId) return;

    const budget = await getBudget(userId);

    const txs = await getExpenses(userId);
    const cats = await getCategories(userId);
    setTransactions(txs.reverse().slice(0, 3));
    setCategories(cats);
    const total = txs.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    setTotalSpent(total);
    const today = new Date().toISOString().slice(0, 10);
    const todaySpent = txs
      .filter((t) => t.date === today)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    setTodaysSpending(todaySpent);
    setRemainingBudget(budget - total);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [currency, setCurrency] = useState(
    localStorage.getItem("currency") || "$"
  );

  const handleCurrencyChange = (e) => {
    const selected = e.target.value;
    setCurrency(selected);
    localStorage.setItem("currency", selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const userId = user?.email;
    const selectedCategory = categories.find(cat => cat.name === form.category);
    const expenseAmount = parseFloat(form.amount);
  
    if (!selectedCategory) {
      alert("Selected category not found!");
      return;
    }
  
    const newSpentAmount = selectedCategory.amount + expenseAmount;
    const categoryBudget = selectedCategory.budget || 0;
  
    if (newSpentAmount > categoryBudget) {
      alert(`Warning: You are exceeding the budget for "${form.category}"!`);
    }
  
    await addExpense(userId, form);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      category: '',
      amount: '',
      description: ''
    });
    setShowForm(false);
    loadData();
  };
  

  const handleLogout = () => {
    const userId = localStorage.getItem("user_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem(`user_${userId}`);
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("user_")) localStorage.removeItem(key);
    });
    navigate("/");
  };

  return user ? (
    <div className="p-6 font-sans bg-white text-black">
      {/* Main Content */}
      <div className="flex flex-col items-center gap-9">
        {/* Currency Selector */}
        <div className="flex justify-end w-full">
          <select
            value={currency}
            onChange={handleCurrencyChange}
            className="border border-black rounded-full px-3 py-1 text-sm"
          >
            <option value="$">USD ($)</option>
            <option value="€">EUR (€)</option>
            <option value="₨">PKR (₨)</option>
            <option value="£">GBP (£)</option>
          </select>
        </div>

        <div>
          <div className="text-4xl font-bold">
            Total Spent This Month:
            <span className="border-blue-500 ml-3 px-4 py-2 bg-black text-blue-500 rounded-xl shadow-lg text-2xl border-2 border-blue-500 min-w-[150px]">
              {currency}
              {totalSpent.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col p-6">
            <button
              className="w-72 border-2 border-black bg-blue-500 text-black font-bold py-2 px-6 rounded-full shadow-lg hover:scale-105 transition mb-3"
              style={{ boxShadow: "3px 3px 0 black" }}
            >
              Today’s Spending: {currency}
              {todaysSpending.toLocaleString()}
            </button>

            <button
              className="w-72 border-2 border-black bg-blue-500 text-black font-bold py-2 px-6 rounded-full shadow-lg hover:scale-105 transition"
              style={{ boxShadow: "3px 3px 0 black" }}
            >
              Remaining Budget: {currency}
              {remainingBudget.toLocaleString()}
            </button>
          </div>

          <div className="border-2 border-black bg-blue-500 text-black rounded-xl p-6 w-80 shadow-md border relative">
          {showForm && (
    <button
      type="button"
      onClick={() => setShowForm(false)}
      className="absolute top-2 right-2 text-2xl font-bold text-black hover:text-red-500 transition"
    >
      ×
    </button>
  )}
          <h3 className="font-bold mb-3 text-lg">
              {showForm ? "Create New Expense" : "Latest Transactions"}
            </h3>

            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-2">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full p-2 rounded"
                  required
                />
                <select
                  name="category"
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setNewCategoryMode(true);
                      setForm({ ...form, category: "" });
                    } else {
                      setForm({ ...form, category: e.target.value });
                      setNewCategoryMode(false);
                    }
                  }}
                  className="w-full p-2 rounded"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__new__">➕ Add New Category</option>
                </select>

                {newCategoryMode && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="New Category Name"
                      className="flex-1 p-2 rounded"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="bg-white px-2 py-1 rounded font-bold border hover:bg-gray-200 transition"
                      onClick={async () => {
                        if (newCategoryName.trim()) {
                          await addCategory(user.email, {
                            name: newCategoryName.trim(),
                            amount: 0,
                          });
                          setCategories(await getCategories(user.email));
                          setForm({
                            ...form,
                            category: newCategoryName.trim(),
                          });
                          setNewCategoryName("");
                          setNewCategoryMode(false);
                        }
                      }}
                    >
                      Save
                    </button>
                  </div>
                )}

                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full p-2 rounded"
                  required
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full p-2 rounded"
                />
                <button
                  type="submit"
                  className="bg-white px-4 py-2 rounded-md font-bold border hover:bg-gray-200 transition w-full"
                >
                  Save
                </button>
              </form>
            ) : (
              <>
                {transactions.length === 0 && <p>No transactions yet.</p>}
                {transactions.map((tx, idx) => (
                  <p key={idx} className="m-2">
                    {tx.category} – {currency}
                    {tx.amount}
                  </p>
                ))}
                <button
                  className="!rounded-2xl p-6 w-30 border-2 border-black mt-4 bg-white px-4 py-2 rounded-md font-bold border hover:bg-gray-200 transition w-full"
                  onClick={() => {
                    setForm({
                      date: new Date().toISOString().slice(0, 10),
                      category: "",
                      amount: "",
                      description: "",
                    });
                    setShowForm(true);
                  }}
                >
                  Create New
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
