import { ValidationError } from '../errors/index.js';

export const registerValidation = (
  data: any,
  userType: 'user' | 'seller'
) => {
  const { name, email, password, phoneNumber, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === 'seller' && (!phoneNumber || !country))
  ) {
    throw new ValidationError('Missing required fields!');
  }

  const regx = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;
  if (!regx.test(email)) {
    throw new ValidationError('Invalid email format!');
  }
};
