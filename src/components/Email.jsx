import { Mail } from 'lucide-react'; 
import { lastArrayElement } from '../functions/utils';

const Email = ({ email, setEmail, errors }) => {
  return (
    <>
        <label
            htmlFor="email"
            className="block mb-1.5 self-start text-sm font-medium text-purple-900"
        >
            Email
        </label>
        <div>
            <label className="input">
                <Mail className="h-[1em] opacity-50" />
                <input id="email" type="email" placeholder="mail@site.com" className="w-60 sm:w-72"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {errors.email && (
            <div className="text-red-400 text-sm text-center mt-1.5 fade-in">
                {lastArrayElement(errors.email)}
            </div>
        )}
        </div>
    </>
  )
}

export default Email;
