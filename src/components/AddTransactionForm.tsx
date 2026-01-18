import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionType, ExpenseCategory, IncomeCategory, PaymentMethod, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddTransactionFormProps {
  onSuccess?: () => void;
}

export function AddTransactionForm({ onSuccess }: AddTransactionFormProps) {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    addTransaction({
      type,
      amount: parsedAmount,
      description: description.trim(),
      category: category as ExpenseCategory | IncomeCategory,
      paymentMethod: type === 'expense' ? paymentMethod as PaymentMethod : undefined,
      date,
    });

    toast.success(type === 'expense' ? 'Despesa registrada!' : 'Receita registrada!');
    
    // Reset form
    setAmount('');
    setDescription('');
    setCategory('');
    setPaymentMethod('');
    setDate(new Date().toISOString().split('T')[0]);
    
    onSuccess?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pt-6 pb-24 space-y-6"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Nova Transação</h1>
        <p className="text-sm text-muted-foreground">Registre uma entrada ou saída</p>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setType('income'); setCategory(''); }}
          className={cn(
            "flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all",
            type === 'income' 
              ? "bg-income text-income-foreground shadow-lg" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <ArrowUpRight className="w-5 h-5" />
          Entrada
        </button>
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory(''); }}
          className={cn(
            "flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all",
            type === 'expense' 
              ? "bg-expense text-expense-foreground shadow-lg" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <ArrowDownRight className="w-5 h-5" />
          Saída
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Valor *</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-12 text-xl font-semibold h-14 bg-card"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            type="text"
            placeholder="Ex: Almoço no restaurante"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12 bg-card"
            maxLength={100}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="h-12 bg-card">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categories).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method (only for expenses) */}
        {type === 'expense' && (
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-12 bg-card">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Data *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 bg-card"
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full h-14 text-base font-semibold btn-primary-gradient rounded-2xl">
          <Check className="w-5 h-5 mr-2" />
          Salvar Transação
        </Button>
      </form>
    </motion.div>
  );
}
