import { Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './pages/authPage'
import RoomPage from './pages/Room'
import VideoCall from './pages/VideoCall'

function App() {

  return (
    <>
      <Routes>
        <Route path={`${import.meta.env.BASE_URL}video-call`} element={<VideoCall />} />
        <Route path={`${import.meta.env.BASE_URL}room/:roomId`} element={<RoomPage />} />
        <Route path={`${import.meta.env.BASE_URL}auth`} element={<AuthPage />} />
        <Route path={`${import.meta.env.BASE_URL}`} element={<AuthPage />} />
      </Routes>
    </>
  )
}

export default App
