import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Share } from 'react-native';
import { Text, Avatar, Surface, Menu, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Clipboard } from 'react-native';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

interface ChatMessageProps {
  message: {
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
    reactions?: Reaction[];
    deleted?: boolean;
    imageURL?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    starred?: boolean;
  };
  isOwnMessage: boolean;
  currentUserId: string;
  onReply?: (messageId: string, messageText: string, userName: string) => void;
  collectionName: 'groupMessages' | 'privateMessages';
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function ChatMessage({ message, isOwnMessage, currentUserId, onReply, collectionName }: ChatMessageProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleReaction = async (emoji: string) => {
    try {
      const existingReactions = message.reactions || [];
      const userReaction = existingReactions.find(r => r.userId === currentUserId);

      let newReactions;
      if (userReaction && userReaction.emoji === emoji) {
        // Remove reaction if same emoji
        newReactions = existingReactions.filter(r => !(r.userId === currentUserId && r.emoji === emoji));
      } else {
        // Remove old reaction and add new one
        const filteredReactions = existingReactions.filter(r => r.userId !== currentUserId);
        newReactions = [...filteredReactions, { emoji, userId: currentUserId, userName: 'You' }];
      }

      const { error } = await supabase
        .from(collectionName)
        .update({ reactions: newReactions })
        .eq('id', message.id);

      if (error) throw error;
      setShowReactions(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(collectionName)
                .update({ deleted: true, text: 'This message was deleted' })
                .eq('id', message.id);

              if (error) throw error;
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
    setMenuVisible(false);
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message.id, message.text, message.userName);
    }
    setMenuVisible(false);
  };

  const handleCopy = async () => {
    try {
      Clipboard.setString(message.text);
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy message');
    }
    setMenuVisible(false);
  };

  const handleForward = async () => {
    try {
      await Share.share({
        message: message.text,
        title: `Forwarded message from ${message.userName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setMenuVisible(false);
  };

  const handleStar = async () => {
    try {
      const isStarred = message.starred || false;
      const { error } = await supabase
        .from(collectionName)
        .update({ starred: !isStarred })
        .eq('id', message.id);

      if (error) throw error;
      Alert.alert(isStarred ? 'Unstarred' : 'Starred', isStarred ? 'Message unstarred' : 'Message starred');
    } catch (error) {
      console.error('Error starring message:', error);
    }
    setMenuVisible(false);
  };

  if (message.deleted) {
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <View style={styles.deletedMessage}>
          <Ionicons name="trash-outline" size={14} color="#9ca3af" />
          <Text style={styles.deletedText}>This message was deleted</Text>
        </View>
      </View>
    );
  }

  const reactions = message.reactions || [];
  const reactionGroups: { [key: string]: string[] } = {};
  reactions.forEach(r => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = [];
    }
    reactionGroups[r.emoji].push(r.userName);
  });

  return (
    <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      {!isOwnMessage && (
        <Avatar.Image
          size={36}
          source={message.userPhotoURL ? { uri: message.userPhotoURL } : undefined}
          style={styles.messageAvatar}
        />
      )}
      {isOwnMessage && <View style={styles.avatarSpacer} />}
      <View style={[styles.messageContent, isOwnMessage && styles.ownMessageContent]}>
        {!isOwnMessage && (
          <Text style={styles.userName}>{message.userName}</Text>
        )}
        
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyLine} />
            <View style={styles.replyContent}>
              <Text style={styles.replyName}>{message.replyTo.userName}</Text>
              <Text style={styles.replyText} numberOfLines={1}>{message.replyTo.text}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onLongPress={() => setMenuVisible(true)}
          delayLongPress={300}
        >
          <Surface style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble
          ]} elevation={isOwnMessage ? 2 : 1}>
            {message.imageURL && (
              <View style={styles.imageContainer}>
                {/* Image would be rendered here */}
                <Ionicons name="image" size={40} color="#9ca3af" />
              </View>
            )}
            <View style={styles.messageTextContainer}>
              <Text style={[
                styles.messageText,
                isOwnMessage ? styles.ownText : styles.otherText
              ]}>
                {message.text}
              </Text>
              {isOwnMessage && message.status && (
                <View style={styles.statusContainer}>
                  {message.status === 'sending' && (
                    <ActivityIndicator size={12} color="#ffffff" />
                  )}
                  {message.status === 'sent' && (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  )}
                  {message.status === 'delivered' && (
                    <Ionicons name="checkmark-done" size={14} color="#ffffff" />
                  )}
                  {message.status === 'read' && (
                    <Ionicons name="checkmark-done" size={14} color="#a5b4fc" />
                  )}
                </View>
              )}
            </View>
          </Surface>
        </TouchableOpacity>

        {Object.keys(reactionGroups).length > 0 && (
          <View style={styles.reactionsContainer}>
            {Object.entries(reactionGroups).map(([emoji, users]) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionBadge}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{users.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.reactionButton}
        onPress={() => setShowReactions(!showReactions)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {showReactions && (
        <View style={styles.reactionsPicker}>
          {EMOJI_REACTIONS.map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionOption}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={<View />}
        contentStyle={styles.menuContent}
      >
        <Menu.Item
          onPress={handleReply}
          title="Reply"
          leadingIcon="reply"
        />
        <Menu.Item
          onPress={handleCopy}
          title="Copy"
          leadingIcon="copy"
        />
        <Menu.Item
          onPress={handleForward}
          title="Forward"
          leadingIcon="arrow-forward"
        />
        <Menu.Item
          onPress={handleStar}
          title={message.starred ? "Unstar" : "Star"}
          leadingIcon={message.starred ? "star" : "star-outline"}
        />
        {isOwnMessage && (
          <Menu.Item
            onPress={handleDelete}
            title="Delete"
            leadingIcon="delete"
            titleStyle={styles.deleteMenuText}
          />
        )}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
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
    marginLeft: 8,
  },
  messageContent: {
    maxWidth: width * 0.75,
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  userName: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 4,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  replyLine: {
    width: 3,
    backgroundColor: '#6366f1',
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#64748b',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
  },
  messageTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    width: '100%',
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
  imageContainer: {
    width: 200,
    height: 150,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
    minWidth: 0,
  },
  ownText: {
    color: '#ffffff',
    fontWeight: '400',
  },
  otherText: {
    color: '#1e293b',
    fontWeight: '400',
  },
  statusContainer: {
    marginLeft: 6,
    alignSelf: 'flex-end',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginLeft: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginTop: 4,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    marginLeft: 4,
  },
  ownMessageTime: {
    textAlign: 'right',
    marginLeft: 0,
    marginRight: 4,
  },
  reactionButton: {
    marginLeft: 8,
    padding: 4,
  },
  reactionsPicker: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  reactionOption: {
    padding: 8,
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
  menuContent: {
    backgroundColor: '#ffffff',
  },
  deleteMenuText: {
    color: '#ef4444',
  },
  deletedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  deletedText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginLeft: 6,
  },
});

