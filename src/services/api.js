import axios from 'axios';

const api = axios.create({
  baseURL: 'https://68b5a555e5dc090291afc730.mockapi.io/api/v1/', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;