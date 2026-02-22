import React, {useState} from 'react'
import { Link } from 'react-router-dom';
import axios from 'axios';
import { server } from '../main.jsx';
import { toast } from 'react-toastify';

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const {data} = await axios.post(`${server}/api/v1/register`, {
                name,
                email,
                password
            });
            toast.success(data.message);
            setName("");
            setEmail("");
            setPassword("");
        } catch (error) {
            toast.error(error.response.data.message);
            console.log(error);
        } finally {
            setLoading(false);
        }
        
    }

  return (
    <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
            <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
                <h1 className="title-font font-medium text-3xl text-gray-900"> <span>🔐</span> Enterprise-Grade Authentication System</h1>
                <p className="leading-relaxed mt-4">Experience the power of our secure and scalable authentication system, designed to protect your applications and user data with ease.</p>
            </div>
            <form onSubmit={submitHandler} className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0">
            <h2 className="text-gray-900 text-lg font-medium title-font mb-5">Sign Up</h2>
            <div className="relative mb-4">
                <label htmlFor="name" className="leading-7 text-sm text-gray-600">Name</label>
                <input type="text" value={name} required onChange={(e) => setName(e.target.value)} id="name" name="name" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"/>
            </div>
            <div className="relative mb-4">
                <label htmlFor="email" className="leading-7 text-sm text-gray-600">Email</label>
                <input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} id="email" name="email" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"/>
            </div>
            <div className="relative mb-4">
                <label htmlFor="password" className="leading-7 text-sm text-gray-600">Password</label>
                <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} id="password" name="password" className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"/>
            </div>
            <button className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg" disabled={loading}>{loading ? "Loading..." : "Submit"}</button>
            <p className="text-xs text-gray-500 mt-3">Already have an account? <Link to="/login" className='text-indigo-500 hover:text-indigo-700'> Login</Link></p>
            </form>
        </div>
    </section>
  )
}

export default Register;