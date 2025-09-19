import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export default function ProductImageGallery({ images }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openGallery = (index) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    )
  }

  return (
    <>
      {/* Big Product Image */}
      <div className="relative">
        <img
          src={images[0]}
          alt="Product"
          className="w-full h-96 object-cover rounded-lg cursor-pointer"
          onClick={() => openGallery(0)}
        />
      </div>

      {/* Fullscreen Modal Gallery */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-full max-h-full bg-black/95 text-white p-0">
          <div className="relative w-screen h-screen flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Image */}
            <img
              src={images[currentIndex]}
              alt="Zoomed Product"
              className="max-h-[90%] max-w-[90%] object-contain"
            />

            {/* Left Arrow */}
            {images.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-6 p-2 bg-black/50 rounded-full hover:bg-black/70"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Right Arrow */}
            {images.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-6 p-2 bg-black/50 rounded-full hover:bg-black/70"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
