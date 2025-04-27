import { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import { useAuth } from "../hooks/useAuth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  getGlobalExpensesByRange,
  getGlobalExpensesByCategoryInRange,
  getCategories,
  initDB,
} from "../db"; // adjust path if needed

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const userId = user?.email;
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [lineData, setLineData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]); // MULTI SELECT
  const [mode, setMode] = useState("week");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const [summaryStats, setSummaryStats] = useState({
    highestCategory: null,
    peakDay: null,
    avgDaily: 0,
  });

  const formatChartData = (expenses) => {
    const dateMap = {};
    expenses.forEach((exp) => {
      const date = new Date(exp.date).toISOString().slice(0, 10);
      dateMap[date] = (dateMap[date] || 0) + Number(exp.amount);
    });
    const labels = Object.keys(dateMap).sort();
    const data = labels.map((date) => dateMap[date]);

    return {
      labels,
      datasets: [
        {
          label: "Spending",
          data,
          borderColor: "#5271ff",
          backgroundColor: "rgba(74, 128, 255, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const formatBarData = (expenses) => {
    const catMap = {};
    expenses.forEach((exp) => {
      const cat = typeof exp.category === "string"
        ? exp.category
        : exp.category?.name || "Other";
      catMap[cat] = (catMap[cat] || 0) + Number(exp.amount);
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => cat);   // No slice
    const data = sorted.map(([_, amt]) => amt);

    return {
      labels,
      datasets: [
        {
          label: "Category Spending",
          data,
          backgroundColor: ["#6edfff", "#4ab8ff", "#3a9fff", "#2c88ff"],
        },
      ],
    };
  };

  const getDateRange = (daysAgo) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  };

  const fetchData = async (userId) => {
    let range;
    if (mode === "week") {
      range = getDateRange(7);
    } else if (mode === "month") {
      range = getDateRange(30);
    } else {
      range = customRange;
    }

    let expenses;
    if (selectedCategories.length > 0) {
      const allExpenses = [];
      for (const cat of selectedCategories) {
        const catExpenses = await getGlobalExpensesByCategoryInRange(
          userId,
          cat,
          range.start,
          range.end
        );
        allExpenses.push(...catExpenses);
      }
      expenses = allExpenses;
    } else {
      expenses = await getGlobalExpensesByRange(userId, range.start, range.end);
    }

    setLineData(formatChartData(expenses));
    setBarData(formatBarData(expenses));
    calculateSummaryStats(expenses);
  };

  const calculateSummaryStats = (expenses) => {
    if (!expenses.length) return;

    const catTotals = {};
    const dateTotals = {};
    let totalAmount = 0;
    const daySet = new Set();

    expenses.forEach((exp) => {
      const cat = typeof exp.category === "string"
        ? exp.category
        : exp.category?.name || "Other";
      const date = new Date(exp.date).toISOString().slice(0, 10);

      catTotals[cat] = (catTotals[cat] || 0) + Number(exp.amount);
      dateTotals[date] = (dateTotals[date] || 0) + Number(exp.amount);
      totalAmount += Number(exp.amount);
      daySet.add(date);
    });

    const [topCat, topAmount] = Object.entries(catTotals).sort(
      (a, b) => b[1] - a[1]
    )[0] || ["-", 0];
    const [peakDay] = Object.entries(dateTotals).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    const avgDaily = totalAmount / (daySet.size || 1);

    setSummaryStats({
      highestCategory: `${topCat} - $${topAmount.toFixed(2)}`,
      peakDay,
      avgDaily: avgDaily.toFixed(2),
    });
  };

  useEffect(() => {
    if (!userId) return;
    const init = async () => {
      await initDB();
      await fetchData(userId);
      const allCats = await getCategories(userId);
      setCategories(allCats);
    };
    init();
  }, [userId, mode, selectedCategories, customRange]);

  const handleCustomRange = () => {
    const start = prompt("Enter start date (YYYY-MM-DD):");
    const end = prompt("Enter end date (YYYY-MM-DD):");
    if (start && end) {
      setCustomRange({ start, end });
      setMode("custom");
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 lg:p-10">
      <h1 className="btn blue mb-10">Analytics</h1>

      <div className="flex flex-col sm:flex-row justify-around w-full">

        {/* Line Chart */}
        <div className="w-full sm:w-2/5 mb-6 sm:mb-0">
          {lineData ? <Line data={lineData} /> : <p>No data available</p>}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 sm:gap-5 mb-6 sm:mb-0">

          {/* Category Selector */}
          {showCategorySelector ? (
            <div className="bg-blue-500 rounded-lg p-4 text-white w-64 shadow-lg relative">
              <button
                onClick={() => setShowCategorySelector(false)}
                className="absolute top-2 right-2 font-bold text-black hover:text-red-500"
              >
                ×
              </button>
              <h2 className="text-center text-md font-bold mb-3 text-black">
                Select Categories
              </h2>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      if (selectedCategories.includes(cat.name)) {
                        setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                      } else {
                        setSelectedCategories([...selectedCategories, cat.name]);
                      }
                    }}
                    className={`bg-white text-black font-semibold px-3 py-2 rounded-full hover:bg-gray-200 ${
                      selectedCategories.includes(cat.name) ? 'bg-gray-300' : ''
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <button className="btn w-full sm:w-auto" onClick={() => setMode("week")}>
                Last Week
              </button>
              <button className="btn w-full sm:w-auto" onClick={() => setMode("month")}>
                Last Month
              </button>
              <button className="btn w-full sm:w-auto" onClick={handleCustomRange}>
                Custom
              </button>
              <button
                className="btn w-full sm:w-auto"
                onClick={() => setShowCategorySelector(true)}
              >
                Categories
              </button>
              {selectedCategories.length > 0 && (
                <button
                  className="btn w-full sm:w-auto"
                  onClick={() => setSelectedCategories([])}
                >
                  Clear Categories
                </button>
              )}
            </>
          )}
        </div>

        {/* Bar Chart */}
        <div className="w-full sm:w-2/5">
          {barData ? <Bar data={barData} /> : <p>No data available</p>}
        </div>

      </div>

      {/* Bottom Summary Cards */}
      <div className="flex flex-col sm:flex-row justify-around mt-6 w-full">
        <div className="summary-card">
          Highest Spending by Category<br />
          {summaryStats.highestCategory || "-"}
        </div>
        <div className="summary-card">
          Day with Highest Spending<br />
          {summaryStats.peakDay || "-"}
        </div>
        <div className="summary-card">
          Average Daily Spending<br />
          ${summaryStats.avgDaily}
        </div>
        <div className="summary-card bg-gray-100 text-black border border-gray-400 hover:scale-100">
          Expected Spending for Rest of Month<br />
          ${(30 - new Date().getDate()) * summaryStats.avgDaily}
        </div>
      </div>

      {/* Button CSS */}
      <style>{`
        .btn {
          padding: 10px 20px;
          border: 2px solid black;
          border-radius: 20px;
          font-weight: bold;
          background-color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn.blue {
          background-color: #5271ff;
          color: black;
          box-shadow: 3px 3px 0 black;
        }
        .btn:hover {
          transform: scale(1.05);
          background-color: #e0e0e0;
        }
        .summary-card {
          background-color: #5271ff;
          color: black;
          margin-top: 15px;
          padding: 15px 25px;
          border-radius: 20px;
          font-weight: bold;
          text-align: center;
          font-size: 14px;
          border: 2px solid #333;
        }
        .summary-card:hover {
          transform: scale(1.05);
        }
      `}</style>

    </div>
  );
};

export default AnalyticsDashboard;
