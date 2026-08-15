import { CalendarDays } from 'lucide-react';
import { lastArrayElement, makeLabelTextId } from '../utils/functions';

const Date = ({ label, date, setDate, errors }) => {

    const fieldId = makeLabelTextId(label);

    return (
        <>
            <label
                htmlFor={fieldId}
                className="block self-start text-sm font-medium text-purple-900"
            >
                {label} {<span className='text-red-600'>*</span>}
            </label>
            <div className='mb-1.5'>
                <label className="input">
                    <CalendarDays className="h-[1em] opacity-50" />
                    <input id={fieldId} type="date" className="input w-58 sm:w-72" value={date}
                        onChange={e => setDate(e.target.value)} max="2017-12-31" required />
                </label>
                {errors[fieldId] && (
                    <div className="text-red-400 text-sm text-center mt-1.5 fade-in">
                        {lastArrayElement(errors[fieldId])}
                    </div>
                )}
            </div>
        </>
    )
}

export default Date;
