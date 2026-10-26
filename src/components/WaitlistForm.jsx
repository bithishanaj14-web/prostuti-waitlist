
import { useState } from "react";
import { supabase } from "../services/supabaseClient.js";

export default function WaitlistForm() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    studentClass: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setResult(null);

    const name = form.name.trim();
    const contact = form.contact.trim().toLowerCase();
    const studentClass = form.studentClass;

    if (!name || !contact || !studentClass) {
      setMessage("সবগুলো তথ্য পূরণ করুন।");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[0-9\s()-]{8,20}$/;

    if (
      !emailPattern.test(contact) &&
      !phonePattern.test(contact)
    ) {
      setMessage("সঠিক ইমেইল অথবা ফোন নম্বর দিন।");
      return;
    }

    if (!supabase) {
      setMessage(
        "Supabase সেটআপ করা হয়নি। আগে Database সংযোগ করুন।"
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("join_waitlist", {
        p_name: name,
        p_contact: contact,
        p_class: studentClass,
        p_referral_code: new URLSearchParams(
          window.location.search
        ).get("ref"),
      });

      if (error) {
        throw error;
      }

      const row = Array.isArray(data) ? data[0] : data;

      if (!row || !row.referral_code) {
        throw new Error(
          "Database থেকে Referral Code পাওয়া যায়নি।"
        );
      }

      const referralLink =
        `${window.location.origin}${window.location.pathname}` +
        `?ref=${encodeURIComponent(row.referral_code)}`;

      localStorage.setItem(
        "prostutiReferralLink",
        referralLink
      );

      setResult({
        ...row,
        referral_link: referralLink,
      });

      setMessage("অভিনন্দন! আপনি Waitlist-এ যোগ দিয়েছেন।");

      setForm({
        name: "",
        contact: "",
        studentClass: "",
      });
    } catch (error) {
      if (error.code === "23505") {
        setMessage(
          "এই ফোন নম্বর বা ইমেইল দিয়ে ইতোমধ্যে যোগ দেওয়া হয়েছে।"
        );
      } else {
        setMessage(
          error.message ||
            "তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="join" className="join-section">
      <div className="container">
        <div className="form-card">
          <h2 className="text-center fw-bold">
            Waitlist-এ যোগ দিন
          </h2>

          <p className="text-center text-secondary">
            নিচের তথ্যগুলো দিয়ে আপনার জায়গা নিশ্চিত করুন।
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">
                আপনার নাম
              </label>

              <input
                id="name"
                className="form-control form-control-lg"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="সম্পূর্ণ নাম লিখুন"
                autoComplete="name"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="contact" className="form-label">
                Phone অথবা Email
              </label>

              <input
                id="contact"
                className="form-control form-control-lg"
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="ফোন নম্বর বা ইমেইল"
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="studentClass"
                className="form-label"
              >
                আপনি কোন ক্লাসে পড়েন?
              </label>

              <select
                id="studentClass"
                className="form-select form-select-lg"
                name="studentClass"
                value={form.studentClass}
                onChange={handleChange}
                required
              >
                <option value="">ক্লাস নির্বাচন করুন</option>
                <option value="6">ষষ্ঠ শ্রেণি</option>
                <option value="7">সপ্তম শ্রেণি</option>
                <option value="8">অষ্টম শ্রেণি</option>
                <option value="9">নবম শ্রেণি</option>
                <option value="10">দশম শ্রেণি</option>
                <option value="11">একাদশ শ্রেণি</option>
                <option value="12">দ্বাদশ শ্রেণি</option>
                <option value="other">অন্যান্য</option>
              </select>
            </div>

            <button
              className="btn btn-primary btn-lg w-100 rounded-pill"
              type="submit"
              disabled={loading}
            >
              {loading ? "অপেক্ষা করুন..." : "Join Waitlist"}
            </button>
          </form>

          {message && (
            <div className="alert alert-info mt-3" role="status">
              {message}
            </div>
          )}

          {result && (
            <div className="success-result mt-4">
              <h3>আপনি সফলভাবে যোগ দিয়েছেন!</h3>

              <p>
                আপনার Waitlist Position:{" "}
                <strong>
                  {result.waitlist_position}
                </strong>
              </p>

              <p>আপনার Referral Link:</p>

              <a
                href={result.referral_link}
                onClick={(event) => {
                  event.preventDefault();
                  navigator.clipboard
                    .writeText(result.referral_link)
                    .then(() => setMessage("Referral Link কপি হয়েছে!"))
                    .catch(() =>
                      setMessage("লিংক কপি করা যায়নি।")
                    );
                }}
              >
                {result.referral_link}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
