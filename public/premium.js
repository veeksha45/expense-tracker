document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('token');
  if (!token) return window.location.href = '/login';

  const form = document.getElementById('expenseForm');
  const expenseList = document.getElementById('expenseList');
  const submitBtn = document.getElementById('submitBtn');
  const pageSize = document.getElementById('pageSize');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const leaderboardDiv = document.getElementById('leaderboard');

  const downloadDailyReport = document.getElementById('downloadDailyReport');
  const downloadMonthlyReport = document.getElementById('downloadMonthlyReport');
  const downloadYearlyReport = document.getElementById('downloadYearlyReport');
  const downloadAllExpenses = document.getElementById('downloadAllExpenses');

  let editingId = null;
  let currentPage = 1;
  let limit = parseInt(pageSize.value);
  let currentFilter = '';

  function fetchExpenses() {
    fetch(`/api/expenses?page=${currentPage}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json()).then(data => {
        expenseList.innerHTML = '';
        data.expenses.forEach(exp => {
          const div = document.createElement('div');
          div.className = 'expense-item';
          div.innerHTML = `
            <div class="expense-content">
              <div class="expense-info">
                <div class="expense-amount">₹${exp.amount}</div>
                <div class="expense-description">${exp.description}</div>
                <div class="expense-meta">
                  <span><i class="fas fa-tag"></i> ${exp.category}</span>
                  <span><i class="fas fa-calendar"></i> ${exp.date}</span>
                  ${exp.note ? `<span><i class="fas fa-sticky-note"></i> ${exp.note}</span>` : ''}
                </div>
              </div>
              <div class="expense-actions">
                <button data-id="${exp.id}" class="btn-small btn-edit edit-btn">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button data-id="${exp.id}" class="btn-small btn-delete delete-btn">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>`;
          expenseList.appendChild(div);
        });

        pageInfo.innerText = `Page ${data.currentPage} of ${data.totalPages}`;
        prevBtn.disabled = data.currentPage === 1;
        nextBtn.disabled = data.currentPage >= data.totalPages;

        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            fetch(`/api/expenses/${btn.dataset.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            }).then(fetchExpenses);
          });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const exp = data.expenses.find(e => e.id == btn.dataset.id);
            document.getElementById('amount').value = exp.amount;
            document.getElementById('description').value = exp.description;
            document.getElementById('note').value = exp.note || '';
            document.getElementById('category').value = exp.category;
            document.getElementById('date').value = exp.date || '';
            document.getElementById('time').value = exp.time || '';
            editingId = exp.id;
            submitBtn.innerText = 'Update Expense';
          });
        });
      });
  }

  prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; fetchExpenses(); } };
  nextBtn.onclick = () => { currentPage++; fetchExpenses(); };
  pageSize.onchange = () => { limit = parseInt(pageSize.value); currentPage = 1; fetchExpenses(); };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const expenseData = {
      amount: document.getElementById('amount').value,
      description: document.getElementById('description').value,
      note: document.getElementById('note').value,
      category: document.getElementById('category').value,
      date: document.getElementById('date').value,
      time: document.getElementById('time').value
    };

    const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses';
    const method = editingId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(expenseData)
    }).then(() => {
      editingId = null;
      submitBtn.innerText = 'Add Expense';
      form.reset();
      fetchExpenses();
    });
  });

  // Leaderboard functionality
  fetch('/api/premium/leaderboard', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.json()).then(data => {
    leaderboardDiv.innerHTML = '';
    data.forEach(user => {
      const div = document.createElement('div');
      div.className = 'leaderboard-item';
      div.innerHTML = `
        <span class="leaderboard-name">${user.name}</span>
        <span class="leaderboard-amount">₹${user.totalExpense}</span>
      `;
      leaderboardDiv.appendChild(div);
    });
  }).catch(() => {
    leaderboardDiv.innerHTML = '<div class="leaderboard-item"><span class="leaderboard-name">No data available</span><span class="leaderboard-amount">₹0</span></div>';
  });

  // Report download functionality
  downloadDailyReport.onclick = () => {
    const date = document.getElementById('dailyDate').value;
    if (!date) return alert('Please select a date first!');
    downloadReport('daily', { date });
  };

  downloadMonthlyReport.onclick = () => {
    const month = document.getElementById('monthlyDate').value;
    if (!month) return alert('Please select a month first!');
    downloadReport('monthly', { month });
  };

  downloadYearlyReport.onclick = () => {
    const year = document.getElementById('yearlyDate').value;
    if (!year) return alert('Please enter a year first!');
    downloadReport('yearly', { year });
  };

  downloadAllExpenses.onclick = () => {
    downloadReport('all');
  };

  function downloadReport(filter, params = {}) {
    const queryParams = new URLSearchParams({ filter, ...params });
    fetch(`/api/premium/download?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.blob()).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${filter}_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }).catch(err => {
      console.error('Download failed:', err);
      alert('Failed to download report. Please try again.');
    });
  }

  // Load user information
  fetch('/api/user', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.json()).then(data => {
      const usernameElement = document.getElementById('usernameBox');
      if (usernameElement) {
        usernameElement.innerText = data.name || 'User';
      }
    });

  fetchExpenses();
});
