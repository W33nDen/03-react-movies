import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchMovies } from '../../services/movieService';
import type { Movie } from '../../types/movie';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import Loader from '../Loader/Loader';
import MovieGrid from '../MovieGrid/MovieGrid';
import MovieModal from '../MovieModal/MovieModal';
import SearchBar from '../SearchBar/SearchBar';
import styles from './App.module.css';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      requestId.current += 1;
      controller.current?.abort();
    };
  }, []);
  const handleSearch = useCallback(async (query: string): Promise<void> => {
    requestId.current += 1;
    const id = requestId.current;
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setMovies([]);
    setError(false);
    setLoading(true);
    try {
      const result = await fetchMovies({
        query,
        signal: nextController.signal,
      });
      if (id !== requestId.current) return;
      setMovies(result);
      if (!result.length) toast('No movies found for your request.');
    } catch (cause) {
      if (
        id !== requestId.current ||
        (cause instanceof DOMException && cause.name === 'AbortError') ||
        axios.isCancel(cause)
      )
        return;
      setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);
  const handleClose = useCallback(() => setSelectedMovie(null), []);
  return (
    <div className={styles.app}>
      <SearchBar onSubmit={handleSearch} />
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage />
      ) : movies.length > 0 ? (
        <MovieGrid movies={movies} onSelect={setSelectedMovie} />
      ) : null}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={handleClose} />
      )}
    </div>
  );
}
