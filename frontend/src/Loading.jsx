import React from 'react'

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="three-body">
          <div className="three-body__dot" />
          <div className="three-body__dot" />
          <div className="three-body__dot" />
      </div>
    </div>
  )
}

export default Loading;