import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const RequestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => {
      loadRequests();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = selectedStatus !== 'all' ? { status: selectedStatus } : {};
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/requests?${queryString}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    if (user?.role !== 'teacher') {
      return;
    }

    try {
      await api.put(`/requests/${requestId}/status`, { status: newStatus });
      Alert.alert(
        'Success',
        newStatus === 'confirmed'
          ? 'Lesson request confirmed! A chat has been created.'
          : 'Lesson request rejected.'
      );
      loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update request');
    }
  };

  const confirmRequest = (request) => {
    Alert.alert(
      'Confirm Lesson Request',
      `Confirm lesson request from ${request.student_first_name || request.student_name || 'student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => handleStatusChange(request.id, 'confirmed'),
        },
      ]
    );
  };

  const rejectRequest = (request) => {
    Alert.alert(
      'Reject Lesson Request',
      `Reject lesson request from ${request.student_first_name || request.student_name || 'student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => handleStatusChange(request.id, 'rejected'),
        },
      ]
    );
  };

  const openChat = async (request) => {
    if (request.status === 'confirmed') {
      try {
        // Get all chats and find the one with matching lesson_request_id
        const chatsResponse = await api.get('/chats');
        const chat = chatsResponse.data.find(c => c.lesson_request_id === request.id);
        
        if (chat) {
          navigation.navigate('Chat', { chatId: chat.id });
        } else {
          Alert.alert('Info', 'Chat not found. Please check your chats list.');
          navigation.navigate('Chats');
        }
      } catch (error) {
        console.error('Error finding chat:', error);
        navigation.navigate('Chats');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const renderRequest = ({ item }) => {
    const isTeacher = user?.role === 'teacher';
    const otherUser = isTeacher
      ? {
          name: item.student_name,
          first_name: item.student_first_name,
          last_name: item.student_last_name,
          avatar: item.student_avatar,
          age: item.student_age,
        }
      : {
          name: item.teacher_name,
          first_name: item.teacher_first_name,
          last_name: item.teacher_last_name,
          avatar: item.teacher_avatar,
          city: item.teacher_city,
        };

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          {otherUser.avatar ? (
            <Image
              source={{ uri: `http://localhost:3000/avatars/${otherUser.avatar}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(otherUser.first_name || otherUser.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>
              {otherUser.first_name && otherUser.last_name
                ? `${otherUser.first_name} ${otherUser.last_name}`
                : otherUser.name || 'User'}
            </Text>
            {isTeacher && otherUser.age && (
              <Text style={styles.requestMeta}>Age: {otherUser.age}</Text>
            )}
            {!isTeacher && otherUser.city && (
              <Text style={styles.requestMeta}>📍 {otherUser.city}</Text>
            )}
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
          >
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {item.requested_date && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Requested Date:</Text>
            <Text style={styles.dateText}>
              {new Date(item.requested_date).toLocaleDateString()}
              {item.requested_time && ` at ${item.requested_time}`}
            </Text>
          </View>
        )}

        <Text style={styles.requestDate}>
          Sent: {new Date(item.created_at).toLocaleString()}
        </Text>

        {isTeacher && item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => confirmRequest(item)}
            >
              <Text style={styles.actionButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => rejectRequest(item)}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'confirmed' && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => openChat(item)}
          >
            <Text style={styles.chatButtonText}>Open Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === 'all' && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'pending' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('pending')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === 'pending' && styles.filterChipTextActive,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'confirmed' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('confirmed')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === 'confirmed' && styles.filterChipTextActive,
            ]}
          >
            Confirmed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'rejected' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('rejected')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === 'rejected' && styles.filterChipTextActive,
            ]}
          >
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedStatus === 'all'
                ? 'No requests yet'
                : `No ${selectedStatus} requests`}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestMeta: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  messageContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  dateContainer: {
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default RequestsScreen;

