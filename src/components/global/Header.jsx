// Author  : Daniel Salim
// Version : 1.0.0 (19 Oktober 2023)
// Description : this component is used as header for common tools

import { FaTimes } from "react-icons/fa";

const Header = ({ clickHandler }) => {
    return (
        <div className="flex justify-between items-center text-white bg-primary-container rounded-t-lg px-2 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12" viewBox="0 0 14 12" fill="none">
                <path d="M12.3333 1.50001H10.8333V1.16667H12.3333C12.7905 1.16667 13.1667 1.54281 13.1667 2.00001V2.83334H12.8333V2.00001V1.50001H12.3333ZM1.66666 1.50001H1.16666V2.00001V2.83334H0.833328V2.00001C0.833328 1.54281 1.20947 1.16667 1.66666 1.16667H3.16666V1.50001H1.66666ZM12.3333 10.5H12.8333V10V9.16667H13.1667V10C13.1667 10.4572 12.7905 10.8333 12.3333 10.8333H10.8333V10.5H12.3333ZM1.16666 10V10.5H1.66666H3.16666V10.8333H1.66666C1.20947 10.8333 0.833328 10.4572 0.833328 10V9.16667H1.16666V10ZM10.1667 4.66667V4.16667H9.66666H4.33333H3.83333V4.66667V7.33334V7.83334H4.33333H9.66666H10.1667V7.33334V4.66667ZM3.49999 8.16667V3.83334H10.5V8.16667H3.49999Z" fill="white" stroke="white" />
            </svg>
            <span className="font-bold">RAC</span>
            <FaTimes className="cursor-pointer hover:text-secondary-hover" onClick={clickHandler} />
        </div>
    );
};

export default Header;
