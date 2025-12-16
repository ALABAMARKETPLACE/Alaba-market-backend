import { genSalt, hash } from "bcrypt";

export const BcryptProvider: any[] = [
  {
    provide: "hashPassword",
    useFactory: () => async (password: string) => {
      try {
        const salt = await genSalt(10);
        return await hash(password, salt);
      } catch (error) {
        return null;
      }
    },
  },
];
