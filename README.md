# SplitMint 💰 - Your Gateway to Karbon

[![Live Demo]](https://splitmint-1.onrender.com)

SplitMint is a modern web application for splitting expenses among friends and groups. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features ✨

- **Authentication** 🔐 - User registration and login
- **Groups Management** 👥 - Create groups with up to 3 participants plus yourself
- **Expense Tracking** 💵 - Add expenses with multiple split modes:
  - Equal split
  - Custom amount split
  - Percentage split
- **Balance Engine** ⚖️ - Automatic balance calculation and settlement suggestions
- **Visualizations** 📊 - Dashboard with summary cards, balance tables, and transaction history
- **Search & Filters** 🔍 - Filter expenses by group, participant, date range, and amount

## Tech Stack 🛠️

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- date-fns for date formatting
- Modern CSS with utility classes

## Project Structure 📁

```
splitmint/
├── backend/              # Backend API
│   ├── models/          # MongoDB models
│   │   ├── User.js
│   │   ├── Group.js
│   │   └── Expense.js
│   ├── routes/          # Express routes
│   │   ├── auth.js
│   │   ├── groups.js
│   │   ├── expenses.js
│   │   └── balance.js
│   ├── middleware/      # Express middleware
│   │   └── auth.js
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/            # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth)
│   │   ├── utils/       # Utility functions
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Prerequisites 📋

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation 🚀

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/splitmint
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

4. Start the backend server:
```bash
npm run dev
# or
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and proxy API requests to `http://localhost:5000`

## API Endpoints 📡

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Groups
- `GET /api/groups` - Get all groups for user
- `GET /api/groups/:id` - Get group by ID
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group (with cascade delete of expenses)

### Expenses
- `GET /api/expenses` - Get expenses (with filters)
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Balance
- `GET /api/balance` - Get balance summary (optionally filtered by groupId)
- `GET /api/balance/participant/:name` - Get participant balance details

## Usage 💡

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Groups**: Create groups with participants (max 3 participants + you)
3. **Add Expenses**: Add expenses to groups with your preferred split mode
4. **View Balances**: Check who owes whom and see settlement suggestions
5. **Filter & Search**: Use filters to find specific expenses

## Features in Detail 🔍

### Split Modes
- **Equal**: Divide expense equally among all participants
- **Custom Amount**: Specify exact amount each participant pays
- **Percentage**: Split expense based on percentages (must sum to 100%)

### Balance Engine
- Automatically calculates who owes whom based on expenses
- Provides minimal settlement suggestions for easy payback
- Shows net balance per participant

### Search & Filters
- Search expenses by description text
- Filter by group
- Filter by date range
- Filter by amount range

## Notes 📝

- All amounts are rounded to 2 decimal places for consistency
- When splitting expenses, the last participant gets the remainder to ensure totals match
- Group deletion cascades to delete all associated expenses
- Password minimum length is 6 characters

## License 📄

This project is open source and available for personal use.

---

Made with 💙 using MERN stack
