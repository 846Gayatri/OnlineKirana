# GramFresh / OnlineKirana

A fully functional, modern 10-minute grocery delivery app prototype built for Vijayawada, AP, India.

It includes 3 interconnected systems:
1. **Backend**: Node.js + Express REST API with `node:sqlite`.
2. **Admin Panel**: React + Vite dashboard to manage products, categories, and orders.
3. **Customer App**: Mobile-first React check-out experience with Wallet/UPI payment flows.

## How to Run

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   node src/seed.js  # Seeds the database with Vijayawada local items!
   node server.js    # Runs on http://localhost:3000
   ```

2. **Start Customer Web App**:
   ```bash
   cd customer
   npm install
   npm run dev       # Runs on http://localhost:5173
   ```

3. **Start Admin Panel**:
   ```bash
   cd admin
   npm install
   npm run dev       # Runs on http://localhost:5174
   ```

## Features
- Deeply customized Vijayawada staples (Kurnool Sona Masoori, Guntur Chillies, Bellam, etc.)
- Granular pricing (grams, liters, pieces)
- 10-minute delivery checkout mock with Rs.2 sachets logic!
- Full mock payment gateway for UPI (GPay, PhonePe, Paytm), Wallet, and Credit Cards!
