import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Sparkles, Check, Zap, Eye, MapPin, Crown, Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PaystackPop from '@paystack/inline-js';
import { toast } from 'react-toastify';

import MainLayout from '../components/Layouts/MainLayout';
import {
    getPremiumPricesHandler,
    verifyPaystackPaymentHandler,
} from '../tanstack/premium';
import { userId } from '../utils/constants';

const CYCLE_LABELS = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: '3 Months',
    semiannual: '6 Months',
    annual: 'Annual',
};

const CYCLE_ORDER = ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'];

const CURRENCY_SYMBOLS = {
    USD: '$', GBP: '£', EUR: '€',
    GHS: 'GH₵', NGN: '₦', ZAR: 'R', KES: 'KSh',
};

export default function PremiumPackages() {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(null);

    const { data: pricingData, isLoading, error } = useQuery({
        queryKey: ['premium-prices'],
        queryFn: getPremiumPricesHandler,
    });

    const displayCurrency = pricingData?.displayCurrency || 'USD';
    const prices = pricingData?.prices || {};
    const charges = pricingData?.charges || {};
    const publicKey = import.meta.env.VITE_REACT_APP_PAYSTACK_PUBLIC_KEY;
    console.log({ pricingData })

    const formatPrice = (amount, currency = displayCurrency) => {
        if (amount == null) return '—';
        const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
        // Display whole numbers without decimals for cleaner chips
        const numeric = Number(amount);
        return `${symbol}${Number.isInteger(numeric) ? numeric : numeric.toFixed(2)}`;
    };

    // For the success modal — we show the charge amount in the currency
    // Paystack actually processed (USD for foreign regions, local for supported).
    const formatCharge = (amount, currency) => {
        if (amount == null) return '';
        const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
        const numeric = Number(amount) / 100; // smallest unit -> major
        return `${symbol}${Number.isInteger(numeric) ? numeric : numeric.toFixed(2)}`;
    };

    // Savings vs monthly — shown as a badge on longer cycles
    const monthlyPerCycle = (cycle) => {
        const months = { weekly: 0.25, monthly: 1, quarterly: 3, semiannual: 6, annual: 12 };
        const m = months[cycle];
        if (!m || prices[cycle] == null || prices.monthly == null) return null;
        const perMonth = prices[cycle] / m;
        if (perMonth >= prices.monthly) return null;
        const pct = Math.round((1 - perMonth / prices.monthly) * 100);
        return pct > 0 ? pct : null;
    };

    const handleSubscribe = () => {
        console.log({ publicKey })
        if (submitting || !publicKey) return;

        const charge = charges[billingCycle];
        if (!charge || !charge.amount) {
            toast.error('Price not available. Try another billing cycle.');
            return;
        }

        setSubmitting(true);

        const paystack = new PaystackPop();
        paystack.newTransaction({
            key: publicKey,
            email: pricingData?.email || 'customer@crushr.app',
            amount: charge.amount,               // smallest unit
            currency: charge.currency,           // what Paystack processes
            ref: `CRUSHR-${Date.now()}`,
            metadata: {
                user_id: userId,
                billing_cycle: billingCycle,
                display_currency: displayCurrency,
            },
            onSuccess: async (transaction) => {
                try {
                    const result = await verifyPaystackPaymentHandler(transaction.reference);

                    if (result?.success) {
                        setShowSuccess({
                            message: result.message || 'Welcome to Crushr Premium!',
                            billingCycle,
                            amount: charge.amount,
                            currency: charge.currency,
                        });
                    } else {
                        toast.error(result?.message || 'Payment succeeded but activation failed.');
                    }
                } catch (err) {
                    toast.error('Payment succeeded but activation failed. Contact support.');
                } finally {
                    setSubmitting(false);
                }
            },
            onCancel: () => {
                toast.info('Payment cancelled.');
                setSubmitting(false);
            },
        });
    };

    if (isLoading) {
        return (
            <MainLayout pageTitle="Unlock Premium" pageDetails="Loading prices…">
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-violet-600" size={32} />
                </div>
            </MainLayout>
        );
    }

    if (error || pricingData?.success === false) {
        return (
            <MainLayout pageTitle="Unlock Premium" pageDetails="Unavailable">
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-sm text-slate-600">
                        {error?.message || pricingData?.message || 'Could not load pricing.'}
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm font-semibold text-violet-700"
                    >
                        Go back
                    </button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout
            pageTitle="Unlock Premium"
            pageDetails="Everything, one plan"
        >
            <div className="w-full h-full p-4 flex flex-col space-y-5 overflow-y-auto pb-8">

                {/* Hero */}
                <div className="text-center space-y-2 mt-2">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-full text-amber-600 mb-1">
                        <Crown className="w-8 h-8 animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        Crushr Premium
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        One plan. Every premium feature. Unlimited likes, see who liked you,
                        direct messages, and global reach.
                    </p>
                </div>

                {/* Billing Cycle Selector */}
                <div className="flex flex-wrap justify-center gap-2">
                    {CYCLE_ORDER.map((cycle) => {
                        const saving = monthlyPerCycle(cycle);
                        const selected = billingCycle === cycle;
                        return (
                            <button
                                key={cycle}
                                type="button"
                                onClick={() => setBillingCycle(cycle)}
                                className={`relative px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selected
                                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent'
                                    : 'bg-white text-slate-600 border-slate-300 hover:border-violet-400'
                                    }`}
                            >
                                {CYCLE_LABELS[cycle]}
                                {saving && (
                                    <span className="ml-1 text-[9px] bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded-full font-bold">
                                        −{saving}%
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Price Card */}
                <div className="rounded-2xl border-2 border-violet-500 bg-gradient-to-b from-violet-50/50 to-white p-5 shadow-md">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-violet-600" /> Premium
                            </h3>
                            <p className="text-[11px] text-slate-500">
                                {CYCLE_LABELS[billingCycle]} billing · {displayCurrency}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-extrabold text-slate-900">
                                {formatPrice(prices[billingCycle])}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                /{billingCycle === 'weekly'
                                    ? 'wk'
                                    : billingCycle === 'annual'
                                        ? 'yr'
                                        : 'period'}
                            </span>
                        </div>
                    </div>

                    <ul className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                        {[
                            'Unlimited Likes',
                            'See Who Liked You',
                            'Direct Messages',
                            'Super Swipes',
                            'Rewind Last Swipe',
                            'Global Passport',
                            'Priority in Feed',
                            'Ad-Free Experience',
                        ].map((feature) => (
                            <li key={feature} className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Feature Highlights */}
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

                {/* CTA */}
                <div className="pt-2 pb-4">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubscribe}
                        className="w-full py-3.5 px-6 rounded-full font-bold text-white text-sm bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing…
                            </>
                        ) : (
                            `Upgrade Now — ${formatPrice(prices[billingCycle])}`
                        )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        Secure payment via Paystack
                    </p>
                </div>
            </div>

            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center relative animate-[scaleIn_0.2s_ease-out]">
                        {/* Confetti-ish header */}
                        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg mb-4">
                            <Crown className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-xl font-black text-slate-900 mb-1">
                            You're Premium! 🎉
                        </h2>
                        <p className="text-sm text-slate-600 mb-4">
                            {showSuccess.message}
                        </p>

                        {/* Receipt summary */}
                        <div className="bg-slate-50 rounded-2xl p-3 mb-5 text-left text-xs text-slate-600 space-y-1">
                            <div className="flex justify-between">
                                <span>Plan</span>
                                <span className="font-semibold text-slate-800">
                                    {CYCLE_LABELS[showSuccess.billingCycle]}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Charged</span>
                                <span className="font-semibold text-slate-800">
                                    {formatCharge(showSuccess.amount, showSuccess.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className="font-semibold text-emerald-600">Active</span>
                            </div>
                        </div>

                        <ul className="text-left text-xs text-slate-600 space-y-1.5 mb-5">
                            {[
                                'Unlimited likes unlocked',
                                'See who liked you',
                                'Direct messaging enabled',
                                'Ad-free experience',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            onClick={() => {
                                setShowSuccess(null);
                                navigate('/profile', { replace: false });
                            }}
                            className="w-full py-3 rounded-full font-bold text-white text-sm bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-md active:scale-[0.98] transition-all"
                        >
                            Start Exploring
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowSuccess(null)}
                            className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-700"
                        >
                            Stay on this page
                        </button>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}