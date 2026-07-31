import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon, isIconName } from './Icon';

describe('Icon', () => {
  it('accepts kebab-case lucide names only', () => {
    expect(isIconName('bed-double')).toBe(true);
    expect(isIconName('wardrobe')).toBe(false);
    expect(isIconName(null)).toBe(false);
  });

  it('renders a placeholder for an unknown name instead of failing', () => {
    const { container } = render(<Icon name="wardrobe" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
