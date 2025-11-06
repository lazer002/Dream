import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/CustomCheckbox.jsx";
import { useCart } from "@/state/CartContext";
import { api } from "@/utils/config";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { items } = useCart();
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
        contactEmail
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
    // 1️⃣ Basic validation
    if (!contactEmail || !firstName || !lastName || !address || !phone) {
      toast.error("Please fill all required fields before placing the order.");
      return;
    }

    // 2️⃣ Prepare items array (handle bundles if present)
    const orderItems = items.map((i) => {
      if (i.bundle) {
        return {
          bundleId: i.bundle._id,
          title: i.bundle.title,
          quantity: i.quantity,
          price: i.bundle.price,
          total: i.bundle.price * i.quantity,
          bundleProducts: i.bundleProducts?.map((bp) => ({
            productId: bp.product._id,
            title: bp.product.title,
            quantity: bp.quantity || 1,
            price: bp.product.price,
            variant: bp.size || "",
          })),
        };
      } else {
        return {
          productId: i.product._id,
          title: i.product.title,
          variant: i.size || "",
          quantity: i.quantity,
          price: i.product.price,
          total: i.product.price * i.quantity,
        };
      }
    });

    // 3️⃣ Prepare order data
    const orderData = {
      items: orderItems,
      subtotal,
      shipping: 100,
      total: subtotal + 100,
      shippingMethod,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "pending",
      statusHistory: [{ status: "pending", updatedAt: new Date() }],
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
        phone
      },
      contactEmail,
    };

    // 4️⃣ Send order to backend
    const response = await api.post("/orders/create", orderData);
    const data = response.data;

    // 5️⃣ Optional: Send confirmation email
    await api.post("/send-order-confirmation", {
      email: contactEmail,
      orderId: data.orderId,
      name: `${firstName} ${lastName}`,
      total: subtotal + 100,
    });

    // 6️⃣ Optional: Update stock for each product
    await Promise.all(
      items.map((i) => {
        if (i.bundle) {
          return i.bundleProducts?.map((bp) =>
            api.post("/update-stock", { productId: bp.product._id, quantity: bp.quantity })
          );
        } else {
          return api.post("/update-stock", { productId: i.product._id, quantity: i.quantity });
        }
      }).flat()
    );

    toast.success(`Order placed successfully! Your order ID: ${data.orderId}`);

    // 7️⃣ Clear cart / redirect
    // clearCart();
    // navigate("/thank-you");

  } catch (err) {
    console.error("COD Order Error:", err);
    toast.error("Failed to place COD order. Please try again.");
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
        <div className="mt-4 flex justify-between gap-2">
          <input type="text" placeholder="Discount code or gift card" className="px-4 w-full py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black" />
          <button className="bg-black text-white p-2 rounded-md hover:bg-gray-800">Submit</button>
        </div>

        {/* Cost Summary */}
        <div className="mt-4 border-t border-gray-200 pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-gray-800"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-800"><span>Shipping</span><span>₹100.00</span></div>
          <div className="flex justify-between font-bold text-lg mt-2"><span>Total (INR)</span><span>₹{(subtotal + 100).toFixed(2)}</span></div>
        </div>

        {/* Action Button */}
        <button className="w-full bg-black text-white py-3 rounded-lg text-lg mt-4 hover:bg-gray-800" onClick={handlePlaceOrder}>
          {paymentMethod === "razorpay" ? "Pay Now" : "Place Order"}
        </button>
      </div>
    </div>
  );
}
