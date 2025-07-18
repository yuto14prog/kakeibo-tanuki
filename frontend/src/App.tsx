import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ExpenseList from './pages/ExpenseList';
import ExpenseForm from './pages/ExpenseForm';
import CardManagement from './pages/CardManagement';
import CategoryManagement from './pages/CategoryManagement';
import Reports from './pages/Reports';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/expenses/new" element={<ExpenseForm />} />
            <Route path="/expenses/edit/:id" element={<ExpenseForm />} />
            <Route path="/cards" element={<CardManagement />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;