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
import Matcher from './routes/Matcher';
import Likes from './routes/Likes';
import Nearby from './routes/Nearby';
import Chats from './routes/Chats';
import Others from "./routes/Others";

import './App.css';

function App() {

    return (

        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="verify-email" element={<Verify />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="confirm-reset-password" element={<ConfirmPasswordReset />} />
            <Route path="set-new-password" element={<SetNewPassword />} />
            <Route path="basic-profile" element={<BasicProfile />} />
            <Route path="advanced-profile" element={<AdvancedProfile />} />
            <Route path="final-profile" element={<FinalProfile />} />
            <Route path="encounters" element={<Encounters />} />
            <Route path="likes" element={<Likes />} />
            <Route path="nearby" element={<Nearby />} />
            <Route path="chats" element={<Chats />} />
            <Route path="matcher" element={<Matcher />} />
            <Route path="others" element={<Others />} />

            {/* <Route element={<AuthLayout />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                </Route>

                <Route path="concerts">
                    <Route index element={<ConcertsHome />} />
                    <Route path=":city" element={<City />} />
                    <Route path="trending" element={<Trending />} />
                </Route> */}
        </Routes>
    )
}

export default App
