import { makeLabelTextId } from '../functions/utils';

const InterestedIn = ({ label }) => {
    const fieldId = makeLabelTextId(label);

    return (
        <>
            <div className='mb-1.5'>
                <label
                    htmlFor={fieldId}
                    className="block self-start text-sm font-medium text-purple-900"
                >
                    { label } {<span className='text-red-600'>*</span>}
                </label>
                <div id={fieldId} className="interested-in">
                    <input className="interested-in-item btn w-24" type="radio" name={fieldId} aria-label="Men" required />
                    <input className="interested-in-item btn w-24" type="radio" name={fieldId} aria-label="Women" required />
                    <input className="interested-in-item btn w-24" type="radio" name={fieldId} aria-label="Everyone" required />
                </div>
            </div>
        </>
    );
}

export default InterestedIn;
