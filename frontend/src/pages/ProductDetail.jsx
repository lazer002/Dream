// src/pages/ProductDetail.jsx
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useCart } from "../state/CartContext.jsx"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X, ShoppingCart, Heart, CreditCard, Gift } from "lucide-react"
import axios from "axios"
import api  from "@/utils/config.jsx"
export default function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  const [activeImage, setActiveImage] = useState(0)
  const [openZoom, setOpenZoom] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

useEffect(() => {
  const getProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
    
    } catch (error) {
      console.error("Failed to fetch product:", error);
    }
  };

  getProduct();
}, [id]);

useEffect(() => {
  if (!product?.category) return;
console.log("Fetching recommended products for category:", product);
  const fetchRecommended = async () => {
    try {
      const params = new URLSearchParams();
      params.append("limit", 3);
      params.append("page", 1);

      const categoryValue =
        typeof product.category === "string"
          ? product.category
          : product.category.name || product.category._id;

      if (categoryValue) params.append("category", categoryValue);

      const res = await api.get("/products", {
        params: Object.fromEntries(params.entries()),
      });

      // filter out the same product
      const filtered = (res.data.items || []).filter(
        (p) => p._id !== product._id
      );

      setRecommendedProducts(filtered);
    } catch (error) {
      console.error("Failed to fetch related products:", error);
    }
  };

  fetchRecommended();
}, [product]);

  if (!recommendedProducts.length) return null;

  // if (!product) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length)
  }


// console.log("Product:", product); 
  return (
    <>
    <div className="flex flex-col md:flex-row gap-12 min-h-screen p-6 relative">
      {/* Left: Images */}
      <div className="md:w-1/2 flex flex-col gap-3">
        <div className="sticky top-24">
          <Card className="relative overflow-hidden border-0 cursor-zoom-in" onClick={() => setOpenZoom(true)}>
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="w-full h-[80vh] object-cover rounded-md"
            />
          </Card>

          {/* Thumbnail Previews */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
            {product.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.title} ${idx}`}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer flex-shrink-0 border transition ${activeImage === idx ? "border-brand-600" : "border-gray-200"
                  }`}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Info */}
      <div className="md:w-1/2 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 48px)" }}>
        <h1 className="text-[44px] font-bold text-gray-900">{product.title}</h1>
    

        <p className="text-[19px] text-gray-700 leading-relaxed">
          Elevate your style with the <strong>{product.title}</strong>. Crafted from premium 100% cotton, this piece
          ensures unmatched comfort while maintaining a breathable, relaxed fit.
        </p>
<div className="flex items-baseline gap-3">
  {/* Discounted / Current Price */}
  <span className="text-[30px] font-bold ">
    ₹ {product.price?.toFixed(2)}
  </span>

  {/* Original MRP — 20% higher, crossed out */}
  <span className="text-gray-500 text-lg font-medium flex items-baseline gap-1">
    MRP
    <span className="text-xl line-through text-gray-500">
      ₹ {(product.price * 1.2).toFixed(2)}
    </span>
  </span>

  {/* Optional Discount Label */}
  <span className="text-[21px] font-semibold text-red-600">
    (20% OFF)
  </span>
</div>


          <span className="text-green-700 text-[19px]">Inclusive of all taxes</span>
        <Separator className="my-4" />

        {/* Size Selection */}
{product.inventory && (
  <div className="flex flex-col gap-4">
    <label className="font-medium text-xl text-black">Select Size</label>

    <div className="flex gap-3 px-2 flex-wrap">
      {["XS", "S", "M", "L", "XL", "XXL"].map((size) => {
        const count = product.inventory[size] || 0;
        const isAvailable = count > 0;

        return (
          <button
            key={size}
            onClick={() => isAvailable && setSelectedSize(size)}
            className={`w-14 h-14 flex items-center justify-center rounded-full border text-base font-semibold
              transition-all duration-300 ease-in-out transform
              ${
                selectedSize === size
                  ? "bg-black text-white border-black scale-110 shadow-md shadow-gray-400"
                  : "bg-white text-gray-700 border-gray-300 hover:border-black hover:scale-105"
              }
              ${
                !isAvailable
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                  : ""
              }`}
            disabled={!isAvailable}
          >
            {size}
          </button>
        );
      })}
    </div>

    {selectedSize && (
      <p className="text-sm text-gray-700 mt-2">
        Selected Size: <span className="font-semibold">{selectedSize}</span>
      </p>
    )}
  </div>
)}







        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-3">
          {/* Row 1: Cart + Wishlist */}
          <div className="flex gap-3">
            <Button
              className="w-1/2 flex items-center justify-center gap-2 text-xl py-6"
              onClick={() => add(product._id,selectedSize)}
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>

            <Button
              variant="outline"
              className={`w-1/2 flex items-center justify-center gap-2 border-black text-black hover:bg-pink-50 text-xl py-6 `}
              onClick={() => setWishlisted(!wishlisted)}
            >
              <Heart
                className={`w-5 h-5 ${wishlisted ? "fill-black text-black" : ""}`}
              />
              Wishlist
            </Button>
          </div>

          {/* Row 2: Buy Now */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-brand-600 text-brand-600 hover:bg-brand-50 text-xl py-6"
          >
            <CreditCard className="w-5 h-5" />
            Buy Now
          </Button>
        </div>


        <Separator className="my-4" />

        <div className=" flex flex-col gap-3">
          <p className="text-2xl font-semibold text-black">Offers For You</p>

          {/* Offer 1 */}
{/* Offer Box with slow blinking animation */}
<div className="border rounded-lg p-3 flex items-center gap-3 hover:bg-gray-50 transition animate-blink">
  <div className="p-2 bg-brand-100 rounded-full">
    <Gift className="w-6 h-6 text-brand-600 " />
  </div>
  <div className="flex flex-col">
    <p className="text-[16px] font-medium text-gray-800">
      EXTRA 10% OFF ON PURCHASE OF ₹ 2999
    </p>
    <p className="text-[14px] text-gray-600">NORETURN</p>
  </div>
</div>


          {/* Offer 2 */}
          <div className="border rounded-lg p-3 flex items-center gap-3 hover:bg-gray-50 transition">
            <div className="p-2 bg-brand-100 rounded-full">
              <Gift className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex flex-col">
              <p className="text-[16px] font-medium text-gray-800">EXTRA 10% OFF ON PURCHASE OF ₹ 3299</p>
              <p className="text-[14px] text-gray-600">LEVI10</p>
            </div>
          </div>
        </div>



        {/* Accordion */}
        <Accordion type="single" collapsible className="text-xl w-full">
          <AccordionItem value="wash-care">
            <AccordionTrigger>Wash Care</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Use cold water to prevent fading & shrinking</li>
                <li>Avoid harsh detergents & wash inside out</li>
                <li>Do not bleach or tumble dry</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="delivery">
            <AccordionTrigger>Delivery / Shipping</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-700">
                <strong>Metros:</strong> 2–4 days • <strong>Rest of India:</strong> 3–6 days
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="returns">
            <AccordionTrigger>Returns & Exchange</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-700 text-sm">
                Returns accepted for defective/incorrect items. Exchange fee: ₹399. Contact{" "}
                <strong>urbanfits519@gmail.com</strong>.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="offers">
            <AccordionTrigger>Offers</AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-700 text-sm">
                Add 2 products + 1 tank top → Apply code <strong>BUY2GET1</strong>.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>


      {/* Fullscreen Image Zoom Modal */}
      <Dialog open={openZoom} onOpenChange={setOpenZoom}>
        <DialogContent
          className="fixed inset-0 w-screen h-screen max-w-none max-h-none p-0 bg-black flex items-center justify-center rounded-none"
        >
          {/* ✅ Close Button */}
          <DialogClose asChild>
            <button className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-200 hover:bg-gray-400 transition">
              <X className="w-6 h-6 text-black" />
            </button>
          </DialogClose>

          {/* ✅ Carousel Container */}
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Image */}
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="max-h-full max-w-full object-contain"
            />

            {/* Left Arrow */}
            {product.images.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-gray-200 hover:bg-gray-400"
              >
                <ChevronLeft className="w-7 h-7 text-black" />
              </button>
            )}

            {/* Right Arrow */}
            {product.images.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-gray-200 hover:bg-gray-400"
              >
                <ChevronRight className="w-7 h-7 text-black" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>


    </div>


{/* You Might Be Interested Section */}
 <section className="mt-12 container px-6 pb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        You Might Be Interested
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {recommendedProducts.map((prod) => (
          <div
            key={prod._id}
            onClick={() => navigate(`/product/${prod.slug || prod._id}`)}
            className="group relative rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition"
          >
            {/* Product Image */}
            <div className="relative w-full h-80 overflow-hidden">
              <img
                src={prod.images?.[0] || "/images/placeholder.png"}
                alt={prod.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition" />
            </div>

            {/* Text Overlay */}
            <div className="absolute bottom-4 left-4 right-4 group-hover:text-white transition">
              <h3 className="font-semibold text-lg truncate">{prod.title}</h3>
              <div className="flex items-center gap-2">
                <span className=" font-bold text-sm group-hover:text-white transition">
                  ₹ {prod.price?.toLocaleString() || "N/A"}
                </span>
                <span className=" text-xs group-hover:text-white transition">Inclusive of taxes</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>






</>
  )
}
