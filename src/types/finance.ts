export type TransactionType = 'income' | 'expense';

export type ExpenseCategory = 
  | 'alimentacao'
  | 'contas'
  | 'cartao'
  | 'dividas'
  | 'transporte'
  | 'saude'
  | 'lazer'
  | 'educacao'
  | 'outros';

export type IncomeCategory = 
  | 'salario'
  | 'projetos'
  | 'investimentos'
  | 'freelance'
  | 'outros';

export type PaymentMethod = 
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'transferencia';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  description: string;
  date: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionsByCategory: Record<string, number>;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  alimentacao: { label: 'Alimentação', icon: 'UtensilsCrossed', color: 'hsl(25, 95%, 53%)' },
  contas: { label: 'Contas', icon: 'Receipt', color: 'hsl(200, 80%, 50%)' },
  cartao: { label: 'Cartão de Crédito', icon: 'CreditCard', color: 'hsl(280, 70%, 55%)' },
  dividas: { label: 'Dívidas', icon: 'AlertCircle', color: 'hsl(0, 72%, 51%)' },
  transporte: { label: 'Transporte', icon: 'Car', color: 'hsl(220, 70%, 55%)' },
  saude: { label: 'Saúde', icon: 'Heart', color: 'hsl(340, 75%, 55%)' },
  lazer: { label: 'Lazer', icon: 'Gamepad2', color: 'hsl(160, 60%, 45%)' },
  educacao: { label: 'Educação', icon: 'GraduationCap', color: 'hsl(45, 90%, 50%)' },
  outros: { label: 'Outros', icon: 'MoreHorizontal', color: 'hsl(0, 0%, 50%)' },
};

export const INCOME_CATEGORIES: Record<IncomeCategory, { label: string; icon: string; color: string }> = {
  salario: { label: 'Salário', icon: 'Wallet', color: 'hsl(142, 71%, 45%)' },
  projetos: { label: 'Projetos', icon: 'Briefcase', color: 'hsl(200, 80%, 50%)' },
  investimentos: { label: 'Investimentos', icon: 'TrendingUp', color: 'hsl(280, 70%, 55%)' },
  freelance: { label: 'Freelance', icon: 'Laptop', color: 'hsl(25, 95%, 53%)' },
  outros: { label: 'Outros', icon: 'MoreHorizontal', color: 'hsl(0, 0%, 50%)' },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: string }> = {
  dinheiro: { label: 'Dinheiro', icon: 'Banknote' },
  pix: { label: 'PIX', icon: 'Zap' },
  cartao_debito: { label: 'Cartão Débito', icon: 'CreditCard' },
  cartao_credito: { label: 'Cartão Crédito', icon: 'CreditCard' },
  transferencia: { label: 'Transferência', icon: 'ArrowLeftRight' },
};
