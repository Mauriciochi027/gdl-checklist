import { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, MonthlyReport } from '@/types/finance';

const STORAGE_KEY = 'finance_transactions';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTransactions(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing transactions:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveTransactions = useCallback((newTransactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
    setTransactions(newTransactions);
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    saveTransactions([newTransaction, ...transactions]);
    return newTransaction;
  }, [transactions, saveTransactions]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    saveTransactions(updated);
  }, [transactions, saveTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    saveTransactions(transactions.filter((t) => t.id !== id));
  }, [transactions, saveTransactions]);

  const getTransactionsByMonth = useCallback((year: number, month: number): Transaction[] => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [transactions]);

  const getMonthlyReport = useCallback((year: number, month: number): MonthlyReport => {
    const monthTransactions = getTransactionsByMonth(year, month);
    const totalIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const transactionsByCategory: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      transactionsByCategory[t.category] = (transactionsByCategory[t.category] || 0) + t.amount;
    });

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return {
      month: monthNames[month],
      year,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionsByCategory,
    };
  }, [getTransactionsByMonth]);

  const getTotalBalance = useCallback((): number => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return totalIncome - totalExpenses;
  }, [transactions]);

  const getRecentTransactions = useCallback((limit: number = 5): Transaction[] => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions]);

  const filterTransactions = useCallback((
    filters: {
      type?: TransactionType;
      category?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
    }
  ): Transaction[] => {
    return transactions.filter((t) => {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;
      if (filters.minAmount && t.amount < filters.minAmount) return false;
      if (filters.maxAmount && t.amount > filters.maxAmount) return false;
      if (filters.search && !t.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [transactions]);

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    getMonthlyReport,
    getTotalBalance,
    getRecentTransactions,
    filterTransactions,
  };
}
