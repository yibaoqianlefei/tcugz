import { useNavigate } from "react-router-dom";

export default function Placeholder({ title = "页面" }: { title?: string }) {
  const nav = useNavigate();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.desc}>此页面正在建设中</p>
      <button style={styles.button} onClick={() => nav("/")}>
        返回主控制台
      </button>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    background: "#F6F1E8",
    color: "#2B2B2B",
  },
  title: {
    fontSize: 28,
    fontFamily: "serif",
    marginBottom: 8,
  },
  desc: {
    color: "#999",
    marginBottom: 24,
  },
  button: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    background: "#FF6B5A",
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },
};
