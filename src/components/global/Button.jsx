// Author  : Adriana Anggita Daeli, Daniel Salim
// Version : 1.0.0 (20 September 2023)
// Description : Button component for User Management, this component is used to create button with customized class, click handler, and label

const Button = ({ label, clickHandler, className, disabled }) => {
    return (
        <button
            className={`text-white ${className}`}
            type="button"
            onClick={clickHandler}
            disabled={disabled}
        >
            {label}
        </button>
    );
};

export default Button;
