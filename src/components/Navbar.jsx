export default function Navbar() {
  return (
    <nav className="navbar navbar-expand bg-white border-bottom sticky-top">
      <div className="container py-2">
        <a className="navbar-brand fw-bold fs-3" href="#">
          Prostuti<span className="brand-dot">.</span>
        </a>

        <a href="#join" className="btn btn-primary rounded-pill px-4">
          যোগ দিন
        </a>
      </div>
    </nav>
  );
}