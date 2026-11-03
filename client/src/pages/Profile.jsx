import { useState } from "react";
import InputField from "../components/InputField";
import { useAuth } from "../context/AuthContext";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateConfirm,
  serverFieldErrors,
  hasErrors,
} from "../utils/validation";

const EMPTY_PW = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  const [profile, setProfile] = useState({ username: user.username, email: user.email });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState(EMPTY_PW);
  const [pwErrors, setPwErrors] = useState({});
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const onProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    setProfileErrors((er) => ({ ...er, [name]: "" }));
  };

  const onPwChange = (e) => {
    const { name, value } = e.target;
    setPw((p) => ({ ...p, [name]: value }));
    setPwErrors((er) => ({ ...er, [name]: "" }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    const next = {
      username: validateUsername(profile.username),
      email: validateEmail(profile.email),
    };
    setProfileErrors(next);
    if (hasErrors(next)) return;

    setSavingProfile(true);
    try {
      await updateProfile({ username: profile.username.trim(), email: profile.email.trim() });
      setProfileMsg("Profile updated.");
    } catch (err) {
      const fieldErrors = serverFieldErrors(err);
      if (hasErrors(fieldErrors)) setProfileErrors(fieldErrors);
      else setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    const next = {
      currentPassword: pw.currentPassword ? "" : "Current password is required",
      newPassword: validatePassword(pw.newPassword),
      confirmPassword: validateConfirm(pw.newPassword, pw.confirmPassword),
    };
    setPwErrors(next);
    if (hasErrors(next)) return;

    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw(EMPTY_PW);
      setPwMsg("Password changed. Other devices have been logged out.");
    } catch (err) {
      if (/current password/i.test(err.message)) setPwErrors({ currentPassword: err.message });
      else if (/different/i.test(err.message)) setPwErrors({ newPassword: err.message });
      else setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <section className="auth-page">
      <h1>My profile</h1>
      <dl className="profile-summary">
        <dt>Role</dt>
        <dd>{user.role}</dd>
        <dt>Member since</dt>
        <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
      </dl>

      <h2>Account details</h2>
      {profileMsg && (
        <p className="success-message" role="status">
          {profileMsg}
        </p>
      )}
      {profileError && (
        <p className="error-box" role="alert">
          {profileError}
        </p>
      )}
      <form onSubmit={saveProfile} noValidate>
        <InputField
          label="Username"
          name="username"
          value={profile.username}
          onChange={onProfileChange}
          error={profileErrors.username}
          autoComplete="username"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          value={profile.email}
          onChange={onProfileChange}
          error={profileErrors.email}
          autoComplete="email"
        />
        <button type="submit" className="btn" disabled={savingProfile}>
          {savingProfile ? "Saving..." : "Save changes"}
        </button>
      </form>

      <h2>Change password</h2>
      {pwMsg && (
        <p className="success-message" role="status">
          {pwMsg}
        </p>
      )}
      {pwError && (
        <p className="error-box" role="alert">
          {pwError}
        </p>
      )}
      <form onSubmit={savePassword} noValidate>
        <InputField
          label="Current password"
          name="currentPassword"
          type="password"
          value={pw.currentPassword}
          onChange={onPwChange}
          error={pwErrors.currentPassword}
          autoComplete="current-password"
        />
        <InputField
          label="New password"
          name="newPassword"
          type="password"
          value={pw.newPassword}
          onChange={onPwChange}
          error={pwErrors.newPassword}
          autoComplete="new-password"
        />
        <InputField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          value={pw.confirmPassword}
          onChange={onPwChange}
          error={pwErrors.confirmPassword}
          autoComplete="new-password"
        />
        <button type="submit" className="btn" disabled={savingPw}>
          {savingPw ? "Changing..." : "Change password"}
        </button>
      </form>
    </section>
  );
}