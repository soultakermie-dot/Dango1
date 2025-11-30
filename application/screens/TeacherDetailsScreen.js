import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const TeacherDetailsScreen = ({ route, navigation }) => {
  const { teacherId } = route.params;
  const { user } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadTeacher();
    loadAvailability();
  }, [teacherId]);

  const loadTeacher = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/teachers/${teacherId}`);
      setTeacher(response.data);
      if (response.data.available_days) {
        setAvailableDays(response.data.available_days);
      }
    } catch (error) {
      console.error('Error loading teacher:', error);
      Alert.alert('Error', 'Failed to load teacher details');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await api.get(`/availability/teacher/${teacherId}`);
      setAvailability(response.data);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const handleRequestLesson = () => {
    if (user?.role !== 'student') {
      Alert.alert('Error', 'Only students can request lessons');
      return;
    }
    setRequestMessage('');
    setShowRequestModal(true);
  };

  const handleSendRequest = async () => {
    try {
      setRequestLoading(true);
      await api.post('/requests', {
        teacher_id: teacherId,
        message: requestMessage || null,
      });
      setShowRequestModal(false);
      setRequestMessage('');
      Alert.alert('Success', 'Lesson request sent! The teacher will be notified.');
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCancelRequest = () => {
    setShowRequestModal(false);
    setRequestMessage('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!teacher) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Teacher not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {teacher.avatar ? (
          <Image
            source={{ uri: `http://localhost:3000/avatars/${teacher.avatar}` }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(teacher.first_name || teacher.name || 'T').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {teacher.first_name && teacher.last_name
            ? `${teacher.first_name} ${teacher.last_name}`
            : teacher.name}
        </Text>
        {teacher.rating > 0 && (
          <Text style={styles.rating}>
            ⭐ {teacher.rating.toFixed(1)} ({teacher.review_count} reviews)
          </Text>
        )}
        {user?.role === 'student' && (
          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestLesson}
            disabled={requestLoading}
          >
            {requestLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.requestButtonText}>Request for Confirmation Lessons</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {teacher.experience && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Experience:</Text>
            <Text style={styles.infoValue}>{teacher.experience}</Text>
          </View>
        )}
        {teacher.education && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Education:</Text>
            <Text style={styles.infoValue}>{teacher.education}</Text>
          </View>
        )}
        {teacher.specialization && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Specialization:</Text>
            <Text style={styles.infoValue}>{teacher.specialization}</Text>
          </View>
        )}
        {teacher.city && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City:</Text>
            <Text style={styles.infoValue}>{teacher.city}</Text>
          </View>
        )}
        {teacher.price_per_lesson && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price per lesson:</Text>
            <Text style={styles.infoValue}>${teacher.price_per_lesson}</Text>
          </View>
        )}
        {teacher.online_offline_format && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Format:</Text>
            <Text style={styles.infoValue}>
              {teacher.online_offline_format === 'both'
                ? 'Online & Offline'
                : teacher.online_offline_format.charAt(0).toUpperCase() +
                  teacher.online_offline_format.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {teacher.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{teacher.bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <View style={styles.subjectsContainer}>
          {teacher.subjects?.map((subject) => (
            <View key={subject.id} style={styles.subjectChip}>
              <Text style={styles.subjectChipText}>{subject.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {availableDays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Available Days</Text>
          {availableDays.map((day) => (
            <View key={day.id} style={styles.availabilitySlot}>
              <Text style={styles.availabilityDate}>{daysOfWeek[day.day_of_week]}</Text>
              <Text style={styles.availabilityTime}>
                {formatTime(day.start_time)} - {formatTime(day.end_time)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {availability.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specific Available Dates & Times</Text>
          {availability
            .filter((slot) => slot.is_available)
            .slice(0, 10)
            .map((slot) => (
              <View key={slot.id} style={styles.availabilitySlot}>
                <Text style={styles.availabilityDate}>{formatDate(slot.date)}</Text>
                <Text style={styles.availabilityTime}>
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </Text>
              </View>
            ))}
        </View>
      )}

      {teacher.reviews && teacher.reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Reviews</Text>
          {teacher.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewStudentName}>
                  {review.student_first_name || review.student_name || 'Anonymous'}
                </Text>
                <Text style={styles.reviewRating}>⭐ {review.rating}/5</Text>
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
              <Text style={styles.reviewDate}>
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelRequest}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Lesson</Text>
            <Text style={styles.modalSubtitle}>Enter a message for the teacher (optional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type your message here..."
              value={requestMessage}
              onChangeText={setRequestMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCancelRequest}
                disabled={requestLoading}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSendButton, { marginLeft: 10 }]}
                onPress={handleSendRequest}
                disabled={requestLoading}
              >
                {requestLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSendButtonText}>Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  rating: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  requestButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subjectChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  subjectChipText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  availabilitySlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  availabilityDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  availabilityTime: {
    fontSize: 14,
    color: '#666',
  },
  reviewCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    fontSize: 14,
    color: '#007AFF',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSendButton: {
    backgroundColor: '#007AFF',
  },
  modalSendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeacherDetailsScreen;
