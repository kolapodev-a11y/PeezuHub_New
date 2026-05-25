import { useEffect, useState, type DependencyList } from 'react';

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { response?: { data?: { message?: string } }; message?: string };
    return candidate.response?.data?.message || candidate.message || 'Something went wrong';
  }

  return 'Something went wrong';
}

export default function useFetch<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        setLoading(true);
        setError('');
        const result = await fetcher();
        if (active) setData(result);
      } catch (error) {
        if (active) setError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error, setData };
}
