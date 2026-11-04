import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import StudentList from "../pages/StudentList";
import { getStudents } from "../api/studentApi";
import { useAuth } from "../context/AuthContext";

vi.mock("../api/studentApi", () => ({ getStudents: vi.fn(), deleteStudent: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../hooks/useCourseOptions", () => ({
  default: () => ({ courses: [{ _id: "c1", name: "BCA" }], error: "" }),
}));

const asha = {
  _id: "s1",
  fullName: "Asha Reddy",
  email: "asha@test.com",
  mobile: "9876543210",
  course: { _id: "c1", code: "BCA" },
};

function setRole(role) {
  const perms = {
    admin: ["students:read", "students:create", "students:update", "students:delete"],
    staff: ["students:read", "students:create", "students:update"],
    viewer: ["students:read"],
  }[role];
  vi.mocked(useAuth).mockReturnValue({
    can: (p) => perms.includes(p),
    canSeeField: (field) => role !== "viewer" || !["mobile", "address"].includes(field),
  });
}

function renderList() {
  return render(
    <MemoryRouter initialEntries={["/students"]}>
      <StudentList />
    </MemoryRouter>
  );
}

describe("StudentList states", () => {
  beforeEach(() => setRole("admin"));

  it("shows a loading message while fetching", () => {
    vi.mocked(getStudents).mockReturnValue(new Promise(() => {}));
    renderList();
    expect(screen.getByText("Loading students...")).toBeInTheDocument();
  });

  it("shows the empty state when there are no students", async () => {
    vi.mocked(getStudents).mockResolvedValue({ data: [], total: 0, totalPages: 1 });
    renderList();
    expect(await screen.findByText("No students yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register the first student" })).toBeInTheDocument();
  });

  it("shows an error with a working Try again button", async () => {
    vi.mocked(getStudents)
      .mockRejectedValueOnce(new Error("Cannot reach the server. Check that the backend is running."))
      .mockResolvedValueOnce({ data: [asha], total: 1, totalPages: 1 });
    renderList();
    expect(await screen.findByText(/Cannot reach the server/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Asha Reddy")).toBeInTheDocument();
  });

  it("shows students with the total and every action for admins", async () => {
    vi.mocked(getStudents).mockResolvedValue({ data: [asha], total: 1, totalPages: 1 });
    renderList();
    expect(await screen.findByText("Asha Reddy")).toBeInTheDocument();
    expect(screen.getByText(/Total students: 1/)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Mobile" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides restricted actions and columns from viewers", async () => {
    setRole("viewer");
    vi.mocked(getStudents).mockResolvedValue({ data: [{ ...asha, mobile: undefined }], total: 1, totalPages: 1 });
    renderList();
    expect(await screen.findByText("Asha Reddy")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Mobile" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add student" })).not.toBeInTheDocument();
  });
});
