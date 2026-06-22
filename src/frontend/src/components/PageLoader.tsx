import { Spinner } from './Spinner';

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-alt">
    <Spinner size="lg" />
  </div>
);
