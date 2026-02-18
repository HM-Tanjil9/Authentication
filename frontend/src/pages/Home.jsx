import React from 'react'
import { AppData } from '../context/AppContext.jsx';

function Home() {
  const { logout } = AppData();
  return (
    <div className='flex justify-center items-center min-h-screen flex-col gap-4'>
      <button className='bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors cursor-pointer' onClick={logout}>Logout</button>
    </div>
  )
}

export default Home