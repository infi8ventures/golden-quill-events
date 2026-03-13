import React from 'react';
import { formatDate, formatCurrency } from "@/lib/supabase-helpers";
import type { TemplateData } from './FormalTemplate';

import floralCorner from "@/assets/floral_corner.png";
import floralDivider from "@/assets/floral_divider.png";
import kmLogo from "@/assets/KM_Logo_Grey.png";
import belowBrand from "@/assets/Below Brand.png";
import goldFloralCorner from "@/assets/gold_corner_frame.png";
import floralBox from "@/assets/floral_corner_old.png";
import floralcornerright from "@/assets/floral_corner_RIGHT.png";
import botanicalLeafCorner from "@/assets/botanical_leaf_corner.png";


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
        <div id={id} style={{
            background: C.paperBg,
            position: 'relative',
            overflow: 'hidden',
            height: '1123px', // Standard A4 height at 96dpi (297mm)
            width: '794px',
            boxSizing: 'border-box',
            fontFamily: '"Inter", sans-serif',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column'
        }}>

            {/* ══ PAPER TEXTURE OVERLAY ══ */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.35,
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'
            }} />

            {/* ══ MASSIVE CENTER WATERMARK (CLEAN) ══ */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                pointerEvents: 'none',
                transform: 'rotate(-25deg)' // Tilt as requested
            }}>
                <img src={kmLogo} alt="" style={{ width: '65%', height: 'auto', objectFit: 'contain', opacity: 0.10, filter: C.logoFilter }} />
            </div>

            {/* ══ CORNER ASSETS (CLEAN) ══ */}
            {/* Top Left */}
            <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '320px', height: 'auto', zIndex: 10, pointerEvents: 'none' }}>
                <img src={floralCorner} alt="" style={{ width: '70%', height: 'auto' }} />
            </div>
            {/* Top Right */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '280px', height: 'auto', zIndex: 10, pointerEvents: 'none', transform: 'scaleX(-1)' }}>
                <img src={floralCorner} alt="" style={{ width: '70%', height: 'auto' }} />
            </div>
            {/* Bottom Left */}
            {/* <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '200px', height: 'auto', zIndex: 10, pointerEvents: 'none', transform: 'scaleY(-1)' }}>
                <img src={floralCorner} alt="" style={{ width: '100%', height: 'auto' }} />
            </div> */}
            {/* Bottom Right */}
            {/* <div style={{ position: 'absolute', bottom: '-20px', right: '-40px', width: '300px', height: 'auto', zIndex: 10, pointerEvents: 'none', transform: 'scale(-1)' }}>
                <img src={floralCorner} alt="" style={{ width: '100%', height: 'auto' }} />
            </div> */}

            {/* ══ MAIN CONTENT ══ */}
            <div style={{ position: 'relative', zIndex: 20, padding: '40px 52px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* ── HEADER ── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: '12px', minHeight: 'auto' }}>
                    {/* Center Branding (Logo + Name) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <img src={kmLogo} alt="Branding Logo" style={{ width: '180px', height: 'auto', marginBottom: '4px' }} />
                        <h2 style={{
                            fontFamily: '"Cormorant Garamond", serif',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '32px',
                            color: '#d6a44a',
                            letterSpacing: '0.06em',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            lineHeight: 1
                        }}>
                            K M ENTERPRISES
                        </h2>
                    </div>
                </div>

                {/* ── QUOTATION TITLE ── */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h1 style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '28px',
                        color: '#d6a44a',
                        letterSpacing: '0.06em',
                        margin: 0,
                        lineHeight: 1,
                    }}>
                        {(data.documentNumber?.toUpperCase().includes('INV') || data.documentNumber?.toUpperCase().includes('TAX')) ? 'INVOICE' : 'QUOTATION'}
                    </h1>
                </div>

                {/* ── DOCUMENT INFO ROW ── */}
                <div style={{ borderTop: `1px solid ${C.gold}50`, borderBottom: `1px solid ${C.gold}50`, padding: '10px', margin: '10px 0', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', color: '#333', marginBottom: '4px' }}>
                            {(data.documentNumber?.toUpperCase().includes('INV') || data.documentNumber?.toUpperCase().includes('TAX')) ? 'Invoice No' : 'Quotation No'}
                        </p>
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
                <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: `1px solid ${C.tableHeaderBg}40`,
                    marginBottom: '24px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}>
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

                {/* ── BOTTOM SECTION: Empty Left Column + Totals (right) ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                        {/* Empty space where terms used to be */}
                    </div>

                    <div style={{
                        width: '380px',
                        position: 'relative',
                        zIndex: 30,
                        border: `1px solid ${C.totalsSep}`,
                        borderRadius: '24px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                    }}>

                        <div style={{
                            padding: '24px 28px',
                            background: C.totalsBg,
                            borderRadius: '23px', // Slightly smaller than container to look perfect
                            position: 'relative',
                            zIndex: 2,
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
                                    <span style={{ fontWeight: 500 }}>Subtotal</span>
                                    <span style={{ fontWeight: 600, color: '#111' }}>{formatCurrency(data.subtotal)}</span>
                                </div>

                                {data.tax > 0 && (<>
                                    {(data.igstAmount || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
                                            <span>IGST ({data.igstPercentage}%)</span>
                                            <span style={{ fontWeight: 600, color: '#111' }}>{formatCurrency(data.igstAmount!)}</span>
                                        </div>
                                    )}
                                    {(data.cgstAmount || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
                                            <span>CGST ({data.cgstPercentage}%)</span>
                                            <span style={{ fontWeight: 600, color: '#111' }}>{formatCurrency(data.cgstAmount!)}</span>
                                        </div>
                                    )}
                                    {(data.sgstAmount || 0) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
                                            <span>SGST ({data.sgstPercentage}%)</span>
                                            <span style={{ fontWeight: 600, color: '#111' }}>{formatCurrency(data.sgstAmount!)}</span>
                                        </div>
                                    )}
                                </>)}

                                {/* Total row separator */}
                                <div style={{ borderTop: `1px solid ${C.totalsSep}`, opacity: 0.6, marginTop: '6px' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, fontSize: '18px', color: '#d6a44a', fontFamily: '"Georgia", serif', letterSpacing: '0.01em' }}>Total Amount</span>
                                    <span style={{ fontWeight: 800, fontSize: '24px', color: '#d6a44a', fontFamily: '"Georgia", serif' }}>{formatCurrency(data.total)}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── CLOSING SECTION: Payment Card (left) & Signatory (right) ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingBottom: '80px', gap: '24px', position: 'relative', zIndex: 30 }}>
                    {/* LEFT COLUMN: Payment Card + Terms */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '320px' }}>
                        {/* Creative Payment Card Redesign */}
                        <div style={{
                            padding: '20px',
                            background: C.totalsBg,
                            borderRadius: '16px',
                            border: `1px solid ${C.totalsSep}40`,
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{
                                    fontFamily: '"Georgia,Cormorant Garamond", serif',
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#000',
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase'
                                }}>
                                    Payment Details
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px 16px', fontSize: '13px', color: '#333', fontFamily: 'Georgia' }}>
                                <span style={{ fontWeight: 600, color: C.darkGold, opacity: 0.8 }}>Account</span>
                                <span style={{ fontWeight: 700 }}>K M Enterprises</span>

                                <span style={{ fontWeight: 600, color: C.darkGold, opacity: 0.8 }}>Number</span>
                                <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>50200064343340</span>

                                <span style={{ fontWeight: 600, color: C.darkGold, opacity: 0.8 }}>IFSC</span>
                                <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>HDFC0000065</span>

                                <span style={{ fontWeight: 600, color: C.darkGold, opacity: 0.8 }}>Branch</span>
                                <span style={{ fontWeight: 700 }}>HDFC Bank - Saraswathipuram</span>
                            </div>

                            {/* Corner subtle accent */}
                            <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '24px', height: '24px', borderRight: `2px solid ${C.gold}30`, borderBottom: `2px solid ${C.gold}30`, borderRadius: '0 0 8px 0' }} />
                        </div>

                        {/* Moved Terms & Conditions below Bank Details */}
                        <div style={{ marginTop: '16px', padding: '12px 16px', borderTop: `1px dashed ${C.totalsSep}40` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontFamily: '"Georgia", serif', fontSize: '14px', fontWeight: 700, color: '#000', letterSpacing: '0.02em' }}>
                                    TERMS <span style={{ fontFamily: '"Great Vibes", cursive', fontSize: '20px', fontWeight: 400 }}>&amp;</span> CONDITIONS
                                </span>
                            </div>
                            <div style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: '12px', color: '#444', lineHeight: 1.4, fontWeight: 500 }}>
                                {(data.terms || '').split('\n').map((line, i) => (
                                    <p key={i} style={{ margin: '0 0 2px 0' }}>{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AUTHORIZED SIGNATORY (RIGHT COLUMN) */}
                    <div style={{ textAlign: 'center', minWidth: '220px', paddingBottom: '10px' }}>
                        <div style={{ height: '50px' }} /> {/* Spacer for potential real signature */}
                        <div style={{ borderBottom: `1px solid ${C.gold}`, width: '100%', marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: C.darkGold, fontSize: '15px', fontWeight: 600, margin: 0, letterSpacing: '0.02em' }}>Authorized Signatory</p>
                    </div>
                </div>

            </div>

            {/* ══ FOOTER ══ */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                background: C.tableHeaderBg,
                height: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 40
            }}>
                <p style={{
                    color: '#e2ca83ff',
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: 0,
                    letterSpacing: '0.05em',
                    fontFamily: 'Georgia, serif',
                    textAlign: 'center'
                }}>
                    #612, Nagendra Nilaya, 8th Main 1st Stage, Vijayanagar Mysuru
                </p>
            </div>
        </div>
    );
}
