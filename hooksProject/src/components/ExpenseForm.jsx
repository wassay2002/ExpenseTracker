import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function ExpenseForm({ onSaved, categories, onAddCategory }) {
  const [form, setForm] = useState({
    date: '',
    category: '',
    amount: '',
    description: ''
  });

  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaved(form);
    setForm({ date: '', category: '', amount: '', description: '' });
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      await onAddCategory(newCategoryName.trim());
      setForm({ ...form, category: newCategoryName.trim() });
      setNewCategoryName('');
      setNewCategoryMode(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-100 rounded-xl p-4 shadow-md w-full max-w-md space-y-2">
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
          if (e.target.value === '__new__') {
            setNewCategoryMode(true);
            setForm({ ...form, category: '' });
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
          <option key={cat.name} value={cat.name}>{cat.name}</option>
        ))}
        <option value="__new__">➕ Add New Category</option>
      </select>

      {newCategoryMode && (
        <div className="flex gap-2">
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
            onClick={handleAddCategory}
            className="bg-white px-2 py-1 rounded font-bold border hover:bg-gray-200 transition"
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
  );
}

ExpenseForm.propTypes = {
  onSaved: PropTypes.func.isRequired,
  categories: PropTypes.array.isRequired,
  onAddCategory: PropTypes.func.isRequired
};
