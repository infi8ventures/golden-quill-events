import React from 'react';
import { formatDate, formatCurrency } from "@/lib/supabase-helpers";
import logoImg from "@/assets/KM_Logo_Grey.png";

export interface TemplateItem {
    id: string;
    description: string;
    quantity: number;
    unit?: string;
    rate: number;
    amount: number;
}

export interface TemplateData {
    type: 'QUOTATION' | 'INVOICE';
    documentNumber: string;
    title: string;
    date: string | null;
    clientName: string;
    eventName: string;
    items: TemplateItem[];
    subtotal: number;
    discount: number;
    tax: number;
    // GST breakdown
    cgstPercentage?: number;
    cgstAmount?: number;
    sgstPercentage?: number;
    sgstAmount?: number;
    igstPercentage?: number;
    igstAmount?: number;
    total: number;
    notes: string;
    terms: string;
    logoDataUrl?: string | null;
    companyDetails?: {
        name: string;
        address: string;
        gstin: string;
    } | null;
    bankDetails?: {
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        ifscCode?: string;
        branchName?: string;
    };
    logoAlignment?: 'left' | 'center' | 'right';
    companyAlignment?: 'left' | 'center' | 'right';
    logoSize?: number;
}

interface FormalTemplateProps {
    data: TemplateData;
    id?: string;
}

export function FormalTemplate({ data, id = "print-content" }: FormalTemplateProps) {
    return (
        <div className="print-formal">
            <div id={id} className="print-formal-sheet">
                {/* Watermark Logo */}
                {data.logoDataUrl && <img src={data.logoDataUrl} className="print-formal-watermark" alt="Watermark" />}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    alignItems: 'center',
                    paddingBottom: '20px',
                    position: 'relative',
                    zIndex: 1,
                    gap: '16px'
                }}>
                    {/* Left Alignments */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '20px' }}>
                        {data.logoAlignment === 'left' && data.logoDataUrl && (
                            <img src={data.logoDataUrl} style={{ maxWidth: `${150 * ((data.logoSize || 100) / 100)}px`, maxHeight: `${80 * ((data.logoSize || 100) / 100)}px`, height: 'auto', objectFit: 'contain' }} alt="Logo" />
                        )}
                        {data.companyAlignment === 'left' && (
                            <div className="print-formal-company" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                                {data.companyDetails?.name && <div className="name" style={{ fontSize: '24px', fontWeight: 700, color: '#000', marginBottom: '4px' }}>{data.companyDetails.name}</div>}
                                {data.companyDetails?.address && <div className="addr" style={{ fontSize: '12px', color: '#000', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{data.companyDetails.address}</div>}
                                {data.companyDetails?.gstin && <div style={{ fontSize: '12px', color: '#000', marginTop: '4px', fontWeight: 600 }}>GSTIN: {data.companyDetails.gstin}</div>}
                            </div>
                        )}
                    </div>

                    {/* Center Alignments */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                        {data.logoAlignment === 'center' && data.logoDataUrl && (
                            <img src={data.logoDataUrl} style={{ maxWidth: `${150 * ((data.logoSize || 100) / 100)}px`, maxHeight: `${80 * ((data.logoSize || 100) / 100)}px`, height: 'auto', objectFit: 'contain' }} alt="Logo" />
                        )}
                        {data.companyAlignment === 'center' && (
                            <div className="print-formal-company" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                {data.companyDetails?.name && <div className="name" style={{ fontSize: '24px', fontWeight: 700, color: '#000', marginBottom: '4px' }}>{data.companyDetails.name}</div>}
                                {data.companyDetails?.address && <div className="addr" style={{ fontSize: '12px', color: '#000', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{data.companyDetails.address}</div>}
                                {data.companyDetails?.gstin && <div style={{ fontSize: '12px', color: '#000', marginTop: '4px', fontWeight: 600 }}>GSTIN: {data.companyDetails.gstin}</div>}
                            </div>
                        )}
                    </div>

                    {/* Right Alignments */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
                        {data.logoAlignment === 'right' && data.logoDataUrl && (
                            <img src={data.logoDataUrl} style={{ maxWidth: `${150 * ((data.logoSize || 100) / 100)}px`, maxHeight: `${80 * ((data.logoSize || 100) / 100)}px`, height: 'auto', objectFit: 'contain' }} alt="Logo" />
                        )}
                        {data.companyAlignment === 'right' && (
                            <div className="print-formal-company" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                                {data.companyDetails?.name && <div className="name" style={{ fontSize: '24px', fontWeight: 700, color: '#000', marginBottom: '4px' }}>{data.companyDetails.name}</div>}
                                {data.companyDetails?.address && <div className="addr" style={{ fontSize: '12px', color: '#000', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{data.companyDetails.address}</div>}
                                {data.companyDetails?.gstin && <div style={{ fontSize: '12px', color: '#000', marginTop: '4px', fontWeight: 600 }}>GSTIN: {data.companyDetails.gstin}</div>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="print-formal-title-container">
                    <div className="title">{data.type}</div>
                </div>

                <div className="print-formal-divider" />

                <div className="print-formal-details-grid">
                    <div className="item">
                        <span className="k">{data.type === 'QUOTATION' ? 'Quotation' : 'Invoice'} No</span>
                        <span className="v">{data.documentNumber}</span>
                    </div>
                    <div className="item">
                        <span className="k">Date</span>
                        <span className="v">{data.date ? formatDate(data.date) : "—"}</span>
                    </div>
                    {/* GST */}
                    {data.companyDetails?.gstin && (
                        <div className="item">
                            <span className="k">GSTIN</span>
                            <span className="v">{data.companyDetails.gstin}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-8 mb-6 relative z-[1]">
                    <div>
                        <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Bill To</div>
                        <div className="text-sm font-bold text-black">{data.clientName || "—"}</div>
                    </div>
                    {data.eventName && (
                        <div className="print-formal-event">
                            <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Services</div>
                            <div className="text-sm font-bold text-black">{data.eventName}</div>
                        </div>
                    )}
                </div>

                <div className="print-formal-section">
                    <div className="hd">Description of Services</div>
                    <table className="print-formal-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>#</th>
                                <th>Description</th>
                                <th className="num" style={{ width: '60px' }}>Qty</th>
                                <th style={{ width: '80px' }}>Unit</th>
                                <th className="num" style={{ width: '100px' }}>Rate</th>
                                <th className="num" style={{ width: '120px' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, i) => (
                                <tr key={item.id || i}>
                                    <td>{i + 1}</td>
                                    <td>{item.description}</td>
                                    <td className="num">{item.quantity}</td>
                                    <td>{item.unit || 'nos'}</td>
                                    <td className="num">{formatCurrency(item.rate)}</td>
                                    <td className="num">{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="print-formal-summary">
                    <div />
                    <div className="print-formal-totals">
                        <div className="print-formal-total-row">
                            <span className="k">Subtotal</span>
                            <span>{formatCurrency(data.subtotal)}</span>
                        </div>
                        {(data.discount || 0) > 0 && (
                            <div className="print-formal-total-row">
                                <span className="k">Discount</span>
                                <span>{formatCurrency(data.discount)}</span>
                            </div>
                        )}
                        {data.tax > 0 && (
                            <>
                                {(data.cgstAmount || 0) > 0 && (
                                    <div className="print-formal-total-row">
                                        <span className="k">CGST ({data.cgstPercentage}%)</span>
                                        <span>{formatCurrency(data.cgstAmount!)}</span>
                                    </div>
                                )}
                                {(data.sgstAmount || 0) > 0 && (
                                    <div className="print-formal-total-row">
                                        <span className="k">SGST ({data.sgstPercentage}%)</span>
                                        <span>{formatCurrency(data.sgstAmount!)}</span>
                                    </div>
                                )}
                                {(data.igstAmount || 0) > 0 && (
                                    <div className="print-formal-total-row">
                                        <span className="k">IGST ({data.igstPercentage}%)</span>
                                        <span>{formatCurrency(data.igstAmount!)}</span>
                                    </div>
                                )}
                                {/* Fallback if no breakdown provided */}
                                {!(data.cgstAmount || data.sgstAmount || data.igstAmount) && (
                                    <div className="print-formal-total-row">
                                        <span className="k">GST</span>
                                        <span>{formatCurrency(data.tax)}</span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="print-formal-total-row grand">
                            <span>Total Amount</span>
                            <span>{formatCurrency(data.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {data.notes && (
                        <div className="print-formal-section">
                            <div className="hd">Notes</div>
                            <div style={{ fontSize: '11px', color: '#000000', fontWeight: 500 }}>{data.notes}</div>
                        </div>
                    )}
                    <div className="print-formal-section">
                        <div className="hd">Terms & Conditions</div>
                        <div style={{ fontSize: '11px', color: '#000000', fontWeight: 500 }}>{data.terms}</div>
                    </div>
                </div>

                <div className="print-formal-thanks-container">
                    <div className="print-formal-thanks">
                        Thank you for your business.
                    </div>
                </div>

                <div className="print-formal-footer">
                    <div className="print-formal-left-col">
                        {data.bankDetails && (data.bankDetails.bankName || data.bankDetails.accountName || data.bankDetails.accountNumber || data.bankDetails.ifscCode || data.bankDetails.branchName) && (
                            <div className="print-formal-bank">
                                <div className="hd-sub">Bank Details</div>
                                {data.bankDetails?.bankName && (
                                    <div className="row"><span className="k">Bank Name:</span> {data.bankDetails.bankName}</div>
                                )}
                                {data.bankDetails?.accountName && (
                                    <div className="row"><span className="k">Account Name:</span> {data.bankDetails.accountName}</div>
                                )}
                                {data.bankDetails?.accountNumber && (
                                    <div className="row"><span className="k">Account No:</span> {data.bankDetails.accountNumber}</div>
                                )}
                                {data.bankDetails?.ifscCode && (
                                    <div className="row"><span className="k">IFSC:</span> {data.bankDetails.ifscCode}</div>
                                )}
                                {data.bankDetails?.branchName && (
                                    <div className="row"><span className="k">Branch:</span> {data.bankDetails.branchName}</div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="print-formal-sign">
                        <div style={{ height: '56px', marginBottom: '4px' }} />
                        <div className="line" />
                        <div className="role">Authorized Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
