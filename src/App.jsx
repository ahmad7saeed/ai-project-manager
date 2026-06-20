import { useState, useRef, useEffect } from "react";

const STEPS_PROMPT = `You are an AI Project Manager. When given a project goal, you:
1. Break it into clear subtasks
2. Assign each subtask to the right AI tool/agent
3. Track progress
4. Ask the user only when a real decision is needed

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "projectName": "short name",
  "summary": "one sentence plan",
  "tasks": [
    {
      "id": "1",
      "title": "task title",
      "agent": "agent name (e.g. Claude Coder, Image AI, Data Agent, Web Search, API Builder)",
      "description": "what this agent will do",
      "status": "pending",
      "decision": null
    }
  ],
  "needsDecision": false,
  "decisionQuestion": null
}`;

const agentColors = {
  "Claude Coder": { bg: "#1a1a2e", accent: "#7c6af7", icon: "⌨️" },
  "Image AI": { bg: "#1a2e1a", accent: "#4caf82", icon: "🎨" },
  "Data Agent": { bg: "#2e1a1a", accent: "#f77c6a", icon: "📊" },
  "Web Search": { bg: "#1a2a2e", accent: "#6ac4f7", icon: "🔍" },
  "API Builder": { bg: "#2a1a2e", accent: "#c46af7", icon: "🔌" },
  "File Manager": { bg: "#2e2a1a", accent: "#f7c46a", icon: "📁" },
  "default": { bg: "#1e1e1e", accent: "#888", icon: "🤖" },
};

function getAgent(name) {
  return agentColors[name] || agentColors["default"];
}

function TaskCard({ task, index, onDecision }) {
  const agent = getAgent(task.agent);
  const [input, setInput] = useState("");

  const statusColor = {
    pending: "#555",
    running: agent.accent,
    done: "#4caf82",
    waiting: "#f7c46a",
  }[task.status] || "#555";

  const statusIcon = {
    pending: "○", running: "◎", done: "●", waiting: "◈",
  }[task.status] || "○";

  return (
    <div style={{
      background: agent.bg,
      border: `1px solid ${task.status === "running" ? agent.accent : "#2a2a2a"}`,
      borderRadius: 12, padding: "16px 18px", marginBottom: 10,
      boxShadow: task.status === "running" ? `0 0 12px ${agent.accent}33` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{agent.icon}</span>
        <span style={{ color: agent.accent, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
          {task.agent}
        </span>
        <span style={{ marginLeft: "auto", color: statusColor, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10 }}>{statusIcon}</span>{task.status}
        </span>
      </div>
      <div style={{ color: "#eee", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
        {index + 1}. {task.title}
      </div>
      <div style={{ color: "#999", fontSize: 13, lineHeight: 1.5 }}>{task.description}</div>
      {task.status === "waiting" && task.decision && (
        <div style={{ marginTop: 12, background: "#ffffff0d", borderRadius: 8, padding: 12 }}>
          <div style={{ color: "#f7c46a", fontSize: 13, marginBottom: 8 }}>⚠️ {task.decision}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Your answer..."
              onKeyDown={e => e.key === "Enter" && input.trim() && onDecision(task.id, input)}
              style={{ flex: 1, background: "#111", border: "1px solid #444", borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 13, outline: "none" }}
            />
            <button onClick={() => input.trim() && onDecision(task.id, input)}
              style={{ background: "#f7c46a", color: "#111", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState("idle");
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  function addLog(msg, color = "#aaa") {
    setLog(prev => [...prev, { msg, color, time: new Date().toLocaleTimeString() }]);
  }

  async function planProject() {
    if (!input.trim() || loading) return;
    setLoading(true); setPhase("planning");
    setProject(null); setTasks([]); setLog([]);
    addLog("📋 Sending project to Groq PM...", "#7c6af7");
    try {
      const res = await fetch("/api/plan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ goal: input, system: STEPS_PROMPT }),
});
const data = await res.json();
console.log("Groq response:", JSON.stringify(data));
const text = data.choices[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setProject(parsed); setTasks(parsed.tasks);
      addLog(`✅ Plan ready: "${parsed.projectName}"`, "#4caf82");
      addLog(`💡 ${parsed.summary}`, "#aaa");
      setPhase("ready");
    } catch (e) {
      addLog("❌ Failed to plan. Check API key or try again.", "#f77c6a");
      setPhase("idle");
    }
    setLoading(false);
  }

  async function executeProject() {
    if (!tasks.length) return;
    setPhase("executing");
    addLog("🚀 Starting execution...", "#7c6af7");
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      addLog(`⚙️ [${task.agent}] Starting: ${task.title}`, getAgent(task.agent).accent);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "running" } : t));
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      if (i === 1 && tasks.length > 2) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "waiting", decision: "Should this use dark mode or light mode as default?" } : t));
        addLog(`⏸️ Waiting for your decision...`, "#f7c46a");
        return;
      }
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "done" } : t));
      addLog(`✓ Done: ${task.title}`, "#4caf82");
    }
    setPhase("done");
    addLog("🎉 Project complete!", "#4caf82");
  }

  async function resumeExecution(remaining) {
    setPhase("executing");
    for (const task of remaining) {
      addLog(`⚙️ [${task.agent}] Starting: ${task.title}`, getAgent(task.agent).accent);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "running" } : t));
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 800));
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "done" } : t));
      addLog(`✓ Done: ${task.title}`, "#4caf82");
    }
    setPhase("done");
    addLog("🎉 All tasks complete!", "#4caf82");
  }

  function handleDecision(taskId, answer) {
    addLog(`✅ Decision: "${answer}"`, "#f7c46a");
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done", decision: null } : t));
    const remaining = tasks.filter(t => t.status === "pending");
    if (!remaining.length) { setPhase("done"); addLog("🎉 Complete!", "#4caf82"); return; }
    resumeExecution(remaining);
  }

  const doneCount = tasks.filter(t => t.status === "done").length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#eee", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c6af7, #c46af7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>AI Project Manager</div>
            <div style={{ color: "#555", fontSize: 12 }}>Powered by Groq</div>
          </div>
          {phase === "done" && (
            <div style={{ marginLeft: "auto", background: "#4caf8222", color: "#4caf82", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>✓ Complete</div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && planProject()}
            placeholder="Describe your project..."
            disabled={loading || phase === "executing"}
            style={{ flex: 1, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 14px", color: "#eee", fontSize: 14, outline: "none" }}
          />
          <button onClick={planProject} disabled={loading || !input.trim() || phase === "executing"}
            style={{ background: loading ? "#333" : "linear-gradient(135deg, #7c6af7, #c46af7)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 18px", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Planning..." : "Plan →"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 24px", gap: 16, overflow: "hidden" }}>
        {tasks.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#555" }}>
              <span>{doneCount}/{tasks.length} tasks</span><span>{progress}%</span>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 99, height: 4 }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #7c6af7, #4caf82)", transition: "width 0.5s ease" }} />
            </div>
          </div>
        )}

        {tasks.length > 0 && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {project && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{project.projectName}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{project.summary}</div>
              </div>
            )}
            {tasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} onDecision={handleDecision} />)}
            {phase === "ready" && (
              <button onClick={executeProject}
                style={{ width: "100%", background: "linear-gradient(135deg, #7c6af7, #4caf82)", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 4 }}>
                🚀 Execute All Tasks
              </button>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div ref={logRef} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 14px", maxHeight: 160, overflowY: "auto", fontFamily: "monospace", fontSize: 12 }}>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.color, marginBottom: 3, display: "flex", gap: 8 }}>
                <span style={{ color: "#333", flexShrink: 0 }}>{l.time}</span>
                <span>{l.msg}</span>
              </div>
            ))}
          </div>
        )}

        {phase === "idle" && tasks.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#333" }}>
            <div style={{ fontSize: 48 }}>⚡</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#444" }}>Describe any project above</div>
            <div style={{ fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 1.6, color: "#333" }}>
              Groq will break it into tasks, assign AI agents, and execute — pausing only when your input is needed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
