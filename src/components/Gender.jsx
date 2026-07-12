import { useState, useEffect } from "react";
import { makeLabelTextId } from "../functions/utils";
import { enabledColor, disabledColor } from "../functions/constants";

const Gender = ({ label, setGender, checkBoxChecked, checkBoxDisabled, setCheckBoxChecked }) => {

    const [checkboxLabelColor, setCheckboxLabelColor] = useState(disabledColor);
    
    const fieldId = makeLabelTextId(label);

    useEffect(() => {
        (() => {
            if (checkBoxDisabled) setCheckboxLabelColor(disabledColor);
            else setCheckboxLabelColor(enabledColor);
        })();
    }, [checkBoxDisabled]);

    return (
    <>
        <div className='mb-1.5'>
            <div className='flex items-center justify-between'>
                <label
                    htmlFor={fieldId}
                    className="block self-start text-sm font-medium text-purple-900"
                >
                    {label} {<span className='text-red-600'>*</span>}
                </label>
                <div>
                    <span className={`text-[10px] ${checkboxLabelColor}`}>Display on Profile</span>
                    <input type="checkbox" checked={checkBoxChecked} onChange={e => setCheckBoxChecked(e.target.checked)} 
                        disabled={checkBoxDisabled} className="toggle toggle-xs" />
                </div>
            </div>
            <div className="gender">
                <input className="gender-item btn w-25" value={'man'} type="radio" name={fieldId} aria-label="Man"
                    onChange={e => setGender(e.target.value)} required />
                <input id={fieldId} className="gender-item btn w-25" value={'woman'} type="radio" name={fieldId} aria-label="Woman"
                    onChange={e => setGender(e.target.value)} required />
            </div>
        </div>
    </>
  )
}

export default Gender;
