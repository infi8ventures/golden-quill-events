import React from 'react';
import { formatDate, formatCurrency } from "@/lib/supabase-helpers";
import type { TemplateData } from './FormalTemplate';

import floralCorner from "@/assets/floral_corner.png";
import floralDivider from "@/assets/floral_divider.png";
import kmLogo from "@/assets/KM_Logo_Grey.png";
import belowBrand from "@/assets/Below Brand.png";


const C = {
    tableHeaderBg: '#284A4A',
    tableHeaderText: '#FFFFFF',
    tableBodyBg: 'rgba(253, 249, 243, 0.4)',
    rowHighlight: '#222222',
    totalsBg: 'rgba(253, 249, 243, 0.6)',
    totalsLabel: '#333333',
    totalsSep: '#D5C3A5',
    termsLabel: '#222222',
    termsText: '#333333',
    paperBg: '#F6F2EC', // Match the off-white paper tone
    gold: '#BBA14F',
    darkGold: '#A17B33',
    logoFilter: 'sepia(0.8) saturate(1.1) hue-rotate(5deg) brightness(1) contrast(1)', // Desaturated gold to match #b69b50
};

interface CreativeTemplateProps {
    data: TemplateData;
    id?: string;
}

export function CreativeTemplate({ data, id = "print-content" }: CreativeTemplateProps) {
    return (
        <div style={{ background: C.paperBg, position: 'relative', overflow: 'hidden', minHeight: '1123px', fontFamily: '"Inter", sans-serif' }}>

            {/* ══ PAPER TEXTURE OVERLAY ══ */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.35,
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'
            }} />

            {/* ══ MASSIVE CENTER WATERMARK (CLEAN) ══ */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, pointerEvents: 'none' }}>
                <img src={kmLogo} alt="" style={{ width: '65%', height: 'auto', objectFit: 'contain', opacity: 0.08, filter: C.logoFilter }} />
            </div>

            {/* ══ CORNER ASSETS (CLEAN) ══ */}
            {/* Top Left */}
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '320px', height: 'auto', zIndex: 10, pointerEvents: 'none' }}>
                <img src={floralCorner} alt="" style={{ width: '100%', height: 'auto' }} />
            </div>
            {/* Top Right */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '280px', height: 'auto', zIndex: 10, pointerEvents: 'none', transform: 'scaleX(-1)' }}>
                <img src={floralCorner} alt="" style={{ width: '100%', height: 'auto' }} />
            </div>
            {/* Bottom Left */}
            <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '200px', height: 'auto', zIndex: 10, pointerEvents: 'none', transform: 'scaleY(-1)' }}>
                <img src={floralCorner} alt="" style={{ width: '100%', height: 'auto' }} />
            </div>
            {/* Bottom Right */}
            <div style={{ position: 'absolute', bottom: '-20px', right: '-40px', width: '300px', height: 'auto', zIndex: 10, pointerEvents: 'none', transform: 'scale(-1)' }}>
                <img src={floralCorner} alt="" style={{ width: '100%', height: 'auto' }} />
            </div>

            {/* ══ MAIN CONTENT ══ */}
            <div id={id} style={{ position: 'relative', zIndex: 20, padding: '44px 56px 52px 56px' }}>

                {/* ── HEADER ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', minHeight: '140px' }}>
                    {/* Left Side Spacer - Equal width to right side for centering */}
                    <div style={{ width: '30%' }} />

                    {/* Center Branding (Pure asset only) */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', textAlign: 'center', marginTop: '-10px' }}>
                        <img src={kmLogo} alt="Branding Logo" style={{ width: '210px', height: 'auto', filter: C.logoFilter }} />
                    </div>

                    {/* Right: company info */}
                    <div style={{ width: '30%', textAlign: 'right', marginTop: '40px' }}>
                        <h2 style={{ fontFamily: '"Georgia", "Playfair Display", serif', fontWeight: 700, fontSize: '26px', color: '#111', marginBottom: '8px', lineHeight: 1.1 }}>K M Enterprises</h2>
                        <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.5, margin: 0 }}>#612, Nagendra Nilaya, 8th Main 1st Stage, Vijayanagar Mysuru</p>
                        {/* Extracted small wave/dot string from asset or recreate closely */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '4px', gap: '2px' }}>
                            <img src={belowBrand} alt="Branding Logo" style={{ width: '210px', height: 'auto', filter: C.logoFilter }} />
                        </div>
                    </div>
                </div>

                {/* ── QUOTATION TITLE ── */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', margin: '0 auto' }}>
                        <img src={floralDivider} alt="" style={{ height: '48px', width: 'auto', opacity: 0.85, marginRight: '-5px' }} />
                        <h1 style={{ fontFamily: '"Georgia", "Playfair Display", serif', fontWeight: 700, textTransform: 'uppercase', fontSize: '38px', color: '#b69b50', letterSpacing: '0.15em', margin: '0 5px', lineHeight: 1 }}>
                            {data.type}
                        </h1>
                        <img src={floralDivider} alt="" style={{ height: '48px', width: 'auto', transform: 'scaleX(-1)', opacity: 0.85, marginLeft: '-5px' }} />
                    </div>
                    {/* Three diamond dots under title */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
                        <svg width="40" height="12" viewBox="0 0 40 12"><path d="M0,6 Q10,2 20,6 Q30,10 40,6" stroke={C.gold} strokeWidth="1.5" fill="none" opacity="0.7" /></svg>
                        <span style={{ color: C.gold, fontSize: '10px' }}>◆</span>
                        <span style={{ color: C.gold, fontSize: '10px' }}>◆</span>
                        <span style={{ color: C.gold, fontSize: '10px' }}>◆</span>
                        <svg width="40" height="12" viewBox="0 0 40 12"><path d="M0,6 Q10,10 20,6 Q30,2 40,6" stroke={C.gold} strokeWidth="1.5" fill="none" opacity="0.7" /></svg>
                    </div>
                </div>

                {/* ── DOCUMENT INFO ROW ── */}
                <div style={{ borderTop: `1px solid ${C.gold}50`, borderBottom: `1px solid ${C.gold}50`, padding: '14px 10px', margin: '14px 0 16px 0', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#333', marginBottom: '4px' }}>Quotation No</p>
                        <p style={{ fontWeight: 700, color: '#000', fontSize: '15px', margin: 0 }}>{data.documentNumber}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 30px' }}>
                        <span style={{ width: '1px', height: '18px', borderLeft: `1.5px dotted ${C.gold}80` }}></span>
                        <span style={{ color: C.gold, fontSize: '12px', lineHeight: 1 }}>◆</span>
                        <span style={{ width: '1px', height: '18px', borderLeft: `1.5px dotted ${C.gold}80` }}></span>
                    </div>
                    <div style={{ flex: 1, paddingLeft: '10px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#333', marginBottom: '4px' }}>Date</p>
                        <p style={{ fontWeight: 700, color: '#000', fontSize: '15px', margin: 0 }}>{data.date ? formatDate(data.date) : '—'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 30px' }}>
                        <span style={{ width: '1px', height: '18px', borderLeft: `1.5px dotted ${C.gold}80` }}></span>
                        <span style={{ color: C.gold, fontSize: '12px', lineHeight: 1 }}>◆</span>
                        <span style={{ width: '1px', height: '18px', borderLeft: `1.5px dotted ${C.gold}80` }}></span>
                    </div>
                    <div style={{ flex: 1, paddingLeft: '10px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#333', marginBottom: '4px' }}>GSTIN</p>
                        <p style={{ fontWeight: 700, color: '#000', fontSize: '15px', margin: 0 }}>29AAXFK3522C1Z6</p>
                    </div>
                </div>

                {/* ── BILL TO / EVENT ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: '#333', textTransform: 'uppercase', marginBottom: '6px' }}>Bill To</p>
                        <p style={{ fontWeight: 700, fontSize: '18px', color: '#000', margin: 0 }}>{data.clientName || '—'}</p>
                    </div>
                    {data.eventName && (
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: '#333', textTransform: 'uppercase', marginBottom: '6px' }}>Event</p>
                            <p style={{ fontWeight: 700, fontSize: '18px', color: '#000', margin: 0 }}>{data.eventName}</p>
                        </div>
                    )}
                </div>

                {/* ── DESCRIPTION OF SERVICES ── */}
                <p style={{ fontFamily: '"Georgia", serif', fontWeight: 800, fontSize: '16px', letterSpacing: '0.06em', color: '#000', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Description of Services
                </p>

                {/* ── TABLE ── */}
                <div style={{ borderRadius: '8px 8px 0 0', overflow: 'hidden', border: `1px solid ${C.tableHeaderBg}40`, borderBottom: 'none', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: C.tableHeaderBg }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#E8D497', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600, width: '40px' }}>#</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#E8D497', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600, borderLeft: `1px solid rgba(255,255,255,0.15)` }}>DESCRIPTION</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#E8D497', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600, width: '60px', borderLeft: `1px solid rgba(255,255,255,0.15)` }}>QTY</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#E8D497', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600, width: '70px', borderLeft: `1px solid rgba(255,255,255,0.15)` }}>UNIT</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#E8D497', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600, width: '100px', borderLeft: `1px solid rgba(255,255,255,0.15)` }}>RATE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#E8D497', fontSize: '11px', letterSpacing: '0.08em', fontWeight: 600, width: '120px', borderLeft: `1px solid rgba(255,255,255,0.15)` }}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody style={{ background: C.tableBodyBg }}>
                            {data.items.map((item, index) => (
                                <tr key={item.id || index} style={{ borderBottom: `1px solid #E2DCD0` }}>
                                    <td style={{ padding: '12px 16px', color: '#444' }}>{index + 1}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111' }}>{item.description}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#222' }}>{item.quantity}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#333' }}>{item.unit || 'nos'}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#222' }}>{formatCurrency(item.rate)}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#000' }}>{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── BOTTOM SECTION: Terms (left) + Totals (right) ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>

                    {/* LEFT: Terms & Conditions */}
                    <div style={{ flex: 1, maxWidth: '48%', position: 'relative', zIndex: 30 }}>
                        {/* Heading imported a cursive webfont just for this template to match perfectly */}
                        <style>
                            {`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}
                        </style>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontFamily: '"Georgia", serif', fontSize: '20px', fontWeight: 700, color: '#000', letterSpacing: '0.02em' }}>
                                TERMS <span style={{ fontFamily: '"Great Vibes", cursive', fontSize: '28px', fontWeight: 400, marginLeft: '2px', marginRight: '2px' }}>&amp;</span> CONDITIONS
                            </span>
                            {/* SVG Flourish */}
                            <svg width="40" height="24" viewBox="0 0 54 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2,12 Q15,4 30,12 Q40,18 52,10" stroke="#000" strokeWidth="1.2" fill="none" opacity="0.9" />
                                <path d="M14,12 C13,7 9,6 5,9 C9,9 12,10 14,12Z" fill="#333" opacity="0.9" />
                                <path d="M26,12 C24,6 19,5 15,8 C19,8 23,10 26,12Z" fill="#333" opacity="0.8" />
                            </svg>
                        </div>
                        <div style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: '14px', color: '#333', lineHeight: 1.5, fontWeight: 500, paddingRight: '12px' }}>
                            {(data.terms || '').split('\n').map((line, i) => (
                                <p key={i} style={{ margin: '0 0 6px 0' }}>{line}</p>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Totals block */}
                    <div style={{ width: '360px', position: 'relative', zIndex: 30 }}>
                        <div style={{ border: `1.5px solid ${C.totalsSep}`, borderRadius: '12px', padding: '20px 24px', background: C.totalsBg, boxShadow: '0 4px 16px rgba(109,60,31,0.04)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: C.totalsLabel }}>
                                    <span>Subtotal</span>
                                    <span style={{ fontWeight: 500, color: '#111' }}>{formatCurrency(data.subtotal)}</span>
                                </div>
                                {data.tax > 0 && (<>
                                    {(data.igstAmount || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: C.totalsLabel }}>
                                            <span>IGST ({data.igstPercentage}%)</span>
                                            <span style={{ fontWeight: 500, color: '#111' }}>{formatCurrency(data.igstAmount!)}</span>
                                        </div>
                                    )}
                                    {(data.cgstAmount || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: C.totalsLabel }}>
                                            <span>CGST ({data.cgstPercentage}%)</span>
                                            <span style={{ fontWeight: 500, color: '#111' }}>{formatCurrency(data.cgstAmount!)}</span>
                                        </div>
                                    )}
                                    {(data.sgstAmount || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: C.totalsLabel }}>
                                            <span>SGST ({data.sgstPercentage}%)</span>
                                            <span style={{ fontWeight: 500, color: '#111' }}>{formatCurrency(data.sgstAmount!)}</span>
                                        </div>
                                    )}
                                </>)}
                                {/* Total row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.totalsSep}`, paddingTop: '14px', marginTop: '4px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '17px', color: C.darkGold }}>Total Amount</span>
                                    <span style={{ fontWeight: 700, fontSize: '22px', color: C.darkGold }}>{formatCurrency(data.total)}</span>
                                </div>
                            </div>
                            {/* Small floret accent in corner of totals box */}
                            <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', width: '80px', height: 'auto', zIndex: 10, pointerEvents: 'none', transform: 'scale(-1)' }}>
                                <img src={floralCorner} alt="" style={{ width: '100%', height: 'auto', opacity: 0.8 }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── AUTHORIZED SIGNATORY ── */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px', position: 'relative', zIndex: 30 }}>
                    <div style={{ textAlign: 'center', minWidth: '200px' }}>
                        <div style={{ height: '40px' }} /> {/* Spacer for potential real signature */}
                        <div style={{ borderBottom: `1px solid ${C.gold}`, width: '100%', marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: C.darkGold, fontSize: '15px', fontWeight: 600, margin: 0, letterSpacing: '0.02em' }}>Authorized Signatory</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
