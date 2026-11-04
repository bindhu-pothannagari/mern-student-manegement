import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

function renderProtected(auth) {
  vi.mocked(useAuth).mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={["/users"]}>
      <Routes>
        <Route element={<ProtectedRoute permission="users:manage" />}>
          <Route path="/users" element={<p>Users page</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("waits while the session is being checked", () => {
    renderProtected({ user: null, checking: true, can: () => false });
    expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
  });

  it("sends logged-out users to the login page", () => {
    renderProtected({ user: null, checking: false, can: () => false });
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Users page")).not.toBeInTheDocument();
  });

  it("shows Access denied when the role lacks permission", () => {
    renderProtected({ user: { role: "viewer" }, checking: false, can: () => false });
    expect(screen.getByRole("heading", { name: "Access denied" })).toBeInTheDocument();
    expect(screen.queryByText("Users page")).not.toBeInTheDocument();
  });

  it("shows the page when the role has permission", () => {
    renderProtected({ user: { role: "admin" }, checking: false, can: () => true });
    expect(screen.getByText("Users page")).toBeInTheDocument();
  });
});
