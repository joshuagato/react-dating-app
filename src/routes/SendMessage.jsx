// Feedback.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Send,
    MessageSquare,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Type,
    AlignLeft,
    ChevronLeft,
} from 'lucide-react';

import MainLayout from '../components/Layouts/MainLayout';
import HelmetHeader from '../components/HelmetHeader';
import { submitFeedbackHandler } from '../tanstack/feedback';
import {
    FEEDBACK_TITLE,
    FEEDBACK_TEXT,
} from '../utils/constants';

const TITLE_MAX = 150;
const BODY_MAX = 5000;

export default function Feedback() {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const titleRemaining = TITLE_MAX - title.length;
    const bodyRemaining = BODY_MAX - body.length;

    const titleValid = title.trim().length >= 3;
    const bodyValid = body.trim().length >= 10;
    const canSubmit = titleValid && bodyValid && !submitting;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError(null);

        try {
            await submitFeedbackHandler({
                title: title.trim(),
                body: body.trim(),
            });
            setSubmitted(true);
            setTitle('');
            setBody('');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Something went wrong. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout
            pageTitle={FEEDBACK_TITLE}
            pageDetails={FEEDBACK_TEXT}
        >
            <HelmetHeader pageTitle={FEEDBACK_TITLE} />

            <div className="relative w-full h-full flex flex-col overflow-y-auto select-none px-4 sm:px-6 py-6 scroll-bar">
                {/* Back button — top-left, subtle */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors mb-4 w-fit"
                >
                    <ChevronLeft size={14} />
                    Back
                </button>

                {/* Success state */}
                {submitted ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <CheckCircle2
                                    size={40}
                                    className="text-white"
                                    strokeWidth={2.5}
                                />
                            </div>
                            <Sparkles
                                size={20}
                                className="absolute -top-1 -right-1 text-amber-400 animate-pulse"
                            />
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 mt-6">
                            Message sent!
                        </h2>
                        <p className="text-sm text-slate-500 max-w-xs mt-2 leading-relaxed">
                            Thanks for reaching out. We read every message
                            and will get back to you if a reply is needed.
                        </p>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setSubmitted(false)}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                            >
                                Send another
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Intro card */}
                        <div className="bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50 border border-violet-100 rounded-2xl p-5 mb-6 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                <MessageSquare
                                    size={20}
                                    className="text-violet-600"
                                />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                    We're listening
                                </h3>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Have a question, feedback, or an issue?
                                    Drop us a message and we'll review it
                                    shortly.
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 flex-1 flex flex-col"
                        >
                            {/* Title field */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-violet-400 focus-within:shadow-md focus-within:shadow-violet-500/5 transition-all">
                                <label
                                    htmlFor="feedback-title"
                                    className="flex items-center gap-2 px-4 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                                >
                                    <Type size={12} className="text-violet-500" />
                                    Title
                                </label>
                                <input
                                    id="feedback-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={TITLE_MAX}
                                    placeholder="Briefly, what's this about?"
                                    className="w-full px-4 pb-3 pt-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                                />
                                <div className="px-4 pb-3 flex justify-end">
                                    <span
                                        className={`text-[10px] font-semibold ${titleRemaining < 20
                                            ? 'text-amber-500'
                                            : 'text-slate-400'
                                            }`}
                                    >
                                        {title.length} / {TITLE_MAX}
                                    </span>
                                </div>
                            </div>

                            {/* Body field */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-violet-400 focus-within:shadow-md focus-within:shadow-violet-500/5 transition-all flex-1 flex flex-col min-h-[220px]">
                                <label
                                    htmlFor="feedback-body"
                                    className="flex items-center gap-2 px-4 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                                >
                                    <AlignLeft
                                        size={12}
                                        className="text-violet-500"
                                    />
                                    Message
                                </label>
                                <textarea
                                    id="feedback-body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    maxLength={BODY_MAX}
                                    placeholder="Tell us everything. The more detail, the better we can help."
                                    className="w-full flex-1 px-4 pb-2 pt-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none resize-none"
                                    rows={8}
                                />
                                <div className="px-4 pb-3 flex justify-end">
                                    <span
                                        className={`text-[10px] font-semibold ${bodyRemaining < 200
                                            ? 'text-amber-500'
                                            : 'text-slate-400'
                                            }`}
                                    >
                                        {body.length} / {BODY_MAX}
                                    </span>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
                                    <AlertCircle
                                        size={14}
                                        className="flex-shrink-0 mt-0.5"
                                    />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${canSubmit
                                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/30 hover:brightness-110 active:scale-[0.99]'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Send Message
                                    </>
                                )}
                            </button>

                            <p className="text-[11px] text-slate-400 text-center leading-relaxed pb-2">
                                We typically respond within 24–48 hours on
                                weekdays.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </MainLayout>
    );
}