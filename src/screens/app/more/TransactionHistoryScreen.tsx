import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,
    TextInput,
    Modal,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { palette, spacing, typography } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import * as walletService from '@/services/walletService';

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    category: 'topup' | 'booking' | 'refund' | 'reward' | 'referral' | 'cashback';
    amount: number;
    description: string;
    timestamp: string;
    status: 'completed' | 'pending' | 'failed';
    icon: string;
    balanceAfter?: number;
}

const TRANSACTION_ICONS = {
    topup: '',
    booking: '',
    refund: '',
    reward: '',
    referral: '',
    cashback: '',
};

const FILTER_OPTIONS = [
    { id: 'all', label: 'All' },
    { id: 'credit', label: 'Credits' },
    { id: 'debit', label: 'Debits' },
    { id: 'pending', label: 'Pending' },
];

const CATEGORY_FILTERS = [
    { id: 'all', label: 'All Categories', icon: '' },
    { id: 'topup', label: 'Top-ups', icon: '' },
    { id: 'booking', label: 'Bookings', icon: '' },
    { id: 'reward', label: 'Rewards', icon: '' },
    { id: 'referral', label: 'Referrals', icon: '' },
    { id: 'refund', label: 'Refunds', icon: '' },
];

export const TransactionHistoryScreen: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Advanced filters
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [showDateFromPicker, setShowDateFromPicker] = useState(false);
    const [showDateToPicker, setShowDateToPicker] = useState(false);
    const [minAmount, setMinAmount] = useState(0);
    const [maxAmount, setMaxAmount] = useState(50000);
    const [amountRange, setAmountRange] = useState({ min: 0, max: 50000 });

    useEffect(() => {
        if (user?.id) {
            loadTransactions();
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [transactions, selectedFilter, selectedCategory, searchQuery, dateFrom, dateTo, amountRange]);

    const loadTransactions = async () => {
        if (!user?.id) {
            console.log('No user ID available');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const result = await walletService.getTransactions(user.id, {
                limit: 100,
            });

            if (result.data) {
                const formattedTransactions: Transaction[] = result.data.map((t: any) => ({
                    id: t.id,
                    type: t.amount >= 0 ? 'credit' : 'debit',
                    category: t.transactionType || 'booking',
                    amount: Math.abs(t.amount),
                    description: t.description || 'Transaction',
                    timestamp: t.createdAt,
                    status: t.status,
                    balanceAfter: t.balanceAfter,
                    icon: TRANSACTION_ICONS[t.transactionType as keyof typeof TRANSACTION_ICONS] || '💵',
                }));
                setTransactions(formattedTransactions);
            } else {
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            // Silently handle PGRST116 (no rows found) error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...transactions];

        // Apply type filter
        if (selectedFilter === 'credit') {
            filtered = filtered.filter(t => t.type === 'credit');
        } else if (selectedFilter === 'debit') {
            filtered = filtered.filter(t => t.type === 'debit');
        } else if (selectedFilter === 'pending') {
            filtered = filtered.filter(t => t.status === 'pending');
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.amount.toString().includes(query)
            );
        }

        // Apply date range filter
        if (dateFrom) {
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.timestamp);
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                return transactionDate >= fromDate;
            });
        }

        if (dateTo) {
            filtered = filtered.filter(t => {
                const transactionDate = new Date(t.timestamp);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                return transactionDate <= toDate;
            });
        }

        // Apply amount range filter
        filtered = filtered.filter(t => {
            return t.amount >= amountRange.min && t.amount <= amountRange.max;
        });

        setFilteredTransactions(filtered);
    };

    const clearAdvancedFilters = () => {
        setDateFrom(null);
        setDateTo(null);
        setAmountRange({ min: 0, max: 50000 });
        setShowAdvancedFilters(false);
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (dateFrom) count++;
        if (dateTo) count++;
        if (amountRange.min > 0 || amountRange.max < 50000) count++;
        return count;
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadTransactions();
    }, []);

    const calculateStats = () => {
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        const credits = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);
        const debits = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);

        return { total, credits, debits };
    };

    const groupTransactionsByDate = () => {
        const grouped: { [key: string]: Transaction[] } = {};

        filteredTransactions.forEach(transaction => {
            const date = new Date(transaction.timestamp);
            const dateKey = date.toDateString();

            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(transaction);
        });

        return Object.entries(grouped).sort((a, b) => {
            return new Date(b[0]).getTime() - new Date(a[0]).getTime();
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
            });
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const stats = calculateStats();
    const groupedTransactions = groupTransactionsByDate();

    const renderStatsCards = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Credits</Text>
                <Text style={[styles.statValue, { color: palette.success }]}>
                    +₹{stats.credits.toFixed(2)}
                </Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Debits</Text>
                <Text style={[styles.statValue, { color: palette.danger }]}>
                    -₹{stats.debits.toFixed(2)}
                </Text>
            </View>
        </View>
    );

    const renderSearchBar = () => {
        const activeFiltersCount = getActiveFiltersCount();

        return (
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search transactions..."
                        placeholderTextColor={palette.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.filterToggleButton}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Text style={styles.filterToggleIcon}></Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.advancedFilterButton, activeFiltersCount > 0 && styles.advancedFilterButtonActive]}
                    onPress={() => setShowAdvancedFilters(true)}
                >
                    <Text style={styles.advancedFilterIcon}></Text>
                    {activeFiltersCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const renderFilters = () => {
        if (!showFilters) return null;

        return (
            <View style={styles.filtersContainer}>
                <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterChips}>
                            {FILTER_OPTIONS.map(option => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.filterChip,
                                        selectedFilter === option.id && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedFilter(option.id)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedFilter === option.id && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterChips}>
                            {CATEGORY_FILTERS.map(category => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.filterChip,
                                        selectedCategory === category.id && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedCategory(category.id)}
                                >
                                    <Text style={styles.filterChipIcon}>{category.icon}</Text>
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            selectedCategory === category.id && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        );
    };

    const renderTransactionItem = (transaction: Transaction) => {
        const isCredit = transaction.type === 'credit';
        const statusColor =
            transaction.status === 'completed' ? palette.success :
                transaction.status === 'pending' ? palette.warning :
                    palette.danger;

        return (
            <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIconContainer}>
                    <Text style={styles.transactionIcon}>{transaction.icon}</Text>
                </View>

                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <View style={styles.transactionMeta}>
                        <Text style={styles.transactionTime}>{formatTime(transaction.timestamp)}</Text>
                        {transaction.status !== 'completed' && (
                            <>
                                <Text style={styles.transactionMetaDot}>•</Text>
                                <Text style={[styles.transactionStatus, { color: statusColor }]}>
                                    {transaction.status}
                                </Text>
                            </>
                        )}
                    </View>
                    {transaction.balanceAfter !== undefined && (
                        <Text style={styles.balanceAfter}>
                            Balance: ₹{transaction.balanceAfter.toFixed(2)}
                        </Text>
                    )}
                </View>

                <View style={styles.transactionRight}>
                    <Text
                        style={[
                            styles.transactionAmount,
                            isCredit ? styles.transactionAmountCredit : styles.transactionAmountDebit,
                        ]}
                    >
                        {isCredit ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.transactionCategory}>
                        {transaction.category}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Transaction History</Text>
                <Text style={styles.subtitle}>{filteredTransactions.length} transactions</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.brandPrimary}
                    />
                }
            >
                {/* Stats Cards */}
                {renderStatsCards()}

                {/* Search Bar */}
                {renderSearchBar()}

                {/* Filters */}
                {renderFilters()}

                {/* Transactions List */}
                {groupedTransactions.length > 0 ? (
                    <View style={styles.transactionsContainer}>
                        {groupedTransactions.map(([dateKey, dayTransactions]) => (
                            <View key={dateKey} style={styles.dateGroup}>
                                <Text style={styles.dateHeader}>{formatDate(dateKey)}</Text>
                                <View style={styles.transactionsList}>
                                    {dayTransactions.map(renderTransactionItem)}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateIcon}></Text>
                        <Text style={styles.emptyStateTitle}>No transactions found</Text>
                        <Text style={styles.emptyStateText}>
                            {searchQuery || selectedFilter !== 'all' || selectedCategory !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Your transaction history will appear here'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Advanced Filters Modal */}
            <Modal
                visible={showAdvancedFilters}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAdvancedFilters(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Advanced Filters</Text>
                            <TouchableOpacity onPress={() => setShowAdvancedFilters(false)}>
                                <Text style={styles.modalCloseButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Date Range Filter */}
                            <View style={styles.filterGroup}>
                                <Text style={styles.filterGroupTitle}> Date Range</Text>

                                <View style={styles.datePickerRow}>
                                    <View style={styles.datePickerItem}>
                                        <Text style={styles.dateLabel}>From</Text>
                                        <TouchableOpacity
                                            style={styles.datePicker}
                                            onPress={() => setShowDateFromPicker(true)}
                                        >
                                            <Text style={styles.datePickerText}>
                                                {dateFrom ? dateFrom.toLocaleDateString() : 'Select date'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.datePickerItem}>
                                        <Text style={styles.dateLabel}>To</Text>
                                        <TouchableOpacity
                                            style={styles.datePicker}
                                            onPress={() => setShowDateToPicker(true)}
                                        >
                                            <Text style={styles.datePickerText}>
                                                {dateTo ? dateTo.toLocaleDateString() : 'Select date'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {(dateFrom || dateTo) && (
                                    <TouchableOpacity
                                        style={styles.clearDatesButton}
                                        onPress={() => {
                                            setDateFrom(null);
                                            setDateTo(null);
                                        }}
                                    >
                                        <Text style={styles.clearDatesText}>Clear dates</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Amount Range Filter */}
                            <View style={styles.filterGroup}>
                                <Text style={styles.filterGroupTitle}> Amount Range</Text>

                                <View style={styles.amountRangeContainer}>
                                    <Text style={styles.amountRangeLabel}>
                                        ₹{amountRange.min.toLocaleString()} - ₹{amountRange.max.toLocaleString()}
                                    </Text>
                                </View>

                                {/* Custom Slider using TouchableOpacity */}
                                <View style={styles.sliderContainer}>
                                    <View style={styles.sliderLabels}>
                                        <Text style={styles.sliderLabel}>Min</Text>
                                        <Text style={styles.sliderLabel}>Max</Text>
                                    </View>

                                    <View style={styles.inputRow}>
                                        <View style={styles.amountInput}>
                                            <Text style={styles.currencySymbol}>₹</Text>
                                            <TextInput
                                                style={styles.amountInputField}
                                                value={amountRange.min.toString()}
                                                onChangeText={(text) => {
                                                    const value = parseInt(text) || 0;
                                                    setAmountRange({ ...amountRange, min: Math.min(value, amountRange.max) });
                                                }}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={palette.textTertiary}
                                            />
                                        </View>

                                        <Text style={styles.rangeSeparator}>-</Text>

                                        <View style={styles.amountInput}>
                                            <Text style={styles.currencySymbol}>₹</Text>
                                            <TextInput
                                                style={styles.amountInputField}
                                                value={amountRange.max.toString()}
                                                onChangeText={(text) => {
                                                    const value = parseInt(text) || 50000;
                                                    setAmountRange({ ...amountRange, max: Math.max(value, amountRange.min) });
                                                }}
                                                keyboardType="numeric"
                                                placeholder="50000"
                                                placeholderTextColor={palette.textTertiary}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.quickAmountButtons}>
                                        {[1000, 5000, 10000, 25000].map((amount) => (
                                            <TouchableOpacity
                                                key={amount}
                                                style={styles.quickAmountButton}
                                                onPress={() => setAmountRange({ min: 0, max: amount })}
                                            >
                                                <Text style={styles.quickAmountText}>₹{(amount / 1000)}K</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Results Preview */}
                            <View style={styles.resultsPreview}>
                                <Text style={styles.resultsPreviewText}>
                                    {filteredTransactions.length} transactions match your filters
                                </Text>
                            </View>
                        </ScrollView>

                        {/* Modal Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearAdvancedFilters}
                            >
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setShowAdvancedFilters(false)}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Pickers */}
            {showDateFromPicker && (
                <DateTimePicker
                    value={dateFrom || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDateFromPicker(false);
                        if (selectedDate) {
                            setDateFrom(selectedDate);
                        }
                    }}
                    maximumDate={dateTo || new Date()}
                />
            )}

            {showDateToPicker && (
                <DateTimePicker
                    value={dateTo || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDateToPicker(false);
                        if (selectedDate) {
                            setDateTo(selectedDate);
                        }
                    }}
                    minimumDate={dateFrom || undefined}
                    maximumDate={new Date()}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        fontSize: 18,
        color: palette.textSecondary,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    title: {
        ...typography.heading1,
        color: palette.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: palette.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
    },
    statLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    statValue: {
        ...typography.heading2,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 12,
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
        ...typography.body,
        color: palette.textPrimary,
        paddingVertical: spacing.sm,
    },
    clearIcon: {
        ...typography.body,
        color: palette.textTertiary,
        fontSize: 20,
        paddingHorizontal: spacing.xs,
    },
    filterToggleButton: {
        width: 48,
        height: 48,
        backgroundColor: palette.surface,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.border,
    },
    filterToggleIcon: {
        fontSize: 20,
    },
    filtersContainer: {
        paddingTop: spacing.md,
    },
    filterSection: {
        marginBottom: spacing.md,
    },
    filterSectionTitle: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    filterChips: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.surface,
        borderRadius: 20,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: palette.border,
        gap: spacing.xs,
    },
    filterChipActive: {
        backgroundColor: palette.brandPrimary + '20',
        borderColor: palette.brandPrimary,
    },
    filterChipIcon: {
        fontSize: 16,
    },
    filterChipText: {
        ...typography.body,
        fontSize: 14,
        color: palette.textSecondary,
    },
    filterChipTextActive: {
        color: palette.brandPrimary,
        fontWeight: '600',
    },
    transactionsContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    dateGroup: {
        marginBottom: spacing.lg,
    },
    dateHeader: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: spacing.sm,
    },
    transactionsList: {
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'hidden',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    transactionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    transactionIcon: {
        fontSize: 20,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionDescription: {
        ...typography.bodyBold,
        color: palette.textPrimary,
        marginBottom: 2,
    },
    transactionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    transactionTime: {
        ...typography.caption,
        color: palette.textSecondary,
    },
    transactionMetaDot: {
        ...typography.caption,
        color: palette.textSecondary,
        marginHorizontal: spacing.xs,
    },
    transactionStatus: {
        ...typography.caption,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    balanceAfter: {
        ...typography.caption,
        fontSize: 11,
        color: palette.textTertiary,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        ...typography.bodyBold,
        fontSize: 16,
        marginBottom: 2,
    },
    transactionAmountCredit: {
        color: palette.success,
    },
    transactionAmountDebit: {
        color: palette.textPrimary,
    },
    transactionCategory: {
        ...typography.caption,
        fontSize: 11,
        color: palette.textTertiary,
        textTransform: 'capitalize',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
        opacity: 0.3,
    },
    emptyStateTitle: {
        ...typography.heading3,
        color: palette.textSecondary,
        marginBottom: spacing.sm,
    },
    emptyStateText: {
        ...typography.body,
        color: palette.textTertiary,
        textAlign: 'center',
        maxWidth: 280,
    },
    // Advanced Filters Button
    advancedFilterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: palette.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
        borderWidth: 1,
        borderColor: palette.border,
    },
    advancedFilterButtonActive: {
        backgroundColor: palette.brandPrimary + '20',
        borderColor: palette.brandPrimary,
    },
    advancedFilterIcon: {
        fontSize: 20,
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: palette.danger,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: palette.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    modalTitle: {
        ...typography.heading2,
        color: palette.textPrimary,
    },
    modalCloseButton: {
        fontSize: 28,
        color: palette.textSecondary,
        fontWeight: '300',
    },
    modalBody: {
        flex: 1,
    },
    filterGroup: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
    },
    filterGroupTitle: {
        ...typography.subtitle,
        color: palette.textPrimary,
        marginBottom: spacing.md,
    },
    // Date Picker Styles
    datePickerRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    datePickerItem: {
        flex: 1,
    },
    dateLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    datePicker: {
        backgroundColor: palette.background,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    datePickerText: {
        ...typography.body,
        color: palette.textPrimary,
        textAlign: 'center',
    },
    clearDatesButton: {
        marginTop: spacing.sm,
        alignItems: 'center',
        padding: spacing.sm,
    },
    clearDatesText: {
        ...typography.caption,
        color: palette.danger,
        fontWeight: '600',
    },
    // Amount Range Styles
    amountRangeContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    amountRangeLabel: {
        ...typography.heading3,
        color: palette.brandPrimary,
        fontWeight: '700',
    },
    sliderContainer: {
        marginTop: spacing.sm,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    sliderLabel: {
        ...typography.caption,
        color: palette.textSecondary,
        fontWeight: '600',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    amountInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    currencySymbol: {
        ...typography.body,
        color: palette.textSecondary,
        marginRight: spacing.xs,
        fontWeight: '600',
    },
    amountInputField: {
        flex: 1,
        ...typography.body,
        color: palette.textPrimary,
        padding: 0,
    },
    rangeSeparator: {
        ...typography.body,
        color: palette.textSecondary,
        marginHorizontal: spacing.md,
        fontWeight: '600',
    },
    quickAmountButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    quickAmountButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        backgroundColor: palette.brandPrimary + '20',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.brandPrimary + '40',
    },
    quickAmountText: {
        ...typography.caption,
        color: palette.brandPrimary,
        fontWeight: '700',
    },
    // Results & Actions
    resultsPreview: {
        padding: spacing.lg,
        backgroundColor: palette.brandPrimary + '10',
        alignItems: 'center',
    },
    resultsPreviewText: {
        ...typography.body,
        color: palette.textPrimary,
        fontWeight: '600',
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: palette.border,
    },
    clearButton: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: palette.surface,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: palette.danger,
    },
    clearButtonText: {
        ...typography.bodyBold,
        color: palette.danger,
    },
    applyButton: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: palette.brandPrimary,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButtonText: {
        ...typography.bodyBold,
        color: palette.background,
    },
});
