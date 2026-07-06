import React from 'react'
// import PropTypes from 'prop-types';

import { APP_NAME } from '../functions/constants'; 

const Layout = ({ children, heading }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800 px-2.5">
        <div className="md:max-w-md w-full space-y-8 p-2 sm:p-8 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm py-20 fade-in">
            <div className="text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text 
                    text-transparent mb-2">
                    {APP_NAME}
                </h1>
                <p className="text-purple-900">
                    {heading}
                </p>
            </div>

            {children}
        </div>
    </div>
  )
}

// Layout.propTypes = {
//     heading: PropTypes.string
// }

export default Layout
