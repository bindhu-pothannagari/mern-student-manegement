import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/students" element={<p>Students page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Login form", () => {
  const login = vi.fn();
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ login });
  });

  it("shows field errors and does not submit when empty", async () => {
    renderAt("/login", <Login />);
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("marks an invalid email field as invalid", async () => {
    renderAt("/login", <Login />);
    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the server error for wrong credentials", async () => {
    login.mockRejectedValue(new Error("Invalid email or password"));
    renderAt("/login", <Login />);
    await userEvent.type(screen.getByLabelText("Email"), "asha@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "WrongPass1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("logs in and goes to the students page", async () => {
    login.mockResolvedValue({ username: "asha" });
    renderAt("/login", <Login />);
    await userEvent.type(screen.getByLabelText("Email"), "asha@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(login).toHaveBeenCalledWith("asha@test.com", "Passw0rd1");
    expect(await screen.findByText("Students page")).toBeInTheDocument();
  });
});

describe("Signup form", () => {
  const register = vi.fn();
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ register });
  });

  async function fill(confirm) {
    await userEvent.type(screen.getByLabelText("Username"), "asha");
    await userEvent.type(screen.getByLabelText("Email"), "asha@test.com");
    await userEvent.type(screen.getByLabelText("Password"), "Passw0rd1");
    await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
  }

  it("rejects mismatched passwords without submitting", async () => {
    renderAt("/signup", <Signup />);
    await fill("Different1");
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows a duplicate email from the server under the email field", async () => {
    register.mockRejectedValue(
      Object.assign(new Error("This email is already registered"), { status: 409, errors: [] })
    );
    renderAt("/signup", <Signup />);
    await fill("Passw0rd1");
    expect(await screen.findByText("This email is already registered")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });
});
