const BASE_URL = 'http://localhost:5001/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE INTEGRATION TESTING ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failCount++;
    }
  }

  try {
    const timestamp = Date.now();
    const testEmail1 = `user_${timestamp}@example.com`;
    const testEmail2 = `user2_${timestamp}@example.com`;

    // 1. User 1 Registration
    console.log('\n1. Testing User Registration...');
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Alex Rivera',
        email: testEmail1,
        password: 'password123',
        confirmPassword: 'password123',
        currency: '$'
      }
    });
    assert(regRes.status === 201 && regRes.data.token, 'User 1 registered with JWT token');
    const token1 = regRes.data.token;
    const headers1 = { Authorization: `Bearer ${token1}` };

    // 2. User 1 Login
    console.log('\n2. Testing User Login...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: 'password123'
      }
    });
    assert(loginRes.status === 200 && loginRes.data.user.email === testEmail1, 'User 1 logged in successfully');

    // 3. Check Default Categories Seeding
    console.log('\n3. Testing Category Seeding...');
    const catRes = await request('/categories', { headers: headers1 });
    assert(catRes.data.categories.length >= 10, `Default categories automatically seeded (${catRes.data.categories.length} categories)`);

    // 4. Create Custom Category
    console.log('\n4. Testing Custom Category Creation...');
    const newCatRes = await request('/categories', {
      method: 'POST',
      headers: headers1,
      body: {
        name: 'Pet Care',
        type: 'expense',
        color: '#ec4899',
        icon: 'Heart'
      }
    });
    assert(newCatRes.status === 201 && newCatRes.data.category.name === 'Pet Care', 'Custom category "Pet Care" created');

    // 5. Income CRUD
    console.log('\n5. Testing Income Management...');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const incRes1 = await request('/income', {
      method: 'POST',
      headers: headers1,
      body: {
        title: 'Senior Software Engineer Salary',
        amount: 6500,
        category: 'Salary',
        date: new Date(currentYear, currentMonth - 1, 1),
        paymentSource: 'Direct Deposit',
        description: 'Monthly payroll'
      }
    });
    assert(incRes1.status === 201 && incRes1.data.income.amount === 6500, 'Income record 1 created ($6,500)');

    const incRes2 = await request('/income', {
      method: 'POST',
      headers: headers1,
      body: {
        title: 'Consulting Project',
        amount: 1200,
        category: 'Freelancing',
        date: new Date(currentYear, currentMonth - 1, 5),
        paymentSource: 'Bank Transfer',
        description: 'Advisory engagement'
      }
    });
    assert(incRes2.status === 201, 'Income record 2 created ($1,200)');

    const getIncRes = await request('/income', { headers: headers1 });
    assert(getIncRes.data.totalAmount === 7700, `Total filtered income matches $7,700 (Actual: ${getIncRes.data.totalAmount})`);

    // 6. Budget Creation & Management
    console.log('\n6. Testing Budget Creation & Management...');
    const budgetRes1 = await request('/budgets', {
      method: 'POST',
      headers: headers1,
      body: {
        name: 'Food & Dining Cap',
        amount: 600,
        category: 'Food',
        month: currentMonth,
        year: currentYear,
        description: 'Target monthly budget for groceries and restaurants'
      }
    });
    assert(budgetRes1.status === 201 && budgetRes1.data.budget.amount === 600, 'Food budget created ($600)');

    const budgetRes2 = await request('/budgets', {
      method: 'POST',
      headers: headers1,
      body: {
        name: 'Transit & Fuel',
        amount: 250,
        category: 'Transportation',
        month: currentMonth,
        year: currentYear,
        description: 'Metro and gas'
      }
    });
    assert(budgetRes2.status === 201, 'Transportation budget created ($250)');

    // 7. Expense CRUD and Automated Budget Alerts
    console.log('\n7. Testing Expenses & Automated Budget Alert Thresholds...');
    // Add Expense 1: Food $300 (50% of $600 - safe)
    await request('/expenses', {
      method: 'POST',
      headers: headers1,
      body: {
        title: 'Grocery Store Essentials',
        amount: 300,
        category: 'Food',
        date: new Date(currentYear, currentMonth - 1, 3),
        paymentMethod: 'Credit Card',
        description: 'Weekly staples'
      }
    });

    // Add Expense 2: Food $200 (Total $500 = 83.3% of $600 -> Should trigger 80% Warning Alert!)
    const expRes2 = await request('/expenses', {
      method: 'POST',
      headers: headers1,
      body: {
        title: 'Organic Market & Provisions',
        amount: 200,
        category: 'Food',
        date: new Date(currentYear, currentMonth - 1, 8),
        paymentMethod: 'Debit Card',
        description: 'Specialty groceries'
      }
    });
    assert(expRes2.data.budgetStatus?.threshold === '80', 'Expense triggered 80% budget warning threshold');

    // Add Expense 3: Food $150 (Total $650 > $600 -> Should trigger Exceeded Alert!)
    const expRes3 = await request('/expenses', {
      method: 'POST',
      headers: headers1,
      body: {
        title: 'Dinner at Bistro',
        amount: 150,
        category: 'Food',
        date: new Date(currentYear, currentMonth - 1, 12),
        paymentMethod: 'Credit Card',
        description: 'Dining out'
      }
    });
    assert(expRes3.data.budgetStatus?.threshold === 'exceeded', 'Expense triggered Budget Exceeded alert threshold');

    // 8. Notification System Verification
    console.log('\n8. Testing Notifications System...');
    const notifRes = await request('/notifications', { headers: headers1 });
    assert(notifRes.data.notifications.length >= 2, `Automated notifications generated (${notifRes.data.notifications.length} notifications)`);
    assert(notifRes.data.unreadCount >= 2, `Unread count tracked (${notifRes.data.unreadCount} unread)`);

    const notifId = notifRes.data.notifications[0]._id;
    const markReadRes = await request(`/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: headers1
    });
    assert(markReadRes.data.notification.isRead === true, 'Single notification marked as read');

    await request('/notifications/read-all', {
      method: 'PATCH',
      headers: headers1
    });
    const notifAllReadRes = await request('/notifications', { headers: headers1 });
    assert(notifAllReadRes.data.unreadCount === 0, 'All notifications marked as read (unread count = 0)');

    // 9. Savings Goals & Ledger
    console.log('\n9. Testing Savings Goal Management...');
    const goalRes = await request('/savings', {
      method: 'POST',
      headers: headers1,
      body: {
        goalName: 'Emergency Reserve',
        targetAmount: 2000,
        currentAmount: 500,
        targetDate: new Date(currentYear + 1, 0, 1),
        description: '6-month emergency buffer'
      }
    });
    assert(goalRes.status === 201 && goalRes.data.goal.currentAmount === 500, 'Savings goal created with $500 initial amount');
    const goalId = goalRes.data.goal._id;

    // Deposit to goal
    const depositRes = await request(`/savings/${goalId}/transactions`, {
      method: 'POST',
      headers: headers1,
      body: {
        amount: 1000,
        transactionType: 'deposit',
        description: 'Allocation from bonus'
      }
    });
    assert(depositRes.data.goal.currentAmount === 1500 && depositRes.data.goal.progress === 75, 'Deposit recorded, goal progress is 75%');

    // Withdrawal from goal
    const withdrawRes = await request(`/savings/${goalId}/transactions`, {
      method: 'POST',
      headers: headers1,
      body: {
        amount: 200,
        transactionType: 'withdrawal',
        description: 'Minor dental procedure'
      }
    });
    assert(withdrawRes.data.goal.currentAmount === 1300, 'Withdrawal of $200 recorded, new balance is $1300');

    // Reach 100% completion
    const completeRes = await request(`/savings/${goalId}/transactions`, {
      method: 'POST',
      headers: headers1,
      body: {
        amount: 700,
        transactionType: 'deposit',
        description: 'Final top up'
      }
    });
    assert(completeRes.data.goal.status === 'completed' && completeRes.data.newlyCompleted === true, 'Goal achieved! Status is completed & celebratory event emitted');

    // 10. Financial Calculations & Reports
    console.log('\n10. Testing Financial Calculations & Reports...');
    const overviewRes = await request(`/reports/overview?month=${currentMonth}&year=${currentYear}`, { headers: headers1 });
    const s = overviewRes.data.summary;
    assert(s.totalIncome === 7700, `Report total income is $7,700 (Actual: ${s.totalIncome})`);
    assert(s.totalExpenses === 650, `Report total expenses is $650 (Actual: ${s.totalExpenses})`);
    assert(s.availableBalance === 7050, `Available balance = Total Income - Total Expenses ($7,050, Actual: ${s.availableBalance})`);
    assert(s.totalSavings === 2000, `Total savings tracked ($2,000, Actual: ${s.totalSavings})`);

    // 11. Centralized Transactions
    console.log('\n11. Testing Centralized Transaction Ledger...');
    const txRes = await request('/transactions', { headers: headers1 });
    assert(txRes.data.transactions.length === 5, `Centralized transactions combines incomes & expenses (Count: ${txRes.data.transactions.length})`);
    assert(txRes.data.summary.netBalance === 7050, `Transaction ledger net cash flow is $7,050`);

    // 12. Security & User Isolation
    console.log('\n12. Testing Security & User Data Isolation...');
    const regRes2 = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Jordan Smith',
        email: testEmail2,
        password: 'password456',
        confirmPassword: 'password456'
      }
    });
    const token2 = regRes2.data.token;
    const headers2 = { Authorization: `Bearer ${token2}` };

    const user2Incomes = await request('/income', { headers: headers2 });
    assert(user2Incomes.data.incomes.length === 0, 'User 2 sees 0 income records (isolated from User 1)');

    const user2Expenses = await request('/expenses', { headers: headers2 });
    assert(user2Expenses.data.expenses.length === 0, 'User 2 sees 0 expense records (isolated from User 1)');

    const user2Budgets = await request('/budgets', { headers: headers2 });
    assert(user2Budgets.data.budgets.length === 0, 'User 2 sees 0 budgets (isolated from User 1)');

    const user2Savings = await request('/savings', { headers: headers2 });
    assert(user2Savings.data.goals.length === 0, 'User 2 sees 0 savings goals (isolated from User 1)');

    // 13. Profile Update & Password Change
    console.log('\n13. Testing Profile Update & Password Verification...');
    const profileUpdateRes = await request('/profile', {
      method: 'PUT',
      headers: headers1,
      body: {
        name: 'Alex Rivera, CFA',
        currency: '€'
      }
    });
    assert(profileUpdateRes.data.user.name === 'Alex Rivera, CFA' && profileUpdateRes.data.user.currency === '€', 'User profile updated');

    const passChangeRes = await request('/profile/change-password', {
      method: 'PUT',
      headers: headers1,
      body: {
        currentPassword: 'password123',
        newPassword: 'newpassword789',
        confirmPassword: 'newpassword789'
      }
    });
    assert(passChangeRes.data.success === true, 'Password changed successfully');

    // Verify login with new password works
    const newLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: 'newpassword789'
      }
    });
    assert(newLoginRes.status === 200, 'Login with new password succeeded');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Fatal error during test run:', err);
  }
}

runTests();
