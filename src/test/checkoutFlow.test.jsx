import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Helper component that seeds items into the cart and renders CheckoutPage
function CheckoutTestWrapper() {
  const { addToCart } = useCart();

  React.useEffect(() => {
    addToCart(
      {
        id: 'prod-01-lavender-tulip',
        name: 'Lavender Blossom Crochet Tulip Bouquet',
        price: 180,
        image: '/images/products/lavender-tulip.jpg',
      },
      1,
    );
  }, []);

  return <CheckoutPage onNavigateToShop={() => {}} />;
}

describe('Checkout Flow (Direct Shipping to Payment)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Step 1 Shipping Destination with compulsory fields', async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <CheckoutTestWrapper />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>,
    );

    // Verify 2-step indicator
    expect(await screen.findByText('1. Shipping Destination')).toBeInTheDocument();
    expect(screen.getByText('2. Payment Authorization')).toBeInTheDocument();

    // Verify shipping inputs exist
    expect(screen.getByPlaceholderText('ananya@knotkari.atelier')).toBeInTheDocument();
    expect(screen.getByText('Proceed to Payment')).toBeInTheDocument();
  });

  it('directly connects Shipping to Payment Authorization upon submission', async () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <CheckoutTestWrapper />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>,
    );

    const nameInput = await screen.findByPlaceholderText('Ananya Sharma');
    const emailInput = screen.getByPlaceholderText('ananya@knotkari.atelier');
    const phoneInput = screen.getByPlaceholderText('+91 98201 44521');
    const streetInput = screen.getByPlaceholderText(
      'Flat 402, Heritage Residency, 12th Main Indiranagar',
    );
    const cityInput = screen.getByPlaceholderText('Bengaluru');
    const stateInput = screen.getByPlaceholderText('Karnataka');
    const pinInput = screen.getByPlaceholderText('560038');

    fireEvent.change(nameInput, { target: { value: 'Pooja Verma' } });
    fireEvent.change(emailInput, { target: { value: 'pooja.verma@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+91 9876543210' } });
    fireEvent.change(streetInput, { target: { value: '12th Cross, Koramangala' } });
    fireEvent.change(cityInput, { target: { value: 'Bengaluru' } });
    fireEvent.change(stateInput, { target: { value: 'Karnataka' } });
    fireEvent.change(pinInput, { target: { value: '560034' } });

    const proceedBtn = screen.getByText('Proceed to Payment');
    fireEvent.click(proceedBtn);

    // Directly transitions to Step 2: Payment Authorization (no separate delivery page)
    await waitFor(() => {
      expect(screen.getByText('Payment Authorization')).toBeInTheDocument();
      expect(screen.getByText(/Razorpay Checkout/i)).toBeInTheDocument();
      expect(screen.getByText(/Back to Shipping/i)).toBeInTheDocument();
    });

    // Clicking Back returns to Step 1 Shipping Destination
    const backBtn = screen.getByText('Back to Shipping');
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText('Shipping Destination')).toBeInTheDocument();
      expect(screen.getByDisplayValue('pooja.verma@example.com')).toBeInTheDocument();
    });
  });
});
