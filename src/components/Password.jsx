import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { lastArrayElement } from '../utils/functions';

const Password = ({ password, setPassword, isShowPassword, setIsShowPassword, errors, children }) => {

    return (
        <>
            <label
                htmlFor="password"
                className="block mb-1.5 self-start text-sm font-medium text-purple-900"
            >
                {children}
            </label>
            <div>
                <div className="flex">
                    <div>
                        <label className="input" htmlFor="password">
                            <KeyRound className="h-[1em] opacity-50" />
                            <input
                                id="password"
                                type={isShowPassword ? "text" : "password"}
                                placeholder="Password" required value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength="8" className="w-44 sm:w-56"
                                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                                title="Must be 8 characters or more, including number, lowercase letter, uppercase letter"
                            />
                        </label>
                    </div>
                    <button type="button" className="btn btn-neutral" onClick={() => setIsShowPassword(prev => !prev)}>
                        {isShowPassword ? <EyeOff /> : <Eye />}
                    </button>
                </div>
                {errors.password && (
                    <div className="text-red-400 text-sm text-center mt-1.5 fade-in">
                        {lastArrayElement(errors.password)}
                    </div>
                )}
            </div>
        </>
    )
}

export default Password;
