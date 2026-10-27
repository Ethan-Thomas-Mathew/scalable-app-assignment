import axios from 'axios';
import Cookies from 'js-cookie';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// GitHub Pages demo build (NEXT_PUBLIC_DEMO=true): answer requests in the browser
// instead of calling the Express server. Normal builds never include this branch.
if (process.env.NEXT_PUBLIC_DEMO === 'true') {
  API.defaults.adapter = require('./demoAdapter').default;
}

API.interceptors.request.use((req) => {
  const token = Cookies.get('token');
  if (token) {
    req.headers['auth-token'] = token;
  }
  return req;
});

export default API;
