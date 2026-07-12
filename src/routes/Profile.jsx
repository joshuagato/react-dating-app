import { useState, useEffect } from 'react';
import { Mail, User, User2, UserCircle, User2Icon } from 'lucide-react'; 

import { SET_UP_BASIC_DETAILS } from '../functions/constants';
import Layout from '../components/Layout';
import Text from '../components/Text';
import HelmetHeader from '../components/HelmetHeader';
import Date from '../components/Date';
import Gender from '../components/Gender';
import InterestedIn from '../components/InterestedIn';
import SubmitButton from '../components/SubmitButton';

const Profile = () => {
    // const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [first_name, setFirstName] = useState('');
    const [firstNameCheckBoxChecked, setFirstNameCheckBoxChecked] = useState(true);

    const [last_name, setLastName] = useState('');
    const [lastNameCheckBoxChecked, setLastNameCheckBoxChecked] = useState(false);

    const [other_names, setOtherNames] = useState('');
    const [otherNamesCheckBoxChecked, setOtherNamesCheckBoxChecked] = useState(false);

    const [date, setDate] = useState('');

    const [gender, setGender] = useState('');
    const [genderCheckBoxChecked, setGenderCheckBoxChecked] = useState(false);

    
    useEffect(() => {
        console.log({lastNameCheckBoxChecked})
    }, [lastNameCheckBoxChecked]);

    async function handleProfileSave(event) {
        event.preventDefault();

        // setLoading(true);
        // unsetAllErrors(setError, setErrors);

        try {
            // const response = await verifyEmailHandler({ verification_code, verification_channel });
            // const { success } = response;

            // if (!success) {
                
                
            // }
            
        } catch (error) {
            console.log(error.message);
        } finally {
            // setLoading(false);
        }
    }
  return (
    <Layout heading={SET_UP_BASIC_DETAILS}>
        <HelmetHeader pageTitle={'Profile'} />
        
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

                <Date label={'Date of Birth'} date={date} setDate={setDate} errors={errors} />

                <Gender setCheckBoxChecked={setGenderCheckBoxChecked} checkBoxChecked={genderCheckBoxChecked}
                    label={'Gender'} setGender={setGender}  />

                <InterestedIn label={'Interested In'} />

                <SubmitButton loading={loading}>
                    Save
                </SubmitButton>
            </fieldset>
        </form>
    </Layout>
  )
}

export default Profile;
