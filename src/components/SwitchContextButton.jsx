import { useNavigate } from "react-router";

const SwitchContextButton = ({ route, children }) => {
    const navigate = useNavigate();

    return (
        <div className="text-center">
            <button
                onClick={() => navigate(route)}
                className="text-purple-600 hover:text-pink-600 cursor-pointer text-sm"
            >
                <span className="fade-in">{children}</span>
            </button>
        </div>
    )
}

export default SwitchContextButton;
