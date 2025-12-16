import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

const phoneNumberRegex = /^[0-9+-]+$/;

@ValidatorConstraint({ name: "isValidPhoneNumber", async: false })
export class IsValidPhoneNumberValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    return (
      typeof value === "string" &&
      value?.length > 7 &&
      phoneNumberRegex.test(value)
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `The Input must be a valid phone number`;
  }
}
