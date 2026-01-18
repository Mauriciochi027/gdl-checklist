import { 
  UtensilsCrossed, Receipt, CreditCard, AlertCircle, Car, Heart, 
  Gamepad2, GraduationCap, MoreHorizontal, Wallet, Briefcase, 
  TrendingUp, Laptop, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  UtensilsCrossed, Receipt, CreditCard, AlertCircle, Car, Heart,
  Gamepad2, GraduationCap, MoreHorizontal, Wallet, Briefcase,
  TrendingUp, Laptop,
};

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const isExpense = transaction.type === 'expense';
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const category = categories[transaction.category as keyof typeof categories];
  
  const Icon = iconMap[category?.icon || 'MoreHorizontal'] || MoreHorizontal;
  const ArrowIcon = isExpense ? ArrowDownRight : ArrowUpRight;

  return (
    <button
      onClick={onClick}
      className="w-full stat-card flex items-center gap-4 text-left hover:bg-accent/50 transition-colors"
    >
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${category?.color}20` }}
      >
        <Icon 
          className="w-5 h-5" 
          style={{ color: category?.color }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{transaction.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{category?.label}</span>
          <span>•</span>
          <span>{formatDate(transaction.date)}</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center gap-1">
          <ArrowIcon className={cn(
            "w-4 h-4",
            isExpense ? "text-expense" : "text-income"
          )} />
          <span className={cn(
            "font-semibold",
            isExpense ? "text-expense" : "text-income"
          )}>
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      </div>
    </button>
  );
}
