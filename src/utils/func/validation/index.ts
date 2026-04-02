import { userRole } from '../../../constants/index.js';
import { ValidationError } from '../../errors/index.js';

// Validate registration data for users and sellers
export const registerValidation = (data: any) => {
  const { name, email, password, phoneNumber, country, role } = data;

  if (
    !role ||
    (role !== userRole.CUSTOMER && role !== userRole.SELLER)
  ) {
    throw new ValidationError('Invalid user type!');
  }

  if (
    !name ||
    !email ||
    !password ||
    (role === userRole.SELLER && (!phoneNumber || !country))
  ) {
    throw new ValidationError('Missing required fields!');
  }

  const regx = /^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gim;
  if (!regx.test(email)) {
    throw new ValidationError('Invalid email format!');
  }
};
