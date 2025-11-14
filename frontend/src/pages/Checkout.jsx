import { useState } from "react";
import { Input } from "@/components/ui/input";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/CustomCheckbox.jsx";
import { useCart } from "@/state/CartContext";
import api  from "@/utils/config";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {Loader2 } from "lucide-react";
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items , clearCart } = useCart();
  const [shippingMethod, setShippingMethod] = useState("free");
  const [billingSame, setBillingSame] = useState(true);
  const [contactEmail, setContactEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Delhi");
  const [zip, setZip] = useState("110045");
  const [country, setCountry] = useState("India");
  const [phone, setPhone] = useState("");
  const [subscribeNews, setSubscribeNews] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
 const [discountCode, setDiscountCode] = useState("");
const [discountValue, setDiscountValue] = useState(0);
const [discountError, setDiscountError] = useState("");
const [discountSuccess, setDiscountSuccess] = useState("");
const [loadingDiscount, setLoadingDiscount] = useState(false);


const applyDiscount = async () => {
  if (!discountCode.trim()) return;
  setLoadingDiscount(true);
  setDiscountError("");
  setDiscountSuccess("");

  try {
    const res = await api.post("/discounts/validate", { code: discountCode });
    if (res.data?.valid) {
      setDiscountValue(res.data.amount);
      setDiscountSuccess(`Code "${discountCode}" applied!`);
      // optionally adjust your subtotal or total
      setSubtotal((prev) => prev - res.data.amount);
    } else {
      setDiscountError("Invalid or expired discount code.");
      setDiscountValue(0);
    }
  } catch (err) {
    console.error(err);
    setDiscountError("Something went wrong while validating the code.");
  } finally {
    setLoadingDiscount(false);
  }
};

  const subtotal = items.reduce((sum, i) => {
    return sum + (i.bundle?.price || i.product?.price || 0) * i.quantity;
  }, 0);

  const handlePayment = async () => {
    try {
      const orderData = {
        items: items.map((i) => ({
          productId: i.product?._id,
          quantity: i.quantity,
          price: i.product?.price,
          title: i.product?.title

        })),
        subtotal,
        shipping: 100,
        total: subtotal + 100,
        shippingMethod,
        billingSame,
        contactEmail,
        source: "web",
        shippingAddress: {
          firstName,
          lastName,
          address,
          apartment,
          city,
          state,
          zip,
          country,
          phone
        },
      };

      const response = await api.post("/create", orderData);
      const data = response.data;

      const options = {
        key: import.meta.env.VITE_PUBLIC_RAZORPAY_KEY,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        handler: async (res) => {
          await api.post("/api/payment-success", {
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_order_id: res.razorpay_order_id,
            razorpay_signature: res.razorpay_signature
          });
          alert("Payment Successful!");
        },
        prefill: {
          name: `${firstName} ${lastName}`,
          email: contactEmail,
          contact: phone
        },
        theme: { color: "#000000" }
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Check console for details.");
    }
  };

const handleCODOrder = async () => {
  try {
    // prevent double submit
    if (loading) return;
    setLoading(true);

    // 1) Basic validation
    if (!contactEmail || !firstName || !lastName || !address || !phone) {
      toast.error("Please fill all required fields before placing the order.");
      setLoading(false);
      return;
    }

    // 2) Prepare items array (handle bundles if present)
    const orderItems = items.map((i) => {
      if (i.bundle) {
        return {
          bundleId: i.bundle._id,
          title: i.bundle.title,
          variant: "", // keep consistent
          quantity: Number(i.quantity) || 1,
          price: Number(i.bundle.price) || 0,
          total: (Number(i.bundle.price) || 0) * (Number(i.quantity) || 1),
          mainImage: i.mainImage || i.bundle.images?.[0] || "",
          bundleProducts: (i.bundleProducts || []).map((bp) => ({
            productId: bp.product._id,
            title: bp.product.title,
            variant: bp.size || "",
            quantity: Number(bp.quantity) || 1,
            price: Number(bp.product.price) || 0,
            mainImage: bp.product.images?.[0] || "",
          })),
        };
      } else {
        return {
          productId: i.product._id,
          title: i.product.title,
          variant: i.size || "",
          quantity: Number(i.quantity) || 1,
          price: Number(i.product.price) || 0,
          total: (Number(i.product.price) || 0) * (Number(i.quantity) || 1),
          mainImage: i.product.images?.[0] || "",
        };
      }
    });

    const shippingFee = 100;
    const orderData = {
      items: orderItems,
      contactEmail,
      source: "web",
      subtotal,
      shipping: shippingFee,         // your backend expects "shipping"
      total: (subtotal || 0) + shippingFee,
      shippingMethod,
      paymentMethod: "cod",
      discountCode: discountCode || "",
      billingSame,
      shippingAddress: {
        firstName,
        lastName,
        address,
        apartment,
        city,
        state,
        zip,
        country,
        phone,
      },
    };

    const response = await api.post("/orders/create", orderData);
    const data = response.data;

    if (!data || !data.success) {
      const msg = data?.message || "Failed to create order. Please try again.";
      toast.error(msg);
      setLoading(false);
      return;
    }

    const orderNumber = data.orderNumber || data.orderId || null;
    toast.success(
      `Order placed successfully! ${orderNumber ? `Order: ${orderNumber}` : `ID: ${data.orderId}`}`
    );

    try {
      if (typeof clearCart === "function") {
        await clearCart(); 
      }
    } catch (e) {
     toast.error("Failed to clear cart after order.");
    }
      await new Promise((r) => setTimeout(r, 1200));

    if (orderNumber) {
      navigate(`/trackorder?email=${encodeURIComponent(contactEmail)}&orderNumber=${encodeURIComponent(orderNumber)}`);
    } else {
      navigate("/thank-you");
    }


  } catch (err) {
    console.error("COD Order Error:", err);
    toast.error("Failed to place COD order. Please try again.");
  } finally {
    setLoading(false);
  }
};




  const handlePlaceOrder = () => {
    paymentMethod === "razorpay" ? handlePayment() : handleCODOrder();
  };

  const renderInput = (value, setValue, placeholder) => (
    <div className="border border-gray-300 rounded-lg">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-10 text-gray-900">

      {/* Left Section */}
      <div className="lg:col-span-2 flex flex-col gap-8 max-h-[calc(100vh-4rem)] overflow-y-auto">

        {/* Contact */}
        <h2 className="text-xl font-semibold border-b pb-2">Contact</h2>
        <div className="space-y-3">
          {renderInput(contactEmail, setContactEmail, "Enter your email")}
          <div className="flex items-center gap-2">
            <Checkbox id="news" checked={subscribeNews} onChange={() => setSubscribeNews(!subscribeNews)} />
            <Label htmlFor="news">Email me with news and offers</Label>
          </div>
        </div>

        {/* Delivery */}
        <h2 className="text-xl font-semibold border-b pb-2">Delivery</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {renderInput(firstName, setFirstName, "First name")}
          {renderInput(lastName, setLastName, "Last name")}
        </div>
        {renderInput(address, setAddress, "Address")}
        {renderInput(apartment, setApartment, "Apartment, suite, etc. (optional)")}
        {renderInput(city, setCity, "City")}
        <div className="grid md:grid-cols-3 gap-4">
          {renderInput(state, setState, "State")}
          {renderInput(zip, setZip, "ZIP / Postal Code")}
          {renderInput(country, setCountry, "Country")}
        </div>
        {renderInput(phone, setPhone, "Phone number")}
        <div className="flex items-center gap-2">
          <Checkbox id="save" checked={saveInfo} onChange={() => setSaveInfo(!saveInfo)} />
          <Label htmlFor="save">Save this information for next time</Label>
        </div>

        {/* Shipping Method */}
        <div className="bg-white shadow rounded-xl p-6 space-y-4 border border-gray-200">
          <h2 className="text-xl font-semibold border-b pb-2">Shipping Method</h2>
          <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
            <div className="flex justify-between items-center p-4 rounded-lg border-2 border-black bg-gray-50">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="font-medium">Free Shipping</Label>
              </div>
              <span className="font-medium">Free</span>
            </div>
            <p className="text-sm text-gray-600 ml-8">
              Get your order by <strong>Oct 9</strong>.
            </p>
          </RadioGroup>
        </div>

        {/* Payment Method */}
        <div className="bg-white shadow rounded-xl p-6 space-y-4 border border-gray-200">
          <h2 className="text-xl font-semibold border-b pb-2">Payment Method</h2>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
            {[
              { id: "cod", label: "Cash on Delivery", note: "Pay on delivery" },
              { id: "razorpay", label: "Razorpay", note: "Online Payment" }
            ].map((m) => (
              <div key={m.id} className="flex justify-between items-center p-4 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={m.id} id={m.id} />
                  <Label htmlFor={m.id} className="font-medium">{m.label}</Label>
                </div>
                <span className="font-medium">{m.note}</span>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Right Section */}
      <div className="lg:col-span-1 sticky top-20 bg-white shadow rounded-xl p-6 flex flex-col gap-6 h-fit">

        <h2 className="text-xl font-semibold border-b pb-3">Order Summary</h2>

        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
          {items.map((item) => {
            const isBundle = !!item.bundle;
            const key = isBundle ? item.bundle._id : `${item.product._id}-${item.size || "default"}`;
            const imageSrc = isBundle ? item.mainImage || item.bundle?.images?.[0] : item.product?.images?.[0];
            const title = isBundle ? item.bundle.title : item.product.title;
            const quantity = item.quantity;
            const price = isBundle ? item.bundle.price : item.product.price;

            return (
              <div key={key} className="flex flex-col border-b border-gray-200 pb-3">
                <div className="flex items-start gap-3">
                  <img src={imageSrc || "/placeholder.jpg"} alt={title} className="w-16 h-16 object-cover rounded-md border" />
                  <div className="flex-1 flex flex-col">
                    <span className="font-medium text-gray-900">{title}</span>
                    {!isBundle && item.product.variant && <span className="text-sm text-gray-500">{item.product.variant}</span>}
                    <span className="text-sm text-gray-500">Quantity: {quantity}</span>
                    <span className="text-xs text-gray-400 mt-1">Delivery by tomorrow</span>
                  </div>
                  <span className="font-semibold text-gray-900 mt-1">₹{(quantity * price).toFixed(2)}</span>
                </div>

                {isBundle && item.bundleProducts?.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2">
                    {item.bundleProducts.map((bp, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <img src={bp.product.images?.[0] || "/placeholder.jpg"} alt={bp.product.title} className="w-12 h-12 rounded border object-cover" />
                        <div className="flex flex-col">
                          <span className="font-medium">{bp.product.title}</span>
                          {bp.size && <span className="text-xs text-gray-500">Size: {bp.size}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Discount / Gift Code */}
      <div className="mt-4 flex gap-2 items-center">
  <input
    type="text"
    placeholder="Discount code or gift card"
    // placeholder="We Add Soon"
    className="px-4 w-full py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black text-sm"
    value={discountCode}
    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
  
  />

  <button
    type="button"
    onClick={applyDiscount}
    disabled={loadingDiscount || !discountCode.trim()}
    className={`px-4 py-2 rounded-md text-sm font-medium ${
      loadingDiscount || !discountCode.trim()
        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
        : "bg-black text-white hover:bg-gray-800 transition"
    }`}
  >
    {loadingDiscount ? "Checking..." : "Apply"}
  </button>
</div>

{discountError && (
  <p className="text-red-600 text-xs mt-2">{discountError}</p>
)}

{discountSuccess && (
  <p className="text-green-600 text-xs mt-2">
    🎉 Discount applied: {discountValue}% off!
  </p>
)}


        {/* Cost Summary */}
        <div className="mt-4 border-t border-gray-200 pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-gray-800"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-800"><span>Shipping</span><span>₹100.00</span></div>
          <div className="flex justify-between font-bold text-lg mt-2"><span>Total (INR)</span><span>₹{(subtotal + 100).toFixed(2)}</span></div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={loading} // prevents double click
          className={`w-full py-3 rounded-lg text-lg mt-4 flex items-center justify-center gap-2 transition-colors ${loading ? "bg-gray-700 cursor-wait" : "bg-black hover:bg-gray-800 text-white"
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing Order...
            </>
          ) : paymentMethod === "razorpay" ? (
            "Pay Now"
          ) : (
            "Place Order"
          )}
        </button>
      </div>
    </div>
  );
}
