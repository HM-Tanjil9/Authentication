import React, {useEffect, useState, useRef} from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom';
import { server } from '../main.jsx';
import axios from 'axios';
import Loading from '../Loading';

function Verify() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const params = useParams();
  const navigate = useNavigate();
  
  // Use refs to store timer IDs for cleanup
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  async function verifyUser() {
    try {
      const {data} = await axios.post(`${server}/api/v1/verify/${params.token}`);
      setSuccessMessage(data.message);
      
      // Only start redirect process on SUCCESS
      setRedirecting(true);
      
      // Start countdown
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      
      // Redirect after 3 seconds (only for success)
      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.log("error", error);
      setErrorMessage(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    verifyUser();
    
    // Cleanup function - this is what React expects
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      {
        loading ? <Loading/> : (
          <div className='min-h-screen flex items-center justify-center'>
            <div className='text-center bg-gray-100/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 md:p-10'>
              {/* Success Message with Redirect */}
              {successMessage && (
                <>
                  <p className='text-2xl font-bold text-green-500 mb-4'>{successMessage}</p>
                  {redirecting && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600 text-lg">
                        Redirecting to login in <span className="font-bold text-green-600">{countdown}</span> seconds...
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {/* Error Message - NO Redirect, just error message with Link */}
              {errorMessage && (
                <>
                  <p className='text-2xl font-bold text-red-500 mb-4'>{errorMessage}</p>
                  <Link 
                    to="/"
                    className="inline-block mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Go to Homepage
                  </Link>
                </>
              )}
            </div>
          </div>
        ) 
      }
    </>
  )
}

export default Verify;