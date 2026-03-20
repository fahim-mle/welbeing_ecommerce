import { Spinner } from './Spinner';

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Spinner size="lg" />
  </div>
);
