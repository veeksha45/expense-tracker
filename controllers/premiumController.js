const { User, Expense } = require('../db');
const { Parser } = require('json2csv');
const { Op } = require('sequelize');

// Show Leaderboard
exports.showLeaderboard = async (req, res) => {
  const leaderboard = await User.findAll({
    attributes: ['name', 'totalExpense'],
    order: [['totalExpense', 'DESC']]
  });
  res.json(leaderboard);
};

// Filtered Report
exports.filteredReport = async (req, res) => {
  const { filter } = req.query;
  const userId = req.user.userId;

  let where = { userId };
  const today = new Date();

  if (filter === 'daily') {
    where.date = today.toISOString().split('T')[0];
  } else if (filter === 'monthly') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    where.date = { [Op.gte]: monthStart };
  } else if (filter === 'yearly') {
    const yearStart = new Date(today.getFullYear(), 0, 1);
    where.date = { [Op.gte]: yearStart };
  }

  const expenses = await Expense.findAll({ where, order: [['date', 'DESC']] });

  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  res.json({ expenses, total });
};

// Download CSV
exports.downloadReport = async (req, res) => {
  const { filter, date, month, year } = req.query;
  const userId = req.user.userId;

  let where = { userId };
  const today = new Date();

  if (filter === 'daily' && date) {
    // Use the provided date
    where.date = date;
  } else if (filter === 'daily') {
    // Default to today if no date provided
    where.date = today.toISOString().split('T')[0];
  } else if (filter === 'monthly' && month) {
    // Parse the month input (YYYY-MM format)
    const [selectedYear, selectedMonth] = month.split('-');
    const monthStart = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
    const monthEnd = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
    where.date = { 
      [Op.gte]: monthStart.toISOString().split('T')[0],
      [Op.lte]: monthEnd.toISOString().split('T')[0]
    };
  } else if (filter === 'monthly') {
    // Default to current month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    where.date = { 
      [Op.gte]: monthStart.toISOString().split('T')[0],
      [Op.lte]: monthEnd.toISOString().split('T')[0]
    };
  } else if (filter === 'yearly' && year) {
    // Use the provided year
    const yearStart = new Date(parseInt(year), 0, 1);
    const yearEnd = new Date(parseInt(year), 11, 31);
    where.date = { 
      [Op.gte]: yearStart.toISOString().split('T')[0],
      [Op.lte]: yearEnd.toISOString().split('T')[0]
    };
  } else if (filter === 'yearly') {
    // Default to current year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    where.date = { 
      [Op.gte]: yearStart.toISOString().split('T')[0],
      [Op.lte]: yearEnd.toISOString().split('T')[0]
    };
  }
  // If filter is 'all', no date filtering is applied

  const expenses = await Expense.findAll({
    where,
    attributes: ['date', 'time', 'amount', 'description', 'category'],
    order: [['date', 'DESC']]
  });

  const rows = expenses.map(e => ({
    Date: e.date,
    Time: e.time || '',
    Amount: e.amount,
    Description: e.description,
    Category: e.category
  }));

  const parser = new Parser({ fields: ['Date', 'Time', 'Amount', 'Description', 'Category'] });
  const csv = parser.parse(rows);

  res.header('Content-Type', 'text/csv');
  res.attachment(`expense_${filter}_report.csv`);
  res.send(csv);
};
