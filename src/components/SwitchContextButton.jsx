import { useNavigate } from "react-router";

const SwitchContextButton = ({ route, textColor, textHoverColor, children }) => {
    const navigate = useNavigate();

    return (
        <div className="text-center">
            <button
                onClick={() => navigate(route)}
                className={`${textColor} ${textHoverColor} cursor-pointer text-sm`}
            >
                <span className="fade-in">{children}</span>
            </button>
        </div>
    )
}

export default SwitchContextButton;