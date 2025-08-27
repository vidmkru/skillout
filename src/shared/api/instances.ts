import axios from 'axios'

export const axiosInstance = axios.create({
  // Use relative URLs to work with current domain
  baseURL: '',
  headers: {
    'content-type': 'application/json'
  }
})

axiosInstance.interceptors.request.use((config) => {
  // attach auth token if exists
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    // unify error shape
    const message = error?.response?.data?.message || error.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)
