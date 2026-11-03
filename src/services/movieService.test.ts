import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Movie } from '../types/movie';

const get = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn(() => ({ get })));

vi.mock('axios', () => ({
  default: { create },
}));

const { fetchMovies } = await import('./movieService');

const movie: Movie = {
  id: 1,
  poster_path: null,
  backdrop_path: null,
  title: 'Dune',
  overview: 'A desert adventure.',
  release_date: '2021-10-22',
  vote_average: 8.1,
};

describe('fetchMovies', () => {
  beforeEach(() => {
    get.mockReset();
  });

  test('configures TMDB auth and returns typed search results', async () => {
    get.mockResolvedValue({ data: { results: [movie] } });
    const signal = new AbortController().signal;

    await expect(fetchMovies({ query: 'dune', signal })).resolves.toEqual([
      movie,
    ]);
    expect(get).toHaveBeenCalledWith('/search/movie', {
      params: { query: 'dune' },
      signal,
    });
  });

  test('propagates cancellation errors to the caller', async () => {
    const cancellation = new Error('cancelled');
    get.mockRejectedValue(cancellation);
    await expect(fetchMovies({ query: 'dune' })).rejects.toBe(cancellation);
  });
});
