import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  registered: "مسجّل، لسه ما اتفهرسش",
  queued: "في الطابور",
  ingesting: "بيتفهرس دلوقتي...",
  ingested: "متفهرس ✅",
  failed: "فشل ❌",
};

const DOCS_POLL_MS = 8000;

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [creatingConv, setCreatingConv] = useState(false);

  // admin: manual registration fallback (بيستخدم أساسًا لـ source_url)
  const [showManualForm, setShowManualForm] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docSourceRef, setDocSourceRef] = useState("");
  const [docSourceUrl, setDocSourceUrl] = useState("");
  const [docPublisher, setDocPublisher] = useState("");
  const [registering, setRegistering] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const pollRef = useRef(null);

  const loadDocuments = async () => {
    if (!isAdmin) return;
    try {
      const docs = await api.listDocuments(projectId);
      setDocuments(docs);
    } catch {
      // مش هنعرض error هنا عشان مش نقاطع الـ polling الصامت
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, convs] = await Promise.all([
        api.getProject(projectId),
        api.listConversations(projectId),
      ]);
      setProject(p);
      setConversations(convs);
      await loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    if (isAdmin) {
      pollRef.current = setInterval(loadDocuments, DOCS_POLL_MS);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleNewConversation = async (e) => {
    e.preventDefault();
    setCreatingConv(true);
    try {
      const conv = await api.createConversation(projectId, newTitle || "محادثة جديدة");
      navigate(`/projects/${projectId}/conversations/${conv.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingConv(false);
    }
  };

  const handleRegisterDocument = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setError("");
    try {
      const doc = await api.registerDocument(projectId, {
        title: docTitle,
        source_ref: docSourceRef || undefined,
        source_url: docSourceUrl || undefined,
        publisher: docPublisher,
      });
      // فوري: نشغّل الفهرسة على طول بدل ما نستنى دورة الـ auto-scan الجاية
      await api.ingestDocument(doc.id, false);
      setDocTitle("");
      setDocSourceRef("");
      setDocSourceUrl("");
      setDocPublisher("");
      setShowManualForm(false);
      loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleRetry = async (documentId) => {
    setRetryingId(documentId);
    setError("");
    try {
      await api.ingestDocument(documentId, true);
      loadDocuments();
    } catch (err) {
      setError(err.message);
    } finally {
      setRetryingId(null);
    }
  };

  if (loading && !project) {
    return (
      <div className="page-body">
        <span className="spinner" style={{ borderTopColor: "var(--accent)", borderColor: "var(--line)" }} />
      </div>
    );
  }

  const sourcesPath = `data/sources/${projectId}/`;

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">مشروع</div>
        <h1>{project?.name}</h1>
        {project?.clinical_topic && <p className="hint" style={{ marginTop: 6 }}>{project.clinical_topic}</p>}
      </div>

      <div className="page-body">
        {error && <div className="error-banner">{error}</div>}

        <section style={{ marginBottom: 36 }}>
          <h3 style={{ marginBottom: 14 }}>المحادثات</h3>

          <form className="chat-input-bar" style={{ borderTop: "none", padding: 0, marginBottom: 18 }} onSubmit={handleNewConversation}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="عنوان المحادثة (اختياري)"
            />
            <button className="btn btn-primary" disabled={creatingConv}>
              {creatingConv ? <span className="spinner" /> : "+ محادثة جديدة"}
            </button>
          </form>

          {conversations.length === 0 && (
            <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>مفيش محادثات لسه في المشروع ده.</p>
          )}

          <div className="history-list">
            {conversations.map((c) => (
              <Link
                to={`/projects/${projectId}/conversations/${c.id}`}
                key={c.id}
                className="history-entry"
                style={{ display: "block", textDecoration: "none" }}
              >
                <div className="role">{new Date(c.created_at).toLocaleString("ar-EG")}</div>
                <p>{c.title}</p>
              </Link>
            ))}
          </div>
        </section>

        {isAdmin && (
          <section>
            <h3 style={{ marginBottom: 6 }}>مستندات النظام (أدمن)</h3>

            <div className="auto-ingest-box">
              <div className="auto-ingest-box-title">فهرسة تلقائية — من غير أي زرار</div>
              <p>
                حط ملف PDF أو TXT رسمي جوه الفولدر ده على السيرفر مباشرة:
              </p>
              <code className="source-path">{sourcesPath}</code>
              <p>
                السيرفر بيدوّر على الفولدر ده لوحده كل كذا ثانية، وأي ملف جديد
                بيتسجّل ويتفهرس (embedding) أوتوماتيك من غير ما تحتاج تعمل أي
                حاجة تانية. اللستة تحت بتتحدث لوحدها كل شوية.
              </p>
            </div>

            <div style={{ margin: "18px 0" }}>
              <button className="btn btn-ghost" onClick={() => setShowManualForm((s) => !s)}>
                {showManualForm ? "إلغاء" : "تسجيل يدوي (fallback) — مفيد لرابط رسمي source_url"}
              </button>
            </div>

            {showManualForm && (
              <form className="profile-card" style={{ marginBottom: 24 }} onSubmit={handleRegisterDocument}>
                <div className="field">
                  <label>عنوان المستند</label>
                  <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} required />
                </div>
                <div className="field">
                  <label>source_ref (اسم ملف موجود بالفعل جوه {sourcesPath})</label>
                  <input
                    value={docSourceRef}
                    onChange={(e) => setDocSourceRef(e.target.value)}
                    placeholder="who_htn_2023.pdf"
                  />
                </div>
                <div className="field">
                  <label>أو source_url (رابط رسمي — السيستم هينزّله لوحده)</label>
                  <input
                    value={docSourceUrl}
                    onChange={(e) => setDocSourceUrl(e.target.value)}
                    placeholder="https://www.who.int/..."
                  />
                </div>
                <div className="field">
                  <label>الجهة الناشرة (اختياري)</label>
                  <input value={docPublisher} onChange={(e) => setDocPublisher(e.target.value)} placeholder="WHO / CDC / NICE" />
                </div>
                <button className="btn btn-primary" disabled={registering}>
                  {registering ? <span className="spinner" /> : "تسجيل وفهرسة فورًا"}
                </button>
              </form>
            )}

            <div className="doc-list">
              {documents.map((d) => (
                <div className="doc-row" key={d.id}>
                  <div>
                    <div className="doc-title">{d.title}</div>
                    <div className="doc-meta">
                      {d.source_ref || d.source_url} · {d.chunks_indexed} chunk
                      {d.publisher ? ` · ${d.publisher}` : ""}
                    </div>
                    {d.error && <div className="doc-error">{d.error}</div>}
                  </div>
                  <div className="doc-actions">
                    <span className={`status-pill status-${d.status}`}>
                      {STATUS_LABELS[d.status] || d.status}
                    </span>
                    {d.status === "failed" && (
                      <button
                        className="btn btn-ghost"
                        disabled={retryingId === d.id}
                        onClick={() => handleRetry(d.id)}
                      >
                        {retryingId === d.id ? <span className="spinner" /> : "إعادة المحاولة"}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <p style={{ color: "var(--ink-faint)", fontSize: 13.5 }}>
                  مفيش مستندات لسه — حط ملف جوه الفولدر فوق وهيظهر هنا لوحده.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
