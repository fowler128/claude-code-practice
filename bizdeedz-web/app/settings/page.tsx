'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  CreditCard,
  FileText,
  Shield,
  ExternalLink,
  LogOut
} from 'lucide-react';

export default function SettingsPage() {
  const [user] = useState({
    name: 'Demo Paralegal',
    email: 'demo@bizdeedz.com',
    firmName: 'BizDeedz Law Firm',
    subscription: 'Trial',
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
              <p className="text-gray-500">{user.email}</p>
              {user.firmName && (
                <p className="text-sm text-gray-400">{user.firmName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Current Plan</p>
                <p className="text-sm text-gray-500">7-Day Free Trial</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {user.subscription}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Available Plans</h4>
            <div className="space-y-3">
              <PlanOption
                name="Solo Paralegal"
                price="$29/mo"
                features={['Single user', 'Unlimited filings', 'Email support']}
              />
              <PlanOption
                name="Law Firm"
                price="$199/mo"
                features={['Up to 10 users', 'Priority support', 'Advanced analytics']}
                highlighted
              />
              <PlanOption
                name="Enterprise"
                price="Custom"
                features={['Unlimited users', 'Dedicated support', 'Custom integrations']}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legal Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Legal</h2>
        </div>
        <div className="divide-y divide-gray-200">
          <Link
            href="/terms"
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">Terms of Service</span>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </Link>
          <Link
            href="/terms#privacy"
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">Privacy Policy</span>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">About</h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Version</span>
            <span className="text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Build</span>
            <span className="text-gray-900">January 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Platform</span>
            <span className="text-gray-900">Web App</span>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium">
        <LogOut className="h-5 w-5" />
        Sign Out
      </button>
    </div>
  );
}

function PlanOption({
  name,
  price,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${highlighted ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{name}</span>
        <span className={`font-semibold ${highlighted ? 'text-blue-600' : 'text-gray-900'}`}>{price}</span>
      </div>
      <ul className="space-y-1">
        {features.map((feature, i) => (
          <li key={i} className="text-sm text-gray-500">• {feature}</li>
        ))}
      </ul>
    </div>
  );
}
