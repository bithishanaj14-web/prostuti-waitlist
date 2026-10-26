export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="container text-center">
        <a className="footer-brand" href="#">
          Prostuti.
        </a>
        <p>আপনার প্রস্তুতি, আপনার ভবিষ্যৎ।</p>
        <small>© {new Date().getFullYear()} Prostuti. All rights reserved.</small>
      </div>
    </footer>
  );
}