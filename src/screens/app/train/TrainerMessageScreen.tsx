import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, spacing, typography } from '@/theme';
import { useNavigation, useRoute } from '@react-navigation/native';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'trainer';
    timestamp: string;
}

export const TrainerMessageScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as { trainerId: string; trainerName: string } | undefined;

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hi! I would like to book a session with you.',
            sender: 'user',
            timestamp: '10:30 AM',
        },
        {
            id: '2',
            text: 'Hello! I\'d be happy to help. What are your fitness goals?',
            sender: 'trainer',
            timestamp: '10:32 AM',
        },
        {
            id: '3',
            text: 'I want to build muscle and improve my strength. I can train 3 times a week.',
            sender: 'user',
            timestamp: '10:35 AM',
        },
        {
            id: '4',
            text: 'Great! I can design a strength training program for you. Are you available for mornings or evenings?',
            sender: 'trainer',
            timestamp: '10:36 AM',
        },
    ]);
    const [inputText, setInputText] = useState('');

    const handleSendMessage = () => {
        if (inputText.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: inputText.trim(),
                sender: 'user',
                timestamp: new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                }),
            };
            setMessages([...messages, newMessage]);
            setInputText('');

            // Simulate trainer response after 2 seconds
            setTimeout(() => {
                const autoReply: Message = {
                    id: (Date.now() + 1).toString(),
                    text: 'Thanks for your message! I\'ll get back to you shortly.',
                    sender: 'trainer',
                    timestamp: new Date().toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                    }),
                };
                setMessages((prev) => [...prev, autoReply]);
            }, 2000);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{params?.trainerName || 'Trainer'}</Text>
                    <View style={styles.onlineStatus}>
                        <Icon name="circle" size={8} color={palette.neonGreen} />
                        <Text style={styles.onlineText}>Online</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Icon name="dots-vertical" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageBubble,
                            message.sender === 'user'
                                ? styles.userMessage
                                : styles.trainerMessage,
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                message.sender === 'user'
                                    ? styles.userMessageText
                                    : styles.trainerMessageText,
                            ]}
                        >
                            {message.text}
                        </Text>
                        <Text
                            style={[
                                styles.timestamp,
                                message.sender === 'user'
                                    ? styles.userTimestamp
                                    : styles.trainerTimestamp,
                            ]}
                        >
                            {message.timestamp}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            {/* Input Box */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Icon name="plus-circle" size={24} color={palette.textSecondary} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={palette.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            inputText.trim() && styles.sendButtonActive,
                        ]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim()}
                    >
                        <Icon
                            name="send"
                            size={20}
                            color={inputText.trim() ? palette.neonGreen : palette.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.cardBackground,
    },
    backButton: {
        marginRight: spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        ...typography.heading3,
        color: palette.textPrimary,
        marginBottom: 2,
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    onlineText: {
        ...typography.caption,
        color: palette.neonGreen,
    },
    moreButton: {
        marginLeft: spacing.md,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    messageBubble: {
        maxWidth: '75%',
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: palette.neonGreen,
        borderBottomRightRadius: 4,
    },
    trainerMessage: {
        alignSelf: 'flex-start',
        backgroundColor: palette.cardBackground,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        ...typography.body,
        marginBottom: 4,
    },
    userMessageText: {
        color: palette.background,
    },
    trainerMessageText: {
        color: palette.textPrimary,
    },
    timestamp: {
        ...typography.footnote,
        fontSize: 10,
    },
    userTimestamp: {
        color: palette.background,
        opacity: 0.7,
        textAlign: 'right',
    },
    trainerTimestamp: {
        color: palette.textSecondary,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: palette.cardBackground,
        backgroundColor: palette.background,
        gap: spacing.sm,
    },
    attachButton: {
        padding: spacing.xs,
    },
    input: {
        flex: 1,
        ...typography.body,
        color: palette.textPrimary,
        backgroundColor: palette.cardBackground,
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxHeight: 100,
    },
    sendButton: {
        padding: spacing.sm,
    },
    sendButtonActive: {
        backgroundColor: palette.cardBackground,
        borderRadius: 20,
    },
});
