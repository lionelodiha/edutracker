import React, { useState } from 'react';
import { Check, School, Loader2, ArrowRight } from 'lucide-react';

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5270/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.orgName,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          successUrl: window.location.origin + '/payment-success',
          cancelUrl: window.location.href
        })
      });

      if (!response.ok) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || 'Server responded with error');
        } catch (e) {
            throw new Error(`Server Error (${response.status}): ${text}`);
        }
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || 'Failed to connect to server'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#1E293B] p-2 rounded-lg">
              <School className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1E293B]">EduTracker SaaS</span>
          </div>
          <a href="/login" className="text-slate-600 hover:text-slate-900 font-medium">Log in</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Start your digital school today</h1>
          <p className="text-xl text-slate-600">Everything you need to manage your educational institution</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Features Column */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-full">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Pro Plan</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold text-slate-900">$29</span>
                <span className="text-slate-500">/month</span>
              </div>

              <ul className="space-y-4">
                {[
                  'Unlimited Students & Teachers',
                  'Advanced Attendance Tracking',
                  'Grade Management System',
                  'Admin Dashboard',
                  'Parent Portal (Coming Soon)',
                  'Priority Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <div className="bg-green-100 p-1 rounded-full">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Registration Form Column */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-6 relative z-10">Create your Organization</h3>
            
            <form onSubmit={handleSubscribe} className="space-y-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School / Organization Name</label>
                <input
                  type="text"
                  name="orgName"
                  required
                  value={formData.orgName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#1E293B] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Springfield High"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="adminFirstName"
                    required
                    value={formData.adminFirstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#1E293B] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="adminLastName"
                    required
                    value={formData.adminLastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#1E293B] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Administrator Email</label>
                <input
                  type="email"
                  name="adminEmail"
                  required
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#1E293B] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="admin@school.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  name="adminPassword"
                  required
                  value={formData.adminPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#1E293B] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E293B] hover:bg-[#334155] text-white py-3 rounded-lg font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Proceed to Payment <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-slate-500 mt-4">
                Secure payment via Stripe. Cancel anytime.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
