interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClassMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-8 w-8 border-2',
  md: 'h-14 w-14 border-4',
  lg: 'h-20 w-20 border-4',
};

export const Spinner = ({ size = 'md' }: SpinnerProps) => {
  return (
    <div
      role="status"
      aria-label="loading"
      className={`${sizeClassMap[size]} animate-spin rounded-full border-border-default border-t-primary-600`}
    />
  );
};
