// Author  : Daniel Salim, Adriana Anggita, Muhammad Rizky Firdaus
// Version : 2.1.0 (6 Oktober 2023)
// Description : This component is used for input

import React from 'react';
import { cn } from '../../../utils/cn';

const Input = ({ id, type = 'text', value, label, changeHandler, placeholder, className, name, onFocus, onBlur }) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={changeHandler}
      placeholder={placeholder}
      name={name}
      onFocus={onFocus} // Menghapus placeholder saat input di-focus
      onBlur={onBlur}
      className={cn('h-12 p-4 text-lg font-normal rounded-md border', className)}
    />
  );
};

export default Input;
