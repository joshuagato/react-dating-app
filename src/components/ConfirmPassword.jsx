import { KeyRound } from 'lucide-react';
import { lastArrayElement } from '../utils/functions';

const ConfirmPassword = ({ passwordConfirmation, setPasswordConfirmation, isShowPassword, errors, children }) => {
    return (
        <>
            <label
                htmlFor="passwordConfirmation"
                className="block mb-1.5 self-start text-sm font-medium text-purple-900 fade-in"
            >
                {children}
            </label>
            <div className="fade-in">
                <label className="input">
                    <KeyRound className="h-[1em] opacity-50" />
                    <input
                        id="passwordConfirmation"
                        type={isShowPassword ? "text" : "password"}
                        placeholder="Confirm Password" required value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        minLength="8" className="w-60 sm:w-72"
                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Must be 8 characters or more, including number, lowercase letter, uppercase letter"
                    />
                </label>
                {errors.passwordConfirmation && (
                    <div className="text-red-400 text-sm text-left mt-1.5 fade-in">
                        {lastArrayElement(errors.passwordConfirmation)}
                    </div>
                )}
            </div>
        </>
    )
}

export default ConfirmPassword;
