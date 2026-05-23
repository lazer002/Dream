import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";
import api from "@/utils/config";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
export default function Footer() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);


const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email || !email.includes("@")) {
    toast.error("Enter a valid email");
    return;
  }

  try {
    setLoading(true);

    await api.post("/newsletter", { email });

    toast.success("Subscribed successfully 🎉");

    setEmail(""); // reset input

  } catch (err) {
    console.error(err);
    toast.error("Failed to subscribe");
  } finally {
    setLoading(false);
  }
};
    return (
        <footer className="bg-black text-white  tracking-wide">
            <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 border-b border-white/10 font-medium text-[12px] leading-loose">
                    {/* Newsletter */}
                        {/* KNOW */}
                    <div>
                        <h3 className="font-bold mb-3 uppercase text-[16px]">KNOW MONKIESS</h3>
                        <ul className="space-y-1 text-[13px]">
                            <li>
                                <Link to="/pages/contact" className="hover:text-white">
                                    CONTACT US
                                </Link>
                            </li>
                            <li>
                                <Link to="/policies/refund-policy" className="hover:text-white">
                                    REFUND POLICY
                                </Link>
                            </li>
                            <li>
                                <Link to="/policies/shipping-policy" className="hover:text-white">
                                    SHIPPING POLICY
                                </Link>
                            </li>
                            <li>
                                <Link to="/policies/privacy-policy" className="hover:text-white">
                                    PRIVACY POLICY
                                </Link>
                            </li>
                        </ul>
                    </div>


               

                    {/* USEFUL LINKS */}
                    <div>
                        <h3 className="font-bold mb-3 uppercase text-[16px]">USEFUL LINKS</h3>
                        <ul className="space-y-1 text-[13px]">
                            <li>
                                <Link to="/pages/faq" className="hover:text-white">
                                    FAQ&apos;S
                                </Link>
                            </li>
                            <li>
                                <Link to="/pages/terms-conditions" className="hover:text-white">
                                    TERMS & CONDITIONS
                                </Link>
                            </li>
                            <li>
                                <Link to="mailto:contact@bowchika.com"
                                    className="hover:text-white"
                                >
                                    EMAIL US
                                </Link>
                            </li>
                            <li>
                                <Link to="tel:+919876543210" className="hover:text-white">
                                    CALL US
                                </Link>
                            </li>
                            <li>
                                <Link to="/returns" className="hover:text-white">
                                    RETURN & EXCHANGE
                                </Link>
                            </li>
                        </ul>
                    </div>
                    
                    {/* SHOP */}
                    <div>
                        <h1 className="font-bold mb-3 text-[16px] uppercase">SHOP</h1>
                        <ul className="space-y-1 text-[13px]">
                            <li>
                                <Link to="/collections/men" className="hover:text-white">
                                    SHOP MEN&apos;S
                                </Link>
                            </li>
                            <li>
                                <Link to="/collections/women" className="hover:text-white">
                                    SHOP WOMEN&apos;S
                                </Link>
                            </li>
                        </ul>
                    </div>
                     <div>
                        <img
                            src="/logo.png"
                            alt="Monkiess"
                            className="h-10 mb-4"
                        />
                    <p className="uppercase font-bold text-[16px]  origin-left inline-block">
  GET EXCLUSIVE OFFERS IN YOUR INBOX!
</p>



                       <div className="flex justify-start">
  <div
    className="relative w-[340px] h-[58px] bg-[#1B1A1A] rounded-lg border border-[#2a2a2a] 
    focus-within:border-white transition-all duration-300"
  >
    {/* Input */}
    <input
      id="footer-email"
      type="email"
      required
      autoComplete="off"
      placeholder=" "
      onChange={(e) => setEmail(e.target.value)}
      className="peer w-full h-full bg-transparent text-white text-[13px]
      px-5 pr-16 rounded-full outline-none border-none
      placeholder-transparent"
    />

    {/* Floating Label */}
    <label
      htmlFor="footer-email"
      className="
        absolute left-5 top-1/2 -translate-y-1/2
        text-[12px] text-gray-400 pointer-events-none
        transition-all duration-200 ease-in-out

        peer-focus:top-2.5
        peer-focus:text-[10px]
        peer-focus:text-white
        peer-valid:top-2.5
        peer-valid:text-[10px]
        peer-valid:text-white
      "
    >
      Enter your email
    </label>

    {/* Circle Arrow Button */}
    <button
      type="submit"
      onClick={handleSubmit}
      disabled={loading}
      className="
        absolute right-2 top-1/2 -translate-y-1/2
        w-10 h-10 rounded-full
        bg-white text-black
        flex items-center justify-center
        transition-all duration-300
        hover:scale-105 active:scale-95
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12h14m-6-6 6 6-6 6"
        />
      </svg>
    </button>
  </div>
</div>



                    </div>
                </div>

                {/* Social + Bottom */}
                <div className="mt-2 flex flex-col md:flex-row justify-between items-center">
                    {/* Social Box */}
                    <div className="bg-[#1B1A1A] border border-white/10 px-4 py-2 flex items-center gap-3 rounded-md">
                        <span className="uppercase text-xs">Follow us on</span>
                        <div className="flex gap-3">
                            <Link to="https://facebook.com"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                            >
                                <Facebook size={18} />
                            </Link>
                            <Link to="https://instagram.com"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                            >
                                <Instagram size={18} />
                            </Link>
                            <Link
                                to="https://wa.me/9876543210"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                            >
                                <MessageCircle size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-gray-300 uppercase tracking-wide mt-4 md:mt-0">
                        © 2025 DripDesi – ALL RIGHTS RESERVED
                    </p>
                </div>
            </div>
        </footer>
    );
}
