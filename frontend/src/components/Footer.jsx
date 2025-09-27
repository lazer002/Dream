import { Facebook, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";
export default function Footer() {
    const [email, setEmail] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        // handle submit (API call or state update)
        console.log("subscribe:", email);
    }
    return (
        <footer className="bg-black text-white text-[11px] tracking-wide">
            <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 border-b border-white/10 font-medium text-[12px] leading-loose">
                    {/* Newsletter */}
                    <div>
                        <img
                            src="/logo.png"
                            alt="DripDesi"
                            className="h-10 mb-4"
                        />
                        <p className="uppercase font-medium tracking-wider mb-3">
                            GET EXCLUSIVE OFFERS IN YOUR INBOX!
                        </p>



                        <form
                            id="footer-newsletter"
                            onSubmit={(e) => e.preventDefault()}
                            className="flex justify-start"
                        >
                            <div
                                className="relative w-[280px] h-[46px] bg-[#1B1A1A] rounded-md overflow-hidden 
               border border-0 focus-within:border-0 "
                            >
                                {/* Input */}
                                <input
                                    id="footer-email"
                                    type="email"
                                    placeholder="YOUR EMAIL ADDRESS"
                                    className="peer w-full h-full pl-4 pr-24 bg-transparent text-white text-[11px] placeholder-transparent 
                 focus:outline-none focus:ring-0"
                                    autoComplete="off"
                                    required
                                    onBlur={(e) => e.target.value = ''}
                                />

                                {/* Floating Label */}
                                <label
                                    htmlFor="footer-email"
                                    className="absolute left-4 top-1/2 -translate-y-2/3 text-[11px] text-gray-400 transition-all duration-150
                 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:opacity-100
                 peer-focus:top-2 peer-focus:text-white peer-focus:opacity-0
                 peer-valid:top-2 peer-valid:text-white peer-valid:opacity-0"
                                >
                                    YOUR EMAIL ADDRESS
                                </label>

                                {/* Button inside input */}
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-white text-black text-[11px] font-medium rounded-md focus:outline-none focus:ring-0"
                                >
                                    SIGN UP
                                </button>
                            </div>
                        </form>



                    </div>

                    {/* SHOP */}
                    <div>
                        <h3 className="font-bold mb-3 uppercase">SHOP</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="/collections/men" className="hover:text-white">
                                    SHOP MEN&apos;S
                                </a>
                            </li>
                            <li>
                                <a href="/collections/women" className="hover:text-white">
                                    SHOP WOMEN&apos;S
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* KNOW */}
                    <div>
                        <h3 className="font-bold mb-3 uppercase">#KNOW BOWCHIKA</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="/pages/contact" className="hover:text-white">
                                    CONTACT US
                                </a>
                            </li>
                            <li>
                                <a href="/policies/refund-policy" className="hover:text-white">
                                    REFUND POLICY
                                </a>
                            </li>
                            <li>
                                <a href="/policies/shipping-policy" className="hover:text-white">
                                    SHIPPING POLICY
                                </a>
                            </li>
                            <li>
                                <a href="/policies/privacy-policy" className="hover:text-white">
                                    PRIVACY POLICY
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* USEFUL LINKS */}
                    <div>
                        <h3 className="font-bold mb-3 uppercase">USEFUL LINKS</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="/pages/faq" className="hover:text-white">
                                    FAQ&apos;S
                                </a>
                            </li>
                            <li>
                                <a href="/pages/terms-conditions" className="hover:text-white">
                                    TERMS & CONDITIONS
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:contact@bowchika.com"
                                    className="hover:text-white"
                                >
                                    EMAIL US
                                </a>
                            </li>
                            <li>
                                <a href="tel:+919876543210" className="hover:text-white">
                                    CALL US
                                </a>
                            </li>
                            <li>
                                <a href="/returns" className="hover:text-white">
                                    RETURN & EXCHANGE
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Social + Bottom */}
                <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
                    {/* Social Box */}
                    <div className="bg-[#1B1A1A] border border-white/10 px-4 py-2 flex items-center gap-3 rounded-md">
                        <span className="uppercase text-xs">Follow us on</span>
                        <div className="flex gap-3">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                            >
                                <Facebook size={18} />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                            >
                                <Instagram size={18} />
                            </a>
                            <a
                                href="https://wa.me/9876543210"
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                            >
                                <MessageCircle size={18} />
                            </a>
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
