// import PropTypes from 'prop-types';

import { NavLink } from 'react-router';
import { APP_NAME, homePath } from '../../utils/constants';

const SetupLayout = ({ children, heading }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-200 to-cyan-800 px-4 py-2">
            <div className="md:max-w-md w-full space-y-8 px-4 sm:px-8 py-6 sm:py-20 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm">
                <div className="text-center">
                    <NavLink to={homePath} className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text 
                    text-transparent mb-2">
                        {APP_NAME}
                    </NavLink>
                    <p className="text-purple-900 text-base sm:text-lg">
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

export default SetupLayout;