import './App.css'
import React, { useState, createContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './components/Home'
import LoginForm from './components/Login/Login'
import RegisterForm from './components/Register/Register'
// import {  } from './contexts/Context'

export const AppContext = createContext()

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    return children
  } else {
    return <Navigate to='/' />
  }
}

function App() {
  const [resultCalculation, setResultCalculation] = useState({
    result: { weekly: '' },
  })

  return (
    <>
      <AppContext.Provider value={{ resultCalculation, setResultCalculation }}>
        <Navbar></Navbar>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<LoginForm />} />
          <Route path='/register' element={<RegisterForm />} />
          {/* <Route path='/details/:id' element={<RegisterForm />} /> */}
          <Route path='/details' element={<PrivateRoute> <p>Hello you are logged in</p> </PrivateRoute>} />
        </Routes>
      </AppContext.Provider>
    </>
  )
}

// 1, check for auth token in state,
// 2, if token is valid return route
// 2, redirect to register form

export default App
