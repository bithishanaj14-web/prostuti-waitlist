import Navbar from "../components/Navbar.jsx";
import Hero from "../components/Hero.jsx";
import WaitlistForm from "../components/WaitlistForm.jsx";
import ReferralCard from "../components/ReferralCard.jsx";
import Footer from "../components/Footer.jsx";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <WaitlistForm />
        <ReferralCard />
      </main>

      <Footer />
    </>
  );
}
