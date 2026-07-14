import { makeLabelTextId } from '../functions/utils';

const InterestedIn = ({ label, setInterestedIn }) => {
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
                    <input className="interested-in-item btn w-24" type="radio" name={fieldId} aria-label="Men" 
                        value={'men'} onChange={e => setInterestedIn(e.target.value)} required />
                    <input className="interested-in-item btn w-24" type="radio" name={fieldId} aria-label="Women" 
                        value={'women'} onChange={e => setInterestedIn(e.target.value)} required />
                    <input className="interested-in-item btn w-24" type="radio" name={fieldId} aria-label="Everyone" 
                        value={'everyone'} onChange={e => setInterestedIn(e.target.value)} required />
                </div>
            </div>
        </>
    );
}

export default InterestedIn;
