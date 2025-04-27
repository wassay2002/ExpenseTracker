import React, { useEffect, useState } from "react";
import { getExpenses, initDB } from "../db";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Expense = () => {
  const { user } = useAuth();
  const userId = user?.email || "defaultUser";
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(""); 
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      await initDB();
      const all = await getExpenses(userId);
      setExpenses(all);
    };
    fetchData();
  }, [userId]);

  const deleteExpenseById = async (id) => {
    const db = await initDB();
    await db.delete("expenses", id);
    const updated = await getExpenses(userId);
    setExpenses(updated);
    setCurrentPage(1); 
  };

  const filteredExpenses = expenses.filter((exp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      exp.category.toLowerCase().includes(searchLower) ||
      exp.description.toLowerCase().includes(searchLower) ||
      exp.date.includes(searchLower)
    );
  });

  const downloadCSV = () => {
    const headers = ["Date", "Category", "Amount", "Description"];
    const rows = expenses.map(exp => [
      exp.date, exp.category, exp.amount, exp.description
    ]);
  
    let csvContent = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map(e => e.join(",")).join("\n");
  
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  
  const visibleExpenses = filteredExpenses.slice(0, currentPage * itemsPerPage);

  return (
    <div className="p-6">
      <div className="flex ">
      <h1 className="btn blue flex justify-center">Expenses</h1>
        <button
          onClick={downloadCSV}
          className="bg-blue-500 text-black border-2 border-black rounded-full font-bold px-6 py-2 mb-4 hover:bg-blue-600"
        >
          Export to CSV
        </button>
        {/* Search Box */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search by category, description, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-black rounded-full px-4 py-2 text-center ml-2"
        />
      </div>
        </div>
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

      {filteredExpenses.length === 0 ? (
        <p className="pt-5 text-gray-500 text-center">No expenses found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {visibleExpenses.map((expense) => (
                <tr key={expense.id} className="border-t border-gray-200 even:bg-gray-200">
                  <td className="py-2 px-4 font-semibold">{expense.date}</td>
                  <td className="py-2 px-4 font-semibold">{expense.category}</td>
                  <td className="py-2 px-4 font-semibold">${expense.amount}</td>
                  <td className="py-2 px-4 font-semibold">{expense.description}</td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => deleteExpenseById(expense.id)}
                      className="text-red-500 hover:text-red-700 transition font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Arrow Button for Pagination */}
          {/* Arrow Button for Pagination */}
{currentPage * itemsPerPage < expenses.length && (
  <div className="text-right mt-6">
    <button
      onClick={() => setCurrentPage((prev) => prev + 1)}
      className="w-10 h-10 border border-black rounded-full flex items-center justify-center transition-transform duration-300 ease-in-out mx-auto"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="black"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
)}

        </div>
      )}

      {/* Create New Button */}
      <div className="text-center mt-6">
        <button
          className="bg-black text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 transition border-2 border-blue-500 font-bold w-40"
          onClick={() => navigate("/dashboard", { state: { fromExpenses: true } })}
        >
          Create New
        </button>
      </div>
    </div>
  );
};

export default Expense;
