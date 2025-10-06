const config = {
  baseUrl: (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/',
  backendUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  maxSizeUploadAvatar: 1048576
}
export default config