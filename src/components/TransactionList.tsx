import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Trash2 } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionCard } from './TransactionCard';
import { TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/finance';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Transaction } from '@/types/finance';
import { EditTransactionForm } from './EditTransactionForm';

export function TransactionList() {
  const { transactions, filterTransactions, deleteTransaction } = useTransactions();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return filterTransactions({
      type: typeFilter === 'all' ? undefined : typeFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      search: search || undefined,
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filterTransactions, typeFilter, categoryFilter, search]);

  const allCategories = useMemo(() => {
    return typeFilter === 'expense' 
      ? Object.entries(EXPENSE_CATEGORIES)
      : typeFilter === 'income'
      ? Object.entries(INCOME_CATEGORIES)
      : [...Object.entries(EXPENSE_CATEGORIES), ...Object.entries(INCOME_CATEGORIES)];
  }, [typeFilter]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  const hasActiveFilters = search || typeFilter !== 'all' || categoryFilter !== 'all';

  const handleDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Transações</h1>
        <span className="text-sm text-muted-foreground">
          {filteredTransactions.length} registro(s)
        </span>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Entradas</SelectItem>
                    <SelectItem value="expense">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {allCategories.map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Transaction List */}
      <AnimatePresence mode="popLayout">
        {filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p className="text-sm">Nenhuma transação encontrada</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.03 }}
              >
                <TransactionCard 
                  transaction={transaction} 
                  onClick={() => setSelectedTransaction(transaction)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Edit Sheet */}
      <Sheet open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[90vh] overflow-y-auto">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Editar Transação</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => {
                setTransactionToDelete(selectedTransaction);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </SheetHeader>
          {selectedTransaction && (
            <EditTransactionForm 
              transaction={selectedTransaction} 
              onClose={() => setSelectedTransaction(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A transação será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
