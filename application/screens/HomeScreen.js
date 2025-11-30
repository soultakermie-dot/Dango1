import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [popularSubjects, setPopularSubjects] = useState([]);
  const [recommendedTeachers, setRecommendedTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopularSubjects();
    loadRecommendedTeachers();
  }, []);

  const loadPopularSubjects = async () => {
    try {
      const response = await api.get('/teachers/subjects/all');
      setPopularSubjects(response.data.slice(0, 4)); // Show first 4 subjects
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadRecommendedTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teachers?limit=6');
      setRecommendedTeachers(response.data.slice(0, 6)); // Show first 6 teachers
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { initialQuery: searchQuery });
    } else {
      navigation.navigate('Search');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find Your Perfect Teacher</Text>
        <Text style={styles.heroDescription}>
          Connect with experienced teachers and enhance your learning journey. 
          Search by subject, location, or teaching style.
        </Text>
      </View>

      {!user && (
        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject or teacher name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Subjects</Text>
        <View style={styles.subjectsContainer}>
          {popularSubjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={styles.subjectChip}
              onPress={() => navigation.navigate('Search', { subject: subject.id })}
            >
              <Text style={styles.subjectChipText}>{subject.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Teachers</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : (
          <View style={styles.teachersContainer}>
            {recommendedTeachers.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                style={styles.teacherCard}
                onPress={() => navigation.navigate('TeacherDetails', { teacherId: teacher.id })}
              >
                <Text style={styles.teacherName}>
                  {teacher.first_name || teacher.name}
                </Text>
                <Text style={styles.teacherSubjects}>
                  {teacher.subjects?.map(s => s.name).join(', ') || 'No subjects'}
                </Text>
                {teacher.rating > 0 && (
                  <Text style={styles.teacherRating}>
                    ⭐ {teacher.rating.toFixed(1)} ({teacher.review_count} reviews)
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  hero: {
    backgroundColor: '#007AFF',
    padding: 30,
    paddingTop: 50,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  heroDescription: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  authButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  loginButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subjectChipText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
  teachersContainer: {
    gap: 10,
  },
  teacherCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  teacherSubjects: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  teacherRating: {
    fontSize: 14,
    color: '#007AFF',
  },
  loader: {
    padding: 40,
  },
});

export default HomeScreen;
