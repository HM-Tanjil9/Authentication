import React from 'react'
import { AppData } from '../context/AppContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const { logoutUser, user } = AppData();
  const navigate = useNavigate();
  return (
    <div className='flex justify-center items-center min-h-screen flex-col gap-4'>
      
      {
        user && (
          <div className='text-center flex flex-col gap-2 justify-center items-center bg-gray-100 p-6 rounded-md shadow-md'>
            <h2 className='text-xl font-semibold'>Welcome, {user.name}</h2>
            <p className='text-gray-600'>Email: {user.email}</p>
            <p className='text-gray-600'>Role: {user.role}</p>
            {
              user.role === 'admin' && (
                <Link to="/dashboard" className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors cursor-pointer">Dashboard</Link>
              )
            }
          </div>
        )
      }
      <button className='bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors cursor-pointer' onClick={()=>logoutUser(navigate)}>Logout</button>
    </div>
  )
}

export default Home