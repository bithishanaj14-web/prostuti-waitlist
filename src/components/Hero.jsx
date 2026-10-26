export default function Hero() {
  return (
    <section className="hero-section text-center">
      <div className="container">
        <span className="launch-badge">
          নতুন কিছু আসছে — সঙ্গে থাকুন
        </span>

        <h1 className="hero-title">
          আপনার প্রস্তুতি হোক
          <br />
          <span>আরও সহজ, আরও স্মার্ট</span>
        </h1>

        <p className="hero-description">
          Prostuti একটি Exam Preparation Platform।
          সবার আগে যোগ দিন, বন্ধুদের আমন্ত্রণ জানান এবং
          Waitlist-এ নিজের অবস্থান এগিয়ে নিন।
        </p>

        <a href="#join" className="btn btn-primary btn-lg rounded-pill px-5">
          Waitlist-এ যোগ দিন
        </a>

        <div className="hero-points">
          <span>✓ বিনামূল্যে যোগ দিন</span>
          <span>✓ বন্ধুদের আমন্ত্রণ জানান</span>
          <span>✓ নিজের অবস্থান দেখুন</span>
        </div>
      </div>
    </section>
  );
}