import React, { useState } from 'react';
import './Upgrade.css';
import { Link } from 'react-router-dom';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    features: [
      'Up to 10 PDF uploads per month',
      'Basic AI-powered answers',
      'Email support',
      'Export answers as text',
      'Mobile app access'
    ],
    button: 'Choose Plan',
    icon: '📄'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    features: [
      'Up to 100 PDF uploads per month',
      'Advanced AI-powered answers',
      'Priority support',
      'Export answers as PDF/Word',
      'API access',
      'Team collaboration (up to 5 users)'
    ],
    button: 'Get Started',
    icon: '⭐',
    badge: 'Most Popular'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    features: [
      'Unlimited PDF uploads',
      'Enterprise AI-powered answers',
      '24/7 priority support',
      'Export in all formats',
      'Mobile app access',
      'Custom AI training',
      'Full API access',
      'Unlimited team collaboration',
      'White-label solution',
      'Advanced analytics',
      'Custom integrations'
    ],
    button: 'Choose Plan',
    icon: '👑'
  }
];

const faqs = [
  {
    q: 'Can I change plans anytime?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.'
  },
  {
    q: 'Is there a free trial?',
    a: 'We offer a 14-day free trial for all paid plans. No credit card required to get started.'
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
  }
];

const Upgrade = () => {
  const [billing, setBilling] = useState('monthly');

  return (
    <div className="upgrade-container">
      <div className="upgrade-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1 className="upgrade-title">Upgrade Your Experience</h1>
        <p className="upgrade-desc">
          Choose the perfect plan to unlock the full power of AI-driven PDF analysis.<br />
          Get instant answers, advanced features, and premium support.
        </p>
        <div className="billing-toggle">
          <span className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')}>Monthly</span>
          <span className="toggle-switch">
            <input type="checkbox" id="billing-switch" checked={billing === 'annual'} onChange={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')} />
            <label htmlFor="billing-switch"></label>
          </span>
          <span className={billing === 'annual' ? 'active' : ''} onClick={() => setBilling('annual')}>Annual</span>
        </div>
      </div>
      <div className="plans-container">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card${plan.badge ? ' popular' : ''}`}>
            {plan.badge && <div className="plan-badge">{plan.badge}</div>}
            <div className="plan-icon">{plan.icon}</div>
            <h2>{plan.name}</h2>
            <div className="price">
              {billing === 'monthly'
                ? `$${plan.price}`
                : `$${(plan.price * 12 * 0.8).toFixed(2)}`
              }
              <span>/{billing === 'monthly' ? 'month' : 'year'}</span>
            </div>
            <ul className="features">
              {plan.features.map((feature, idx) => <li key={idx}>{feature}</li>)}
            </ul>
            <button className="select-plan">{plan.button}</button>
          </div>
        ))}
      </div>
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div className="faq-item" key={idx}>
              <div className="faq-q">{faq.q}</div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="contact-sales">
        <h3>Need Help Choosing?</h3>
        <p>Our team is here to help you find the perfect plan for your needs.</p>
        <button className="contact-btn">Contact Sales</button>
      </div>
    </div>
  );
};

export default Upgrade; 