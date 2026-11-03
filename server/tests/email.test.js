import { describe, it, expect, vi } from "vitest";
import { enrollmentConfirmation } from "../services/email/templates/enrollmentConfirmation.js";
import { createEnrollmentNotifier, maskEmail } from "../services/email/enrollmentNotifier.js";

const student = {
  _id: "student-1",
  fullName: "Asha <b>Reddy</b>",
  email: "asha@example.com",
  createdAt: new Date("2026-11-03T10:00:00Z"),
  course: { name: "Bachelor of Computer Applications", code: "BCA", durationMonths: 36 },
};

function setup(overrides = {}) {
  const deps = {
    claim: vi.fn().mockResolvedValue(student),
    markSent: vi.fn().mockResolvedValue(),
    markFailed: vi.fn().mockResolvedValue(),
    send: vi.fn().mockResolvedValue({ messageId: "msg-1", previewUrl: null }),
    log: { info: vi.fn(), error: vi.fn() },
    ...overrides,
  };
  return { deps, notify: createEnrollmentNotifier(deps) };
}

function allLogText(log) {
  return [...log.info.mock.calls, ...log.error.mock.calls].flat().join(" ");
}

describe("enrollment confirmation template", () => {
  it("includes the student name, course name, code and duration", () => {
    const { subject, html, text } = enrollmentConfirmation({
      studentName: "Asha Reddy",
      courseName: "Bachelor of Computer Applications",
      courseCode: "BCA",
      durationMonths: 36,
      enrolledAt: "2026-11-03",
    });
    expect(subject).toBe("Enrollment confirmed: Bachelor of Computer Applications (BCA)");
    expect(html).toContain("Asha Reddy");
    expect(html).toContain("Bachelor of Computer Applications (BCA)");
    expect(html).toContain("3 years");
    expect(text).toContain("Your enrollment in Bachelor of Computer Applications (BCA) is confirmed.");
  });

  it("escapes HTML in user-supplied values", () => {
    const { html } = enrollmentConfirmation({ studentName: "<script>alert(1)</script>", courseName: "BCA" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps line breaks out of the subject", () => {
    const { subject } = enrollmentConfirmation({ studentName: "A", courseName: "BCA\r\nBcc: x@evil.test" });
    expect(subject).not.toMatch(/[\r\n]/);
  });
});

describe("enrollment notifier", () => {
  it("sends one email to the student and marks it sent", async () => {
    const { deps, notify } = setup();
    const result = await notify("student-1");

    expect(result.status).toBe("sent");
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(deps.send.mock.calls[0][0].to).toBe("asha@example.com");
    expect(deps.send.mock.calls[0][0].subject).toContain("BCA");
    expect(deps.markSent).toHaveBeenCalledWith("student-1", "msg-1");
    expect(deps.markFailed).not.toHaveBeenCalled();
  });

  it("does not send when the email was already sent or is in progress", async () => {
    const { deps, notify } = setup({ claim: vi.fn().mockResolvedValue(null) });
    const result = await notify("student-1");

    expect(result.status).toBe("skipped");
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("records a failure without throwing when sending fails", async () => {
    const error = Object.assign(new Error("Connection refused for asha@example.com"), { code: "ECONNREFUSED" });
    const { deps, notify } = setup({ send: vi.fn().mockRejectedValue(error) });

    const result = await notify("student-1");

    expect(result.status).toBe("failed");
    expect(deps.markFailed).toHaveBeenCalledWith("student-1", "ECONNREFUSED");
    expect(deps.markSent).not.toHaveBeenCalled();
  });

  it("still returns failed if recording the failure also fails", async () => {
    const { notify } = setup({
      send: vi.fn().mockRejectedValue(new Error("down")),
      markFailed: vi.fn().mockRejectedValue(new Error("db down")),
    });
    await expect(notify("student-1")).resolves.toEqual({ status: "failed" });
  });

  it("never logs the full email address", async () => {
    const ok = setup();
    await ok.notify("student-1");
    expect(allLogText(ok.deps.log)).not.toContain("asha@example.com");
    expect(allLogText(ok.deps.log)).toContain("a***@example.com");

    const failing = setup({
      send: vi.fn().mockRejectedValue(new Error("Mailbox asha@example.com unavailable")),
    });
    await failing.notify("student-1");
    expect(allLogText(failing.deps.log)).not.toContain("asha@example.com");
  });
});

describe("maskEmail", () => {
  it("hides all but the first character of the local part", () => {
    expect(maskEmail("asha@example.com")).toBe("a***@example.com");
    expect(maskEmail("not-an-email")).toBe("***");
  });
});
