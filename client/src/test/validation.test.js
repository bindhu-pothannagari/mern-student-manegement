import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateConfirm,
  serverFieldErrors,
} from "../utils/validation";

describe("client validation rules", () => {
  it("validates email addresses", () => {
    expect(validateEmail("")).toBe("Email is required");
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address");
    expect(validateEmail(" asha@example.com ")).toBe("");
  });

  it("validates usernames", () => {
    expect(validateUsername("ab")).toMatch(/3 to 30/);
    expect(validateUsername("bad name!")).toMatch(/letters, numbers and underscores/);
    expect(validateUsername("vivek_1")).toBe("");
  });

  it("requires a letter and a number in passwords", () => {
    expect(validatePassword("short1")).toMatch(/8 to 72/);
    expect(validatePassword("onlyletters")).toMatch(/letter and one number/);
    expect(validatePassword("Passw0rd1")).toBe("");
  });

  it("checks password confirmation", () => {
    expect(validateConfirm("Passw0rd1", "")).toBe("Please confirm the password");
    expect(validateConfirm("Passw0rd1", "Different1")).toBe("Passwords do not match");
    expect(validateConfirm("Passw0rd1", "Passw0rd1")).toBe("");
  });

  it("maps server errors onto form fields", () => {
    const fromList = serverFieldErrors({ errors: [{ field: "email", message: "Enter a valid email address" }] });
    expect(fromList).toEqual({ email: "Enter a valid email address" });

    const duplicate = serverFieldErrors({ status: 409, message: "This username is already registered", errors: [] });
    expect(duplicate).toEqual({ username: "This username is already registered" });
  });
});
