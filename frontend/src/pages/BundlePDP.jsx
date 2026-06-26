// src/pages/BundlePDP.jsx
import { useState, useEffect,useRef } from "react";
import { useParams } from "react-router-dom";
import api  from "@/utils/config";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ShoppingCart, Heart, CreditCard, Gift } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/state/CartContext";


export default function BundlePDP() {

  const { addBundleToCart } = useCart()
  const { id } = useParams();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [targetImage, setTargetImage] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState({});
const [showMagnifier, setShowMagnifier] = useState(false);
const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });



const images = bundle
  ? [
      ...new Set([
        ...(bundle.mainImages || []),
        ...bundle.products.flatMap((p) =>
          (p.images || []).slice(0, 2)
        ),
      ]),
    ]
  : [];

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bundles/${id}`);
        setBundle(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBundle();
  }, [id]);

    const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  if (loading) return <div className="text-center py-20">Loading bundle...</div>;
  if (!bundle) return <div className="text-center py-20">Bundle not found.</div>;

// console.log("selectedSizes",bundle);
  return (
    <div className="flex flex-col md:flex-row gap-12 p-6 relative mb-40">
      {/* Left: Sticky Image Section */}
      <div className="md:w-[60%] md:sticky md:top-0 h-[100vh] flex flex-col justify-center">
        <div className="flex flex-col gap-3 h-full justify-between">
      <div
  className="flex-1 flex gap-6 relative"

>
<Card
  className="
    relative
    overflow-hidden
    border-0
    flex-1
    bg-[#f5f5f3]
    cursor-crosshair
  "
  onMouseEnter={() => {
    if (window.innerWidth < 1024) return;
    setShowMagnifier(true);
  }}
  onMouseLeave={() => {
    setShowMagnifier(false);
  }}
  onMouseMove={(e) => {
    if (window.innerWidth < 1024) return;

    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  }}
>
  <div
    className="flex h-full transition-transform duration-500 ease-in-out"
    style={{
      transform: `translateX(-${activeImage * 100}%)`,
    }}
  >
    {images.map((img, idx) => (
      <img
        key={idx}
        src={img}
        alt={`${bundle.title}-${idx}`}
        className="
          w-full
          shrink-0
          max-h-[55vh]
          md:max-h-[82vh]
          object-cover
        "
      />
    ))}
  </div>

  <div
    className="
      absolute
      bottom-3
      right-3
      bg-black/70
      text-white
      px-3 py-1
      rounded-full
      text-xs
      md:hidden
    "
  >
    {activeImage + 1}/{images.length}
  </div>

  <div className="flex justify-center gap-2 mt-3 md:hidden">
    {images.map((_, idx) => (
      <button
        key={idx}
        onClick={() => setActiveImage(idx)}
        className={`h-2 rounded-full transition-all ${
          activeImage === idx
            ? "w-6 bg-black"
            : "w-2 bg-gray-300"
        }`}
      />
    ))}
  </div>
  {showMagnifier && (
  <div
    className="
      absolute
      z-[999]

      w-60 h-60

      border-2 border-black/20

      bg-white/20

      pointer-events-none

      shadow-lg
    "
    style={{
      left: `calc(${zoomPosition.x}% - 80px)`,
      top: `calc(${zoomPosition.y}% - 80px)`,
    }}
  />
)}
</Card>



<div
  className={`
    hidden xl:block
    absolute
    left-[calc(100%+24px)]
    top-0

    w-[620px]
    h-[620px]

    overflow-hidden
    bg-[#f5f5f3]

    border border-gray-200
    shadow-2xl

    z-50

    transition-all duration-300

    ${
      showMagnifier
        ? "opacity-100"
        : "opacity-0 pointer-events-none"
    }
  `}
  onMouseEnter={() => {
    setShowMagnifier(false);
  }}
>
    <div
      className="w-full h-full bg-no-repeat"
      style={{
        backgroundImage: `url(${images[activeImage]})`,
        backgroundSize: "250%",
        backgroundPosition: `
          ${Math.min(Math.max(zoomPosition.x, 15), 85)}%
          ${Math.min(Math.max(zoomPosition.y, 15), 85)}%
        `,
      }}
    />
  </div>
</div>

          {/* Thumbnails */}
       <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
  {images.map((img, idx) => (
    <img
      key={idx}
      src={img}
      alt={`${bundle.title} ${idx}`}
      className={`w-20 h-20 object-cover rounded-md cursor-pointer flex-shrink-0 border transition ${
        activeImage === idx
          ? "border-black"
          : "border-gray-200"
      }`}
      onClick={() => {
        setActiveImage(idx) 
        setTargetImage(idx)}
      }
    />
  ))}
</div>
        </div>
      </div>

      {/* Right: Scrollable Details */}
      <div className="md:w-[40%] flex flex-col  pr-2 md:h-auto md:overflow-y-visible">
        <h1 className="text-[44px] font-bold text-gray-900">{bundle.title}</h1>

        <p className="text-[19px] text-gray-700 leading-relaxed">
          {bundle.description ||
            "Check out this curated bundle of products for a complete style upgrade!"}
        </p>

        {/* Included Products */}
    


        {/* Price Section */}
        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-[30px] font-bold">
            ₹ {bundle.price?.toFixed(2)}
          </span>
          <span className="text-gray-500 text-lg font-medium flex items-baseline gap-1">
            MRP{" "}
            <span className="text-xl line-through text-gray-500">
              ₹ {(bundle.price * 1.2).toFixed(2)}
            </span>
          </span>
          <span className="text-[21px] font-semibold text-red-600">
            (20% OFF)
          </span>
        </div>

        <span className="text-green-700 text-[19px]">
          Inclusive of all taxes
        </span>

   <div className="flex flex-col gap-4 mt-4">
  {bundle.products.map((p) => (
    <div
      key={p._id}
      className="flex items-center justify-between gap-4 border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all bg-white"
    >
      {/* Left: Image + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
          <img
            src={p.images?.[0] || "/images/placeholder.png"}
            alt={p.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex flex-col justify-center truncate">
          <p className="font-medium text-black text-sm truncate">
            {p.title}
          </p>
          <p className="text-xs text-gray-500">₹{p.price}</p>
        </div>
      </div>

      {/* Right: Size selector */}
      <div className="flex-shrink-0 w-36">
        <Select
       value={selectedSizes[p._id] ?? ""}
                    onValueChange={(val) => handleSizeChange(p._id, val)}
        >
          <SelectTrigger className="w-full border-gray-300 rounded-lg focus:ring-1 focus:ring-black text-sm">
            <SelectValue placeholder="Select Size" />
          </SelectTrigger>
          <SelectContent>
            {(p.sizes || ["S", "M", "L", "XL", "XXL"]).map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  ))}
</div>

        <Separator className="my-4" />
        

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button className="w-1/2 flex items-center justify-center gap-2 text-xl py-6" onClick={() => addBundleToCart(bundle, selectedSizes)}>
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              className={`w-1/2 flex items-center justify-center gap-2 border-black text-black hover:bg-pink-50 text-xl py-6`}
              onClick={() => setWishlisted(!wishlisted)}
            >
              <Heart
                className={`w-5 h-5 ${wishlisted ? "fill-black text-black" : ""
                  }`}
              />
              Wishlist
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-brand-600 text-brand-600 hover:bg-brand-50 text-xl py-6"
          >
            <CreditCard className="w-5 h-5" />
            Buy Now
          </Button>
        </div>

        {/* Offers */}
        <div className="flex flex-col gap-3 mt-6">
          {[
            "EXTRA 10% OFF ON PURCHASE OF ₹ 2999",
            "EXTRA 10% OFF ON PURCHASE OF ₹ 3299",
          ].map((offer, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-3 flex items-center gap-3 hover:bg-gray-50 transition"
            >
              <div className="p-2 bg-brand-100 rounded-full">
                <Gift className="w-6 h-6 text-brand-600" />
              </div>
              <p className="text-[16px] font-medium text-gray-800">{offer}</p>
            </div>
          ))}
        </div>

        {/* Accordion */}
        {/* Accordion Section */}
        <Accordion type="single" collapsible className="text-xl w-full mt-6">
          {/* Description */}
          <AccordionItem value="description">
            <AccordionTrigger>DESCRIPTION</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-700 text-base leading-relaxed">
                {bundle.description ||
                  "A thoughtfully curated bundle that brings comfort, style, and quality together. Perfect for any occasion and built to last with premium materials."}
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Product Details & Care */}
          <AccordionItem value="details">
            <AccordionTrigger>PRODUCT Details & Care</AccordionTrigger>
            <AccordionContent>
              <ul className="text-gray-700 text-base space-y-2 list-disc pl-5">
                <li>Material: 100% premium cotton</li>
                <li>Fit: Regular / Relaxed</li>
                <li>Wash care: Machine wash cold, tumble dry low</li>
                <li>Made in India</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Shipping & Payment */}
          <AccordionItem value="shipping">
            <AccordionTrigger>Shipping & Payment</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-700 text-base">
                <strong>Shipping:</strong> Metros 2–4 days • Rest of India 3–6 days<br />
                <strong>Payment:</strong> We accept Credit/Debit Cards, UPI, Net Banking & Wallets.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Return & Exchange */}
          <AccordionItem value="returns">
            <AccordionTrigger>Return & Exchange</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-700 text-base">
                Returns accepted only for defective or incorrect items. Exchange available within 7 days of delivery.
                For support, contact <strong>urbanfits519@gmail.com</strong>.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </div>


    </div>
  );



}
