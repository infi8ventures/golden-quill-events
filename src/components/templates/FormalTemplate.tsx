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
                <img src={logoImg} className="print-formal-watermark" alt="Watermark" />

                <div className="print-formal-header">
                    <div className="print-formal-logo-container">
                        <img src={logoImg} className="print-formal-logo" alt="Logo" />
                    </div>
                    <div className="print-formal-company">
                        <div className="name">K M Enterprises</div>
                        <div className="addr">
                            #612, Nagendra Nilaya, 8th Main 1st Stage,<br />
                            Vijayanagar Mysuru
                        </div>
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
                    <div className="item">
                        <span className="k">GSTIN</span>
                        <span className="v">29AAXFK3522C1Z6</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-6 relative z-[1]">
                    <div>
                        <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Bill To</div>
                        <div className="text-sm font-bold text-black">{data.clientName || "—"}</div>
                    </div>
                    {data.eventName && (
                        <div>
                            <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Event</div>
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
                        <div className="print-formal-bank">
                            <div className="hd-sub">Bank Details</div>
                            <div className="row"><span className="k">Account Name:</span> K M Enterprises</div>
                            <div className="row"><span className="k">Account No:</span> 50200064343340</div>
                            <div className="row"><span className="k">IFSC:</span> HDFC0000065</div>
                            <div className="row"><span className="k">Branch:</span> HDFC Bank, Saraswathipuram</div>
                        </div>
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
