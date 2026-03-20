import { Circles } from 'react-loader-spinner';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 32, md: 56, lg: 80 };

export const Spinner = ({ size = 'md' }: SpinnerProps) => {
  const px = sizeMap[size];
  return (
    <Circles
      height={px}
      width={px}
      color="#4f46e5"
      ariaLabel="loading"
      visible
    />
  );
};
