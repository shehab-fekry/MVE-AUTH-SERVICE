import { customers, sellers } from '@prisma/client';

type ICustomers = customers;

type IRestCustomers = Omit<
  customers,
  'password' | 'createdAt' | 'updatedAt'
>;

type ISellers = sellers;

type IRestSellers = Omit<
  sellers,
  'password' | 'createdAt' | 'updatedAt' | 'stripId'
>;
