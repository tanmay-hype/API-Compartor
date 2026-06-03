import { ApiCompareProvider } from './context/ApiCompareContext';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  return (
    <ApiCompareProvider>
      <MainLayout />
    </ApiCompareProvider>
  );
}
