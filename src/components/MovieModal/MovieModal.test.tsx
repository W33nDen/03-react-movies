import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import MovieModal from './MovieModal';
import type { Movie } from '../../types/movie';

const movie: Movie = {
  id: 1,
  poster_path: null,
  backdrop_path: null,
  title: 'Dune',
  overview: 'A desert adventure.',
  release_date: '2021-10-22',
  vote_average: 8.1,
};

afterEach(() => {
  document.body.style.overflow = '';
});

describe('MovieModal', () => {
  test('renders through a portal with details and local fallback image', () => {
    render(<MovieModal movie={movie} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('A desert adventure.')).toBeInTheDocument();
    expect(screen.getByText('2021-10-22')).toBeInTheDocument();
    expect(screen.getByAltText('Dune')).toHaveAttribute('src', '/no-image.svg');
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('closes with button, Escape, and backdrop but not inner content', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MovieModal movie={movie} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');

    await user.click(screen.getByRole('heading', { name: 'Dune' }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  test('restores body scroll and removes Escape handling on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<MovieModal movie={movie} onClose={onClose} />);
    unmount();
    expect(document.body.style.overflow).toBe('');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
