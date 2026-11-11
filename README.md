# PlanWise — Budget Planning System (MERN Stack)

A complete, fully functional, responsive financial management and budget planning web application built using the **MERN Stack** (MongoDB, Express.js, React.js, and Node.js).

PlanWise enables individuals to take complete control of their personal finances through real-time income tracking, expense categorization, monthly budget monitoring with automated threshold alerts (80%, 100%, and exceeded), savings goal management with deposit/withdrawal ledgers, centralized transaction history, and interactive financial reports.

---

## Technology Stack

### Frontend
- **React.js** (Vite-based modern single-page architecture)
- **JavaScript (ES6+)**
- **HTML5 & CSS3** (Custom fintech design system, responsive grid & flexbox layouts)
- **React Router DOM** (Client-side routing with protected authenticated routes)
- **Axios** (REST API communication with request/response authorization interceptors)
- **Recharts** (Interactive financial charts: Donut, Income vs Expense Bars, Area Cashflow Trends, Budget Comparison Bars)
- **Context API** (`AuthContext` for global auth session & notification state management)
- **Lucide React** (Clean, consistent financial iconography)

### Backend
- **Node.js**
- **Express.js** (Modular REST API architecture)
- **MongoDB** (NoSQL database for persistent personal finance storage)
- **Mongoose ODM** (Schema validation, indexes, and aggregation pipelines)
- **JSON Web Tokens (JWT)** (Stateless secure authentication)
- **bcryptjs** (Salted password hashing)
- **Express Middleware** (JWT token verification, error handling, CORS, request logging)

---

## Key Modules & Features

### 1. User Authentication & Profile Management
- Secure user registration with validation (full name, email, password, confirm password, preferred currency).
- Automatic seeding of default income and expense categories upon account creation.
- JWT-based login with bcrypt password verification and token persistence.
- Session verification with automatic logout on token expiration.
- User profile updates (display name, currency preferences) and secure password change with verification.
- Protected route guards redirecting unauthenticated traffic to login.

### 2. Dashboard Module
- **Total Income**: Selected month's income with comparison vs. previous month.
- **Total Expenses**: Selected month's expenditures with comparison vs. previous month.
- **Available Balance**: Calculated as `Total Income - Total Expenses`.
- **Total Savings**: Cumulative amount allocated to savings goals.
- **Monthly Budget Overview**: Allocated budget, amount spent, remaining buffer, and utilization percentage.
- **Recent Transactions**: Real-time list of latest income and expense entries.
- **Expense Distribution**: Donut chart displaying spending by category with percentages.
- **Income vs Expense**: Grouped bar chart comparing the last 6 months of cash flow.
- **Category Budget Progress**: Color-coded progress indicators (Green <80%, Orange 80-100%, Red >100%).
- **Active Savings Goals**: Progress bars displaying targets and completion rates.
- **Date Selector**: Dynamic month and year selection updating all metrics.

### 3. Income Management Module
- Full CRUD operations: Record, view, edit, and delete income records.
- Fields: Title, amount, category, date received, description, payment source.
- Live search by title, description, or payment source.
- Filter by category and date range.
- Sort by date, amount, or title (ascending / descending).
- Automatic dynamic total calculation for filtered records.

### 4. Expense Management Module
- Full CRUD operations: Record, view, edit, and delete expenses.
- Fields: Title, amount, category, transaction date, payment method, description.
- Advanced filtering: Search by title/description, category, payment method, date range, and min/max amount.
- Sort by date, amount, or title.
- Automatic category-wise spending totals.
- **Real-time Budget Alert Trigger**: Immediately checks budget thresholds on expense creation/editing and generates alerts.

### 5. Monthly Budget Creation & Management Module
- Create category budgets with spending caps, target month/year, and optional guidelines.
- Dynamic monitoring:
  - Real-time calculation of spent amount from MongoDB expense records.
  - Remaining buffer: `Allocated Budget - Actual Expenses`.
  - Budget utilization: `(Actual Expenses / Allocated Budget) * 100`.
- Visual progress indicators:
  - **Green (Safe)**: Spending is below 80%.
  - **Orange (Warning)**: Spending reaches or exceeds 80% and is within 100%.
  - **Red (Exceeded)**: Spending exceeds 100% of the allocated cap.
- Monthly budget summary across all categories.

### 6. Expense & Income Categorization Module
- Built-in default categories for Income (Salary, Business, Freelancing, Investments, Rental Income, Other).
- Built-in default categories for Expenses (Food, Transportation, Shopping, Entertainment, Healthcare, Education, Housing, Bills & Utilities, Travel, Personal Care, Other).
- Full custom category management: Create, view, edit, and delete custom user categories with custom color palettes and icons.
- Usage protection: Prevents accidental deletion of categories currently used in active transactions.

### 7. Automated Budget Alerts & Notifications Module
- Automated threshold triggers:
  - **Budget Warning**: Generated when spending reaches 80% of budget.
  - **Budget Limit Reached**: Generated when spending reaches 100% of budget.
  - **Budget Exceeded**: Generated when spending surpasses the allocated budget.
- Automatic event deduplication within the monthly billing cycle.
- Top navigation bell icon with live unread counter badge.
- Interactive notification dropdown panel for rapid review.
- Full Notifications page supporting:
  - Unread filter toggle
  - Single mark-as-read
  - Mark all as read
  - Notification dismissal/deletion

### 8. Savings Goal Management Module
- Target-based savings tracking (goal name, target amount, initial amount, target date, description).
- Savings transaction ledger: Record contributions (deposits) and withdrawals with validation (prevents overdrawing).
- Dynamic progress calculation: `(Current Amount / Target Amount) * 100`.
- Automatic completion detection: Marks status as completed and creates a celebratory milestone alert upon reaching 100%.
- Transaction history modal displaying contribution dates and amounts.

### 9. Financial Reports & Analytics Module
- 6 Report Modes:
  1. **Overview Report**: Income, expenses, available balance, savings, monthly comparison.
  2. **Category-wise Report**: Grouped expenses and revenues with percentage shares.
  3. **Income Analysis**: Inflow trends, top payment sources, average inflow.
  4. **Expense Distribution**: Spending timeline, payment method breakdown, category shares.
  5. **Budget Performance**: Comparison of allocated budgets vs actual spending with surplus/deficit amounts.
  6. **Savings Progress**: Overall progress, milestones achieved, total deposited vs withdrawn.
- Date filters: Daily (today), Weekly (last 7 days), Monthly, Yearly, and Custom date ranges.
- One-click **CSV Export** for spreadsheets and **Print Report** styling.

### 10. Centralized Transaction History Module
- Unified view combining both Income and Expense transactions.
- Visual type indicators (+ Green for Income, - Red for Expense).
- Search by title and notes.
- Filter by transaction type, category, and date range.
- Sorting by date and amount.
- Detailed transaction inspection modal.
- Client-side and server-side pagination with record counters.

---

## User Interface & Design System

The UI was crafted following modern fintech design standards:
- **Palette**: Deep Navy Blue (`#0f172a`), Muted Teal (`#0d9488`), Soft Off-White background (`#f8fafc`), Clean White cards (`#ffffff`).
- **Semantic Accents**: Natural Emerald Green (`#10b981`) for positive cash flow, Muted Amber (`#f59e0b`) for warnings, Soft Crimson (`#ef4444`) for expenses and deficits.
- **Typography**: Clean hierarchy with tabular numerals for monetary figures.
- **Responsiveness**: Smooth collapsible sidebar on desktop, off-canvas sliding drawer on mobile, and responsive CSS grids adapting from 4 columns to 1 column.

---

## Project Structure

```
Budget Planning System/
├── backend/
│   ├── config/
│   │   └── db.js                   # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js       # Register, login, me, logout
│   │   ├── budgetController.js     # Budgets CRUD & spending calculation
│   │   ├── categoryController.js   # Category management
│   │   ├── expenseController.js    # Expense CRUD & threshold triggers
│   │   ├── incomeController.js     # Income CRUD & filtering
│   │   ├── notificationController.js # Alerts, unread tracking, mark-read
│   │   ├── profileController.js    # Profile & password updates
│   │   ├── reportController.js     # Analytical aggregates & charts
│   │   ├── savingsController.js    # Goals & savings ledger
│   │   └── transactionController.js # Unified transaction history
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification & route protection
│   │   └── errorMiddleware.js      # Global error & 404 handler
│   ├── models/
│   │   ├── Budget.js               # Budget Mongoose schema
│   │   ├── Category.js             # Category Mongoose schema
│   │   ├── Expense.js              # Expense Mongoose schema
│   │   ├── Income.js               # Income Mongoose schema
│   │   ├── Notification.js         # Notification Mongoose schema
│   │   ├── SavingsGoal.js          # Savings goal schema
│   │   ├── SavingsTransaction.js   # Savings deposit/withdrawal schema
│   │   └── User.js                 # User schema with bcrypt hooks
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── incomeRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── savingsRoutes.js
│   │   └── transactionRoutes.js
│   ├── utils/
│   │   ├── budgetChecker.js        # Automated alert logic & deduplication
│   │   └── defaultCategories.js    # Seeding template
│   ├── test_integration.js         # Automated end-to-end test suite
│   ├── .env                        # Local environment variables
│   ├── .env.example                # Example environment template
│   ├── package.json
│   └── server.js                   # Application entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChartComponents.jsx # Recharts charts (Donut, Bars, Area)
│   │   │   ├── Modal.jsx           # Accessible dialog with blur backdrop
│   │   │   ├── Navbar.jsx          # Top bar with notifications & profile
│   │   │   ├── NotificationPanel.jsx # Bell dropdown notification panel
│   │   │   ├── ProtectedRoute.jsx  # Auth guard
│   │   │   ├── Sidebar.jsx         # Collapsible desktop/mobile navigation
│   │   │   ├── SummaryCard.jsx     # Financial metric stat card
│   │   │   └── TransactionTable.jsx # Reusable transaction ledger table
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Auth state, session, unread counts
│   │   ├── pages/
│   │   │   ├── Budgets.jsx         # Monthly budget management
│   │   │   ├── Categories.jsx      # Category management
│   │   │   ├── Dashboard.jsx       # Overview dashboard
│   │   │   ├── Expenses.jsx        # Expense management
│   │   │   ├── Income.jsx          # Income management
│   │   │   ├── Login.jsx           # Sign in page
│   │   │   ├── Notifications.jsx   # Dedicated notifications page
│   │   │   ├── Profile.jsx         # User profile & security
│   │   │   ├── Register.jsx        # Account registration page
│   │   │   ├── Reports.jsx         # Reports & analytics with export
│   │   │   └── Transactions.jsx    # Unified transaction history
│   │   ├── services/
│   │   │   └── api.js              # Axios REST client with interceptors
│   │   ├── styles/
│   │   │   └── main.css            # Complete design system & tokens
│   │   ├── App.jsx                 # Route configurations
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .env.example
└── README.md
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18+ or v20+ (tested on Node v26)
- **MongoDB**: Running instance locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI.

### 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/budget_planning_system
   JWT_SECRET=budget_planning_system_super_secret_jwt_key_2026_finance_secure
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173
   ```
4. Start the backend server:
   ```bash
   npm start
   # or development mode:
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

### 2. Frontend Setup
1. In a new terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## Running the Automated Integration Test Suite

The system includes an automated end-to-end integration test suite covering all 13 core domains:
```bash
node backend/test_integration.js
```
The test suite automatically tests:
- User registration and token issuance
- User authentication and credential validation
- Automatic category seeding and custom category creation
- Income CRUD operations and total calculation
- Monthly budget creation and category limits
- Expense creation and real-time 80% & >100% threshold alert generation
- Automated notification generation, unread tracking, and mark-as-read
- Savings goal creation, deposit/withdrawal ledger, and 100% milestone completion
- Financial calculation logic (Available Balance, Savings Buffer, Budget Utilization)
- Multi-user data isolation and protected route security
- User profile updates and password changes

Result: **32 Tests Executed, 32 Passed, 0 Failed (100% Passing)**.

---

## REST API Reference

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register new user & seed categories | No |
| | `POST` | `/api/auth/login` | Login user & issue JWT | No |
| | `GET` | `/api/auth/me` | Fetch active user session | Yes |
| | `POST` | `/api/auth/logout` | Terminate session | No |
| **Profile** | `GET` | `/api/profile` | Get user profile info | Yes |
| | `PUT` | `/api/profile` | Update name and currency | Yes |
| | `PUT` | `/api/profile/change-password` | Update account password | Yes |
| **Income** | `GET` | `/api/income` | List incomes with search & filter | Yes |
| | `POST` | `/api/income` | Create new income record | Yes |
| | `GET` | `/api/income/:id` | Get income by ID | Yes |
| | `PUT` | `/api/income/:id` | Update income record | Yes |
| | `DELETE` | `/api/income/:id` | Delete income record | Yes |
| **Expenses** | `GET` | `/api/expenses` | List expenses with search & filter | Yes |
| | `POST` | `/api/expenses` | Create expense & trigger budget check | Yes |
| | `GET` | `/api/expenses/:id` | Get expense by ID | Yes |
| | `PUT` | `/api/expenses/:id` | Update expense & re-verify thresholds | Yes |
| | `DELETE` | `/api/expenses/:id` | Delete expense record | Yes |
| **Budgets** | `GET` | `/api/budgets` | List budgets with real-time spending | Yes |
| | `POST` | `/api/budgets` | Create category budget cap | Yes |
| | `GET` | `/api/budgets/:id` | Get budget by ID | Yes |
| | `PUT` | `/api/budgets/:id` | Update budget cap | Yes |
| | `DELETE` | `/api/budgets/:id` | Delete budget cap | Yes |
| **Savings** | `GET` | `/api/savings` | List savings goals with progress % | Yes |
| | `POST` | `/api/savings` | Create new savings goal | Yes |
| | `GET` | `/api/savings/:id` | Get goal details & transaction ledger | Yes |
| | `PUT` | `/api/savings/:id` | Update goal details | Yes |
| | `DELETE` | `/api/savings/:id` | Delete goal and history | Yes |
| | `POST` | `/api/savings/:id/transactions` | Record deposit or withdrawal | Yes |
| | `GET` | `/api/savings/:id/transactions` | Get goal transaction ledger | Yes |
| **Categories** | `GET` | `/api/categories` | List user & system categories | Yes |
| | `POST` | `/api/categories` | Create custom category | Yes |
| | `PUT` | `/api/categories/:id` | Update category details | Yes |
| | `DELETE` | `/api/categories/:id` | Delete custom category | Yes |
| **Alerts** | `GET` | `/api/notifications` | Get user notifications & unread count | Yes |
| | `PATCH` | `/api/notifications/:id/read` | Mark single notification as read | Yes |
| | `PATCH` | `/api/notifications/read-all` | Mark all notifications as read | Yes |
| | `DELETE` | `/api/notifications/:id` | Delete notification item | Yes |
| **Reports** | `GET` | `/api/reports/overview` | Overall dashboard metrics & trends | Yes |
| | `GET` | `/api/reports/income` | Detailed income analytics & trends | Yes |
| | `GET` | `/api/reports/expenses` | Detailed expense distribution | Yes |
| | `GET` | `/api/reports/categories` | Category-wise cash flows | Yes |
| | `GET` | `/api/reports/budgets` | Budget performance & variances | Yes |
| | `GET` | `/api/reports/savings` | Savings progress & ledger summary | Yes |
| **Ledger** | `GET` | `/api/transactions` | Unified income + expense ledger | Yes |

---

## License

This project is licensed under the ISC License.
