import { useState, useEffect } from 'react';
import { lastArrayElement, makeLabelTextId } from '../utils/functions';
import { enabledColor, disabledColor } from "../utils/constants";

const Text = ({ Icon, label, type, placeholder, text, setText, checkBoxChecked = false,
    setCheckBoxChecked, checkBoxDisabled = false, required = true, errors }) => {

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
            <div className='flex items-center justify-between'>
                <label
                    htmlFor={fieldId}
                    className="block self-start text-sm font-medium text-purple-900"
                >
                    {label} {required && <span className='text-red-600'>*</span>}
                </label>
                <div>
                    <span className={`text-[10px] ${checkboxLabelColor}`}>Display on Profile</span>
                    <input type="checkbox" checked={checkBoxChecked} onChange={e => setCheckBoxChecked(e.target.checked)}
                        disabled={checkBoxDisabled} className="toggle toggle-xs" />
                </div>
            </div>
            <div className='mb-1.5'>
                <label className="input">
                    <Icon className="h-[1em] opacity-50" />
                    <input id={fieldId} type={type} placeholder={placeholder} className="w-58 sm:w-72"
                        value={text} onChange={(e) => setText(e.target.value)} required={required} />
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

export default Text;
