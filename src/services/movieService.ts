import axios from 'axios';
import type { Movie } from '../types/movie';

interface MovieSearchResponse {
  results: Movie[];
}
export interface FetchMoviesParams {
  query: string;
  signal?: AbortSignal;
}

const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: { Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}` },
});

export async function fetchMovies({
  query,
  signal,
}: FetchMoviesParams): Promise<Movie[]> {
  const { data } = await api.get<MovieSearchResponse>('/search/movie', {
    params: { query },
    signal,
  });
  return data.results;
}
