import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import api from '../config/api';

const SearchScreen = ({ route, navigation }) => {
  const { initialQuery, subject } = route.params || {};
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [selectedSubject, setSelectedSubject] = useState(subject || null);
  const [selectedCity, setSelectedCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlineOffline, setOnlineOffline] = useState('');
  const [availableDay, setAvailableDay] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

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
    loadSubjects();
    loadTeachers();
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [searchQuery, selectedSubject, selectedCity, minPrice, maxPrice, onlineOffline, availableDay]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/teachers/subjects/all');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedCity) params.city = selectedCity;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (onlineOffline) params.online_offline_format = onlineOffline;
      if (availableDay !== null) params.available_day = availableDay;

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/teachers?${queryString}`);
      setTeachers(response.data);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedSubject(null);
    setSelectedCity('');
    setMinPrice('');
    setMaxPrice('');
    setOnlineOffline('');
    setAvailableDay(null);
  };

  const renderTeacher = ({ item }) => (
    <TouchableOpacity
      style={styles.teacherCard}
      onPress={() => navigation.navigate('TeacherDetails', { teacherId: item.id })}
    >
      {item.avatar ? (
        <Image
          source={{ uri: `http://localhost:3000/avatars/${item.avatar}` }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {(item.first_name || item.name || 'T').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>
          {item.first_name && item.last_name 
            ? `${item.first_name} ${item.last_name}` 
            : item.name}
        </Text>
        <View style={styles.subjectsContainer}>
          {item.subjects?.slice(0, 3).map((subject) => (
            <View key={subject.id} style={styles.subjectTag}>
              <Text style={styles.subjectTagText}>{subject.name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.teacherMeta}>
          {item.price_per_lesson && (
            <Text style={styles.price}>${item.price_per_lesson}/lesson</Text>
          )}
          {item.rating > 0 && (
            <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
          )}
        </View>
        {item.city && (
          <Text style={styles.city}>📍 {item.city}</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => navigation.navigate('TeacherDetails', { teacherId: item.id })}
      >
        <Text style={styles.viewButtonText}>View Profile</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject or name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filtersContent}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.filterChip, !selectedSubject && styles.filterChipActive]}
                    onPress={() => setSelectedSubject(null)}
                  >
                    <Text style={[styles.filterChipText, !selectedSubject && styles.filterChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {subjects.map((subj) => (
                    <TouchableOpacity
                      key={subj.id}
                      style={[styles.filterChip, selectedSubject === subj.id && styles.filterChipActive]}
                      onPress={() => setSelectedSubject(selectedSubject === subj.id ? null : subj.id)}
                    >
                      <Text style={[styles.filterChipText, selectedSubject === subj.id && styles.filterChipTextActive]}>
                        {subj.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>City</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Enter city"
                  value={selectedCity}
                  onChangeText={setSelectedCity}
                />
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Price Range</Text>
                <View style={styles.priceInputs}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                  />
                  <Text style={styles.priceSeparator}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Format</Text>
                <View style={styles.formatButtons}>
                  <TouchableOpacity
                    style={[styles.formatButton, onlineOffline === '' && styles.formatButtonActive]}
                    onPress={() => setOnlineOffline('')}
                  >
                    <Text style={[styles.formatButtonText, onlineOffline === '' && styles.formatButtonTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatButton, onlineOffline === 'online' && styles.formatButtonActive]}
                    onPress={() => setOnlineOffline(onlineOffline === 'online' ? '' : 'online')}
                  >
                    <Text style={[styles.formatButtonText, onlineOffline === 'online' && styles.formatButtonTextActive]}>
                      Online
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatButton, onlineOffline === 'offline' && styles.formatButtonActive]}
                    onPress={() => setOnlineOffline(onlineOffline === 'offline' ? '' : 'offline')}
                  >
                    <Text style={[styles.formatButtonText, onlineOffline === 'offline' && styles.formatButtonTextActive]}>
                      Offline
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Available Day of Week</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
                  <TouchableOpacity
                    style={[styles.dayChip, availableDay === null && styles.dayChipActive]}
                    onPress={() => setAvailableDay(null)}
                  >
                    <Text style={[styles.dayChipText, availableDay === null && styles.dayChipTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {daysOfWeek.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[styles.dayChip, availableDay === day.value && styles.dayChipActive]}
                      onPress={() => setAvailableDay(availableDay === day.value ? null : day.value)}
                    >
                      <Text style={[styles.dayChipText, availableDay === day.value && styles.dayChipTextActive]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={teachers}
          renderItem={renderTeacher}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No teachers found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  filtersContent: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
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
  filterInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 18,
    color: '#666',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  formatButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  formatButtonActive: {
    backgroundColor: '#007AFF',
  },
  formatButtonText: {
    fontSize: 14,
    color: '#666',
  },
  formatButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  clearButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  subjectTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  subjectTagText: {
    fontSize: 12,
    color: '#1976d2',
  },
  teacherMeta: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  city: {
    fontSize: 12,
    color: '#999',
  },
  viewButton: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  viewButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  daysScrollView: {
    marginTop: 10,
  },
  dayChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  dayChipActive: {
    backgroundColor: '#007AFF',
  },
  dayChipText: {
    fontSize: 14,
    color: '#666',
  },
  dayChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SearchScreen;

