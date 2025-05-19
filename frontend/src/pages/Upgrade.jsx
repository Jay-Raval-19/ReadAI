import React, { useState } from 'react';
import './Upgrade.css';

const Upgrade = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upiId, setUpiId] = useState('');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '₹299',
      features: [
        'Up to 5 PDF uploads per month',
        'Basic search functionality',
        'Standard support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹599',
      features: [
        'Unlimited PDF uploads',
        'Advanced search functionality',
        'Priority support',
        'Custom page ranges',
        'Export functionality'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹999',
      features: [
        'Everything in Pro',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Team collaboration'
      ]
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      alert('Please select a plan first');
      return;
    }

    if (!upiId) {
      alert('Please enter your UPI ID');
      return;
    }

    // TODO: Implement actual payment processing
    console.log('Processing payment for plan:', selectedPlan, 'with UPI ID:', upiId);
  };

  return (
    <div className="upgrade-container">
      <div className="upgrade-header">
        <h1>Upgrade Your Plan</h1>
        <p>Choose the perfect plan for your needs</p>
      </div>

      <div className="plans-container">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            <h2>{plan.name}</h2>
            <div className="price">{plan.price}<span>/month</span></div>
            <ul className="features">
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button
              className={`select-plan ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePlanSelect(plan.id);
              }}
            >
              {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="payment-section">
          <h2>Complete Your Payment</h2>
          <div className="payment-form">
            <div className="form-group">
              <label htmlFor="upiId">Enter your UPI ID</label>
              <input
                type="text"
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@upi"
                required
              />
            </div>
            <button className="pay-button" onClick={handlePayment}>
              Pay Now
            </button>
          </div>
          <div className="payment-info">
            <p>Supported UPI Apps:</p>
            <div className="upi-apps">
              <span>Google Pay</span>
              <span>PhonePe</span>
              <span>Paytm</span>
              <span>BHIM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upgrade; 