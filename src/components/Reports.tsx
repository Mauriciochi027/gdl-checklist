import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';
import { formatCurrency } from '@/lib/formatters';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Reports() {
  const { transactions, getMonthlyReport } = useTransactions();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fullMonthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const monthlyReport = getMonthlyReport(selectedYear, selectedMonth);

  const yearlyData = useMemo(() => {
    return monthNames.map((_, index) => {
      const report = getMonthlyReport(selectedYear, index);
      return {
        name: monthNames[index],
        Receitas: report.totalIncome,
        Despesas: report.totalExpenses,
      };
    });
  }, [selectedYear, getMonthlyReport]);

  const pieData = useMemo(() => {
    const report = viewType === 'monthly' ? monthlyReport : null;
    if (!report) return [];

    const expenseCategories = Object.entries(report.transactionsByCategory)
      .filter(([key]) => key in EXPENSE_CATEGORIES)
      .map(([key, value]) => ({
        name: EXPENSE_CATEGORIES[key as keyof typeof EXPENSE_CATEGORIES]?.label || key,
        value,
        color: EXPENSE_CATEGORIES[key as keyof typeof EXPENSE_CATEGORIES]?.color || 'hsl(0, 0%, 50%)',
      }))
      .filter(item => item.value > 0);

    return expenseCategories;
  }, [monthlyReport, viewType]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(y => y - 1);
      } else {
        setSelectedMonth(m => m - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(y => y + 1);
      } else {
        setSelectedMonth(m => m + 1);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pt-6 pb-24 space-y-6"
    >
      <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>

      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setViewType('monthly')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm",
            viewType === 'monthly' 
              ? "bg-card shadow-md text-foreground" 
              : "text-muted-foreground"
          )}
        >
          Mensal
        </button>
        <button
          onClick={() => setViewType('yearly')}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg font-medium transition-all text-sm",
            viewType === 'yearly' 
              ? "bg-card shadow-md text-foreground" 
              : "text-muted-foreground"
          )}
        >
          Anual
        </button>
      </div>

      {viewType === 'monthly' ? (
        <>
          {/* Month Navigator */}
          <div className="flex items-center justify-between bg-card rounded-2xl p-4 shadow-card">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="font-semibold text-foreground">{fullMonthNames[selectedMonth]}</p>
              <p className="text-sm text-muted-foreground">{selectedYear}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Monthly Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-income" />
                <span className="text-xs text-muted-foreground">Receitas</span>
              </div>
              <p className="text-lg font-bold text-income">{formatCurrency(monthlyReport.totalIncome)}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-expense" />
                <span className="text-xs text-muted-foreground">Despesas</span>
              </div>
              <p className="text-lg font-bold text-expense">{formatCurrency(monthlyReport.totalExpenses)}</p>
            </div>
          </div>

          {/* Balance */}
          <div className={cn(
            "stat-card",
            monthlyReport.balance >= 0 ? "border-l-4 border-l-income" : "border-l-4 border-l-expense"
          )}>
            <p className="text-sm text-muted-foreground mb-1">Saldo do Mês</p>
            <p className={cn(
              "text-2xl font-bold",
              monthlyReport.balance >= 0 ? "text-income" : "text-expense"
            )}>
              {formatCurrency(monthlyReport.balance)}
            </p>
          </div>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Despesas por Categoria</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        background: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Year Navigator */}
          <div className="flex items-center justify-between bg-card rounded-2xl p-4 shadow-card">
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <p className="font-semibold text-foreground text-lg">{selectedYear}</p>
            <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Yearly Bar Chart */}
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Evolução Mensal</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yearly Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <p className="text-xs text-muted-foreground mb-1">Total Receitas {selectedYear}</p>
              <p className="text-lg font-bold text-income">
                {formatCurrency(yearlyData.reduce((sum, m) => sum + m.Receitas, 0))}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-muted-foreground mb-1">Total Despesas {selectedYear}</p>
              <p className="text-lg font-bold text-expense">
                {formatCurrency(yearlyData.reduce((sum, m) => sum + m.Despesas, 0))}
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
