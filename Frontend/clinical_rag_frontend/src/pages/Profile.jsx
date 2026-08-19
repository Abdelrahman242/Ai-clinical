import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = {};
      if (username && username !== user?.username) payload.username = username;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setSaving(false);
        return;
      }

      await api.updateMe(payload);
      await refreshUser();
      setPassword("");
      setSuccess("تم تحديث بياناتك بنجاح");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">حسابك</div>
        <h1>تعديل البروفايل</h1>
      </div>

      <div className="page-body">
        <div className="profile-card">
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>اسم المستخدم</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} />
            </div>
            <div className="field">
              <label>كلمة مرور جديدة (اختياري)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="سيبها فاضية لو مش عايز تغيّرها"
                minLength={6}
              />
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : "حفظ التغييرات"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
