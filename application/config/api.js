import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to access host machine's localhost
// Physical Android devices use your computer's local IP (192.168.0.154)
// iOS simulator and web use localhost
const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator - use special IP to access host machine
      return 'http://10.0.2.2:3000/api';
    } else {
      // iOS simulator or web - use localhost
      return 'http://localhost:3000/api';
    }
  }
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('config', config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

