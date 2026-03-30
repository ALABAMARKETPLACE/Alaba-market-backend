# Frontend Web Integration Guide

## 1. Seller Registration with Bank Details

### Frontend Form Component (React/Next.js example)
```jsx
// components/SellerRegistrationForm.jsx
import { useState } from 'react';

export default function SellerRegistrationForm() {
  const [formData, setFormData] = useState({
    // Basic store details
    first_name: '',
    last_name: '',
    email: '',
    store_name: '',
    phone: '',
    business_address: '',
    
    // Bank details for subaccount
    settlement_bank: '',
    settlement_account_number: '',
    settlement_account_name: '',
    business_name: '',
    create_subaccount: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create store with bank details
      const response = await fetch('http://127.0.0.1:8017/coorporate_store/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.status) {
        // Store created successfully
        console.log('Store created:', result.data);
        
        // Automatically create subaccount request if bank details provided
        if (formData.create_subaccount && formData.settlement_bank) {
          await createSubaccountRequest(result.data.id);
        }
        
        // Redirect to success page
        router.push('/seller/registration-success');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
    }
  };

  const createSubaccountRequest = async (storeId) => {
    try {
      const subaccountData = {
        business_name: formData.business_name || formData.store_name,
        settlement_bank: formData.settlement_bank,
        settlement_account_number: formData.settlement_account_number,
        settlement_account_name: formData.settlement_account_name,
        primary_contact_email: formData.email,
        primary_contact_name: `${formData.first_name} ${formData.last_name}`,
        primary_contact_phone: formData.phone,
      };

      const response = await fetch('http://127.0.0.1:8017/paystack-subaccounts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(subaccountData),
      });

      const result = await response.json();
      console.log('Subaccount request created:', result);
    } catch (error) {
      console.error('Subaccount request error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      {/* Basic Store Information */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Store Name
        </label>
        <input
          type="text"
          value={formData.store_name}
          onChange={(e) => setFormData({...formData, store_name: e.target.value})}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          required
        />
      </div>

      {/* Bank Details Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-4">Bank Account Details</h3>
        <p className="text-sm text-gray-600 mb-4">
          Provide your bank details to receive automatic payments (95% of sales)
        </p>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Bank Name
          </label>
          <select
            value={formData.settlement_bank}
            onChange={(e) => setFormData({...formData, settlement_bank: e.target.value})}
            className="shadow border rounded w-full py-2 px-3 text-gray-700"
            required
          >
            <option value="">Select Bank</option>
            <option value="044">Access Bank</option>
            <option value="014">Afribank Nigeria Plc</option>
            <option value="023">Citibank Nigeria Limited</option>
            <option value="050">Ecobank Nigeria Plc</option>
            <option value="011">First Bank of Nigeria Plc</option>
            <option value="214">First City Monument Bank Plc</option>
            <option value="070">Fidelity Bank Plc</option>
            <option value="058">Guaranty Trust Bank Plc</option>
            <option value="030">Heritage Banking Company Ltd</option>
            <option value="082">Keystone Bank Plc</option>
            <option value="221">Stanbic IBTC Bank Plc</option>
            <option value="068">Standard Chartered Bank Nigeria Ltd</option>
            <option value="232">Sterling Bank Plc</option>
            <option value="033">United Bank for Africa Plc</option>
            <option value="032">Union Bank of Nigeria Plc</option>
            <option value="057">Zenith Bank Plc</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Account Number
          </label>
          <input
            type="text"
            value={formData.settlement_account_number}
            onChange={(e) => setFormData({...formData, settlement_account_number: e.target.value})}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            placeholder="1234567890"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Account Name
          </label>
          <input
            type="text"
            value={formData.settlement_account_name}
            onChange={(e) => setFormData({...formData, settlement_account_name: e.target.value})}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            placeholder="John Doe Business Account"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create Seller Account
        </button>
      </div>
    </form>
  );
}
```

## 2. Payment Integration with Split

### Checkout Component with Split Payment
```jsx
// components/CheckoutWithSplit.jsx
import { useState } from 'react';

export default function CheckoutWithSplit({ order }) {
  const [paymentData, setPaymentData] = useState({
    email: '',
    amount: order.total,
  });

  const handlePayment = async () => {
    try {
      // First create payment split
      const splitResponse = await fetch(`http://127.0.0.1:8017/payment-splits/create/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalAmount: order.total }),
      });

      const splitResult = await splitResponse.json();
      console.log('Split created:', splitResult);

      // Then process payment with split
      const paymentResponse = await fetch(`http://127.0.0.1:8017/payment-splits/process/${order.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: paymentData.email,
          callback_url: `${window.location.origin}/payment/verify`,
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResult.paystackResponse?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = paymentResult.paystackResponse.authorization_url;
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>
      
      {/* Order Summary */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold">Order Summary</h3>
        <div className="flex justify-between">
          <span>Total Amount:</span>
          <span>₦{order.total.toFixed(2)}</span>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          <div className="flex justify-between">
            <span>To Seller (95%):</span>
            <span>₦{(order.total * 0.95).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee (5%):</span>
            <span>₦{(order.total * 0.05).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={paymentData.email}
          onChange={(e) => setPaymentData({...paymentData, email: e.target.value})}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          required
        />
      </div>

      <button
        onClick={handlePayment}
        className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Pay ₦{order.total.toFixed(2)}
      </button>
    </div>
  );
}
```

## 3. Payment Verification Page

### Payment Verification Component
```jsx
// pages/payment/verify.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PaymentVerify() {
  const router = useRouter();
  const { reference } = router.query;
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (reference) {
      verifyPayment(reference);
    }
  }, [reference]);

  const verifyPayment = async (ref) => {
    try {
      const response = await fetch(`http://127.0.0.1:8017/payment-splits/verify/${ref}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.status && result.data.status === 'success') {
        setVerificationStatus('success');
        setPaymentData(result.data);
      } else {
        setVerificationStatus('failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('failed');
    }
  };

  if (verificationStatus === 'verifying') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-green-50 rounded-lg">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
          <p className="text-green-700 mb-4">
            Your payment of ₦{paymentData?.amount / 100} has been processed successfully.
          </p>
          
          <div className="bg-white p-4 rounded border text-left">
            <h3 className="font-semibold mb-2">Payment Split Details:</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total Paid:</span>
                <span>₦{(paymentData?.amount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>To Seller (95%):</span>
                <span>₦{((paymentData?.amount * 0.95) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee (5%):</span>
                <span>₦{((paymentData?.amount * 0.05) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/orders')}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 rounded-lg text-center">
      <div className="text-red-500 text-6xl mb-4">✗</div>
      <h2 className="text-2xl font-bold text-red-800 mb-2">Payment Failed</h2>
      <p className="text-red-700 mb-4">
        There was an issue processing your payment. Please try again.
      </p>
      <button
        onClick={() => router.push('/checkout')}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Try Again
      </button>
    </div>
  );
}
```

## 4. Admin Dashboard for Subaccount Management

### Admin Subaccount Management Component
```jsx
// components/AdminSubaccountManager.jsx
import { useState, useEffect } from 'react';

export default function AdminSubaccountManager() {
  const [pendingSubaccounts, setPendingSubaccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSubaccounts();
  }, []);

  const fetchPendingSubaccounts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8017/paystack-subaccounts/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      const result = await response.json();
      if (result.status) {
        setPendingSubaccounts(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subaccounts:', error);
      setLoading(false);
    }
  };

  const approveSubaccount = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8017/paystack-subaccounts/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ approval_note: 'Approved by admin' }),
      });

      const result = await response.json();
      if (result.status) {
        alert('Subaccount approved successfully!');
        fetchPendingSubaccounts(); // Refresh list
      }
    } catch (error) {
      console.error('Error approving subaccount:', error);
      alert('Failed to approve subaccount');
    }
  };

  const rejectSubaccount = async (id, reason) => {
    try {
      const response = await fetch(`http://127.0.0.1:8017/paystack-subaccounts/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });

      const result = await response.json();
      if (result.status) {
        alert('Subaccount rejected');
        fetchPendingSubaccounts(); // Refresh list
      }
    } catch (error) {
      console.error('Error rejecting subaccount:', error);
      alert('Failed to reject subaccount');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Pending Subaccount Requests</h2>

      {pendingSubaccounts.length === 0 ? (
        <p className="text-gray-600">No pending subaccount requests</p>
      ) : (
        <div className="space-y-4">
          {pendingSubaccounts.map((subaccount) => (
            <div key={subaccount.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{subaccount.business_name}</h3>
                  <p className="text-sm text-gray-600">Store: {subaccount.store?.store_name}</p>
                  <p className="text-sm text-gray-600">Email: {subaccount.primary_contact_email}</p>
                  <p className="text-sm text-gray-600">Phone: {subaccount.primary_contact_phone}</p>
                </div>

                <div>
                  <h4 className="font-medium">Bank Details</h4>
                  <p className="text-sm">Bank: {subaccount.settlement_bank}</p>
                  <p className="text-sm">Account: {subaccount.settlement_account_number}</p>
                  <p className="text-sm">Name: {subaccount.settlement_account_name}</p>
                  <p className="text-sm">Code: {subaccount.subaccount_code}</p>
                </div>
              </div>

              <div className="mt-4 space-x-2">
                <button
                  onClick={() => approveSubaccount(subaccount.id)}
                  className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason) rejectSubaccount(subaccount.id, reason);
                  }}
                  className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 5. API Integration Summary

## Guest Checkout With Webhook Finalization

Use this flow if you want guest orders to be created by the Paystack webhook while keeping the current frontend verification flow as a safe fallback.

### Step 1: Initialize guest payment with `order_payload`

```ts
const payload = {
  guest_info: {
    email: "guest@example.com",
    first_name: "John",
    last_name: "Doe",
    phone: "08000000000",
  },
  cart_items: [
    {
      product_id: 123,
      store_id: 7,
      quantity: 1,
      unit_price: 50000, // kobo
    },
  ],
  amount: 50000, // cart subtotal in kobo
  delivery_charge: 2500, // kobo
  callback_url: `${window.location.origin}/guest/payment/result`,
  order_payload: {
    guest_info: {
      email: "guest@example.com",
      first_name: "John",
      last_name: "Doe",
      phone: "08000000000",
    },
    delivery_address: {
      id: "guest_address_1",
      full_name: "John Doe",
      phone_no: "08000000000",
      full_address: "123 Test Street",
      city: "Lagos",
      state: "Lagos",
      state_id: 1,
      country: "Nigeria",
      country_id: 1,
    },
    cart_items: [
      {
        product_id: 123,
        store_id: 7,
        product_name: "Sample Product",
        quantity: 1,
        unit_price: 500,
        total_price: 500,
      },
    ],
    payment: {
      payment_reference: "",
      transaction_reference: "",
      payment_status: "success",
    },
    delivery: {
      delivery_token: "SIGNED_DELIVERY_TOKEN_FROM_CALCULATE_DELIVERY_PUBLIC",
    },
    order_summary: {
      total: 525,
    },
  },
};

const initResponse = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/paystack/initialize-guest`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
);

const initResult = await initResponse.json();
window.location.href = initResult.data.authorization_url;
```

### Step 2: Let the webhook finalize the guest order

Configure Paystack webhook URL:

```text
https://your-backend-domain.com/paystack/webhook
```

If `order_payload` was included during `initialize-guest`, the webhook will:

- verify the transaction reference
- mark payment as successful
- create the guest order
- save the created order ids against the pending guest checkout record

### Step 3: Keep frontend verification as fallback

Do not remove your current frontend verification flow yet. After redirect, you can still call:

```ts
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/paystack/verify-guest`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reference,
    guest_email: "guest@example.com",
  }),
});

await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/guest/orders?page=1&take=10`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "guest@example.com",
  }),
});
```

Because the backend is now idempotent on `payment_reference`, this fallback will not duplicate the guest order if the webhook already created it.

### Key API Endpoints for Web Integration:

1. **Store Registration with Bank Details**
   - `POST /coorporate_store/create` - Include bank details in request body

2. **Subaccount Management**
   - `POST /paystack-subaccounts/request` - Create subaccount request
   - `GET /paystack-subaccounts/my-subaccount` - Get seller's subaccount
   - `GET /paystack-subaccounts/pending` - Admin: Get pending requests
   - `PUT /paystack-subaccounts/:id/approve` - Admin: Approve subaccount
   - `PUT /paystack-subaccounts/:id/reject` - Admin: Reject subaccount

3. **Payment Processing**
   - `POST /payment-splits/create/:orderId` - Create payment split
   - `POST /payment-splits/process/:orderId` - Process payment with split
   - `GET /payment-splits/verify/:reference` - Verify payment

4. **Payment Reporting**
   - `GET /payment-splits/store/my-splits` - Seller: View earnings
   - `GET /payment-splits/admin/summary` - Admin: View all splits

## 6. Required Environment Variables

Add to your frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8017
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
```

Backend development should now also use:

```env
PAYSTACK_TEST_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_TEST_SECRET_KEY=sk_test_your_secret_key
```

This integration will work seamlessly with your web frontend, providing automatic payment splitting while maintaining full control over subaccount approval and settlement tracking.
