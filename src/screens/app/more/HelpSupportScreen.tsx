import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../../../theme';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: 'general' | 'bookings' | 'payments' | 'technical';
}

interface SupportTicket {
    id: string;
    subject: string;
    status: 'open' | 'in-progress' | 'resolved';
    date: Date;
}

export default function HelpSupportScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    // Placeholder data
    const faqs: FAQItem[] = [
        {
            id: '1',
            question: 'How do I book a gym session?',
            answer: 'To book a gym session, go to the Home tab, browse available gyms, select your preferred gym, choose a date and time, and confirm your booking. Payment can be made using your wallet balance or other payment methods.',
            category: 'bookings',
        },
        {
            id: '2',
            question: 'Can I cancel or reschedule my booking?',
            answer: 'Yes, you can cancel or reschedule your booking from the Bookings screen. Cancellations made 24 hours before the scheduled time are eligible for a full refund. Cancellations within 24 hours may incur a cancellation fee.',
            category: 'bookings',
        },
        {
            id: '3',
            question: 'How do I add money to my wallet?',
            answer: 'Go to the Wallet screen in the MORE tab, tap "Add Money", enter the amount, and complete the payment using your preferred payment method. The amount will be credited to your wallet instantly.',
            category: 'payments',
        },
        {
            id: '4',
            question: 'What payment methods are accepted?',
            answer: 'We accept credit/debit cards, UPI, net banking, and popular digital wallets like PayPal, Google Pay, and Apple Pay. You can also use your SIXFINITY wallet balance.',
            category: 'payments',
        },
        {
            id: '5',
            question: 'How do rewards and points work?',
            answer: 'You earn points for gym check-ins, completing bookings, achieving fitness goals, and referring friends. Points can be redeemed for discounts, free sessions, and other rewards. Check the Rewards screen for more details.',
            category: 'general',
        },
        {
            id: '6',
            question: 'The app is not loading properly',
            answer: 'Try closing and reopening the app. If the issue persists, check your internet connection, clear the app cache, or reinstall the app. Contact support if the problem continues.',
            category: 'technical',
        },
        {
            id: '7',
            question: 'How do I update my profile information?',
            answer: 'Go to the MORE tab, tap "Edit Profile", update your information, and save changes. You can update your name, email, phone number, profile photo, and other details.',
            category: 'general',
        },
        {
            id: '8',
            question: 'Can I use my membership at multiple gyms?',
            answer: 'Yes, SIXFINITY gives you access to a network of partner gyms. Your membership allows you to book sessions at any participating gym based on your plan.',
            category: 'general',
        },
    ];

    const tickets: SupportTicket[] = [
        {
            id: '1',
            subject: 'Payment not reflected in wallet',
            status: 'in-progress',
            date: new Date(Date.now() - 86400000 * 2),
        },
        {
            id: '2',
            subject: 'Unable to check-in at gym',
            status: 'resolved',
            date: new Date(Date.now() - 86400000 * 7),
        },
    ];

    const filteredFAQs = searchQuery.trim()
        ? faqs.filter(
            (faq) =>
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : faqs;

    const toggleFAQ = (id: string) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const handleSubmitTicket = () => {
        if (!subject.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        Alert.alert('Success', 'Your support ticket has been submitted. We\'ll get back to you soon!');
        setSubject('');
        setMessage('');
    };

    const handleLiveChat = () => {
        Alert.alert('Live Chat', 'Live chat feature coming soon! For now, please submit a ticket or email us.');
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:support@sixfinity.app?subject=Support Request');
    };

    const handleCallSupport = () => {
        Linking.openURL('tel:+941234567890');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return palette.warning;
            case 'in-progress':
                return palette.brandPrimary;
            case 'resolved':
                return palette.success;
            default:
                return palette.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
                    onPress={() => setActiveTab('faq')}
                >
                    <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>
                        FAQ
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
                    onPress={() => setActiveTab('contact')}
                >
                    <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>
                        Contact Us
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
                    onPress={() => setActiveTab('tickets')}
                >
                    <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>
                        My Tickets
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* FAQ Tab */}
                {activeTab === 'faq' && (
                    <>
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search FAQs..."
                                placeholderTextColor={palette.textTertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Text style={styles.clearButton}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* FAQ List */}
                        <View style={styles.faqList}>
                            {filteredFAQs.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyIcon}>🔍</Text>
                                    <Text style={styles.emptyText}>No FAQs found</Text>
                                    <Text style={styles.emptySubtext}>Try a different search term</Text>
                                </View>
                            ) : (
                                filteredFAQs.map((faq) => (
                                    <TouchableOpacity
                                        key={faq.id}
                                        style={[
                                            styles.faqCard,
                                            expandedFAQ === faq.id && styles.faqCardExpanded,
                                        ]}
                                        onPress={() => toggleFAQ(faq.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.faqHeader}>
                                            <Text style={styles.faqQuestion}>{faq.question}</Text>
                                            <Text style={styles.faqToggle}>
                                                {expandedFAQ === faq.id ? '−' : '+'}
                                            </Text>
                                        </View>
                                        {expandedFAQ === faq.id && (
                                            <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </>
                )}

                {/* Contact Us Tab */}
                {activeTab === 'contact' && (
                    <>
                        {/* Quick Contact Options */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Quick Contact</Text>
                            <View style={styles.contactOptions}>
                                <TouchableOpacity style={styles.contactCard} onPress={handleLiveChat}>
                                    <Text style={styles.contactIcon}>💬</Text>
                                    <Text style={styles.contactLabel}>Live Chat</Text>
                                    <Text style={styles.contactSubtext}>Chat with us now</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
                                    <Text style={styles.contactIcon}>📧</Text>
                                    <Text style={styles.contactLabel}>Email</Text>
                                    <Text style={styles.contactSubtext}>support@sixfinity.app</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
                                    <Text style={styles.contactIcon}></Text>
                                    <Text style={styles.contactLabel}>Call</Text>
                                    <Text style={styles.contactSubtext}>+91 1234567890</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Submit Ticket Form */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Submit a Support Ticket</Text>
                            <View style={styles.form}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Subject"
                                    placeholderTextColor={palette.textTertiary}
                                    value={subject}
                                    onChangeText={setSubject}
                                />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Describe your issue..."
                                    placeholderTextColor={palette.textTertiary}
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket}>
                                    <Text style={styles.submitButtonText}>Submit Ticket</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Info */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoIcon}>ℹ</Text>
                            <Text style={styles.infoText}>
                                Our support team typically responds within 24 hours. For urgent issues, please use live chat or call us directly.
                            </Text>
                        </View>
                    </>
                )}

                {/* My Tickets Tab */}
                {activeTab === 'tickets' && (
                    <View style={styles.section}>
                        {tickets.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>🎫</Text>
                                <Text style={styles.emptyText}>No Support Tickets</Text>
                                <Text style={styles.emptySubtext}>
                                    You don't have any open or past support tickets
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.ticketsList}>
                                {tickets.map((ticket) => (
                                    <TouchableOpacity key={ticket.id} style={styles.ticketCard}>
                                        <View style={styles.ticketHeader}>
                                            <Text style={styles.ticketId}>#{ticket.id}</Text>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: `${getStatusColor(ticket.status)}20` },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statusText,
                                                        { color: getStatusColor(ticket.status) },
                                                    ]}
                                                >
                                                    {ticket.status.replace('-', ' ')}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                                        <Text style={styles.ticketDate}>
                                            {ticket.date.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
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
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: palette.brandPrimary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: palette.textSecondary,
    },
    activeTabText: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: palette.textPrimary,
    },
    clearButton: {
        fontSize: 18,
        color: palette.textTertiary,
        paddingLeft: spacing.sm,
    },
    faqList: {
        padding: spacing.md,
    },
    faqCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    faqCardExpanded: {
        borderColor: palette.brandPrimary,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    faqQuestion: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
        marginRight: spacing.sm,
    },
    faqToggle: {
        fontSize: 24,
        color: palette.brandPrimary,
        fontWeight: '300',
    },
    faqAnswer: {
        fontSize: 13,
        color: palette.textSecondary,
        lineHeight: 20,
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    section: {
        padding: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    contactOptions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    contactCard: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    contactIcon: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs / 2,
    },
    contactSubtext: {
        fontSize: 11,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    form: {
        gap: spacing.md,
    },
    input: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        fontSize: 15,
        color: palette.textPrimary,
        borderWidth: 1,
        borderColor: palette.border,
    },
    textArea: {
        minHeight: 120,
    },
    submitButton: {
        backgroundColor: palette.brandPrimary,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    infoCard: {
        backgroundColor: `${palette.brandPrimary}10`,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: `${palette.brandPrimary}30`,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: palette.textSecondary,
        lineHeight: 18,
    },
    emptyContainer: {
        backgroundColor: palette.surface,
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    emptySubtext: {
        fontSize: 13,
        color: palette.textSecondary,
        textAlign: 'center',
    },
    ticketsList: {
        gap: spacing.sm,
    },
    ticketCard: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    ticketId: {
        fontSize: 12,
        fontWeight: '600',
        color: palette.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    ticketSubject: {
        fontSize: 15,
        fontWeight: '600',
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    ticketDate: {
        fontSize: 12,
        color: palette.textSecondary,
    },
});
