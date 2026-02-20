import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { ToastContainer } from 'react-toastify';
import { AppData } from './context/AppContext.jsx';
import Loading from './Loading.jsx';
import Verify from './pages/Verify.jsx';

function App() {
  const { loading, isAuth } = AppData();

  return (
    <>
      {
        loading ? <Loading /> : (<BrowserRouter>
          <Routes>
            <Route path='/' element={ isAuth ? <Home /> : <Login /> } />
            <Route path='/login' element={isAuth ? <Home /> : <Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/verify-otp' element={isAuth ? <Home /> : <VerifyOtp />} />
            <Route path='/verify/:token' element={isAuth ? <Home /> : <Verify />} />
            <Route path='/dashboard' element={<Dashboard />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>)
      }
    </>
  )
}

export default App
