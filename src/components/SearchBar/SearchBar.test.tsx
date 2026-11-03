import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, expect, test } from 'vitest';
import SearchBar from './SearchBar';

test('rejects an empty search and submits a trimmed query', async () => {
  const onSubmit = vi.fn();
  render(<SearchBar onSubmit={onSubmit} />);
  const input = screen.getByPlaceholderText('Search movies...');
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect(onSubmit).not.toHaveBeenCalled();
  await userEvent.type(input, '  dune  ');
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));
  expect(onSubmit).toHaveBeenCalledWith('dune');
});
