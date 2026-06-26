import { useState ,useEffect } from "react";
import { Input } from "@/components/ui/input";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/CustomCheckbox.jsx";
import { useCart } from "@/state/CartContext";
import api  from "@/utils/config";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getDeliveryDate } from "@/utils/public";
import { useAuth } from "@/state/AuthContext.jsx";
import { loadRazorpay } from "@/utils/loader.js";

export default function CheckoutPage() {
    const { user } = useAuth();
  const navigate = useNavigate();
  const { items , clearCart } = useCart();

  const [contactEmail, setContactEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Delhi");
  const [zip, setZip] = useState("110045");
  const [country, setCountry] = useState("India");
  const [shippingMethod, setShippingMethod] = useState("free");
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
const [selectedAddress, setSelectedAddress] = useState(null);
const [processingPayment, setProcessingPayment] = useState(false);
const [openBundles, setOpenBundles] = useState({});
const [errors, setErrors] = useState({});
const addresses = user?.addresses || [];
const [addressMode, setAddressMode] = useState(addresses.length > 0 ? "saved" : "new"); 
const defaultAddress =
addresses.find((a) => a.isDefault) || addresses[0];

const toggleBundle = (key) => {
  setOpenBundles((prev) => ({
    ...prev,
    [key]: !prev[key],
  }));
};

useEffect(() => {
  if (addresses.length) {
    setSelectedAddress(defaultAddress);
  }
}, [user]);

useEffect(() => {
  if (addressMode === "saved" && selectedAddress) {
    const fullName = selectedAddress.name || "";
    const [first, ...rest] = fullName.split(" ");

    setFirstName(first || "");
    setLastName(rest.join(" ") || "");

    setPhone(selectedAddress.phone || "");
    setAddress(selectedAddress.address || "");
    setCity(selectedAddress.city || "");
    setState(selectedAddress.state || "");
    setZip(selectedAddress.zip || "");
    setCountry("India");
  }
}, [selectedAddress, addressMode]);

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
    return sum + (i.bundle?.price || i.product?.price || i.customBundle?.price || 0) * i.quantity;
  }, 0);

  const shippingFee = 0;
const finalTotal = Math.max(0, subtotal - discountValue + shippingFee);


useEffect(() => {
  if (!saveInfo) return;

  localStorage.setItem(
    "checkoutInfo",
    JSON.stringify({
      contactEmail,
      firstName,
      lastName,
      address,
      apartment,
      city,
      state,
      zip,
      country,
      phone,
    })
  );
}, [
  saveInfo,
  contactEmail,
  firstName,
  lastName,
  address,
  apartment,
  city,
  state,
  zip,
  country,
  phone,
]);

useEffect(() => {
  const saved = localStorage.getItem("checkoutInfo");

  if (!saved) return;

  try {
    const data = JSON.parse(saved);

    setContactEmail(data.contactEmail || "");
    setFirstName(data.firstName || "");
    setLastName(data.lastName || "");
    setAddress(data.address || "");
    setApartment(data.apartment || "");
    setCity(data.city || "");
    setState(data.state || "Delhi");
    setZip(data.zip || "");
    setCountry(data.country || "India");
    setPhone(data.phone || "");

    setSaveInfo(true);
  } catch (err) {
    console.error(err);
  }
}, []);


// razewrpay integration



const saveAddressIfNeeded = async () => {
  if (!user || !saveInfo || addressMode !== "new") return;

  try {
    await api.post("/address", {
      name: `${firstName} ${lastName}`,
      address,
      city,
      state,
      zip,
      country,
      phone,
    });
  } catch (err) {
    console.error("Address save failed", err);
  }
};


const handlePayment = async () => {
  try {
    if (loading) return;
    setLoading(true);

    const orderData = {
items: items.map((i) => {
  // 🛍️ Product item
  if (i.product) {
    return {
      productId: i.product._id,
      quantity: i.quantity,
      variant: i.size || ""
    };
  }

  // 📦 Bundle item
if (i.bundle) {
  return {
    bundleId: i.bundle._id,
    quantity: i.quantity,
    mainImage: i.mainImage || "default.jpg",

    bundleProducts: (i.bundleProducts || []).map((bp) => ({
      productId: bp.product._id,
      quantity: bp.quantity || 1,
      variant: bp.size || ""   // ✅ THIS IS IMPORTANT
    }))
  };
}

  return null;
}).filter(Boolean),
      paymentMethod: "razorpay",
      shippingMethod,
      contactEmail,
      subscribeNews,
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
        phone,
      },
    };


    const isLoaded = await loadRazorpay();

    if (!isLoaded) {
      toast.error("Payment failed to load. Check your connection.");
      setLoading(false);
      return;
    }

    const response = await api.post("/orders/create", orderData);
    const data = response.data;

    if (!data?.razorpayOrderId) {
      toast.error("Order creation failed");
      return;
    }

    const options = {
      key: import.meta.env.VITE_PUBLIC_RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      order_id: data.razorpayOrderId,

      handler: async (res) => {
        try {
          setProcessingPayment(true);

          const verifyRes = await api.post("/orders/payment-success", {
            orderId: data.orderId,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_order_id: res.razorpay_order_id,
            razorpay_signature: res.razorpay_signature,
          });

          if (verifyRes.data.success) {
  if (subscribeNews && contactEmail) {
    try {
      await api.post("/newsletter", {
        email: contactEmail,
      });
    } catch (err) {
      console.error("Newsletter subscribe failed", err);
    }
  }
  // Save address for logged-in users
  await saveAddressIfNeeded();


            toast.success("Payment Successful!");

            if (typeof clearCart === "function") {
              await clearCart();
            }

            navigate("/thankyou/" + data.orderId);
          } else {
            toast.error("Verification failed");
          }
        } catch (err) {
          toast.error("Verification error");
        }
      },

      modal: {
        ondismiss: function () {
          toast.error("Payment cancelled");
        },
      },

      prefill: {
        name: `${firstName} ${lastName}`,
        email: contactEmail,
        contact: phone,
      },

      theme: { color: "#000000" },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function () {
      toast.error("Payment failed. Try again.");
    });

    rzp.open();
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong");
  } finally {
    setLoading(false);
  }
};

const handleCODOrder = async () => {
  try {
    // prevent double submit
    if (loading) return;
    setLoading(true);

if (
  addressMode === "new" &&
  (!contactEmail || !firstName || !lastName || !address || !phone || !city || !state || !zip)
) {
  toast.error("Please fill all required fields before placing the order.");
  setLoading(false);
  return;
}
const orderItems = items
  .map((i) => {

    // Regular Bundle
    if (i.bundle) {
      return {
        bundleId: i.bundle._id,
        quantity: i.quantity,
        mainImage: i.mainImage,

        bundleProducts: (i.bundleProducts || []).map((bp) => ({
          productId: bp.product._id,
          variant: bp.size || "",
          quantity: bp.quantity || 1,
        })),
      };
    }

    // Custom Bundle
    if (i.customBundle) {
      return {
        customBundle: true,
        title: i.customBundle.title,
        price: i.customBundle.price,
        quantity: i.quantity,
        mainImage: i.mainImage,

        bundleProducts: (i.bundleProducts || []).map((bp) => ({
          productId: bp.product._id,
          variant: bp.size || "",
          quantity: bp.quantity || 1,
        })),
      };
    }

    // Product
    if (i.product) {
      return {
        productId: i.product._id,
        quantity: Number(i.quantity) || 1,
        variant: i.size || "",
      };
    }

    return null;
  })
  .filter(Boolean);

    const orderData = {
      items: orderItems,
      contactEmail,
      subscribeNews,
      source: "web",

      shippingMethod,
      paymentMethod: "cod",
discountCode: discountCode,
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


if (subscribeNews && contactEmail) {
  await api.post("/newsletter", {
    email: contactEmail,
  });
}
  // Save address for logged-in users
  await saveAddressIfNeeded();
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

    navigate("/thankyou/" + data.orderId);

  } catch (err) {
    console.error("COD Order Error:", err);
    toast.error("Failed to place COD order. Please try again.");
  } finally {
    setLoading(false);
  }
};




  const handlePlaceOrder = () => {
    if (!validateForm()) return;
    paymentMethod === "razorpay" ? handlePayment() : handleCODOrder();
  };


const validateForm = () => {
  const newErrors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!contactEmail.trim()) {
    newErrors.contactEmail = "Email is required";
  } else if (!emailRegex.test(contactEmail)) {
    newErrors.contactEmail = "Enter a valid email";
  }

  if (addressMode === "new") {
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      newErrors.phone = "Enter a valid 10 digit mobile number";
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!city.trim()) {
      newErrors.city = "City is required";
    }

    if (!state.trim()) {
      newErrors.state = "State is required";
    }

    if (!zip.trim()) {
      newErrors.zip = "PIN code is required";
    } else if (!/^\d{6}$/.test(zip)) {
      newErrors.zip = "Enter a valid PIN code";
    }
  }

  if (!items.length) {
    toast.error("Your cart is empty");
    return false;
  }

  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    toast.error(Object.values(newErrors)[0]);
    return false;
  }

  return true;
};



const renderInput = (
  value,
  setValue,
  placeholder,
  field
) => (
  <div>
    <div
      className={`
        border
        rounded-lg
        transition-all

        ${
          errors[field]
            ? "border-red-500"
            : "border-gray-300"
        }

        focus-within:border-black
      `}
    >
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);

          setErrors((prev) => ({
            ...prev,
            [field]: "",
          }));
        }}
        className="
          w-full
          px-4
          py-3
          border-none
          shadow-none
          focus-visible:ring-0
          focus-visible:ring-offset-0
        "
      />
    </div>

    {errors[field] && (
      <p className="mt-1 text-xs text-red-500">
        {errors[field]}
      </p>
    )}
  </div>
);
  return (
    <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-10 text-gray-900 mb-12">

      {/* Left Section */}
   <div className="lg:col-span-2 space-y-6">

  {/* Header */}
  <div>
    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
      Checkout
    </h1>
    <p className="text-sm text-gray-500 mt-1">
      Complete your order securely
    </p>
  </div>

  {/* Contact */}
  <div className="bg-white border border-gray-200 rounded-2xl p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-5">
      Contact Information
    </h2>

    <div className="space-y-4">
      {renderInput(contactEmail, setContactEmail, "Email address", "contactEmail")}

      <div className="flex items-center gap-3 text-sm text-gray-600">
<Checkbox
  id="news"
  checked={subscribeNews}
  onChange={(checked) => {
    console.log("NEWS:", checked);
    setSubscribeNews(checked);
  }}
/>
        <Label htmlFor="news">
          Email me with news and offers
        </Label>
      </div>
    </div>
  </div>

  {/* Address */}
  <div className="bg-white border border-gray-200 rounded-2xl p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-5">
      Delivery Address
    </h2>

{addresses.length > 0 && (
  <div className="mb-6">
    <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-500">
      <button
        type="button"
        onClick={() => setAddressMode("saved")}
        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
          addressMode === "saved"
            ? "bg-black shadow-sm text-white"
            : "text-gray-500 hover:text-black"
        }`}
      >
        Saved Address
      </button>

      <button
        type="button"
        onClick={() => setAddressMode("new")}
        className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
          addressMode === "new"
            ? "bg-black shadow-sm text-white"
            : "text-gray-500 hover:text-black"
        }`}
      >
        New Address
      </button>
    </div>
  </div>
)}

    {addressMode === "saved" && addresses.length > 0 && (
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr._id}
            onClick={() => setSelectedAddress(addr)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedAddress?._id === addr._id
                ? "border-black bg-black/[0.03]"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">
                  {addr.name}
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  {addr.address}
                </p>

                <p className="text-sm text-gray-600">
                  {addr.city}, {addr.state} - {addr.zip}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {addr.phone}
                </p>
              </div>

              {addr.isDefault && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Default
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {addressMode === "new" && (
      <div className="space-y-4">

        <div className="grid md:grid-cols-2 gap-3">
          {renderInput(firstName, setFirstName, "First name", "firstName")}
          {renderInput(lastName, setLastName, "Last name", "lastName")}
        </div>

        {renderInput(address, setAddress, "Address", "address")}

        {renderInput(
          apartment,
          setApartment,
          "Apartment, suite, etc. (optional)",
          "apartment"
        )}

        {renderInput(city, setCity, "City", "city")}

        <div className="grid md:grid-cols-3 gap-3">
          {renderInput(state, setState, "State", "state")}
          {renderInput(zip, setZip, "ZIP / Postal Code", "zip")}
          {renderInput(country, setCountry, "Country", "country")}
        </div>

        {renderInput(phone, setPhone, "Phone number", "phone")}

        <div className="flex items-center gap-3 text-sm text-gray-600">
      <Checkbox
  id="save"
  checked={saveInfo}
  onChange={(checked) => {
    setSaveInfo(Boolean(checked));

    if (!checked) {
      localStorage.removeItem("checkoutInfo");
    }
  }}
/>
          <Label htmlFor="save">
            Save this information for next time
          </Label>
        </div>

      </div>
    )}
  </div>

  {/* Shipping */}
<div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

  <div className="px-6 py-5 border-b border-gray-100">
    <h2 className="text-lg font-semibold">
      Shipping
    </h2>
  </div>

  <div className="p-6">
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-4">

        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
          🚚
        </div>

        <div>
          <p className="font-medium text-gray-900">
            Standard Delivery
          </p>

          <p className="text-sm text-gray-500">
            Estimated arrival: {getDeliveryDate()}
          </p>
        </div>

      </div>

      <span className="text-sm font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
        FREE
      </span>

    </div>
  </div>

</div>

  {/* Payment */}
<div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
  <div className="px-6 py-5 border-b border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900">
      Payment Method
    </h2>
  </div>

  <RadioGroup
    value={paymentMethod}
    onValueChange={setPaymentMethod}
  >
    {[
      {
        id: "cod",
        label: "Cash on Delivery",
        note: "Pay when your order arrives",
      },
      {
        id: "razorpay",
        label: "Razorpay",
        note: "UPI, Cards, Net Banking & Wallets",
      },
    ].map((m, index) => (
      <label
        key={m.id}
        htmlFor={m.id}
        className={`flex items-center justify-between p-6 cursor-pointer transition-colors ${
          paymentMethod === m.id
            ? "bg-black/[0.02]"
            : "hover:bg-gray-50"
        } ${
          index !== 1
            ? "border-b border-gray-100"
            : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <RadioGroupItem
            value={m.id}
            id={m.id}
          />

          <div>
            <p className="font-medium text-gray-900">
              {m.label}
            </p>

            <p className="text-sm text-gray-500">
              {m.note}
            </p>
          </div>
        </div>

        {m.id === "razorpay" && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
              UPI
            </span>

            <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
              CARD
            </span>
          </div>
        )}
      </label>
    ))}
  </RadioGroup>
</div>
</div>

      {/* Right Section */}
      <div className="lg:col-span-1 sticky top-20 bg-white shadow rounded-xl p-6 flex flex-col gap-6 h-fit">

        <h2 className="text-xl font-semibold border-b pb-3">Order Summary</h2>

        <div className="space-y-4 max-h-64 overflow-y-auto pr-2"  data-lenis-prevent>
          {items.map((item) => {
           const isBundle =  !!item.bundle || !!item.customBundle;
          const key = item.bundle  ? item.bundle._id  : item.customBundle  ? item._id  : `${item.product?._id}-${item.size || "default"}`;
            const imageSrc = isBundle ? item.mainImage || item.bundle?.images?.[0] : item.product?.images?.[0];
           const title = item.bundle  ? item.bundle.title  : item.customBundle  ? item.customBundle.title  : item.product?.title;
            const quantity = item.quantity;
           const price = item.bundle  ? item.bundle.price  : item.customBundle  ? item.customBundle.price  : item.product?.price || 0;

            return (
              <div key={key} className="flex flex-col border-b border-gray-200 pb-3">
                <div className="flex items-start gap-3">
                  <img src={imageSrc || "/placeholder.jpg"} alt={title} className="w-16 h-16 object-cover rounded-md border" />
                  <div className="flex-1 flex flex-col">
                    <span className="font-medium text-gray-900">{title}</span>
                    {!isBundle && item.product.variant && <span className="text-sm text-gray-500">{item.product.variant}</span>}
                    <span className="text-sm text-gray-500">Quantity: {quantity}</span>
                    <span className="text-xs text-gray-400 mt-1">Delivery by {getDeliveryDate()}</span>
                  </div>
                  <span className="font-semibold text-gray-900 mt-1">₹{(quantity * price).toFixed(2)}</span>
                </div>

{isBundle && item.bundleProducts?.length > 0 && (
  <div className="mt-3">
<button
  onClick={() => toggleBundle(key)}
  className="flex items-center gap-1 mt-2 text-[11px] uppercase tracking-wide text-gray-500 hover:text-black transition"
>
  {openBundles[key] ? "Hide Items" : "View Items"}
  <ChevronDown
    className={`w-3 h-3 transition-transform duration-300 ${
      openBundles[key] ? "rotate-180" : ""
    }`}
  />
</button>

<div
  className={`overflow-hidden transition-all duration-300 ${
    openBundles[key]
      ? "max-h-96 opacity-100 mt-3"
      : "max-h-0 opacity-0"
  }`}
>
  <div className="ml-6 border-l border-gray-200 pl-4 space-y-3">
    {item.bundleProducts.map((bp, i) => (
      <div key={i} className="flex items-center gap-3">
        <img
          src={bp.product.images?.[0]}
          alt={bp.product.title}
          className="w-10 h-10 object-cover"
        />

        <div>
          <p className="text-xs uppercase font-medium text-gray-900">
            {bp.product.title}
          </p>

          {bp.size && (
            <p className="text-[11px] uppercase text-gray-500">
              Size {bp.size}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
  </div>
)}
              </div>
            );
          })}
        </div>

        {/* Discount / Gift Code */}
      <div className=" flex gap-2 items-center edit-modal">
  <input
    type="text"
    placeholder="Discount code or gift card"
    // placeholder="We Add Soon"
    className="px-4 w-full py-2 rounded-md focus:ring-2 focus:ring-black focus:border-black text-sm"
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
    🎉 Discount applied: {discountValue} off!
  </p>
)}


        {/* Cost Summary */}
        <div className="mt-1 border-t border-gray-200 pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-gray-800"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-800"><span>Shipping</span><span>₹{shippingFee.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg mt-2"><span>Total (INR)</span><span>₹{finalTotal.toFixed(2)}</span></div>
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
{processingPayment && (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-lg font-medium">Processing payment...</p>
    </div>
  </div>
)}
    </div>
    
  );
}
