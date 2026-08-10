import axios from 'axios'

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_MSBD_API_URL as string | undefined) || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

export default api
