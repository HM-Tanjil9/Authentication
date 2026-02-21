
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import api from '../apiIntercepter.js';

function Dashboard() {
  const [content, setContent] = useState("");
  async function fetchAdminData() {
    try {
      const {data} = await api.get(`/api/v1/admin`);
      setContent(data?.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch admin data");
    }
  }

  useEffect( () => {
    fetchAdminData();
  }, []);

  return (
    <>
      {
        content && (
          <div className="p-4">{content}</div>
        )
      }
    </>
  )
}

export default Dashboard