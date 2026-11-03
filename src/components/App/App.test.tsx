import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import App from './App';
import type { Movie } from '../../types/movie';
import { fetchMovies } from '../../services/movieService';

const mockedToast = vi.hoisted(() => vi.fn());

vi.mock('../../services/movieService', () => ({
  fetchMovies: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: mockedToast }));

const mockedFetchMovies = vi.mocked(fetchMovies);
const movie: Movie = {
  id: 1,
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  title: 'Dune',
  overview: 'A desert adventure.',
  release_date: '2021-10-22',
  vote_average: 8.1,
};

beforeEach(() => {
  mockedFetchMovies.mockReset();
  mockedToast.mockReset();
});

describe('App search lifecycle', () => {
  test('shows loading, then results, and clears old results for a new search', async () => {
    const user = userEvent.setup();
    let resolveFirst: (value: Movie[]) => void = () => undefined;
    const first = new Promise<Movie[]>((resolve) => {
      resolveFirst = resolve;
    });
    mockedFetchMovies.mockReturnValueOnce(first).mockResolvedValueOnce([]);
    render(<App />);
    const input = screen.getByPlaceholderText('Search movies...');

    await user.type(input, 'dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(
      screen.getByText('Loading movies, please wait...'),
    ).toBeInTheDocument();
    resolveFirst([movie]);
    await screen.findByRole('heading', { name: 'Dune' });

    await user.clear(input);
    await user.type(input, 'unknown');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(
      screen.queryByRole('heading', { name: 'Dune' }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Dune' }),
      ).not.toBeInTheDocument(),
    );
    expect(mockedFetchMovies).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: 'unknown',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test('ignores an older response when searches overlap', async () => {
    const user = userEvent.setup();
    let resolveFirst: (value: Movie[]) => void = () => undefined;
    const first = new Promise<Movie[]>((resolve) => {
      resolveFirst = resolve;
    });
    mockedFetchMovies.mockReturnValueOnce(first).mockResolvedValueOnce([movie]);
    render(<App />);
    const input = screen.getByPlaceholderText('Search movies...');

    await user.type(input, 'old');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.clear(input);
    await user.type(input, 'new');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('heading', { name: 'Dune' });

    resolveFirst([{ ...movie, id: 2, title: 'Old result' }]);
    await waitFor(() =>
      expect(screen.queryByText('Old result')).not.toBeInTheDocument(),
    );
  });

  test('shows a toast for an empty response and an error message for failures', async () => {
    const user = userEvent.setup();
    mockedFetchMovies
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('offline'));
    render(<App />);
    const input = screen.getByPlaceholderText('Search movies...');

    await user.type(input, 'missing');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() =>
      expect(mockedToast).toHaveBeenCalledWith(
        'No movies found for your request.',
      ),
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'failure');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(
      await screen.findByText('There was an error, please try again...'),
    ).toBeInTheDocument();
  });

  test('aborts the active request when unmounted', async () => {
    const user = userEvent.setup();
    mockedFetchMovies.mockReturnValue(new Promise<Movie[]>(() => undefined));
    const { unmount } = render(<App />);
    await user.type(screen.getByPlaceholderText('Search movies...'), 'dune');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    const signal = mockedFetchMovies.mock.calls[0][0].signal;
    expect(signal).toBeDefined();
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
