import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const RegisterScreen = ({ navigation }) => {
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState('student');
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
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  React.useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/teachers/subjects/all');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
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

  const handleRegister = async () => {
    if (!first_name || !last_name || !login || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (role === 'student' && !age) {
      Alert.alert('Error', 'Age is required for students');
      return;
    }

    if (role === 'teacher' && selectedSubjects.length === 0) {
      Alert.alert('Error', 'Teachers must select at least one subject');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('first_name', first_name);
    formData.append('last_name', last_name);
    formData.append('login', login);
    formData.append('password', password);
    formData.append('role', role);
    formData.append('bio', bio);
    
    if (role === 'student') {
      formData.append('age', age);
    }
    
    if (city) {
      formData.append('city', city);
    }
    
    if (role === 'teacher') {
      selectedSubjects.forEach((subjectId) => {
        formData.append('subjects[]', subjectId.toString());
      });
      
      if (experience) {
        formData.append('experience', experience);
      }
      if (education) {
        formData.append('education', education);
      }
      if (specialization) {
        formData.append('specialization', specialization);
      }
      if (price_per_lesson) {
        formData.append('price_per_lesson', price_per_lesson);
      }
      formData.append('online_offline_format', online_offline_format);
    }

    if (avatar) {
      formData.append('avatar', {
        uri: avatar.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
    }

    const result = await register(formData);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {avatar ? (
          <Image source={{ uri: avatar.uri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="First Name *"
        value={first_name}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name *"
        value={last_name}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Login *"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
      />

      <View style={styles.roleContainer}>
        <Text style={styles.label}>Role *</Text>
        <View style={styles.roleButtons}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === 'student' && styles.roleButtonActive,
            ]}
            onPress={() => setRole('student')}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === 'student' && styles.roleButtonTextActive,
              ]}
            >
              Student
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === 'teacher' && styles.roleButtonActive,
            ]}
            onPress={() => setRole('teacher')}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === 'teacher' && styles.roleButtonTextActive,
              ]}
            >
              Teacher
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />

      {role === 'student' && (
        <TextInput
          style={styles.input}
          placeholder="Age *"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      )}

      {role === 'teacher' && (
        <>
          <View style={styles.subjectsContainer}>
            <Text style={styles.label}>Subjects *</Text>
            <View style={styles.subjectsGrid}>
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

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Experience (e.g., 5 years teaching Math)"
            value={experience}
            onChangeText={setExperience}
            multiline
            numberOfLines={2}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Education (e.g., Master's in Mathematics)"
            value={education}
            onChangeText={setEducation}
            multiline
            numberOfLines={2}
          />

          <TextInput
            style={styles.input}
            placeholder="Specialization"
            value={specialization}
            onChangeText={setSpecialization}
          />

          <TextInput
            style={styles.input}
            placeholder="Price per lesson ($)"
            value={price_per_lesson}
            onChangeText={setPricePerLesson}
            keyboardType="numeric"
          />

          <View style={styles.formatContainer}>
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
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
    color: '#333',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
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
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#666',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  subjectsContainer: {
    marginBottom: 20,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subjectChip: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
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
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  formatContainer: {
    marginBottom: 20,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  formatButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
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
});

export default RegisterScreen;

