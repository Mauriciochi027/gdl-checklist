interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente de loading reutilizável
 */
export const LoadingSpinner = ({ message = "Carregando...", size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin mx-auto`} />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
