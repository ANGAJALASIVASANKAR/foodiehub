import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RestaurantCard from '../RestaurantCard';

const sample = {
  id: 1,
  name: 'Biryani Blues',
  description: 'Royal biryani',
  cuisine: 'Biryani',
  address: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
  latitude: 12.97,
  longitude: 77.59,
  imageUrl: null,
  bannerUrl: null,
  rating: 4.6,
  ratingCount: 210,
  active: true,
  open: true,
  openingTime: '10:00',
  closingTime: '23:00',
  minOrderAmount: 199,
  deliveryTimeMinutes: 30,
  priceForTwo: 400,
};

describe('RestaurantCard', () => {
  it('renders restaurant name, cuisine and rating', () => {
    render(
      <MemoryRouter>
        <RestaurantCard restaurant={sample} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Biryani Blues')).toBeInTheDocument();
    expect(screen.getByText('Biryani')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/restaurants/1');
  });

  it('shows closed badge when restaurant is closed', () => {
    render(
      <MemoryRouter>
        <RestaurantCard restaurant={{ ...sample, open: false }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});
