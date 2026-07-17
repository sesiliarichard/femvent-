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
import { Text, ActivityIndicator, Avatar, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { checkEventRegistration } from '../services/registration';
import { supabase } from '../services/supabase';
import ChatMessage from '../components/ChatMessage';

const { width } = Dimensions.get('window');

interface GroupMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
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
}

interface GroupChatScreenProps {
  navigation: any;
  route?: {
    params?: {
      eventId?: string;
    };
  };
}

export default function GroupChatScreen({ navigation, route }: GroupChatScreenProps) {
  const { eventId } = route?.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; userName: string } | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<GroupMessage[]>([]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchEventAndCheckRegistration = async () => {
      try {
        if (eventId) {
          // Fetch event data
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

          // Check if user is registered for this event
          if (user?.id) {
            const registered = await checkEventRegistration(eventId, user.id);
            setIsRegistered(registered);
          }
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
        Alert.alert('Error', 'Failed to load event information');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndCheckRegistration();
  }, [eventId, user]);

  useEffect(() => {
    if (isRegistered && eventId && user?.id) {
      const mapMessageRow = (row: any): GroupMessage => ({
        id: row.id,
        text: row.text,
        userId: row.user_id,
        userName: row.user_name,
        userPhotoURL: row.user_photo_url,
        timestamp: row.created_at ? new Date(row.created_at) : new Date(),
        eventId: row.event_id,
        replyTo: row.reply_to,
        reactions: row.reactions || [],
        deleted: row.deleted || false,
        status: row.status || 'sent',
      });

      const loadMessages = async () => {
        try {
          const { data, error } = await supabase
            .from('group_messages')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })
            .limit(200);

          if (error) throw error;

          const messageList = (data || []).map(mapMessageRow);
          setMessages(messageList);
          if (searchQuery) {
            setFilteredMessages(messageList.filter(msg =>
              msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
              msg.userName.toLowerCase().includes(searchQuery.toLowerCase())
            ));
          }

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (error) {
          console.error('Error listening to messages:', error);
        }
      };

      loadMessages();

      // Realtime subscription for new/updated messages
      const messagesChannel = supabase
        .channel(`group-messages-${eventId}-${Date.now()}-${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_messages', filter: `event_id=eq.${eventId}` },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      // Typing indicators
      const loadTypingUsers = async () => {
        try {
          const { data, error } = await supabase
            .from('typing_indicators')
            .select('*')
            .eq('event_id', eventId)
            .eq('is_typing', true);

          if (error) throw error;

          const typing = (data || [])
            .filter((row) => row.user_id !== user.id)
            .map((row) => row.user_name || 'Someone');

          setTypingUsers(typing);
        } catch (error) {
          console.error('Error loading typing indicators:', error);
        }
      };

      loadTypingUsers();

      const typingChannel = supabase
        .channel(`typing-indicators-${eventId}-${Date.now()}-${Math.random()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'typing_indicators', filter: `event_id=eq.${eventId}` },
          () => {
            loadTypingUsers();
          }
        )
        .subscribe();

      // Set user as online
      const onlineId = `${eventId}_${user.id}`;
      supabase.from('online_users').upsert({
        id: onlineId,
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'Anonymous',
        event_id: eventId,
        last_seen: new Date().toISOString(),
        is_online: true,
      });

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
        // Set offline when leaving
        supabase.from('online_users').update({ is_online: false }).eq('id', onlineId);
      };
    }
  }, [isRegistered, eventId, user]);

  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!user?.id || !eventId) return;

    const typingId = `${eventId}_${user.id}`;

    // Update typing indicator
    supabase.from('typing_indicators').upsert({
      id: typingId,
      user_id: user.id,
      user_name: user.name || user.email?.split('@')[0] || 'Anonymous',
      event_id: eventId,
      is_typing: text.length > 0,
      updated_at: new Date().toISOString(),
    });

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set timeout to stop typing indicator
    const timeout = setTimeout(() => {
      supabase.from('typing_indicators').upsert({
        id: typingId,
        user_id: user.id,
        user_name: user.name || user.email?.split('@')[0] || 'Anonymous',
        event_id: eventId,
        is_typing: false,
        updated_at: new Date().toISOString(),
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !eventId || !isRegistered) {
      if (!isRegistered) {
        Alert.alert('Registration Required', 'You must be registered for this event to participate in group discussions.');
      }
      return;
    }

  // Stop typing indicator
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  const typingId = `${eventId}_${user.id}`;
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
      event_id: eventId,
      status: 'sent',
      reactions: [],
    };

    if (replyingTo) {
      messageData.reply_to = replyingTo;
    }

    const { error } = await supabase.from('group_messages').insert(messageData);
    if (error) throw error;

    setNewMessage('');
    setReplyingTo(null);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReply = (messageId: string, messageText: string, userName: string) => {
    setReplyingTo({ id: messageId, text: messageText, userName });
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatDateHeader = (timestamp: Date, prevTimestamp?: Date) => {
    if (!prevTimestamp) return true;
    
    const messageDate = new Date(timestamp);
    const prevDate = new Date(prevTimestamp);
    
    return messageDate.toDateString() !== prevDate.toDateString();
  };

  const renderMessage = ({ item, index }: { item: GroupMessage; index: number }) => {
    const isOwnMessage = item.userId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = formatDateHeader(item.timestamp, prevMessage?.timestamp);
    
    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {new Date(item.timestamp).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        )}
        <ChatMessage
          message={{
            ...item,
            status: item.status || 'sent',
          }}
          isOwnMessage={isOwnMessage}
          currentUserId={user?.id || ''}
          onReply={handleReply}
          collectionName="groupMessages"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading group chat...</Text>
        </View>
      </View>
    );
  }

  if (!isRegistered) {
    return (
      <View style={styles.container}>
        {/* Modern Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Group Discussion</Text>
              <Text style={styles.headerSubtitle}>{event?.title || 'Event Chat'}</Text>
            </View>
            
            <View style={styles.headerAction} />
          </View>
        </View>

        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIcon}>
            <Ionicons name="chatbubbles-outline" size={64} color="#6366f1" />
          </View>
          <Text style={styles.restrictedTitle}>Registration Required</Text>
          <Text style={styles.restrictedDescription}>
            You need to register for this event to participate in group discussions and connect with other attendees.
          </Text>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.registerButtonText}>Go Back to Event</Text>
          </TouchableOpacity>
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Group Discussion</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {event?.title || 'Event Chat'}
            </Text>
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
                Alert.alert(
                  'Group Discussion',
                  'This is a public group chat for all registered attendees. Be respectful and follow community guidelines.',
                  [{ text: 'OK' }]
                );
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
                    msg.text.toLowerCase().includes(text.toLowerCase()) ||
                    msg.userName.toLowerCase().includes(text.toLowerCase())
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
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#6366f1" />
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyDescription}>
              Be the first to share your thoughts with the group!
            </Text>
          </View>
        }
        ListFooterComponent={
          typingUsers.length > 0 ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.typingText}>
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </Text>
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
              placeholder="Type your message..."
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
    color: '#475569',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
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
  avatarSpacer: {
    width: 36,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: width * 0.75,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  userName: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
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
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: '#ffffff',
    fontWeight: '400',
  },
  otherText: {
    color: '#1e293b',
    fontWeight: '400',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  ownMessageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 12,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
    maxHeight: 100,
    marginLeft: 12,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8fafc',
  },
  restrictedIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  restrictedTitle: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  restrictedDescription: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  registerButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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

