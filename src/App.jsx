import { Routes, Route } from "react-router";
import Home from './routes/Home';
import Login from './routes/Login';
import SignUp from './routes/SignUp';
import Verify from './routes/VerifyEmail';
import ResetPassword from './routes/ResetPassword';
import ConfirmPasswordReset from './routes/ConfirmPasswordReset';
import SetNewPassword from './routes/SetNewPassword';
import BasicProfile from './routes/BasicProfile';
import AdvancedProfile from './routes/AdvancedProfile';
import FinalProfile from './routes/FinalProfile';
import Encounters from './routes/Encounters';
import Likes from './routes/Likes';
import Nearby from './routes/Nearby';
import Chats from './routes/Chats';
import Chat from './routes/Chat';
import Profile from './routes/Profile';
import InstallApp from './routes/InstallApp';
import PremiumPackages from './routes/PremiumPackages';
import ProfilePageSetup from './routes/ProfilePageSetup';
import PartnerProfile from './routes/PartnerProfile';
import Others from "./routes/Others";
import ProtectedRoute from "./components/ProtectedRoute"; // 👈 Import Guard Component
import { PWAProvider } from './components/PWAContext';
import { baseURL, userId } from './utils/constants';
import { connectSocket } from './utils/functions';

import './App.css';

function App() {
    connectSocket(baseURL, userId);

    return (
        <PWAProvider>
            <Routes>
                {/* Unprotected / Public Routes (First 6) */}
                <Route path="/" element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="verify-email" element={<Verify />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="confirm-reset-password" element={<ConfirmPasswordReset />} />
                <Route path="install" element={<InstallApp />} />

                {/* Protected Routes (Require Authentication) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="set-new-password" element={<SetNewPassword />} />
                    <Route path="basic-profile" element={<BasicProfile />} />
                    <Route path="advanced-profile" element={<AdvancedProfile />} />
                    <Route path="final-profile" element={<FinalProfile />} />
                    <Route path="profile-page" element={<ProfilePageSetup />} />
                    <Route path="partner-profile" element={<PartnerProfile />} />
                    <Route path="encounters" element={<Encounters />} />
                    <Route path="likes" element={<Likes />} />
                    <Route path="nearby" element={<Nearby />} />
                    <Route path="chats" element={<Chats />} />
                    <Route path="chat" element={<Chat />} />
                    <Route path="profile" element={<Profile />} />

                    <Route path="premium" element={<PremiumPackages />} />
                    <Route path="others" element={<Others />} />
                </Route>
            </Routes>
        </PWAProvider>
    );
}

export default App;