
//Chat with AI fitness assistant//


import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { palette, spacing, typography } from '@/theme';
import { chatWithAI, ChatMessage, ChatContext } from '@/services/aiService';
import { useAuth } from '@/context/AuthContext';

export const AIChatbotScreen = () => {
    const auth = useAuth();
    const profile = (auth as any).profile;
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Hi! I\'m your AI fitness assistant. Ask me anything about workouts, nutrition, or fitness goals! 💪',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const context: ChatContext = {
                userProfile: profile ? {
                    age: profile.age,
                    gender: profile.gender,
                    weight: profile.weight,
                    height: profile.height,
                    goal: profile.fitnessGoal,
                } : undefined,
                conversationHistory: messages,
            };

            const response = await chatWithAI(userMessage.content, context);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.assistantMessage,
            ]}>
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userText : styles.assistantText,
                    ]}>
                        {item.content}
                    </Text>
                    <Text style={styles.timestamp}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    const quickPrompts = [
        'Create a workout plan for me',
        'What should I eat for breakfast?',
        'How to lose belly fat?',
        'Best exercises for chest',
    ];

    return (
        <Screen>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.aiIcon}>
                            <Ionicons name="sparkles" size={24} color={palette.neonGreen} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>AI Fitness Assistant</Text>
                            <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
                        </View>
                    </View>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Loading indicator */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={palette.neonGreen} />
                        <Text style={styles.loadingText}>AI is thinking...</Text>
                    </View>
                )}

                {/* Quick prompts */}
                {messages.length === 1 && (
                    <View style={styles.quickPromptsContainer}>
                        <Text style={styles.quickPromptsTitle}>Quick questions:</Text>
                        {quickPrompts.map((prompt, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickPrompt}
                                onPress={() => {
                                    setInput(prompt);
                                }}
                            >
                                <Text style={styles.quickPromptText}>{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Ask me anything about fitness..."
                        placeholderTextColor={palette.textSecondary}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!input.trim() || loading}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={input.trim() ? '#FFFFFF' : palette.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        backgroundColor: palette.surface,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    aiIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${palette.neonGreen}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: palette.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: palette.textSecondary,
        marginTop: 2,
    },
    messagesList: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    messageContainer: {
        marginVertical: spacing.xs,
    },
    userMessage: {
        alignItems: 'flex-end',
    },
    assistantMessage: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: spacing.md,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: palette.neonGreen,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: palette.surface,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: '#121212',
    },
    assistantText: {
        color: palette.textPrimary,
    },
    timestamp: {
        fontSize: 10,
        color: palette.textSecondary,
        marginTop: spacing.xs,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    loadingText: {
        fontSize: 14,
        color: palette.textSecondary,
    },
    quickPromptsContainer: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    quickPromptsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: palette.textSecondary,
        marginBottom: spacing.xs,
    },
    quickPrompt: {
        padding: spacing.sm,
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
    },
    quickPromptText: {
        fontSize: 14,
        color: palette.textPrimary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.border,
        backgroundColor: palette.surface,
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        padding: spacing.sm,
        backgroundColor: palette.background,
        borderRadius: 20,
        fontSize: 15,
        color: palette.textPrimary,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: palette.neonGreen,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: palette.border,
    },
});
