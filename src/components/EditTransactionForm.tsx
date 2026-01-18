import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction, ExpenseCategory, IncomeCategory, PaymentMethod, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface EditTransactionFormProps {
  transaction: Transaction;
  onClose: () => void;
}

export function EditTransactionForm({ transaction, onClose }: EditTransactionFormProps) {
  const { updateTransaction } = useTransactions();
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>(transaction.category as any);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(transaction.paymentMethod || '');
  const [date, setDate] = useState(transaction.date);

  const categories = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Valor inválido');
      return;
    }

    updateTransaction(transaction.id, {
      amount: parsedAmount,
      description: description.trim(),
      category,
      paymentMethod: transaction.type === 'expense' ? paymentMethod as PaymentMethod : undefined,
      date,
    });

    toast.success('Transação atualizada!');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-4">
      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="edit-amount">Valor</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
          <Input
            id="edit-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-12 text-xl font-semibold h-14 bg-card"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="edit-description">Descrição</Label>
        <Input
          id="edit-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-12 bg-card"
          maxLength={100}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger className="h-12 bg-card">
            <SelectValue />
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

      {/* Payment Method */}
      {transaction.type === 'expense' && (
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
        <Label htmlFor="edit-date">Data</Label>
        <Input
          id="edit-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 bg-card"
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full h-14 text-base font-semibold btn-primary-gradient rounded-2xl">
        <Check className="w-5 h-5 mr-2" />
        Salvar Alterações
      </Button>
    </form>
  );
}
