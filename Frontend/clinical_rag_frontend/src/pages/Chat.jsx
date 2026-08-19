import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

const CONFIDENCE_CLASS = {
  High: "conf-high",
  Medium: "conf-medium",
  Low: "conf-low",
  "Insufficient Evidence": "conf-insufficient",
};

export default function Chat() {
  const { projectId, conversationId } = useParams();

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .listMessages(conversationId)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim() || asking) return;

    const userMsg = { id: `local-${Date.now()}`, role: "user", content: query, citations: [] };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setAsking(true);
    setError("");

    try {
      const res = await api.sendMessage(conversationId, userMsg.content);
      setMessages((prev) => [...prev, res]);
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">
          <Link to={`/projects/${projectId}`} style={{ color: "inherit", textDecoration: "none" }}>
            ← رجوع للمشروع
          </Link>
        </div>
        <h1>محادثة سريرية</h1>
      </div>

      <div className="chat-layout">
        <div className="chat-column" style={{ width: "100%" }}>
          <div className="chat-messages">
            {loading && (
              <span className="spinner" style={{ borderTopColor: "var(--accent)", borderColor: "var(--line)" }} />
            )}

            {!loading && messages.length === 0 && (
              <div className="empty-state">
                <h2>ابدأ السؤال</h2>
                <p>الإجابات هتبقى مبنية على مستندات المشروع الرسمية بس، مع ذكر المصدر والصفحة.</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`msg-row ${m.role === "user" ? "user" : "assistant"}`}>
                <div className={`msg-bubble ${m.refused ? "msg-refused" : ""}`}>
                  {m.role === "assistant" && m.confidence && (
                    <div className={`confidence-badge ${CONFIDENCE_CLASS[m.confidence] || ""}`}>
                      {m.refused ? "رفض / أدلة غير كافية" : `الثقة: ${m.confidence}`}
                    </div>
                  )}

                  <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

                  {m.citations && m.citations.length > 0 && (
                    <details className="sources">
                      <summary>المصادر ({m.citations.length})</summary>
                      {m.citations.map((c, ci) => (
                        <div className="source-item" key={ci}>
                          <div className="source-name">
                            {c.document}
                            {c.section ? ` — ${c.section}` : ""}
                            {c.page ? ` — ص${c.page}` : ""}
                          </div>
                          {typeof c.score === "number" && (
                            <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                              score: {c.score.toFixed(3)}
                            </div>
                          )}
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && <div className="error-banner" style={{ margin: "0 36px" }}>{error}</div>}

          <form className="chat-input-bar" onSubmit={handleAsk}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اسأل سؤال عن الدليل السريري..."
              disabled={asking}
            />
            <button className="btn btn-primary" disabled={asking || !query.trim()}>
              {asking ? <span className="spinner" /> : "إرسال"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
