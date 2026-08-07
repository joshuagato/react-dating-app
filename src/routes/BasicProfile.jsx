import { useState } from 'react';
import { User, User2, UserCircle, CircleX, CircleCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

import { SET_UP_BASIC_DETAILS, advancedProfilePath } from '../functions/constants';
import { unsetAllErrors, unsetErrorSetMessage, unsetMessageSetError } from '../functions/utils';
import { setupBasicProfileHandler } from '../tanstack/user';

import Layout from '../components/Layouts/SetupLayout';
import Text from '../components/Text';
import HelmetHeader from '../components/HelmetHeader';
import Date from '../components/Date';
import Gender from '../components/Gender';
import InterestedIn from '../components/InterestedIn';
import SubmitButton from '../components/SubmitButton';

const BasicProfile = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const [first_name, setFirstName] = useState('');
    const [firstNameCheckBoxChecked, setFirstNameCheckBoxChecked] = useState(true);

    const [last_name, setLastName] = useState('');
    const [lastNameCheckBoxChecked, setLastNameCheckBoxChecked] = useState(false);

    const [other_names, setOtherNames] = useState('');
    const [otherNamesCheckBoxChecked, setOtherNamesCheckBoxChecked] = useState(false);

    const [date_of_birth, setDateOfBirth] = useState('');

    const [gender, setGender] = useState('');
    const [genderCheckBoxChecked, setGenderCheckBoxChecked] = useState(false);

    const [interested_in, setInterestedIn] = useState('');

    const navigate = useNavigate();

    async function handleProfileSave(event) {
        event.preventDefault();

        setLoading(true);
        unsetAllErrors(setError, setErrors);

        try {
            const data = {
                first_name, last_name, other_names, date_of_birth, gender, interested_in,
                first_name_on: firstNameCheckBoxChecked, last_name_on: lastNameCheckBoxChecked,
                other_names_on: otherNamesCheckBoxChecked, gender_on: genderCheckBoxChecked
            };

            const response = await setupBasicProfileHandler(data);
            const { success, message } = response;

            if (success) {
                unsetErrorSetMessage(setError, setMessage, message);
                toast.success(message, { autoClose: 5000, theme: 'colored' });
                navigate(advancedProfilePath, { replace: true });
            } else {
                unsetMessageSetError(setMessage, setError, message);
                toast.error(message, { autoClose: 5000, theme: 'colored' });
            }

        } catch (error) {
            toast.error(error.message, { autoClose: 5000, theme: 'colored' });
        } finally {
            setLoading(false);
        }
    }
    return (
        <Layout heading={SET_UP_BASIC_DETAILS}>
            <HelmetHeader pageTitle={'Basic Profile'} />

            <form className="w-full flex flex-col items-center space-y-3" onSubmit={handleProfileSave}>

                <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
                    <legend className="fieldset-legend">Basic Details as they appear on your ID</legend>

                    <Text Icon={UserCircle} label={'First Name'} type={'text'} placeholder={'e.g Kenneth'}
                        text={first_name} setText={setFirstName} errors={errors} checkBoxDisabled={true}
                        setCheckBoxChecked={setFirstNameCheckBoxChecked} checkBoxChecked={firstNameCheckBoxChecked} />

                    <Text Icon={User} label={'Last Name'} type={'text'} placeholder={'e.g Hagin'}
                        text={last_name} setText={setLastName} errors={errors}
                        setCheckBoxChecked={setLastNameCheckBoxChecked} checkBoxChecked={lastNameCheckBoxChecked} />

                    <Text Icon={User2} label={'Other Names'} type={'text'} placeholder={'e.g Erwin'} required={false}
                        text={other_names} setText={setOtherNames} errors={errors} checkBoxDisabled={!other_names}
                        setCheckBoxChecked={setOtherNamesCheckBoxChecked} checkBoxChecked={otherNamesCheckBoxChecked} />

                    <Date label={'Date of Birth'} date={date_of_birth} setDate={setDateOfBirth} errors={errors} />

                    <Gender setCheckBoxChecked={setGenderCheckBoxChecked} checkBoxChecked={genderCheckBoxChecked}
                        label={'Gender'} setGender={setGender} />

                    <InterestedIn label={'Interested In'} setInterestedIn={setInterestedIn} />

                    {error && (
                        <div role="alert" className="alert alert-error fade-in">
                            <CircleX />
                            <span>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div role="alert" className="alert alert-success fade-in">
                            <CircleCheck />
                            <span>{message}</span>
                        </div>
                    )}

                    <SubmitButton loading={loading}>
                        Save
                    </SubmitButton>
                </fieldset>
            </form>
        </Layout>
    )
}

export default BasicProfile;
