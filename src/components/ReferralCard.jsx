import { useState } from "react";

export default function ReferralCard() {
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState(
    () => localStorage.getItem("prostutiReferralLink") || ""
  );

  async function copyLink() {
    if (!referralLink) {
      alert("আগে Waitlist-এ যোগ দিয়ে আপনার Referral Link নিন।");
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("লিংক কপি করা যায়নি। লিংকটি নির্বাচন করে কপি করুন।");
    }
  }

  return (
    <section className="referral-section">
      <div className="container">
        <div className="referral-card text-center">
          <div className="referral-icon">🎁</div>
          <h2>বন্ধুদের আমন্ত্রণ জানান</h2>
          <p>
            আপনার Referral Link শেয়ার করুন। যোগ্য নতুন ব্যবহারকারী
            আপনার লিংক দিয়ে যোগ দিলে আপনার Waitlist Position এগিয়ে যেতে পারে।
          </p>

          <input
            className="form-control mb-3"
            value={referralLink}
            onChange={(event) => setReferralLink(event.target.value)}
            placeholder="আপনার Referral Link এখানে দেখাবে"
            readOnly
          />

          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button className="btn btn-dark" onClick={copyLink}>
              {copied ? "কপি হয়েছে ✓" : "Copy Link"}
            </button>

            <a
              className="btn btn-success"
              href={
                referralLink
                  ? `https://wa.me/?text=${encodeURIComponent(
                      "Prostuti Waitlist-এ যোগ দিন: " + referralLink
                    )}`
                  : undefined
              }
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!referralLink) {
                  event.preventDefault();
                  alert("আগে Waitlist-এ যোগ দিন।");
                }
              }}
            >
              WhatsApp
            </a>

            <a
              className="btn btn-primary"
              href={
                referralLink
                  ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      referralLink
                    )}`
                  : undefined
              }
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!referralLink) {
                  event.preventDefault();
                  alert("আগে Waitlist-এ যোগ দিন।");
                }
              }}
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}