import { useState } from 'react';
import {
    Sparkles, Check, Zap, Eye, MapPin, Crown
} from 'lucide-react';
import MainLayout from '../components/Layouts/MainLayout';
import PaystackPop from '@paystack/inline-js';
import { toast } from 'react-toastify';

export default function PremiumPackages() {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
    const [selectedPlan, setSelectedPlan] = useState('gold'); // 'gold' | 'vip'

    // Pricing schema mapping (In GHS / your target currency)
    const PRICING = {
        gold: { monthly: 14.99, annual: 9.99 * 12 },
        vip: { monthly: 29.99, annual: 19.99 * 12 },
    };

    const handleSubscribe = (planId) => {
        const amountInMajor = PRICING[planId][billingCycle];
        // Paystack expects amount in lowest currency unit (e.g., pesewas/kobo -> multiply by 100)
        const amountInSubunit = Math.round(amountInMajor * 100);

        const paystack = new PaystackPop();

        paystack.newTransaction({
            key: import.meta.env.VITE_REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx',
            email: 'joshuagato37@gmail.com', // Pass authenticated user's email
            amount: amountInSubunit,
            currency: 'GHS', // Adjust currency code as needed ('GHS', 'NGN', 'USD')
            ref: `TRX-${planId.toUpperCase()}-${Date.now()}`,
            metadata: {
                custom_fields: [
                    { display_name: 'Plan', variable_name: 'plan', value: planId },
                    { display_name: 'Billing Cycle', variable_name: 'billing_cycle', value: billingCycle },
                ],
            },
            onSuccess: (transaction) => {
                toast.success(`Payment successful! Ref: ${transaction.reference}`);
                // Verify transaction reference on backend:
                // await verifyPaymentOnBackend(transaction.reference);
            },
            onCancel: () => {
                toast.info('Payment window closed.');
            },
        });
    };

    return (
        <MainLayout pageTitle="Unlock Premium" pageDetails="Upgrade to keep connecting without limits">
            <div className="w-full h-full p-4 flex flex-col justify-between space-y-6">

                {/* Hero Header */}
                <div className="text-center space-y-2 mt-2">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full text-amber-600 mb-1">
                        <Crown className="w-8 h-8 animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Elevate Your Experience
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Get 5x more matches, direct messaging, and see who liked your profile instantly.
                    </p>
                </div>

                {/* Billing Cycle Switch */}
                <div className="flex justify-center">
                    <div className="bg-slate-200 p-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-1.5 rounded-full transition-all ${billingCycle === 'monthly'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle('annual')}
                            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1 ${billingCycle === 'annual'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Annual <span className="bg-emerald-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold">Save 40%</span>
                        </button>
                    </div>
                </div>

                {/* Subscription Tiers */}
                <div className="space-y-3">
                    {/* Gold Tier (Featured) */}
                    <div
                        onClick={() => setSelectedPlan('gold')}
                        className={`relative cursor-pointer rounded-2xl p-4 transition-all border-2 ${selectedPlan === 'gold'
                            ? 'border-violet-500 bg-gradient-to-b from-violet-50/50 to-white shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                    >
                        <div className="absolute -top-3 right-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Most Popular
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-violet-600" /> Gold Pass
                                </h3>
                                <p className="text-[11px] text-slate-500">Perfect for active local encounters</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-extrabold text-slate-900">
                                    {billingCycle === 'annual' ? '$9.99' : '$14.99'}
                                </span>
                                <span className="text-[10px] text-slate-400">/mo</span>
                            </div>
                        </div>

                        <ul className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Unlimited Likes
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> See Who Liked You
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 5 Super Swipes/wk
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Rewind Last Swipe
                            </li>
                        </ul>
                    </div>

                    {/* VIP Tier */}
                    <div
                        onClick={() => setSelectedPlan('vip')}
                        className={`cursor-pointer rounded-2xl p-4 transition-all border-2 ${selectedPlan === 'vip'
                            ? 'border-amber-400 bg-gradient-to-b from-amber-50/50 to-white shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                                    <Crown className="w-4 h-4 text-amber-500" /> VIP Elite
                                </h3>
                                <p className="text-[11px] text-slate-500">Ultimate priority and global reach</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-extrabold text-slate-900">
                                    {billingCycle === 'annual' ? '$19.99' : '$29.99'}
                                </span>
                                <span className="text-[10px] text-slate-400">/mo</span>
                            </div>
                        </div>

                        <ul className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Everything in Gold
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Direct Msg Before Match
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Passport (Change Location)
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Priority Likes Stream
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="bg-slate-100/70 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center">
                        <Zap className="w-5 h-5 text-amber-500 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-700">Boost Profile</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Eye className="w-5 h-5 text-violet-500 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-700">See Likes</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <MapPin className="w-5 h-5 text-emerald-500 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-700">Global Travel</span>
                    </div>
                </div>

                {/* CTA Submit Button */}
                <div className="pt-2 pb-4">
                    <button
                        type="button"
                        onClick={() => handleSubscribe(selectedPlan)}
                        className="w-full py-3.5 px-6 rounded-full font-bold text-white text-sm bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all"
                    >
                        {`Upgrade to ${selectedPlan.toUpperCase()} Now`}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        Recurring billing. Cancel anytime in your profile settings.
                    </p>
                </div>

            </div>
        </MainLayout>
    );
}