import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [price_per_lesson, setPricePerLesson] = useState('');
  const [online_offline_format, setOnlineOfflineFormat] = useState('both');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [lessonHistory, setLessonHistory] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [timeRange, setTimeRange] = useState('');

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    loadProfile();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (user?.role === 'teacher') {
      loadAvailableDays();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      const profile = response.data;
      
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setLogin(profile.login || '');
      setBio(profile.bio || '');
      setAge(profile.age?.toString() || '');
      setCity(profile.city || '');
      
      if (profile.avatar) {
        setAvatar({ uri: `http://localhost:3000/avatars/${profile.avatar}` });
      }
      
      if (profile.subjects) {
        setSelectedSubjects(profile.subjects.map((s) => s.id));
      }
      
      if (profile.role === 'teacher') {
        setExperience(profile.experience || '');
        setEducation(profile.education || '');
        setSpecialization(profile.specialization || '');
        setPricePerLesson(profile.price_per_lesson?.toString() || '');
        setOnlineOfflineFormat(profile.online_offline_format || 'both');
      }
      
      if (profile.lesson_history) {
        setLessonHistory(profile.lesson_history);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get('/teachers/subjects/all');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadAvailableDays = async () => {
    try {
      const response = await api.get('/availability/me/days');
      setAvailableDays(response.data);
    } catch (error) {
      console.error('Error loading available days:', error);
    }
  };

  const handleSaveAvailableDay = async (dayOfWeek, startTime, endTime) => {
    try {
      await api.post('/availability/days', {
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });
      loadAvailableDays();
      Alert.alert('Success', 'Available day updated');
    } catch (error) {
      console.error('Error saving available day:', error);
      Alert.alert('Error', 'Failed to save available day');
    }
  };

  const handleDeleteAvailableDay = async (id) => {
    try {
      await api.delete(`/availability/days/${id}`);
      loadAvailableDays();
      Alert.alert('Success', 'Available day deleted');
    } catch (error) {
      console.error('Error deleting available day:', error);
      Alert.alert('Error', 'Failed to delete available day');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  const toggleSubject = (subjectId) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const handleSave = async () => {
    if (!first_name || !last_name || !login) {
      Alert.alert('Error', 'First name, last name, and login are required');
      return;
    }

    if (user?.role === 'teacher' && selectedSubjects.length === 0) {
      Alert.alert('Error', 'Teachers must select at least one subject');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('first_name', first_name);
      formData.append('last_name', last_name);
      formData.append('login', login);
      if (password) {
        formData.append('password', password);
      }
      formData.append('bio', bio);
      formData.append('city', city);
      
      if (user?.role === 'student') {
        if (age) {
          formData.append('age', age);
        }
      }
      
      if (user?.role === 'teacher') {
        selectedSubjects.forEach((subjectId) => {
          formData.append('subjects[]', subjectId.toString());
        });
        formData.append('experience', experience);
        formData.append('education', education);
        formData.append('specialization', specialization);
        if (price_per_lesson) {
          formData.append('price_per_lesson', price_per_lesson);
        }
        formData.append('online_offline_format', online_offline_format);
      }

      if (avatar && avatar.uri && !avatar.uri.includes('http://localhost:3000')) {
        formData.append('avatar', {
          uri: avatar.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });
      }

      await api.put('/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Profile updated successfully');
      setPassword('');
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {avatar ? (
            <Image source={avatar} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(first_name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={first_name}
          onChangeText={setFirstName}
          placeholder="First Name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={last_name}
          onChangeText={setLastName}
          placeholder="Last Name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Login *</Text>
        <TextInput
          style={styles.input}
          value={login}
          onChangeText={setLogin}
          placeholder="Login"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />
      </View>

      {user?.role === 'student' && (
        <View style={styles.section}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Age"
            keyboardType="numeric"
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Password (leave empty to keep current)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          secureTextEntry
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Bio"
          multiline
          numberOfLines={4}
        />
      </View>

      {user?.role === 'teacher' && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Subjects *</Text>
            <View style={styles.subjectsContainer}>
              {subjects.map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectChip,
                    selectedSubjects.includes(subject.id) &&
                      styles.subjectChipActive,
                  ]}
                  onPress={() => toggleSubject(subject.id)}
                >
                  <Text
                    style={[
                      styles.subjectChipText,
                      selectedSubjects.includes(subject.id) &&
                        styles.subjectChipTextActive,
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Experience</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={experience}
              onChangeText={setExperience}
              placeholder="Experience"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Education</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={education}
              onChangeText={setEducation}
              placeholder="Education"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Specialization</Text>
            <TextInput
              style={styles.input}
              value={specialization}
              onChangeText={setSpecialization}
              placeholder="Specialization"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Price per Lesson ($)</Text>
            <TextInput
              style={styles.input}
              value={price_per_lesson}
              onChangeText={setPricePerLesson}
              placeholder="Price per lesson"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Teaching Format</Text>
            <View style={styles.formatButtons}>
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  online_offline_format === 'online' && styles.formatButtonActive,
                ]}
                onPress={() => setOnlineOfflineFormat('online')}
              >
                <Text
                  style={[
                    styles.formatButtonText,
                    online_offline_format === 'online' && styles.formatButtonTextActive,
                  ]}
                >
                  Online
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  online_offline_format === 'offline' && styles.formatButtonActive,
                  { marginLeft: 10 },
                ]}
                onPress={() => setOnlineOfflineFormat('offline')}
              >
                <Text
                  style={[
                    styles.formatButtonText,
                    online_offline_format === 'offline' && styles.formatButtonTextActive,
                  ]}
                >
                  Offline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formatButton,
                  online_offline_format === 'both' && styles.formatButtonActive,
                  { marginLeft: 10 },
                ]}
                onPress={() => setOnlineOfflineFormat('both')}
              >
                <Text
                  style={[
                    styles.formatButtonText,
                    online_offline_format === 'both' && styles.formatButtonTextActive,
                  ]}
                >
                  Both
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Weekly Available Days</Text>
            <Text style={styles.sectionDescription}>
              Set your recurring weekly availability. Students can search for teachers available on specific days.
            </Text>
            {daysOfWeek.map((day) => {
              const existingDay = availableDays.find(ad => ad.day_of_week === day.value);
              
              return (
                <View key={day.value} style={styles.availableDayRow}>
                  <View style={styles.availableDayInfo}>
                    <Text style={styles.availableDayLabel}>{day.label}</Text>
                    {existingDay ? (
                      <Text style={styles.availableDayTime}>
                        {existingDay.start_time?.substring(0, 5)} - {existingDay.end_time?.substring(0, 5)}
                      </Text>
                    ) : (
                      <Text style={styles.availableDayTimeUnset}>Not set</Text>
                    )}
                  </View>
                  <View style={styles.availableDayActions}>
                    <TouchableOpacity
                      style={styles.editTimeButton}
                      onPress={() => {
                        setSelectedDay(day);
                        setTimeRange(
                          existingDay 
                            ? `${existingDay.start_time?.substring(0, 5)}-${existingDay.end_time?.substring(0, 5)}`
                            : '09:00-17:00'
                        );
                        setShowTimeModal(true);
                      }}
                    >
                      <Text style={styles.editTimeButtonText}>
                        {existingDay ? 'Edit' : 'Set'}
                      </Text>
                    </TouchableOpacity>
                    {existingDay && (
                      <TouchableOpacity
                        style={[styles.deleteTimeButton, { marginLeft: 10 }]}
                        onPress={() => {
                          Alert.alert(
                            'Delete Available Day',
                            `Remove ${day.label} availability?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => handleDeleteAvailableDay(existingDay.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.deleteTimeButtonText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {lessonHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>Lesson History</Text>
          {lessonHistory.slice(0, 5).map((lesson) => (
            <View key={lesson.id} style={styles.lessonCard}>
              <Text style={styles.lessonTitle}>
                {user?.role === 'student'
                  ? `Teacher: ${lesson.teacher_first_name || lesson.teacher_name || 'Unknown'}`
                  : `Student: ${lesson.student_first_name || lesson.student_name || 'Unknown'}`}
              </Text>
              <Text style={styles.lessonStatus}>Status: {lesson.status}</Text>
              <Text style={styles.lessonDate}>
                {new Date(lesson.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.requestsButton}
        onPress={() => navigation.navigate('Requests')}
      >
        <Text style={styles.requestsButtonText}>
          {user?.role === 'teacher' ? 'View Lesson Requests' : 'My Lesson Requests'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Set {selectedDay?.label} Availability
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter start and end time (HH:MM format){'\n'}Example: 09:00-17:00
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="09:00-17:00"
              value={timeRange}
              onChangeText={setTimeRange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowTimeModal(false);
                  setTimeRange('');
                  setSelectedDay(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton, { marginLeft: 10 }]}
                onPress={() => {
                  if (timeRange && timeRange.includes('-')) {
                    const [startTime, endTime] = timeRange.split('-').map(t => t.trim());
                    if (startTime && endTime) {
                      handleSaveAvailableDay(selectedDay.value, startTime, endTime);
                      setShowTimeModal(false);
                      setTimeRange('');
                      setSelectedDay(null);
                    } else {
                      Alert.alert('Error', 'Please enter time in format: HH:MM-HH:MM');
                    }
                  } else {
                    Alert.alert('Error', 'Please enter time in format: HH:MM-HH:MM');
                  }
                }}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
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
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  subjectChip: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
  },
  subjectChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#666',
  },
  subjectChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  requestsButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    margin: 20,
    marginBottom: 10,
    marginTop: 20,
  },
  requestsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    margin: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    margin: 20,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formatButtons: {
    flexDirection: 'row',
  },
  formatButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  formatButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  formatButtonText: {
    fontSize: 16,
    color: '#666',
  },
  formatButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  lessonCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lessonStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lessonDate: {
    fontSize: 12,
    color: '#999',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    lineHeight: 18,
  },
  availableDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  availableDayInfo: {
    flex: 1,
  },
  availableDayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  availableDayTime: {
    fontSize: 14,
    color: '#007AFF',
  },
  availableDayTimeUnset: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  availableDayActions: {
    flexDirection: 'row',
  },
  editTimeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  editTimeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteTimeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F44336',
    borderRadius: 6,
  },
  deleteTimeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  modalSaveButton: {
    backgroundColor: '#007AFF',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;

