/**
 * Support Service
 * Handles FAQ, support tickets, chat, and issue reports
 */

import { supabase } from '@/config/supabaseClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FAQ {
    faq_id: string;
    category: 'account' | 'payment' | 'booking' | 'gym' | 'trainer' | 'subscription' | 'referral' | 'technical' | 'general';
    question: string;
    answer: string;
    helpful_count: number;
    not_helpful_count: number;
    tags: string[];
    is_popular: boolean;
    display_order: number;
    is_active: boolean;
    search_vector: any;
    created_at: string;
    updated_at: string;
}

export interface SupportRequest {
    ticket_id: string;
    user_id: string;
    ticket_no: string;
    subject: string;
    category: 'account' | 'payment' | 'booking' | 'gym' | 'trainer' | 'subscription' | 'referral' | 'technical' | 'general' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting_user' | 'waiting_support' | 'resolved' | 'closed' | 'canceled';
    description: string;
    resolution: string | null;
    assigned_to: string | null;
    assigned_at: string | null;
    resolved_at: string | null;
    closed_at: string | null;
    rating: number | null;
    feedback: string | null;
    tags: string[];
    attachments: any[];
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface SupportChat {
    message_id: string;
    ticket_id: string;
    sender_id: string;
    sender_type: 'user' | 'support' | 'system';
    message_type: 'text' | 'image' | 'file' | 'system';
    message_content: string;
    attachments: any[];
    is_read: boolean;
    read_at: string | null;
    sent_at: string;
    created_at: string;
}

export interface IssueReport {
    issue_id: string;
    user_id: string;
    issue_type: 'bug' | 'crash' | 'performance' | 'ui_ux' | 'feature_request' | 'security' | 'data_issue' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    steps_to_reproduce: string | null;
    expected_behavior: string | null;
    actual_behavior: string | null;
    screen_name: string | null;
    device_info: any;
    app_version: string | null;
    os_version: string | null;
    logs: any;
    screenshots: string[];
    video_url: string | null;
    status: 'reported' | 'investigating' | 'confirmed' | 'in_progress' | 'resolved' | 'wont_fix' | 'duplicate';
    resolved_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// FAQ OPERATIONS
// ============================================================================

/**
 * Search FAQs
 */
export const searchFAQ = async (query: string, category?: FAQ['category']) => {
    try {
        let supabaseQuery = supabase
            .from('faq')
            .select('*')
            .eq('is_active', true);

        if (category) {
            supabaseQuery = supabaseQuery.eq('category', category);
        }

        // Use full-text search if available
        if (query) {
            supabaseQuery = supabaseQuery.textSearch('search_vector', query);
        }

        supabaseQuery = supabaseQuery.order('display_order', { ascending: true });

        const { data, error } = await supabaseQuery;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error searching FAQ:', error);
        return { data: null, error: error };
    }
};

/**
 * Get all FAQs by category
 */
export const getFAQsByCategory = async (category: FAQ['category']) => {
    try {
        const { data, error } = await supabase
            .from('faq')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching FAQs by category:', error);
        return { data: null, error: error };
    }
};

/**
 * Get popular FAQs
 */
export const getPopularFAQs = async (limit: number = 10) => {
    try {
        const { data, error } = await supabase
            .from('faq')
            .select('*')
            .eq('is_popular', true)
            .eq('is_active', true)
            .order('helpful_count', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching popular FAQs:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single FAQ
 */
export const getFAQ = async (faqId: string) => {
    try {
        const { data, error } = await supabase
            .from('faq')
            .select('*')
            .eq('faq_id', faqId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching FAQ:', error);
        return { data: null, error: error };
    }
};

/**
 * Mark FAQ as helpful
 */
export const markFAQHelpful = async (faqId: string, helpful: boolean) => {
    try {
        const { data: faq } = await getFAQ(faqId);
        if (!faq) throw new Error('FAQ not found');

        const updates = helpful
            ? { helpful_count: faq.helpful_count + 1 }
            : { not_helpful_count: faq.not_helpful_count + 1 };

        const { data, error } = await supabase
            .from('faq')
            .update(updates)
            .eq('faq_id', faqId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error marking FAQ helpful:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// SUPPORT TICKET OPERATIONS
// ============================================================================

/**
 * Get all support tickets for a user
 */
export const getSupportTickets = async (
    userId: string,
    filters?: {
        status?: SupportRequest['status'];
        category?: SupportRequest['category'];
        limit?: number;
    }
) => {
    try {
        let query = supabase
            .from('support_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.category) {
            query = query.eq('category', filters.category);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching support tickets:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single support ticket
 */
export const getSupportTicket = async (ticketId: string) => {
    try {
        const { data, error } = await supabase
            .from('support_requests')
            .select('*')
            .eq('ticket_id', ticketId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching support ticket:', error);
        return { data: null, error: error };
    }
};

/**
 * Get ticket by ticket number
 */
export const getTicketByNumber = async (ticketNo: string) => {
    try {
        const { data, error } = await supabase
            .from('support_requests')
            .select('*')
            .eq('ticket_no', ticketNo)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching ticket by number:', error);
        return { data: null, error: error };
    }
};

/**
 * Create a support ticket
 */
export const createSupportTicket = async (
    userId: string,
    ticket: {
        subject: string;
        category: SupportRequest['category'];
        priority?: SupportRequest['priority'];
        description: string;
        attachments?: any[];
        tags?: string[];
    }
) => {
    try {
        const { data, error } = await supabase
            .from('support_requests')
            .insert({
                user_id: userId,
                subject: ticket.subject,
                category: ticket.category,
                priority: ticket.priority || 'medium',
                description: ticket.description,
                status: 'open',
                attachments: ticket.attachments || [],
                tags: ticket.tags || [],
            })
            .select()
            .single();

        if (error) throw error;

        // Create initial system message
        if (data) {
            await sendChatMessage({
                ticket_id: data.ticket_id,
                sender_id: 'system',
                sender_type: 'system',
                message_type: 'text',
                message_content: `Your support ticket ${data.ticket_no} has been created. Our team will respond shortly.`,
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating support ticket:', error);
        return { data: null, error: error };
    }
};

/**
 * Update support ticket
 */
export const updateSupportTicket = async (
    ticketId: string,
    updates: Partial<SupportRequest>
) => {
    try {
        const { data, error } = await supabase
            .from('support_requests')
            .update(updates)
            .eq('ticket_id', ticketId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating support ticket:', error);
        return { data: null, error: error };
    }
};

/**
 * Close support ticket
 */
export const closeSupportTicket = async (ticketId: string, resolution?: string) => {
    try {
        return await updateSupportTicket(ticketId, {
            status: 'closed',
            resolution: resolution || null,
            closed_at: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error closing support ticket:', error);
        return { data: null, error: error };
    }
};

/**
 * Rate support ticket
 */
export const rateSupportTicket = async (
    ticketId: string,
    rating: number,
    feedback?: string
) => {
    try {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        return await updateSupportTicket(ticketId, {
            rating: rating,
            feedback: feedback || null,
        });
    } catch (error: any) {
        console.error('Error rating support ticket:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// SUPPORT CHAT OPERATIONS
// ============================================================================

/**
 * Get chat messages for a ticket
 */
export const getChatMessages = async (ticketId: string) => {
    try {
        const { data, error } = await supabase
            .from('support_chat')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('sent_at', { ascending: true });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching chat messages:', error);
        return { data: null, error: error };
    }
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (message: Partial<SupportChat>) => {
    try {
        const { data, error } = await supabase
            .from('support_chat')
            .insert({
                sent_at: new Date().toISOString(),
                is_read: false,
                ...message,
            })
            .select()
            .single();

        if (error) throw error;

        // Update ticket status to indicate user is waiting for response
        if (data && message.sender_type === 'user') {
            await updateSupportTicket(data.ticket_id, {
                status: 'waiting_support',
            });
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('Error sending chat message:', error);
        return { data: null, error: error };
    }
};

/**
 * Mark chat message as read
 */
export const markMessageAsRead = async (messageId: string) => {
    try {
        const { data, error } = await supabase
            .from('support_chat')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('message_id', messageId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error marking message as read:', error);
        return { data: null, error: error };
    }
};

/**
 * Mark all messages as read for a ticket
 */
export const markAllMessagesAsRead = async (ticketId: string, userId: string) => {
    try {
        const { data, error } = await supabase
            .from('support_chat')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('ticket_id', ticketId)
            .neq('sender_id', userId) // Don't mark own messages as read
            .eq('is_read', false);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error marking all messages as read:', error);
        return { data: null, error: error };
    }
};

/**
 * Get unread message count for a ticket
 */
export const getUnreadMessageCount = async (ticketId: string, userId: string) => {
    try {
        const { count, error } = await supabase
            .from('support_chat')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticketId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        return { data: count || 0, error: null };
    } catch (error: any) {
        console.error('Error fetching unread message count:', error);
        return { data: 0, error: error };
    }
};

// ============================================================================
// ISSUE REPORT OPERATIONS
// ============================================================================

/**
 * Get issue reports for a user
 */
export const getIssueReports = async (userId: string, limit: number = 20) => {
    try {
        const { data, error } = await supabase
            .from('issue_reports')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching issue reports:', error);
        return { data: null, error: error };
    }
};

/**
 * Get a single issue report
 */
export const getIssueReport = async (issueId: string) => {
    try {
        const { data, error } = await supabase
            .from('issue_reports')
            .select('*')
            .eq('issue_id', issueId)
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching issue report:', error);
        return { data: null, error: error };
    }
};

/**
 * Report an issue
 */
export const reportIssue = async (
    userId: string,
    issue: {
        issue_type: IssueReport['issue_type'];
        severity: IssueReport['severity'];
        title: string;
        description: string;
        steps_to_reproduce?: string;
        expected_behavior?: string;
        actual_behavior?: string;
        screen_name?: string;
        device_info?: any;
        app_version?: string;
        os_version?: string;
        logs?: any;
        screenshots?: string[];
        video_url?: string;
    }
) => {
    try {
        const { data, error } = await supabase
            .from('issue_reports')
            .insert({
                user_id: userId,
                status: 'reported',
                ...issue,
            })
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error reporting issue:', error);
        return { data: null, error: error };
    }
};

/**
 * Update issue report
 */
export const updateIssueReport = async (
    issueId: string,
    updates: Partial<IssueReport>
) => {
    try {
        const { data, error } = await supabase
            .from('issue_reports')
            .update(updates)
            .eq('issue_id', issueId)
            .select()
            .single();

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating issue report:', error);
        return { data: null, error: error };
    }
};

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get support statistics for a user
 */
export const getSupportStats = async (userId: string) => {
    try {
        const { count: totalTickets } = await supabase
            .from('support_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: openTickets } = await supabase
            .from('support_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('status', ['open', 'in_progress', 'waiting_support']);

        const { count: resolvedTickets } = await supabase
            .from('support_requests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'resolved');

        const { count: totalIssues } = await supabase
            .from('issue_reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        return {
            data: {
                totalTickets: totalTickets || 0,
                openTickets: openTickets || 0,
                resolvedTickets: resolvedTickets || 0,
                totalIssues: totalIssues || 0,
            },
            error: null,
        };
    } catch (error: any) {
        console.error('Error fetching support stats:', error);
        return {
            data: {
                totalTickets: 0,
                openTickets: 0,
                resolvedTickets: 0,
                totalIssues: 0,
            },
            error: error,
        };
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get status color
 */
export const getStatusColor = (status: SupportRequest['status']): string => {
    const colors = {
        open: '#3B82F6',
        in_progress: '#F59E0B',
        waiting_user: '#8B5CF6',
        waiting_support: '#EC4899',
        resolved: '#10B981',
        closed: '#6B7280',
        canceled: '#EF4444',
    };
    return colors[status] || colors.open;
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority: SupportRequest['priority']): string => {
    const colors = {
        low: '#94A3B8',
        medium: '#F59E0B',
        high: '#EF4444',
        urgent: '#DC2626',
    };
    return colors[priority] || colors.medium;
};

/**
 * Get severity color
 */
export const getSeverityColor = (severity: IssueReport['severity']): string => {
    const colors = {
        low: '#94A3B8',
        medium: '#F59E0B',
        high: '#EF4444',
        critical: '#DC2626',
    };
    return colors[severity] || colors.medium;
};

/**
 * Format ticket number
 */
export const formatTicketNumber = (ticketNo: string): string => {
    return ticketNo.toUpperCase();
};
