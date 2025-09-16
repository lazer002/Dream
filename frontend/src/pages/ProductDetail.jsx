// src/pages/ProductDetail.jsx
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useCart } from "../state/CartContext.jsx"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

export default function ProductDetail() {
  const { id } = useParams()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data)
        if (data.sizes?.length) setSelectedSize(data.sizes[0])
      })
  }, [id])

  if (!product) return <div>Loading...</div>

  return (
<div className="flex flex-col md:flex-row gap-12 min-h-screen p-6">
  {/* Left: Images */}
  <div className="md:w-1/2 flex flex-col gap-3">
    <div className="sticky top-24"> {/* Sticky with offset from top (header height) */}
      <Card className="overflow-hidden">
        <img
          src={product.images[activeImage]}
          alt={product.title}
          className="w-full h-[400px] object-cover rounded-md"
        />
      </Card>
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
    <h1 className="text-3xl font-bold">{product.title}</h1>
    <div className="flex items-center gap-3">
      <span className="text-2xl font-semibold text-brand-600">${product.price?.toFixed(2)}</span>
      {product.discount && <Badge variant="secondary">{product.discount}% OFF</Badge>}
    </div>

    {/* Detailed description */}
    <p className="text-gray-700">
      Elevate your style with the <strong>{product.title}</strong>. Crafted from premium 100% cotton, this piece ensures
      unmatched comfort while maintaining a breathable, relaxed fit. Ideal for casual outings, streetwear looks, or
      layering with jackets, it merges modern aesthetics with timeless durability.
    </p>

    <ul className="list-disc pl-5 text-gray-700 mt-2">
      <li>Unisex design for versatile styling</li>
      <li>Soft, breathable, and durable fabric (240 GSM)</li>
      <li>Screen print / DTF detailing for vibrant graphics</li>
      <li>Made in India with quality craftsmanship</li>
      <li>Perfectly oversized fit for layering or casual wear</li>
    </ul>

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

    {/* Add to Cart */}
    <Button className="mt-4 w-full" onClick={() => add(product._id, quantity)}>
      Add to Cart
    </Button>

    {/* Accordion: Details */}
    <Accordion type="single" collapsible className="mt-6 w-full">
      <AccordionItem value="wash-care">
        <AccordionTrigger>Wash Care</AccordionTrigger>
        <AccordionContent className="overflow-hidden transition-all duration-300">
          <ul className="list-disc pl-5 text-gray-700">
            <li>Use cold water to prevent fading & shrinking</li>
            <li>Avoid harsh detergents & turn inside out before washing</li>
            <li>Do not bleach or tumble dry to maintain print quality</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="delivery">
        <AccordionTrigger>Delivery / Shipping</AccordionTrigger>
        <AccordionContent className="overflow-hidden transition-all duration-300">
          <p className="text-gray-700">
            <strong>Average Processing Time:</strong>
          </p>
          <ul className="list-disc pl-5 text-gray-700">
            <li><strong>Metros:</strong> 2-4 business days (excluding holidays)</li>
            <li><strong>Rest of India:</strong> 3-6 business days (excluding holidays)</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="returns">
        <AccordionTrigger>Returns & Exchange</AccordionTrigger>
        <AccordionContent className="overflow-hidden transition-all duration-300">
          <p className="text-gray-700">
            We accept returns and exchanges for defective or incorrect items. Please refer to the size chart before
            ordering, as incorrect size selections cannot be refunded. Exchange shipping fee: ₹399. For assistance,
            contact <strong>urbanfits519@gmail.com</strong>.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="offers">
        <AccordionTrigger>Offers</AccordionTrigger>
        <AccordionContent className="overflow-hidden transition-all duration-300">
          <ul className="list-disc pl-5 text-gray-700">
            <li>Add any 2 products + 1 tank top to your cart</li>
            <li>Apply code <strong>BUY2GET1</strong> at checkout to get the tank top free</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>

</div>

  )
}
