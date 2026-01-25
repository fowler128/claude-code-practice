import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

// Hook for fetching content from your streaming services
export const useStreamingContent = (type = 'movie') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchContent = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      const results = await api.getContentFromMyServices(type, pageNum);

      if (pageNum === 1) {
        setData(results);
      } else {
        setData(prev => [...prev, ...results]);
      }

      setHasMore(results.length >= 20);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchContent(1);
  }, [fetchContent]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContent(nextPage);
    }
  }, [loading, hasMore, page, fetchContent]);

  const refresh = useCallback(() => {
    setPage(1);
    fetchContent(1);
  }, [fetchContent]);

  return { data, loading, error, loadMore, refresh, hasMore };
};

// Hook for trending content
export const useTrending = (timeWindow = 'week') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const results = await api.getTrending(timeWindow);
        setData(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [timeWindow]);

  return { data, loading, error };
};

// Hook for searching content
export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.searchContent(query);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [query]);

  return { query, setQuery, results, loading, error };
};

// Hook for content details
export const useContentDetails = (id, type) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const details = await api.getContentDetails(id, type);
        setData(details);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, type]);

  return { data, loading, error };
};

// Hook for top rated content
export const useTopRated = (type = 'movie') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        setLoading(true);
        const results = type === 'movie'
          ? await api.getTopRatedMovies()
          : await api.getTopRatedTVShows();
        setData(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRated();
  }, [type]);

  return { data, loading, error };
};
