import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "containsPlus", async: false })
export class ContainsPlusValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return typeof value === "string" && value.includes("+");
  }

  defaultMessage(args: ValidationArguments) {
    return `The Countrycode must contain a "+" sign.`;
  }
}
