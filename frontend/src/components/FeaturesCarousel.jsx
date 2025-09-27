"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Truck, Headphones, CreditCard } from "lucide-react";

const FeaturesCarousel = () => {
  const features = [
    {
      icon: <Truck className="w-12 h-12 text-gray-900 mx-auto" />,
      title: "Free Product Shipping",
      description: "Available across India",
    },
    {
      icon: <Headphones className="w-12 h-12 text-gray-900 mx-auto" />,
      title: "Helpful Customer Support",
      description: "Monday to Friday 10 am - 7 pm",
    },
    {
      icon: <CreditCard className="w-12 h-12 text-gray-900 mx-auto" />,
      title: "Secure & Smooth Payment",
      description: "Includes Credit Card, UPI, and COD",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-gray-900">
          Why Choose Us
        </h2>

        <Swiper
          modules={[Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          pagination={false} // Disable default Swiper pagination
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-8"
        >
          {features.map((feature, index) => (
            <SwiperSlide key={index}>
              <div
                className={`p-8 flex flex-col items-center text-center transition-all duration-300 cursor-pointer
                  ${
                    index !== features.length - 1
                      ? "border-r border-gray-300 lg:border-r"
                      : ""
                  }`}
              >
                {feature.icon}
                <h3 className="text-xl font-bold text-[16px] text-gray-900 mt-4 mb-2 uppercase">
                  {feature.title}
                </h3>
                <p className="text-gray-700 font-bold text-[12px]">{feature.description}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination Dots */}
        <div className="flex justify-center mt-6 space-x-2 md:hidden">
          {features.map((_, index) => (
            <span
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
                activeIndex === index ? "bg-gray-900" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesCarousel;
