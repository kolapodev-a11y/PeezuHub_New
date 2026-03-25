import { useEffect, useState } from 'react';

export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
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
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || 'Something went wrong');
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => { active = false; };
  }, deps);

  return { data, loading, error, setData };
}
