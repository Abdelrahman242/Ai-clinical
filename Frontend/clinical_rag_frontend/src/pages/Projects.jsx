import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [clinicalTopic, setClinicalTopic] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .listProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.createProject({ name, clinical_topic: clinicalTopic, description });
      setName("");
      setClinicalTopic("");
      setDescription("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">النطاقات السريرية</div>
        <h1>المشاريع</h1>
      </div>

      <div className="page-body">
        {error && <div className="error-banner">{error}</div>}

        <div style={{ marginBottom: 20 }}>
          <button className="btn btn-ghost" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "إلغاء" : "+ مشروع جديد"}
          </button>
        </div>

        {showForm && (
          <form className="profile-card" style={{ marginBottom: 28 }} onSubmit={handleCreate}>
            <div className="field">
              <label>اسم المشروع</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            </div>
            <div className="field">
              <label>الموضوع السريري (اختياري)</label>
              <input
                value={clinicalTopic}
                onChange={(e) => setClinicalTopic(e.target.value)}
                placeholder="مثال: Adult Hypertension Management"
              />
            </div>
            <div className="field">
              <label>وصف مختصر (اختياري)</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={creating}>
              {creating ? <span className="spinner" /> : "إنشاء المشروع"}
            </button>
          </form>
        )}

        {loading && (
          <span className="spinner" style={{ borderTopColor: "var(--accent)", borderColor: "var(--line)" }} />
        )}

        {!loading && projects.length === 0 && (
          <div className="empty-state" style={{ margin: "40px auto" }}>
            <h2>مفيش مشاريع لسه</h2>
            <p>اعمل مشروع جديد وسجّل فيه مستندات النظام عشان تبدأ تسأل.</p>
          </div>
        )}

        <div className="project-grid">
          {projects.map((p) => (
            <Link to={`/projects/${p.id}`} className="project-card" key={p.id}>
              <div className="project-card-title">{p.name}</div>
              {p.clinical_topic && <div className="project-card-topic">{p.clinical_topic}</div>}
              {p.description && <p className="project-card-desc">{p.description}</p>}
              <div className="project-card-meta">{p.document_count} مستند مسجّل</div>
            </Link>
          ))}
        </div>

        {isAdmin && (
          <p style={{ marginTop: 24, fontSize: 12.5, color: "var(--ink-faint)" }}>
            انت أدمن — تقدر تسجّل وتفهرس مستندات النظام من جوه كل مشروع.
          </p>
        )}
      </div>
    </>
  );
}
