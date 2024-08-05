import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from './App.jsx'
import './index.css'
import { SocketContextProvider } from './hookcontext/SocketContext.jsx'
import { PeerContextProvider } from './hookcontext/PeerContext.jsx'
import { Router } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter >
      <SocketContextProvider>
        <PeerContextProvider>
          <App />
        </PeerContextProvider>
      </SocketContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
