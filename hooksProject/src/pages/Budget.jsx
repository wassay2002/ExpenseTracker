import React, { useEffect, useState, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import {
  getCategories,
  initDB,
  addCategory,
  setBudget,
  getBudget,
  getCategorySpending,
  updateCategory,
} from "../db"; 
import { useAuth } from "../hooks/useAuth";

ChartJS.register(ArcElement, Tooltip);

export default function BudgetDashboard() {
  const { user } = useAuth();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [totalBudget, setTotalBudget] = useState(25000);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const uid = user?.email || "defaultUser";
      await initDB();
      const cats = await getCategories(uid);
      const budget = await getBudget(uid);
      const categorySpending = await getCategorySpending(uid); 

      const formattedCats = cats.map((c) => ({
        ...c,
        amount: categorySpending[c.name] || 0,
        budget: c.budget || 0,  // <--- include budget field
      }));

      setCategories(formattedCats);
      setTotalBudget(budget || 0);
      setSelectedCategory(formattedCats[0] || null);
    };

    fetchData();
  }, [user?.email]);

  const selectedSpent = selectedCategory?.amount || 0;
  const selectedBudget = selectedCategory?.budget || 0;
  const selectedRemaining = Math.max(selectedBudget - selectedSpent, 0);

  const chartData = useMemo(() => {
    if (!selectedCategory) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: ["Spent", "Remaining"],
      datasets: [
        {
          data: [selectedSpent, selectedRemaining],
          backgroundColor: ["#5C6CFF", "#000"],
          borderWidth: 0,
          cutout: "80%",
        },
      ],
    };
  }, [selectedSpent, selectedRemaining, selectedCategory]);

  const chartOptions = {
    cutout: "80%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  const handleBudgetChange = (e) => {
    setTotalBudget(Number(e.target.value));
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
  };

  const handleBudgetEdit = (name, newBudget) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.name === name ? { ...cat, budget: parseFloat(newBudget) } : cat
      )
    );
  };

  const handleSave = async () => {
    const uid = user?.email || "defaultUser";

    await setBudget(uid, totalBudget);

    for (const cat of categories) {
      await updateCategory(uid, cat); // saving individual budgets
    }

    setShowCustomizer(false);
    setShowNewCategory(false);
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const uid = user?.email || "defaultUser";
      await addCategory(uid, { name: newCategoryName, amount: 0, budget: 0 });

      const updated = await getCategories(uid);
      const categorySpending = await getCategorySpending(uid);

      const formattedCats = updated.map(c => ({
        ...c,
        amount: categorySpending[c.name] || 0,
        budget: c.budget || 0,
      }));

      setCategories(formattedCats);
      setNewCategoryName("");
      setShowNewCategory(false);
    }
  };

  const spent = categories.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = totalBudget - spent;

  const daysLeft = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return lastDay - today.getDate();
  }, []);

  return (
    <div>
      {/* Budget Title */}
      <h1 className="btn blue flex justify-center">Budget</h1>

      <style>{`
        .btn {
          padding: 8px 20px;
          border: 2px solid black;
          border-radius: 20px;
          font-weight: bold;
          font-size: 20px;
          background-color: white;
          cursor: pointer;
          max-width: 180px;
          margin: 0 auto;
        }
        .btn.blue {
          background-color: #4a80ff;
          color: black;
          box-shadow: 3px 3px 0 black;
          margin-bottom: 15px;
        }
      `}</style>

      <div className="flex flex-col md:flex-row items-center justify-center gap-12 p-6 font-sans bg-white text-black">
        
        {/* Left Circular Chart */}
        {chartData && (
          <div className="relative w-44 h-44 flex justify-center items-center">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-semibold">{selectedCategory?.name || "Category"}</p>
              <button
                onClick={() => setShowCustomizer(true)}
                className="font-semibold text-xs px-3 py-1 mt-1 bg-blue-500 border border-black border-2 rounded-full shadow-sm hover:bg-blue-600"
              >
                See Others
              </button>
            </div>
          </div>
        )}

        {/* Right Side */}
        <div className="flex flex-col items-center justify-center gap-4 px-4 sm:px-0">
          
          {!showCustomizer && (
            <div className="text-left">
              <p className="text-[30px] font-bold mb-1 flex justify-center">Total Budget</p>
              <div className="flex text-white font-bold rounded overflow-hidden">
                <div className="flex h-10 w-[300px] rounded overflow-hidden text-white font-bold text-sm">
                  <div
                    className="bg-blue-500 flex items-center justify-center px-2 overflow-hidden whitespace-nowrap"
                    style={{ flexGrow: spent, minWidth: "60px" }}
                  >
                    ${spent.toLocaleString()}
                  </div>
                  <div
                    className="bg-black flex items-center justify-center px-2 overflow-hidden whitespace-nowrap"
                    style={{ flexGrow: remaining, minWidth: "60px" }}
                  >
                    ${remaining.toLocaleString()}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-lg font-bold text-center">{daysLeft} Days Left in this Budget!</p>
            </div>
          )}

          {/* Customize Budget Button */}
          {!showCustomizer && !showNewCategory && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCustomizer(true)}
                className="bg-blue-500 border-2 border-black text-black font-bold px-5 py-2 rounded-full hover:bg-blue-600"
              >
                Customize Budget
              </button>
              <button
                onClick={() => setShowNewCategory(true)}
                className="bg-blue-500 border-2 border-black text-black font-bold px-5 py-2 rounded-full hover:bg-blue-600"
              >
                Create New Category
              </button>
            </div>
          )}

          {/* Customize Budget Modal */}
          {showCustomizer && (
            <div className="relative bg-blue-500 rounded-lg p-4 text-white w-full max-w-sm shadow-lg sm:w-80">
              <button
                onClick={handleSave}
                className="absolute top-2 right-2 font-bold text-black hover:text-red-500"
              >
                ×
              </button>
              <h2 className="text-center text-md font-bold mb-4 text-black">Customize your Budget</h2>

              <div className="flex justify-between items-center bg-white text-black px-4 py-2 rounded-full mb-2">
                <span>Total Budget</span>
                <input
                  type="number"
                  className="bg-black text-white rounded-full px-4 py-1 w-24 text-right"
                  value={totalBudget}
                  onChange={handleBudgetChange}
                />
              </div>

              {categories.map((cat, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-white text-black px-4 py-2 rounded-full mb-2"
                  onClick={() => handleCategorySelect(cat)}
                >
                  <span>{cat.name}</span>
                  <input
                    type="number"
                    value={cat.budget}
                    onChange={(e) => handleBudgetEdit(cat.name, e.target.value)}
                    className="bg-black text-white rounded-full px-4 py-1 w-24 text-right"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add New Category Modal */}
          {showNewCategory && (
            <div className="relative bg-blue-500 rounded-lg p-4 text-white w-64 shadow-lg">
              <button
                onClick={() => setShowNewCategory(false)}
                className="absolute top-2 right-2 font-bold text-black hover:text-red-500"
              >
                ×
              </button>
              <h2 className="text-center text-md font-bold mb-3 text-black">Create New Category</h2>
              <input
                type="text"
                placeholder="Name your Category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 rounded-full text-black mb-3"
              />
              <button
                onClick={handleAddCategory}
                className="bg-black text-white px-4 py-2 rounded-full w-full font-semibold"
              >
                Add Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Spending Indicator */}
      <div className="mt-4 text-sm text-center">
        <div className="flex justify-center items-center gap-2 mb-1">
          <span className="w-3 h-3 bg-[#5C6CFF] rounded-full inline-block"></span>
          <span>Total Spending</span>
        </div>
        <div className="flex justify-center items-center gap-2">
          <span className="w-3 h-3 bg-black rounded-full inline-block"></span>
          <span>Remaining Budget</span>
        </div>
      </div>
    </div>
  );
}
