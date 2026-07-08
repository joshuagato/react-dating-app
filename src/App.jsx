import { Routes, Route } from "react-router";
import Home from './routes/Home';
import Auth from './routes/Auth';
import Login from './routes/Login';
import SignUp from './routes/SignUp';
import Verify from './routes/VerifyEmail';
import ResetPassword from './routes/ResetPassword';
import Others from "./routes/Others";

import './App.css';

function App() { 

  return (
    
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="auth" element={<Auth />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="verify-email" element={<Verify />} />
        <Route path="reset-password" element={<ResetPassword />} />
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
