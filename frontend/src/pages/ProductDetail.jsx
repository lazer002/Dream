// src/pages/ProductDetail.jsx
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useCart } from "../state/CartContext.jsx"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X, ShoppingCart, Heart, CreditCard, Gift } from "lucide-react"
import api from "@/utils/config"
import toast from "react-hot-toast"
import { useWishlist } from "../state/WishlistContext.jsx";
export default function ProductDetail() {
    const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { id } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [activeImage, setActiveImage] = useState(0)
  const [openZoom, setOpenZoom] = useState(false)  
  const [loading, setLoading] = useState(true)
  const [showMagnifier, setShowMagnifier] =
    useState(false)
  const [showRequest, setShowRequest] = useState(false);
const [request, setRequest] = useState({
  email: "",
  size: "",
});


  const [zoomPosition, setZoomPosition] =
    useState({ x: 50, y: 50 })
  const [mousePosition, setMousePosition] =
    useState({ x: 0, y: 0 })

  const magnifierTimeout = useRef(null)



  const handleRequestSubmit = async () => {
  if (!request.email || !request.size) {
    toast.error("Please fill all fields");
    return;
  }

  try {
    await api.post("/product-request", {
      productId: product._id,
      email: request.email,
      size: request.size,
    });

    toast.success("We’ll notify you when available 🚀");

    setShowRequest(false);
    setRequest({ email: "", size: "" });

  } catch (err) {
    console.error(err);
    toast.error("Failed to send request");
  }
};



  useEffect(() => {
    const getProduct = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data)
        setActiveImage(0) // reset image index when product changes
      } catch (error) {
        console.error("Failed to fetch product:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) getProduct()
  }, [id])

  useEffect(() => {
    if (!product?.category) return

    const fetchRecommended = async () => {
      try {
        const params = new URLSearchParams()
        params.append("limit", 3)
        params.append("page", 1)

        const categoryValue =
          typeof product.category === "string"
            ? product.category
            : product.category?.name || product.category?._id

        if (categoryValue) params.append("category", categoryValue)

        const res = await api.get("/products", {
          params: Object.fromEntries(params.entries()),
        })

        // filter out the same product
        const items = res.data?.items || []
        const filtered = items.filter((p) => p._id !== product._id)
        setRecommendedProducts(filtered)
      } catch (error) {
        console.error("Failed to fetch related products:", error)
      }
    }

    fetchRecommended()
  }, [product])

  // Safety: if product isn't loaded show a friendly loading UI
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading product...</div>
  }

  if (!product) {
    return <div className="p-8 text-center text-red-600">Product not found.</div>
  }

  const images = Array.isArray(product.images) && product.images.length ? product.images : ["/images/placeholder.png"]
  const imageCount = images.length

  const nextImage = () => {
    if (imageCount <= 1) return
    setActiveImage((prev) => (prev + 1) % imageCount)
  }

  const prevImage = () => {
    if (imageCount <= 1) return
    setActiveImage((prev) => (prev - 1 + imageCount) % imageCount)
  }

  const price = Number(product.price ?? 0)
  const mrp = (price * 1.2)

  const handleAddToCart = () => {
    // If inventory exists and has multiple sizes, require a selection
    if (product.inventory && Object.keys(product.inventory).length > 0) {
      // check if there is at least one available size
      const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"].filter((s) => (product.inventory?.[s] || 0) > 0)
      if (availableSizes.length && !selectedSize) {
        toast.error("Please select a size before adding to cart.")
        return
      }
    }
    add(product._id, selectedSize || null)
  }


  // inside the component
  const handleBuyNow = () => {
    // Check size requirement first (same logic as handleAddToCart)
    if (product.inventory && Object.keys(product.inventory).length > 0) {
      const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"].filter(s => (product.inventory?.[s] || 0) > 0)
      if (availableSizes.length && !selectedSize) {
        toast.error("Please select a size before buying.")
        return
      }
    }

    // add to cart then navigate
    add(product._id, selectedSize || null)
    navigate("/checkout")
  }

  const isOutOfStock = Object.values(product.inventory || {}).every(q => q === 0);

const handleWishlist = (e) => {
  e.preventDefault();
  e.stopPropagation();

  wishlisted
    ? removeFromWishlist(product._id)
    : addToWishlist(product._id);
};
const wishlisted = wishlist.includes(product._id);
  return (
    <>
      <div
        className="
    flex flex-col
    md:flex-row

    gap-12

    p-6

    relative
    items-start
  "
      >
        {/* Left: Images */}
        <div
          className="
    md:w-1/2
    flex gap-4

    sticky
    top-24

    self-start

    h-fit
  "
        >

          {/* THUMBNAILS */}
          <div className="flex flex-col gap-3">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.title} ${idx}`}

                onClick={() => setActiveImage(idx)}

                className={`
          w-20 h-24

          object-cover

          rounded-md

          cursor-pointer

          border

          transition-all duration-300

          ${activeImage === idx
                    ? "border-black opacity-100"
                    : "border-gray-200 opacity-60 hover:opacity-100"
                  }
        `}
              />
            ))}
          </div>

          {/* MAIN IMAGE + MAGNIFIER */}
          <div
            className="
      flex-1
      flex gap-6
    "

            onMouseEnter={() => {

              if (magnifierTimeout.current) {
                clearTimeout(magnifierTimeout.current)
              }

              setShowMagnifier(true)
            }}

            onMouseLeave={() => {

              magnifierTimeout.current =
                setTimeout(() => {
                  setShowMagnifier(false)
                }, 120)

            }}
          >

            {/* MAIN IMAGE */}
            <Card
              className="
        relative

        overflow-hidden

        border-0

        flex-1

        bg-[#f5f5f3]

        cursor-crosshair
      "

              onMouseMove={(e) => {

                const {
                  left,
                  top,
                  width,
                  height,
                } =
                  e.currentTarget.getBoundingClientRect()

                const x =
                  ((e.clientX - left) / width) * 100

                const y =
                  ((e.clientY - top) / height) * 100

                setZoomPosition({ x, y })

                setMousePosition({
                  x: e.clientX,
                  y: e.clientY,
                })
              }}
            >

              <img
                src={images[activeImage]}
                alt={
                  product.title ??
                  "Product image"
                }

                className="
          w-full
          max-h-[82vh]

          object-cover
        "
              />

              {/* MAGNIFIER LENS */}


            </Card>
            {showMagnifier && (
              <div
                className="
            absolute
z-[999]
            w-44 h-44
            rounded-full

            border border-white/80

        bg-white/30
backdrop-blur-md
ring-2 ring-white/60
            pointer-events-none

            shadow-[0_10px_40px_rgba(0,0,0,0.18)]
          "

                style={{
                  left: `calc(${zoomPosition.x}% - 88px)`,

                  top: `calc(${zoomPosition.y}% - 88px)`,
                }}
              />
            )}

            {/* ZOOM PREVIEW */}
            <div
              className={`
        hidden xl:block

        fixed
isolate
        right-1/4
        top-32

        w-[620px]
        h-[620px]

        overflow-hidden

        bg-[#f5f5f3]

        border border-gray-200

        shadow-2xl

        z-[44444]

        transition-all duration-300

        ${showMagnifier
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 pointer-events-none"
                }
      `}
            >

              <div
                className="
          w-full h-full

          bg-no-repeat
        "

                style={{
                  backgroundImage: `url(${images[activeImage]})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "250%",

                  backgroundPosition: `
  ${Math.min(Math.max(zoomPosition.x, 15), 85)}%
  ${Math.min(Math.max(zoomPosition.y, 15), 85)}%
`,
                }}
              />

            </div>

          </div>

        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 flex flex-col gap-4 " >
          <h1 className="text-[44px] font-bold text-gray-900">{product.title}</h1>

          <p className="text-[19px] text-gray-700 leading-relaxed">
            Elevate your style with the <strong>{product.title}</strong>. Crafted from premium 100% cotton, this piece ensures unmatched comfort while maintaining a breathable, relaxed fit.
          </p>

          <div className="flex items-baseline gap-3">
            {/* Discounted / Current Price */}
            <span className="text-[30px] font-bold ">
              ₹ {price.toFixed(2)}
            </span>

            {/* Original MRP — 20% higher, crossed out */}
            <span className="text-gray-500 text-lg font-medium flex items-baseline gap-1">
              MRP
              <span className="text-xl line-through text-gray-500">
                ₹ {mrp.toFixed(2)}
              </span>
            </span>

            {/* Optional Discount Label */}
            <span className="text-[21px] font-semibold text-red-600">
              (20% OFF)
            </span>
          </div>

          <span className="text-green-700 text-[19px]">Inclusive of all taxes</span>
           {isOutOfStock && (
            <div  className="px-3 text-lg font-semibold text-white bg-red-600 rounded-full w-max">
              Out of Stock
            </div>
          )}
          <Separator className="my-4" />

          {/* Size Selection */}
          {product.inventory && (
            <div className="flex flex-col gap-4">
              <label className="font-medium text-xl text-black">Select Size</label>

              <div className="flex gap-3 px-2 flex-wrap" >
                {["XS", "S", "M", "L", "XL", "XXL"].map((size) => {
                  const count = product.inventory[size] || 0
                  const isAvailable = count > 0

                  return (
                    <button
                      key={size}
                      onClick={() =>
                        isAvailable &&
                        setSelectedSize(size)
                      }

                      className={`
      w-14 h-14

      flex items-center
      justify-center

      rounded-full

      border

      text-base
      font-semibold

      transition-all
      duration-300
      ease-out

      ${selectedSize === size
                          ? `
            bg-black
            text-white
            border-black

            shadow-lg
          `
                          : `
            bg-white
            text-gray-700
            border-gray-300

            hover:border-black
            hover:-translate-y-[2px]
            hover:shadow-md
          `
                        }

      ${!isAvailable
                          ? `
            bg-gray-100
            text-gray-400
            border-gray-200

            cursor-not-allowed
            opacity-50

            hover:translate-y-0
            hover:shadow-none
          `
                          : ""
                        }
    `}

                      disabled={!isAvailable}

                      aria-pressed={
                        selectedSize === size
                      }

                      aria-label={`
      Size ${size}
      ${isAvailable
                          ? "available"
                          : "out of stock"
                        }
    `}
                    >
                      {size}
                    </button>
                  )
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
          {!isOutOfStock ? (
          <div className="mt-4 flex flex-col gap-3">
            {/* Row 1: Cart + Wishlist */}
            <div className="flex gap-3">
              <Button
                className="w-1/2 flex items-center justify-center gap-2 text-xl py-6"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </Button>

            <Button
  variant="outline"
  className={`
    w-1/2 flex items-center justify-center gap-2
    border-black text-black
    hover:bg-gray-100
    text-base py-6
    transition-all duration-200
  `}
  onClick={handleWishlist}
  aria-pressed={wishlisted}
>
  <Heart
    className={`
      w-5 h-5 transition-all
      ${wishlisted
        ? "fill-black text-black"
        : "text-black"
      }
    `}
  />

  {wishlisted ? "Wishlisted" : "Add to Wishlist"}
</Button>
            </div>

            {/* Row 2: Buy Now */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-brand-600 text-brand-600 hover:bg-brand-50 text-xl py-6"
              onClick={handleBuyNow}
            >
              <CreditCard className="w-5 h-5" />
              Buy Now
            </Button>
          </div>
  ) : (
     <div className="mt-4 flex flex-col gap-3">
<div className="flex  gap-3">

  {/* DISABLED */}
    <Button
                className="w-1/2 flex items-center justify-center gap-2 text-xl py-6 bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100"
                
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </Button>

  {/* REQUEST */}
  <Button
    onClick={() =>
      setShowRequest(true)
    }
    className="
      flex-1

      py-6

      text-lg

      bg-black
      text-white

      hover:bg-neutral-800

    "
  >
    Request Product
  </Button>

</div>
</div>
  )}
</div>

          <Separator className="my-4" />

          <div className=" flex flex-col gap-3">
            <p className="text-2xl font-semibold text-black">Offers For You</p>

            {/* Offer 1 */}
            <div className="border rounded-lg p-3 flex items-center gap-3 hover:bg-gray-50 transition  hover:-translate-y-[2px] hover:shadow-md">
              <div className="p-2 bg-brand-100 rounded-full">
                <Gift className="w-6 h-6 text-brand-600" />
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
                  <strong>garrib@gmail.com</strong>.
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
    {showRequest && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    
    {/* Modal box */}
    <div className="bg-white w-full max-w-md p-6 rounded-lg relative">

      {/* Close button */}
      <button
        className="absolute top-3 right-3 text-xl"
        onClick={() => setShowRequest(false)}
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4">
        Get Notified
      </h2>

      {/* Email */}
      <div className=" border-b py-3">
      <input
        type="email"
        placeholder="Enter your email"
        value={request.email}
        onChange={(e) =>
          setRequest({ ...request, email: e.target.value })
        }
        className="w-full border"
      />
</div>
      {/* Size */}
<div className="border-b py-4">
  <p className="text-sm font-semibold mb-3 tracking-wide uppercase">
    Select Size
  </p>

  <div className="flex flex-wrap gap-2">
    {Object.keys(product.inventory || {}).map((size) => {
      const isSelected = request.size === size;

      return (
        <button
          key={size}
          type="button"
          onClick={() => setRequest({ ...request, size })}
          className={`px-4 py-2 border text-sm font-medium transition-all duration-200
            ${
              isSelected
                ? "bg-black text-white border-black"
                : "bg-white text-black border-gray-300 hover:border-black"
            }
          `}
        >
          {size}
        </button>
      );
    })}
  </div>
</div>
      {/* Submit */}
      <button
        onClick={handleRequestSubmit}
        className="w-full bg-black text-white py-3 font-bold"
      >
        Notify Me
      </button>
    </div>
  </div>
)}
      </div>

      {/* You Might Be Interested Section */}
      <section className="mt-12 container px-6 pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          You Might Be Interested
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recommendedProducts.length ? (
            recommendedProducts.map((prod) => (
              <div
                key={prod._id}
                onClick={() => navigate(`/product/${prod.slug || prod._id}`)}
                className="group relative rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/product/${prod.slug || prod._id}`) }}
              >
                <div className="relative w-full h-80 overflow-hidden">
                  <img
                    src={prod.images?.[0] || "/images/placeholder.png"}
                    alt={prod.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition" />
                </div>

                <div className="absolute bottom-4 left-4 right-4 group-hover:text-white transition">
                  <h3 className="font-semibold text-lg truncate">{prod.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className=" font-bold text-sm group-hover:text-white transition">
                      ₹ {Number(prod.price ?? 0).toLocaleString()}
                    </span>
                    <span className=" text-xs group-hover:text-white transition">Inclusive of taxes</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No recommendations at the moment.</p>
          )}
        </div>
      </section>
    </>
  )
}