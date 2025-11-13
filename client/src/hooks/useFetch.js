import { useEffect, useState } from 'react';
import http from '../api/httpClient.js';

const useFetch = (endpoint, options = {}) => {
  const [data, setData] = useState(options.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    http
      .get(endpoint)
      .then((response) => {
        if (isMounted) {
          setData(response.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  const refresh = async () => {
    try {
      const response = await http.get(endpoint);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return { data, loading, error, refresh };
};

export default useFetch;
