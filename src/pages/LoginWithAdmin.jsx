import UserLogin from "./Login";

export default function LoginWithAdmin(props) {
  return (
    <>
      <UserLogin {...props} />

      <a href="/admin" style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: "#284C3C",
        color: "white",
        padding: "12px 22px",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "600",
        zIndex: 9999
      }}>
        Admin Login
      </a>
    </>
  );
}
