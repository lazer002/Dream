// src/pages/ProductDetail.jsx
import { useState, useEffect } from "react"
import ProductCard from "../components/ProductCard.jsx"
import { useParams } from "react-router-dom"
import { useCart } from "../state/CartContext.jsx"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

export default function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [openZoom, setOpenZoom] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data)
        if (data.sizes?.length) setSelectedSize(data.sizes[0])
      })
  }, [id])

  if (!product) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  return (
    <div className="flex flex-col md:flex-row gap-12 min-h-screen p-6">
      {/* Left: Images */}
      <div className="md:w-1/2 flex flex-col gap-3">
        <div className="sticky top-24">
          <Card className="relative overflow-hidden border-0 cursor-zoom-in" onClick={() => setOpenZoom(true)}>
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="w-full h-[450px] object-cover rounded-md"
            />
          </Card>

          {/* Thumbnail Previews */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
            {product.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.title} ${idx}`}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer flex-shrink-0 border transition ${
                  activeImage === idx ? "border-brand-600" : "border-gray-200"
                }`}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Info */}
      <div className="md:w-1/2 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 48px)" }}>
        <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold text-brand-600">₹{product.price?.toFixed(2)}</span>
          {product.discount && <Badge variant="secondary">{product.discount}% OFF</Badge>}
        </div>

        <p className="text-gray-700 leading-relaxed">
          Elevate your style with the <strong>{product.title}</strong>. Crafted from premium 100% cotton, this piece
          ensures unmatched comfort while maintaining a breathable, relaxed fit.
        </p>

        <Separator className="my-4" />

        {/* Size Selection */}
        {product.sizes && (
          <div className="flex flex-col gap-2">
            <label className="font-medium">Size:</label>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {product.sizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quantity */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="font-medium">Quantity:</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border rounded-md w-24 px-2 py-1"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-3">
          <Button className="w-full" onClick={() => add(product._id, quantity)}>
            Add to Cart
          </Button>
          <Button variant="outline" className="w-full border-brand-600 text-brand-600 hover:bg-brand-50">
            Buy Now
          </Button>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="mt-6 w-full">
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
  <DialogContent className="relative w-screen h-screen max-w-full max-h-full p-0 bg-black flex items-center justify-center">
    
    {/* ✅ Close Button (always top-right, outside carousel) */}
    <DialogClose asChild>
      <button
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/20 hover:bg-white/40 transition"
      >
        <X className="w-6 h-6 text-black" />
      </button>
    </DialogClose>

    {/* ✅ Carousel Container */}
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Image */}
      <img
        src={product.images[activeImage]}
        alt={product.title}
        className="max-h-[90vh] max-w-full object-contain mx-auto"
      />

      {/* Left Arrow */}
      {product.images.length > 1 && (
        <button
          onClick={prevImage}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/20 hover:bg-white/40"
        >
          <ChevronLeft className="w-7 h-7 text-black" />
        </button>
      )}

      {/* Right Arrow */}
      {product.images.length > 1 && (
        <button
          onClick={nextImage}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/20 hover:bg-white/40"
        >
          <ChevronRight className="w-7 h-7 text-black" />
        </button>
      )}
    </div>
  </DialogContent>
</Dialog>

    </div>
  )
}
