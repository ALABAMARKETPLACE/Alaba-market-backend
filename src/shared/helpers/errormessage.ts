import { HttpException } from "@nestjs/common";
import { ValidationError } from "sequelize";

export const getErrorMessage = (err: any): string => {
  let message = "";
  if (err instanceof HttpException) {
    return err?.message;
  }
  if (Array.isArray(err.errors) == true && err instanceof ValidationError) {
    err.errors.forEach((error) => {
      if (error?.message?.includes("@@")) {
        message = error.message.replace("@@", "");
        return;
      }
      switch (error.validatorKey) {
        case "isEmail":
          message = "Please enter a valid email";
          break;
        case "isDate":
          message = "Please enter a valid date";
          break;
        case "len":
          if (error.validatorArgs[0] === error.validatorArgs[1]) {
            message = "Use " + error.validatorArgs[0] + " characters";
          } else {
            message =
              "Use between " +
              error.validatorArgs[0] +
              " and " +
              error.validatorArgs[1] +
              ` characters for ${error.path}`;
          }
          break;
        case "min":
          message =
            "Use a number greater or equal to " +
            error.validatorArgs[0] +
            ` for ${error.path}`;
          break;
        case "max":
          message =
            "Use a number less or equal to " +
            error.validatorArgs[0] +
            ` for ${error.path}`;
          break;
        case "isInt":
          message = "Please use an integer number";
          break;
        case "is_null":
          message = `Invalid input for '${error.path}', Please try again.`;
          break;
        case "not_unique":
          message = `The ${String(error?.path)
            .toUpperCase()
            ?.replace("_", "")} You've choosed is Already Used(${
            error.value
          }). Please Select another One`;
          break;
        case "notEmpty":
          message = "Invalid " + error.path + ", Please try again.";
          break;
        default:
          message = error.message?.includes("@@")
            ? error.message.replace("@@", "")
            : "Incorrect Data found, please try again.";
          break;
      }
    });
    return message + " ";
  } else if (err?.message && err?.message?.includes("@@")) {
    message = err.message.replace("@@", " ");
    return message;
  } else if (
    err?.message &&
    err?.message?.includes("foreign key") &&
    err?.message?.includes("delete")
  ) {
    message =
      "You cannot delete this record because other data references it. ER3004";
    return message;
  } else if (err?.message && err?.message?.includes("foreign key")) {
    message = "The operation can't be completed. Reason:Reference Error ER3004";
    return message;
  } else if (err?.message && err?.message?.includes("out of range")) {
    message = "Invalid input. Out of range.";
    return message;
  } else if (err?.message && err?.message?.includes("too long")) {
    message = "Value is too long.. Please use a valid input";
    return message;
  } else if (err?.message && err?.message?.includes("invalid input")) {
    const match = err?.message.match(/"([^"]*)"/);
    message = `Invalid Input ${
      match ? `'${match[1]}'` : ``
    }. Please try again.`;
    return message;
  } else if (err.name == "SequelizeHostNotReachableError") {
    message = "Database Connection has been lost. please try later.";
    return message;
  } else if (err.message.includes("Firebase ID token")) {
    message = "UnAuthorized Access";
    return message;
  } else if (err.name == "JsonWebTokenError") {
    return "Unauthorized Action.";
  } else if (err.name == "TokenExpiredError") {
    return "Session token has expired. Please try again.";
  } else {
    return "Something went wrong in our end..";
  }
};
