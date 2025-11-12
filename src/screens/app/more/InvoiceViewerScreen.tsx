import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Share,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';
import { getInvoices } from '../../../services/walletService';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type InvoiceViewerRouteProp = RouteProp<{
    InvoiceViewer: {
        transactionId: string;
        amount?: number;
        bookingDetails?: any;
    };
}, 'InvoiceViewer'>;

interface Invoice {
    invoice_id: string;
    transaction_id: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    currency: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    billing_address: any;
    items: any[];
    notes: string;
    payment_method: string;
    payment_status: string;
}

export default function InvoiceViewerScreen() {
    const navigation = useNavigation();
    const route = useRoute<InvoiceViewerRouteProp>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<Invoice | null>(null);

    const { transactionId, amount, bookingDetails } = route.params || {};

    useEffect(() => {
        if (user?.id && transactionId) {
            loadInvoice();
        } else {
            // Use mock data if no invoice found
            createMockInvoice();
        }
    }, [user, transactionId]);

    const loadInvoice = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const result = await getInvoices(user.id, 1);

            if (result.data && result.data.length > 0) {
                // Find invoice matching transaction ID if provided
                const matchingInvoice = transactionId
                    ? result.data.find((inv: any) => inv.transaction_id === transactionId)
                    : result.data[0];

                if (matchingInvoice) {
                    setInvoice(matchingInvoice);
                } else {
                    createMockInvoice();
                }
            } else {
                // Create mock invoice if not found
                createMockInvoice();
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
            createMockInvoice();
        } finally {
            setLoading(false);
        }
    };

    const createMockInvoice = () => {
        const now = new Date();
        const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`;

        setInvoice({
            invoice_id: transactionId || `inv_${Date.now()}`,
            transaction_id: transactionId || 'N/A',
            invoice_number: invoiceNumber,
            invoice_date: now.toISOString(),
            due_date: now.toISOString(),
            status: 'paid',
            subtotal: bookingDetails?.baseFee || amount || 0,
            tax_amount: bookingDetails?.tax || 0,
            discount_amount: bookingDetails?.discount || 0,
            total_amount: amount || 0,
            currency: 'INR',
            customer_name: user?.user_metadata?.full_name || user?.email || 'Customer',
            customer_email: user?.email || '',
            customer_phone: user?.phone || '',
            billing_address: null,
            items: [{
                description: bookingDetails?.gymName || 'Gym Booking',
                quantity: 1,
                rate: bookingDetails?.baseFee || amount || 0,
                amount: bookingDetails?.baseFee || amount || 0,
            }],
            notes: 'Thank you for your business!',
            payment_method: 'Card',
            payment_status: 'completed',
        });
        setLoading(false);
    };

    const generateInvoiceHTML = (): string => {
        if (!invoice) return '';

        const qrData = JSON.stringify({
            invoice_id: invoice.invoice_id,
            transaction_id: invoice.transaction_id,
            amount: invoice.total_amount,
            date: invoice.invoice_date,
        });

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; background: #f5f5f5; }
        .invoice { background: white; max-width: 800px; margin: 0 auto; padding: 48px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 3px solid ${palette.brandPrimary}; padding-bottom: 20px; }
        .company { flex: 1; }
        .company-name { font-size: 32px; font-weight: 800; color: ${palette.brandPrimary}; margin-bottom: 8px; }
        .company-tagline { font-size: 14px; color: #666; margin-bottom: 16px; }
        .company-info { font-size: 13px; color: #666; line-height: 1.6; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 36px; font-weight: 700; color: #333; margin-bottom: 8px; }
        .invoice-number { font-size: 14px; color: #666; }
        .parties { display: flex; gap: 40px; margin-bottom: 40px; }
        .party { flex: 1; padding: 24px; background: #f9f9f9; border-radius: 8px; }
        .party-title { font-size: 12px; font-weight: 700; color: ${palette.brandPrimary}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .party-name { font-size: 18px; font-weight: 700; color: #333; margin-bottom: 8px; }
        .party-detail { font-size: 13px; color: #666; margin: 4px 0; }
        .invoice-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .meta-item { padding: 16px; background: #f9f9f9; border-radius: 8px; }
        .meta-label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .meta-value { font-size: 15px; font-weight: 600; color: #333; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        .items-table th { background: ${palette.brandPrimary}; color: white; padding: 14px; text-align: left; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .items-table td { padding: 16px 14px; border-bottom: 1px solid #e0e0e0; font-size: 14px; color: #333; }
        .items-table tr:hover { background: #f9f9f9; }
        .summary { display: flex; justify-content: space-between; margin-top: 32px; }
        .summary-left { flex: 1; }
        .summary-right { width: 320px; }
        .summary-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 14px; }
        .summary-row.subtotal { color: #666; border-bottom: 1px solid #e0e0e0; }
        .summary-row.total { font-size: 24px; font-weight: 700; color: ${palette.brandPrimary}; border-top: 3px solid ${palette.brandPrimary}; margin-top: 8px; padding-top: 16px; }
        .qr-section { margin-top: 40px; padding: 24px; background: #f9f9f9; border-radius: 8px; text-align: center; }
        .qr-title { font-size: 14px; font-weight: 600; color: #666; margin-bottom: 16px; }
        .footer { margin-top: 48px; padding-top: 24px; border-top: 2px solid #e0e0e0; text-align: center; }
        .footer-text { font-size: 12px; color: #999; line-height: 1.8; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; }
        .status-paid { background: #10b981; color: white; }
        .status-pending { background: #f59e0b; color: white; }
        @media print { body { background: white; } .invoice { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="invoice">
        <!-- Header -->
        <div class="header">
            <div class="company">
                <div class="company-name">SIXFINITY</div>
                <div class="company-tagline">Your Fitness, Redefined</div>
                <div class="company-info">
                    SIXFINITY Fitness Solutions Pvt Ltd<br/>
                    No 02, Asgiriya Road <br/>
                    Kandy ,Sri Lanka<br/>
                    GSTIN: 29ABCDE1234F1Z5<br/>
                    Phone: +94 77 956 8666 | Email: support@sixfinity.com
                </div>
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-number">${invoice.invoice_number}</div>
                <div class="status-badge status-${invoice.payment_status === 'paid' ? 'paid' : 'pending'}">
                    ${invoice.payment_status.toUpperCase()}
                </div>
            </div>
        </div>

        <!-- Parties -->
        <div class="parties">
            <div class="party">
                <div class="party-title">Billed To </div>
                <div class="party-name">${invoice.customer_name || user?.email || 'Guest User'}</div>
                <div class="party-detail"> ${invoice.customer_email || user?.email || 'N/A'}</div>
                <div class="party-detail"> ${invoice.customer_phone || 'N/A'}</div>
                <div class="party-detail"> ${invoice.billing_address?.city || 'Kandy'}, ${invoice.billing_address?.state || 'Central Province'}</div>
            </div>
            <div class="party">
                <div class="party-title">Issued By</div>
                <div class="party-name">SIXFINITY Fitness</div>
                <div class="party-detail">billing@sixfinity.com</div>
                <div class="party-detail">+94 77 956 8666</div>
                <div class="party-detail">Kandy, Sri Lanka</div>
            </div>
        </div>

        <!-- Meta Information -->
        <div class="invoice-meta">
            <div class="meta-item">
                <div class="meta-label">Invoice Date</div>
                <div class="meta-value">${formatDate(invoice.invoice_date)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Due Date</div>
                <div class="meta-value">${formatDate(invoice.due_date)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Payment Method</div>
                <div class="meta-value">${invoice.payment_method || 'Card'}</div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%">Description</th>
                    <th style="width: 20%; text-align: center">Quantity</th>
                    <th style="width: 15%; text-align: right">Rate</th>
                    <th style="width: 15%; text-align: right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items && invoice.items.length > 0 ? invoice.items.map((item: any) => `
                <tr>
                    <td><strong>${item.description || 'Gym Session'}</strong><br/><small style="color: #999">${item.details || ''}</small></td>
                    <td style="text-align: center">${item.quantity || 1}</td>
                    <td style="text-align: right">₹${(item.rate || invoice.subtotal).toFixed(2)}</td>
                    <td style="text-align: right"><strong>₹${(item.amount || invoice.subtotal).toFixed(2)}</strong></td>
                </tr>
                `).join('') : `
                <tr>
                    <td><strong>${bookingDetails?.gymName || 'Gym Session'}</strong><br/><small style="color: #999">${bookingDetails?.sessionDate || ''} at ${bookingDetails?.sessionTime || ''}</small></td>
                    <td style="text-align: center">1</td>
                    <td style="text-align: right">₹${invoice.subtotal.toFixed(2)}</td>
                    <td style="text-align: right"><strong>₹${invoice.subtotal.toFixed(2)}</strong></td>
                </tr>
                `}
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-left">
                <div style="padding: 16px; background: #f0f9ff; border-left: 4px solid ${palette.brandPrimary}; border-radius: 4px;">
                    <div style="font-size: 13px; color: #666; margin-bottom: 8px;"><strong>Payment Terms:</strong></div>
                    <div style="font-size: 12px; color: #666; line-height: 1.6;">
                        • Payment is due within 7 days of invoice date<br/>
                        • All payments are processed securely<br/>
                        • For queries: support@sixfinity.com
                    </div>
                </div>
            </div>
            <div class="summary-right">
                <div class="summary-row subtotal">
                    <span>Subtotal:</span>
                    <span>₹${invoice.subtotal.toFixed(2)}</span>
                </div>
                ${invoice.discount_amount > 0 ? `
                <div class="summary-row subtotal">
                    <span>Discount:</span>
                    <span style="color: #10b981">-₹${invoice.discount_amount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row subtotal">
                    <span>GST (18%):</span>
                    <span>₹${invoice.tax_amount.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Amount:</span>
                    <span>₹${invoice.total_amount.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <!-- QR Code Section -->
        <div class="qr-section">
            <div class="qr-title">Scan to Verify Invoice</div>
            <div style="display: inline-block; padding: 16px; background: white; border-radius: 8px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" alt="QR Code" style="width: 150px; height: 150px;"/>
            </div>
            <div style="margin-top: 12px; font-size: 11px; color: #999;">
                Transaction ID: ${invoice.transaction_id}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-text">
                <strong>Thank you for choosing SIXFINITY!</strong><br/>
                This is a computer-generated invoice and does not require a physical signature.<br/>
                For any questions, contact us at support@sixfinity.com or call +94 77 956 8666
            </div>
        </div>
    </div>
</body>
</html>
        `;
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;

        try {
            // Generate HTML content
            const htmlContent = generateInvoiceHTML();

            // Create PDF
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
            });

            // Share or save the PDF
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    await Sharing.shareAsync(uri, {
                        UTI: '.pdf',
                        mimeType: 'application/pdf',
                        dialogTitle: `Invoice ${invoice.invoice_number}`,
                    });
                } else {
                    Alert.alert('Success', `PDF saved at: ${uri}`);
                }
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
    };

    const handleShare = async () => {
        if (!invoice) return;

        try {
            // First try to share PDF
            const htmlContent = generateInvoiceHTML();
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false,
            });

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Invoice ${invoice.invoice_number}`,
                });
            } else {
                // Fallback to text sharing
                await Share.share({
                    message: `SIXFINITY Invoice

Invoice Number: ${invoice.invoice_number}
Date: ${formatDate(invoice.invoice_date)}
Amount: ₹${invoice.total_amount.toFixed(2)}
Status: ${invoice.payment_status.toUpperCase()}

Transaction ID: ${invoice.transaction_id}

Thank you for choosing SIXFINITY!`,
                });
            }
        } catch (error) {
            console.error('Error sharing invoice:', error);
            Alert.alert('Error', 'Failed to share invoice. Please try again.');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Invoice</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={palette.brandPrimary} />
                    <Text style={styles.loadingText}>Loading invoice...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!invoice) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Invoice</Text>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}></Text>
                    <Text style={styles.errorTitle}>Invoice Not Found</Text>
                    <Text style={styles.errorText}>
                        We couldn't find the invoice for this transaction.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Invoice</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Text style={styles.shareButton}></Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Invoice Card */}
                <View style={styles.invoiceCard}>
                    {/* Header */}
                    <View style={styles.invoiceHeader}>
                        <View>
                            <Text style={styles.companyName}>SIXFINITY</Text>
                            <Text style={styles.companyTagline}>Your Fitness Partner</Text>
                            <Text style={styles.companyAddress}>
                                Fitness Solutions Pvt. Ltd.{'\n'}
                                No 02, Asgiriya Road,Kandy,Srilanka.
                            </Text>
                        </View>
                        <View style={styles.invoiceStamp}>
                            <Text style={styles.stampText}>PAID</Text>
                        </View>
                    </View>

                    <View style={styles.dividerThick} />

                    {/* Invoice Details */}
                    <View style={styles.invoiceDetails}>
                        <View style={styles.detailColumn}>
                            <Text style={styles.detailLabel}>INVOICE NUMBER</Text>
                            <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
                        </View>
                        <View style={styles.detailColumn}>
                            <Text style={styles.detailLabel}>DATE</Text>
                            <Text style={styles.detailValue}>
                                {formatDate(invoice.invoice_date)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailColumn}>
                            <Text style={styles.detailLabel}>TRANSACTION ID</Text>
                            <Text style={styles.detailValueSmall} numberOfLines={1}>
                                {invoice.transaction_id}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Client & Receiver Details in 2 Columns */}
                    <View style={styles.partiesSection}>
                        <View style={styles.partyBox}>
                            <Text style={styles.partyTitle}>CLIENT (BILLED TO)</Text>
                            <Text style={styles.partyName}>{invoice.customer_name || user?.email || 'Guest User'}</Text>
                            <Text style={styles.partyDetail}>{invoice.customer_email || user?.email || 'N/A'}</Text>
                            <Text style={styles.partyDetail}> {invoice.customer_phone || 'N/A'}</Text>
                            <Text style={styles.partyDetail}>
                                {invoice.billing_address?.city || 'Kandy'}, {invoice.billing_address?.state || 'Central Province'}
                            </Text>
                        </View>
                        <View style={styles.partyBox}>
                            <Text style={styles.partyTitle}>RECEIVER </Text>
                            <Text style={styles.partyName}>SIXFINITY Fitness</Text>
                            <Text style={styles.partyDetail}> billing@sixfinity.com</Text>
                            <Text style={styles.partyDetail}> +94 77 956 8666</Text>
                            <Text style={styles.partyDetail}> No 02,Asgiriya Road ,Kandy ,Srilanka</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Items Table */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ITEMS</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Description</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                            </View>
                            {invoice.items && invoice.items.map((item, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
                                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
                                        {item.quantity || 1}
                                    </Text>
                                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                                        ₹{(item.amount || 0).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Totals */}
                    <View style={styles.totalsSection}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>₹{invoice.subtotal.toFixed(2)}</Text>
                        </View>
                        {invoice.discount_amount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Discount</Text>
                                <Text style={[styles.totalValue, styles.discountText]}>
                                    -₹{invoice.discount_amount.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        {invoice.tax_amount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Tax & Fees</Text>
                                <Text style={styles.totalValue}>₹{invoice.tax_amount.toFixed(2)}</Text>
                            </View>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.grandTotalLabel}>TOTAL</Text>
                            <Text style={styles.grandTotalValue}>₹{invoice.total_amount.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Payment Info */}
                    <View style={styles.section}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Payment Method:</Text>
                            <Text style={styles.paymentValue}>{invoice.payment_method || 'Card'}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Payment Status:</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>✓ {invoice.payment_status.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* QR Code for Verification */}
                    <View style={styles.qrSection}>
                        <Text style={styles.qrTitle}>Scan to Verify Invoice</Text>
                        <View style={styles.qrCodeContainer}>
                            <QRCode
                                value={JSON.stringify({
                                    invoice_id: invoice.invoice_id,
                                    transaction_id: invoice.transaction_id,
                                    amount: invoice.total_amount,
                                    date: invoice.invoice_date,
                                    verify_url: `https://sixfinity.com/verify/${invoice.invoice_id}`,
                                })}
                                size={120}
                                color={palette.textPrimary}
                                backgroundColor="#FFFFFF"
                            />
                        </View>
                        <Text style={styles.qrSubtext}>Transaction ID: {invoice.transaction_id.slice(0, 16)}...</Text>
                    </View>

                    {/* Notes */}
                    {invoice.notes && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.section}>
                                <Text style={styles.notesTitle}>NOTES</Text>
                                <Text style={styles.notesText}>{invoice.notes}</Text>
                            </View>
                        </>
                    )}

                    {/* Footer */}
                    <View style={styles.invoiceFooter}>
                        <Text style={styles.footerText}>
                            This is a computer-generated invoice and does not require a signature.
                        </Text>
                        <Text style={styles.footerText}>
                            For any queries, contact support@sixfinity.com
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
                        <Text style={styles.downloadButtonText}> Download PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.shareButtonFull} onPress={handleShare}>
                        <Text style={styles.shareButtonText}>Share Invoice</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        backgroundColor: palette.surface,
    },
    backButton: {
        fontSize: 16,
        color: palette.brandPrimary,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    shareButton: {
        fontSize: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 14,
        color: palette.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    errorText: {
        fontSize: 14,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    invoiceCard: {
        backgroundColor: palette.surface,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
        padding: spacing.xl,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    companyName: {
        fontSize: 24,
        fontWeight: '700',
        color: palette.brandPrimary,
        marginBottom: spacing.xs / 2,
    },
    companyTagline: {
        fontSize: 12,
        color: palette.textSecondary,
        marginBottom: spacing.sm,
    },
    companyAddress: {
        fontSize: 11,
        color: palette.textTertiary,
        lineHeight: 16,
    },
    invoiceStamp: {
        backgroundColor: `${palette.success}20`,
        borderWidth: 3,
        borderColor: palette.success,
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        transform: [{ rotate: '15deg' }],
    },
    stampText: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.success,
    },
    divider: {
        height: 1,
        backgroundColor: palette.border,
        marginVertical: spacing.md,
    },
    dividerThick: {
        height: 2,
        backgroundColor: palette.brandPrimary,
        marginVertical: spacing.md,
    },
    invoiceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    detailRow: {
        marginBottom: spacing.sm,
    },
    detailColumn: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: palette.textTertiary,
        marginBottom: spacing.xs / 2,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    detailValueSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: palette.textTertiary,
        marginBottom: spacing.sm,
        letterSpacing: 0.5,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    customerInfo: {
        fontSize: 13,
        color: palette.textSecondary,
        marginBottom: spacing.xs / 4,
    },
    table: {
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: 8,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: `${palette.brandPrimary}10`,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    tableHeaderCell: {
        fontSize: 12,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    tableCell: {
        fontSize: 13,
        color: palette.textPrimary,
    },
    totalsSection: {
        alignItems: 'flex-end',
        marginBottom: spacing.md,
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: spacing.xs,
        minWidth: 200,
    },
    totalLabel: {
        fontSize: 14,
        color: palette.textSecondary,
        marginRight: spacing.lg,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        minWidth: 80,
        textAlign: 'right',
    },
    discountText: {
        color: palette.success,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.textPrimary,
        marginRight: spacing.lg,
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: palette.brandPrimary,
        minWidth: 80,
        textAlign: 'right',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    paymentLabel: {
        fontSize: 13,
        color: palette.textSecondary,
    },
    paymentValue: {
        fontSize: 13,
        fontWeight: '600',
        color: palette.textPrimary,
    },
    statusBadge: {
        backgroundColor: `${palette.success}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: palette.success,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: palette.success,
    },
    notesTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: palette.textTertiary,
        marginBottom: spacing.xs,
        letterSpacing: 0.5,
    },
    notesText: {
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    invoiceFooter: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 10,
        color: palette.textTertiary,
        textAlign: 'center',
        lineHeight: 16,
    },
    actionsContainer: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    downloadButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    downloadButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    shareButtonFull: {
        backgroundColor: palette.surface,
        borderWidth: 2,
        borderColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: palette.brandPrimary,
    },
    bottomSpacing: {
        height: spacing.xl,
    },
    partiesSection: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    partyBox: {
        flex: 1,
        backgroundColor: palette.backgroundElevated,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    partyTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: palette.brandPrimary,
        letterSpacing: 0.8,
        marginBottom: spacing.xs,
    },
    partyName: {
        fontSize: 15,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    partyDetail: {
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
        marginTop: 2,
    },
    qrSection: {
        backgroundColor: palette.backgroundElevated,
        padding: spacing.lg,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    qrTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: palette.textSecondary,
        marginBottom: spacing.md,
        letterSpacing: 0.5,
    },
    qrCodeContainer: {
        backgroundColor: '#FFFFFF',
        padding: spacing.md,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    qrSubtext: {
        fontSize: 10,
        color: palette.textTertiary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
});
