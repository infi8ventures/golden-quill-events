import React from 'react';
import { formatDate, formatCurrency } from "@/lib/supabase-helpers";
import logoImg from "@/assets/KM_Logo_Grey.png";
import type { TemplateData } from './FormalTemplate';

interface ModernTemplateProps {
    data: TemplateData;
    id?: string;
}

export function ModernTemplate({ data, id = "print-content" }: ModernTemplateProps) {
    return (
        <div className="print-modern bg-white font-sans text-stone-900">
            <div id={id} className="print-modern-sheet relative overflow-hidden">

                {/* GEOMETRIC ACCENTS */}
                <div className="absolute top-0 right-0 w-64 h-[200vh] bg-stone-50 border-l border-stone-200 -z-10 rotate-12 translate-x-32 -translate-y-32"></div>
                <div className="absolute top-16 right-16 w-32 h-32 bg-amber-400 rounded-full blur-[80px] opacity-40 -z-10"></div>

                <div className="p-12">
                    {/* Header Row */}
                    <div className="flex justify-between items-end mb-16 border-b-4 border-stone-900 pb-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="bg-stone-900 p-4 rounded-xl shadow-lg">
                                <img src={logoImg} className="h-20 w-auto object-contain brightness-0 invert" alt="Logo" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter text-stone-900">K M Enterprises</h2>
                                <p className="text-sm font-medium text-stone-500 mt-1">Event Management</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <h1 className="text-6xl font-black tracking-tighter text-stone-900 uppercase leading-none mb-2">
                                {data.type === 'QUOTATION' ? 'QUOTE' : 'INVOICE'}
                            </h1>
                            <p className="text-amber-500 font-bold text-xl tracking-widest">#{data.documentNumber}</p>
                        </div>
                    </div>

                    {/* Meta Info & Billing */}
                    <div className="grid grid-cols-12 gap-8 mb-16 relative z-10">
                        {/* Meta Data */}
                        <div className="col-span-4 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date Issued</p>
                                <p className="text-lg font-bold text-stone-900">{data.date ? formatDate(data.date) : "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Company Info</p>
                                <p className="text-xs font-semibold text-stone-600 leading-relaxed">
                                    #612, Nagendra Nilaya, 8th Main<br />
                                    1st Stage, Vijayanagar Mysuru<br />
                                    GSTIN: <span className="text-stone-900">29AAXFK3522C1Z6</span>
                                </p>
                            </div>
                        </div>

                        {/* Billed To */}
                        <div className="col-span-8 bg-stone-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden flex items-center">
                            <div className="absolute top-0 right-0 w-32 h-full bg-amber-500 transform skew-x-12 translate-x-16 opacity-90"></div>

                            <div className="grid grid-cols-2 gap-8 w-full relative z-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Billed To
                                    </p>
                                    <p className="text-2xl font-bold text-white leading-tight">{data.clientName || "—"}</p>
                                </div>

                                {data.eventName && (
                                    <div className="space-y-2 pl-8 border-l border-stone-700/50">
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span> For Event
                                        </p>
                                        <p className="text-xl font-bold text-amber-400 leading-tight">{data.eventName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Minimalist Bold Table */}
                    <div className="mb-16 relative z-10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-stone-200">
                                    <th className="py-4 px-2 text-left font-black text-stone-400 uppercase tracking-widest text-[10px] w-12">No.</th>
                                    <th className="py-4 px-2 text-left font-black text-stone-400 uppercase tracking-widest text-[10px]">Description</th>
                                    <th className="py-4 px-2 text-center font-black text-stone-400 uppercase tracking-widest text-[10px] w-24">Qty</th>
                                    <th className="py-4 px-2 text-right font-black text-stone-400 uppercase tracking-widest text-[10px] w-32">Rate</th>
                                    <th className="py-4 px-2 text-right font-black text-stone-400 uppercase tracking-widest text-[10px] w-36">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {data.items.map((item, index) => (
                                    <tr key={item.id || index} className="group hover:bg-stone-50 transition-colors">
                                        <td className="py-5 px-2 text-stone-400 font-bold text-xs">{(index + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-5 px-2 font-bold text-stone-800 text-base">{item.description}</td>
                                        <td className="py-5 px-2 text-center font-semibold text-stone-600">
                                            {item.quantity} <span className="text-xs text-stone-400 font-normal">{item.unit || 'nos'}</span>
                                        </td>
                                        <td className="py-5 px-2 text-right font-medium text-stone-600">{formatCurrency(item.rate)}</td>
                                        <td className="py-5 px-2 text-right font-black text-stone-900">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals & Notes Section */}
                    <div className="grid grid-cols-12 gap-12 relative z-10 mb-8">
                        {/* Terms & Bank */}
                        <div className="col-span-7 space-y-10">
                            {data.notes && (
                                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 relative">
                                    <div className="absolute top-0 left-6 -translate-y-1/2 bg-amber-400 text-stone-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                        Notes
                                    </div>
                                    <p className="text-sm font-medium text-amber-900 leading-relaxed pt-2">{data.notes}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Terms & Conditions</h4>
                                <p className="text-xs font-medium text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">{data.terms}</p>
                            </div>


                            <div>
                                <h4 className="flex items-center gap-3 text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">
                                    Bank Details <span className="h-px bg-stone-200 flex-1"></span>
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                        <p className="text-stone-400 mb-1">Bank Name</p>
                                        <p className="text-stone-900 font-bold">HDFC Bank, Saraswathipuram</p>
                                    </div>

                                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                        <p className="text-stone-400 mb-1">Account Info</p>
                                        <p className="text-stone-900 font-bold tracking-tight">K M Enterprises</p>
                                        <p className="text-stone-600 font-mono tracking-wider mt-1 border-t border-stone-200 pt-1">50200064343340</p>
                                    </div>
                                    <div className="col-span-2 bg-stone-50/50 p-3 rounded-xl border border-stone-200 flex justify-between items-center">
                                        <span className="text-stone-400">IFSC Code</span>
                                        <span className="text-stone-900 font-mono font-bold tracking-wider">HDFC0000065</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grand Totals */}
                        <div className="col-span-5 flex flex-col justify-end">
                            <div className="bg-stone-50 rounded-3xl p-8 border-2 border-stone-900 shadow-xl relative">
                                {/* Diagonal lines decoration */}
                                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-3xl">
                                    <div className="absolute top-0 right-0 w-[200%] h-[200%] -translate-y-1/2 translate-x-1/2 rotate-45 flex flex-col gap-1 opacity-10">
                                        {[...Array(10)].map((_, i) => <div key={i} className="w-full h-1 bg-stone-900"></div>)}
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm font-bold relative z-10">
                                    <div className="flex justify-between items-center text-stone-500">
                                        <span>Subtotal</span>
                                        <span className="text-stone-900 text-base">{formatCurrency(data.subtotal)}</span>
                                    </div>
                                    {data.discount > 0 && (
                                        <div className="flex justify-between items-center text-red-500">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(data.discount)}</span>
                                        </div>
                                    )}
                                    {data.tax > 0 && (
                                        <>
                                            {(data.cgstAmount || 0) > 0 && (
                                                <div className="flex justify-between items-center text-stone-500">
                                                    <span>CGST ({data.cgstPercentage}%)</span>
                                                    <span className="text-stone-900 text-base">{formatCurrency(data.cgstAmount!)}</span>
                                                </div>
                                            )}
                                            {(data.sgstAmount || 0) > 0 && (
                                                <div className="flex justify-between items-center text-stone-500">
                                                    <span>SGST ({data.sgstPercentage}%)</span>
                                                    <span className="text-stone-900 text-base">{formatCurrency(data.sgstAmount!)}</span>
                                                </div>
                                            )}
                                            {(data.igstAmount || 0) > 0 && (
                                                <div className="flex justify-between items-center text-stone-500">
                                                    <span>IGST ({data.igstPercentage}%)</span>
                                                    <span className="text-stone-900 text-base">{formatCurrency(data.igstAmount!)}</span>
                                                </div>
                                            )}
                                            {!(data.cgstAmount || data.sgstAmount || data.igstAmount) && (
                                                <div className="flex justify-between items-center text-stone-500">
                                                    <span>GST</span>
                                                    <span className="text-stone-900 text-base">{formatCurrency(data.tax)}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="pt-6 mt-4 border-t-2 border-stone-200">
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Due</p>
                                        <div className="text-5xl font-black text-stone-900 tracking-tighter leading-none mb-1">
                                            {formatCurrency(data.total)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 text-right mr-4">
                                <div className="h-14 mb-3" />
                                <div className="w-40 h-1 bg-stone-900 ml-auto mb-2 rounded-full"></div>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
