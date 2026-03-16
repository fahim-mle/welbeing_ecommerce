import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterDropdown } from '../FilterDropdown';

describe('FilterDropdown', () => {
  const mockOptions = [
    { value: 'all', label: 'All' },
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  it('renders label and options correctly', () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        label="Test Filter"
        value="all"
        options={mockOptions}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Test Filter')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        label="Test Filter"
        value="all"
        options={mockOptions}
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option1' } });

    expect(onChange).toHaveBeenCalledWith('option1');
  });

  it('displays the correct selected value', () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        label="Test Filter"
        value="option2"
        options={mockOptions}
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('option2');
  });
});
