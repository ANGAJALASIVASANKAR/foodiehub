import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderStatusTimeline from '../OrderStatusTimeline';

describe('OrderStatusTimeline', () => {
  it('shows all active steps for an in-progress order', () => {
    render(<OrderStatusTimeline status="PREPARING" />);
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText('Being Prepared')).toBeInTheDocument();
    expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('shows cancelled state', () => {
    render(<OrderStatusTimeline status="CANCELLED" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('shows delivered state', () => {
    render(<OrderStatusTimeline status="DELIVERED" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });
});
