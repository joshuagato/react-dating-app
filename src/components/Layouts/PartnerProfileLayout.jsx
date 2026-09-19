import { useLocation, useNavigate } from 'react-router';
import { SlidersHorizontal, ArrowLeft, Crown, Sparkles, Lock } from 'lucide-react';
import { NavLink } from 'react-router';
import { encountersPath, premiumPath } from '../../utils/constants';
import { pathMatched } from '../../utils/functions';
import AdSense from '../AdSense';

const PartnerProfileLayout = ({ children, pageTitle = "Partner Profile", pageDetails = "" }) => {
    const currentPathName = useLocation().pathname;
    const navigate = useNavigate();

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800 select-none">
            <div className='relative h-full w-full lg:max-w-2xl flex flex-col'>

                {/* Header Section: 7vh */}
                <section className="w-full h-[7vh] flex justify-between items-center bg-white py-2 px-4 z-10 border-b border-[#e2e8f0]">
                    <div className='bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600'>
                        <h1 className="text-xl font-bold">
                            {pageTitle}
                        </h1>
                        {pageDetails && <p className='text-sm'>{pageDetails}</p>}
                    </div>

                    <div className='flex gap-4 items-center'>
                        {pathMatched(encountersPath, currentPathName) && (
                            <article className="cursor-pointer">
                                <div onClick={() => document.getElementById('my_modal_3').showModal()}>
                                    <SlidersHorizontal className="hover:text-violet-600 transition-colors" />
                                </div>

                                <dialog id="my_modal_3" className="modal modal-bottom sm:modal-middle">
                                    <div className="modal-box bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl relative text-left">
                                        <form method="dialog">
                                            <button className="btn btn-sm btn-circle btn-ghost text-slate-400 hover:text-slate-700 absolute right-3 top-3">
                                                ✕
                                            </button>
                                        </form>

                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold mb-3">
                                            <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                            <span>Premium Feature</span>
                                        </div>

                                        <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">
                                            Advanced Distance Filters
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
                                            Adjusting match radius and age criteria beyond defaults requires an active premium pass.
                                        </p>

                                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-6 relative overflow-hidden">
                                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-2">
                                                <span>Search Radius</span>
                                                <span className="font-bold text-slate-400">30 km (Locked)</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max="100"
                                                defaultValue="30"
                                                disabled
                                                className="range range-xs range-primary opacity-40 cursor-not-allowed"
                                            />

                                            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                    <Lock className="w-3 h-3 text-amber-400" /> Locked
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <NavLink
                                                to={premiumPath}
                                                onClick={() => document.getElementById('my_modal_3').close()}
                                                className="w-full py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-md shadow-violet-500/20 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2"
                                            >
                                                <Sparkles className="w-4 h-4 fill-white" />
                                                Unlock Premium Packages
                                            </NavLink>

                                            <form method="dialog">
                                                <button className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                                                    Maybe Later
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <form method="dialog" className="modal-backdrop">
                                        <button>close</button>
                                    </form>
                                </dialog>
                            </article>
                        )}

                        {/* Back Arrow Button */}
                        <article className='cursor-pointer hover:bg-slate-100 p-1.5 rounded-full transition-colors' onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5 text-slate-700" />
                        </article>
                    </div>
                </section>

                {/* Main Content Area: 86vh (Expanded since bottom nav was removed) */}
                <section className="w-full h-[86vh] bg-[#f8fafc] border-x border-[#e2e8f0] overflow-y-auto">
                    {children}
                </section>

                {/* AdSense Section: 7vh */}
                <section id='adsense' className="w-full flex justify-center items-center bg-white border-t border-x border-[#e2e8f0] overflow-hidden z-10">
                    <div className="w-full h-full flex justify-center items-center">
                        <AdSense
                            client="ca-pub-1951941014525314"
                            slot="4437680249"
                            format="horizontal"
                            responsive="true"
                        />
                    </div>
                </section>

            </div>
        </div>
    );
};

export default PartnerProfileLayout;