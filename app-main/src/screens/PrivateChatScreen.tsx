import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { supabase } from '../services/supabase';
import ChatMessage from '../components/ChatMessage';

const { width } = Dimensions.get('window');

interface PrivateMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  recipientId: string;
  timestamp: Date;
  eventId: string;
  replyTo?: {
    id: string;
    text: string;
    userName: string;
  };
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
  deleted?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  readAt?: Date;
}

interface PrivateChatScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
      recipientId?: string;
      recipientName?: string;
      recipientPhotoURL?: string;
    };
  };
}

export default function PrivateChatScreen({ navigation, route }: PrivateChatScreenProps) {
  const { eventId, recipientId, recipientName, recipientPhotoURL } = route?.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; userName: string } | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<PrivateMessage[]>([]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (eventId) {
          const { data: eventRow, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .maybeSingle();

          if (!eventError && eventRow) {
            setEvent({
              id: eventRow.id,
              ...eventRow,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (eventId && recipientId && user?.id) {
      const mapMessageRow = (row: any): PrivateMessage => ({
        id: row.id,
        text: row.text,
        senderId: row.user_id,
        senderName: row.user_name,
        senderPhotoURL: row.user_photo_url,
        recipientId: row.recipient_id,
        timestamp: row.created_at ? new Date(row.created_at) : new Date(),
        eventId: row.event_id,
        replyTo: row.reply_to,
        reactions: row.reactions || [],
        deleted: row.deleted || false,
        status: row.status || (row.user_id === user.id ? 'sent' : 'delivered'),
        readAt: row.read_at ? new Date(row.read_at) : undefined,
      });

      const loadMessages = async () => {
        try {
          const { data, error } = await supabase
            .from('private_messages')
            .select('*')
            .eq('event_id', eventId)
            .contains('participants', [user.id])
            .order('created_at', { ascending: true })
            .limit(200);

          if (error) throw error;

          const messageList: PrivateMessage[] = [];

          for (const row of data || []) {
            // Only include messages between current user and recipient
            if (
              (row.user_id === user.id && row.recipient_id === recipientId) ||
              (row.user_id === recipientId && row.recipient_id === user.id)
            ) {
              messageList.push(mapMessageRow(row));

              // Mark as read if message is from recipient and not read yet
              if (row.user_id === recipientId && !row.read_at) {
                supabase
                  .from('private_messages')
                  .update({ status: 'read', read_at: new Date().toISOString() })
                  .eq('id', row.id);
              }
            }
          }

          setMessages(messageList);
          if (searchQuery) {
            setFilteredMessages(messageList.filter(msg =>
              msg.text.toLowerCase().includes(searchQuery.toLowerCase())
            ));
          }

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (error) {
          console.error('Error loading private messages:', error);
        }
      };

      loadMessages();

      const messagesChannel = supabase
        .channel(`private-messages-${eventId}-${user.id}-${recipientId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'private_messages', filter: `event_id=eq.${eventId}` },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      // Listen to recipient's typing indicator
      const recipientTypingId = `${eventId}_${recipientId}`;
      const loadRecipientTyping = async () => {
        const { data } = await supabase
          .from('typing_indicators')
          .select('is_typing')
          .eq('id', recipientTypingId)
          .maybeSingle();
        setRecipientTyping(data?.is_typing || false);
      };
      loadRecipientTyping();

      const typingChannel = supabase
        .channel(`typing-${recipientTypingId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'typing_indicators', filter: `id=eq.${recipientTypingId}` },
          () => {
            loadRecipientTyping();
          }
        )
        .subscribe();

      // Listen to recipient's online status
      const recipientOnlineId = `${eventId}_${recipientId}`;
      const loadRecipientOnline = async () => {
        const { data } = await supabase
          .from('online_users')
          .select('is_online')
          .eq('id', recipientOnlineId)
          .maybeSingle();
        setIsOnline(data?.is_online || false);
      };
      loadRecipientOnline();

      const onlineChannel = supabase
        .channel(`online-${recipientOnlineId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'online_users', filter: `id=eq.${recipientOnlineId}` },
          () => {
            loadRecipientOnline();
          }
        )
        .subscribe();

      // Set current user as online
      const myOnlineId = `${eventId}_${user.id}`;
      supabase.from('online_users').upsert({
        id: myOnlineId,
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'Anonymous',
        event_id: eventId,
        last_seen: new Date().toISOString(),
        is_online: true,
      });

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
        supabase.removeChannel(onlineChannel);
        // Set offline when leaving
        supabase.from('online_users').update({ is_online: false }).eq('id', myOnlineId);
      };
    }
  }, [eventId, recipientId, user]);

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (!user?.id || !eventId || !recipientId) return;

    // Update typing indicator
    const typingRef = doc(db, 'typingIndicators', `${eventId}_${recipientId}`);
    setDoc(typingRef, {
      userId: user.id,
      userName: user.name || user.email?.split('@')[0] || 'Anonymous',
      eventId: eventId,
      recipientId: recipientId,
      isTyping: text.length > 0,
      timestamp: serverTimestamp(),
    });

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setDoc(typingRef, {
        userId: user.id,
        userName: user.name || user.email?.split('@')[0] || 'Anonymous',
        eventId: eventId,
        recipientId: recipientId,
        isTyping: false,
        timestamp: serverTimestamp(),
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !eventId || !recipientId) {
      return;
    }

// Stop typing indicator
if (typingTimeout) {
  clearTimeout(typingTimeout);
}
const typingId = `${eventId}_${recipientId}`;
supabase.from('typing_indicators').upsert({
  id: typingId,
  user_id: user.id,
  user_name: user.name || user.email?.split('@')[0] || 'Anonymous',
  event_id: eventId,
  is_typing: false,
  updated_at: new Date().toISOString(),
});

setSending(true);
try {
  const messageData: any = {
    text: newMessage.trim(),
    user_id: user.id,
    user_name: user.name || user.email?.split('@')[0] || 'Anonymous',
    user_photo_url: user.photoURL || null,
    recipient_id: recipientId,
    event_id: eventId,
    participants: [user.id, recipientId],
    status: 'sent',
    reactions: [],
  };

  if (replyingTo) {
    messageData.reply_to = replyingTo;
  }

  const { error } = await supabase.from('private_messages').insert(messageData);
  if (error) throw error;

  setNewMessage('');
  setReplyingTo(null);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReply = (messageId: string, messageText: string, userName: string) => {
    setReplyingTo({ id: messageId, text: messageText, userName });
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: PrivateMessage }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <ChatMessage
        message={{
          id: item.id,
          text: item.text,
          userId: item.senderId,
          userName: item.senderName,
          userPhotoURL: item.senderPhotoURL,
          timestamp: item.timestamp,
          eventId: item.eventId,
          replyTo: item.replyTo,
          reactions: item.reactions,
          deleted: item.deleted,
          status: item.status || (isOwnMessage ? 'sent' : 'delivered'),
        }}
        isOwnMessage={isOwnMessage}
        currentUserId={user?.id || ''}
        onReply={handleReply}
        collectionName="privateMessages"
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('EventDetail', { eventId: route?.params?.eventId })}
          >
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.recipientInfo}>
              <Avatar.Image
                size={40}
                source={recipientPhotoURL ? { uri: recipientPhotoURL } : undefined}
                style={styles.recipientAvatar}
              />
              <View style={styles.recipientDetails}>
                <Text style={styles.recipientName}>{recipientName}</Text>
                <Text style={styles.recipientStatus}>
                  {recipientTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={24} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => {
                Alert.alert('Chat Info', `Private conversation with ${recipientName}`);
              }}
            >
              <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text) {
                  setFilteredMessages(messages.filter(msg => 
                    msg.text.toLowerCase().includes(text.toLowerCase())
                  ));
                } else {
                  setFilteredMessages([]);
                }
              }}
              placeholder="Search messages..."
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setFilteredMessages([]);
              }}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Messages List */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={searchQuery ? filteredMessages : messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={60} color="#6366f1" />
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyDescription}>
              Send a message to {recipientName} to begin your private chat
            </Text>
          </View>
        }
        ListFooterComponent={
          recipientTyping ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.typingText}>{recipientName} is typing...</Text>
            </View>
          ) : null
        }
        />
      </KeyboardAvoidingView>

      {/* Modern Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <View style={styles.replyPreviewLine} />
              <View style={styles.replyPreviewText}>
                <Text style={styles.replyPreviewName}>{replyingTo.userName}</Text>
                <Text style={styles.replyPreviewMessage} numberOfLines={1}>{replyingTo.text}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.replyPreviewClose}
              onPress={() => setReplyingTo(null)}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputWrapper}>
          <View style={styles.inputField}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={handleTyping}
              placeholder={`Message ${recipientName}...`}
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1000}
              textAlignVertical="center"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientAvatar: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  recipientStatus: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAvatar: {
    backgroundColor: '#8b5cf6',
    marginRight: 12,
  },
  navTitleText: {
    alignItems: 'center',
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navSubtitle: {
    color: '#cccccc',
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
  messageContent: {
    maxWidth: width * 0.7,
  },
  senderName: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#ffffff',
  },
  otherText: {
    color: '#1e293b',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#9ca3af',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#9ca3af',
    textAlign: 'left',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#f8fafc',
  },
  emptyTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 16,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    color: '#1e293b',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bottomNavItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  bottomNavLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavItem: {
    backgroundColor: '#f0f4ff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  typingText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  replyPreviewContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyPreviewLine: {
    width: 3,
    height: 40,
    backgroundColor: '#6366f1',
    borderRadius: 2,
    marginRight: 12,
  },
  replyPreviewText: {
    flex: 1,
  },
  replyPreviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 2,
  },
  replyPreviewMessage: {
    fontSize: 12,
    color: '#64748b',
  },
  replyPreviewClose: {
    padding: 4,
    marginLeft: 8,
  },
});

