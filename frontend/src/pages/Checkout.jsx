import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/CustomCheckbox.jsx";
import { useCart } from "@/state/CartContext";
import api from "@/utils/config";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ChevronDown,
  ShieldCheck,
  Truck,
  Lock,
  CreditCard,
  MapPin,
  Check,
  Tag,
  Mail,
  User,
  Phone,
  Home,
  PackageCheck,
} from "lucide-react";
import { getDeliveryDate } from "@/utils/public";
import { useAuth } from "@/state/AuthContext.jsx";
import { loadRazorpay } from "@/utils/loader.js";

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, clearCart } = useCart();

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
  const [addressMode, setAddressMode] = useState(
    addresses.length > 0 ? "saved" : "new"
  );

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
      const res = await api.post("/discounts/validate", {
        code: discountCode,
      });

      if (res.data?.valid) {
        setDiscountValue(res.data.amount);
        setDiscountSuccess(`Code "${discountCode}" applied!`);
        toast.success("Discount applied");
      } else {
        setDiscountError("Invalid or expired discount code.");
        setDiscountValue(0);
        toast.error("Invalid discount code");
      }
    } catch (err) {
      console.error(err);
      setDiscountError(
        "Something went wrong while validating the code."
      );
      setDiscountValue(0);
      toast.error("Unable to validate discount");
    } finally {
      setLoadingDiscount(false);
    }
  };

  const subtotal = items.reduce((sum, i) => {
    return (
      sum +
      (i.bundle?.price ||
        i.product?.price ||
        i.customBundle?.price ||
        0) *
        i.quantity
    );
  }, 0);

  const shippingFee = 0;
  const finalTotal = Math.max(
    0,
    subtotal - discountValue + shippingFee
  );

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
        items: items
          .map((i) => {
            if (i.product) {
              return {
                productId: i.product._id,
                quantity: i.quantity,
                variant: i.size || "",
              };
            }

            if (i.bundle) {
              return {
                bundleId: i.bundle._id,
                quantity: i.quantity,
                mainImage: i.mainImage || "default.jpg",
                bundleProducts: (i.bundleProducts || []).map((bp) => ({
                  productId: bp.product._id,
                  quantity: bp.quantity || 1,
                  variant: bp.size || "",
                })),
              };
            }

            return null;
          })
          .filter(Boolean),

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
        toast.error(
          "Payment failed to load. Check your connection."
        );
        setLoading(false);
        return;
      }

      const response = await api.post(
        "/orders/create",
        orderData
      );

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

            const verifyRes = await api.post(
              "/orders/payment-success",
              {
                orderId: data.orderId,
                razorpay_payment_id:
                  res.razorpay_payment_id,
                razorpay_order_id:
                  res.razorpay_order_id,
                razorpay_signature:
                  res.razorpay_signature,
              }
            );

            if (verifyRes.data.success) {
              if (subscribeNews && contactEmail) {
                try {
                  await api.post("/newsletter", {
                    email: contactEmail,
                  });
                } catch (err) {
                  console.error(
                    "Newsletter subscribe failed",
                    err
                  );
                }
              }

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
          } finally {
            setProcessingPayment(false);
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

        theme: {
          color: "#111111",
        },
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
      if (loading) return;

      setLoading(true);

      if (
        addressMode === "new" &&
        (!contactEmail ||
          !firstName ||
          !lastName ||
          !address ||
          !phone ||
          !city ||
          !state ||
          !zip)
      ) {
        toast.error(
          "Please fill all required fields before placing the order."
        );
        setLoading(false);
        return;
      }

      const orderItems = items
        .map((i) => {
          if (i.bundle) {
            return {
              bundleId: i.bundle._id,
              quantity: i.quantity,
              mainImage: i.mainImage,

              bundleProducts: (i.bundleProducts || []).map(
                (bp) => ({
                  productId: bp.product._id,
                  variant: bp.size || "",
                  quantity: bp.quantity || 1,
                })
              ),
            };
          }

          if (i.customBundle) {
            return {
              customBundle: true,
              title: i.customBundle.title,
              price: i.customBundle.price,
              quantity: i.quantity,
              mainImage: i.mainImage,

              bundleProducts: (i.bundleProducts || []).map(
                (bp) => ({
                  productId: bp.product._id,
                  variant: bp.size || "",
                  quantity: bp.quantity || 1,
                })
              ),
            };
          }

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
        discountCode,

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

      const response = await api.post(
        "/orders/create",
        orderData
      );

      const data = response.data;

      if (subscribeNews && contactEmail) {
        await api.post("/newsletter", {
          email: contactEmail,
        });
      }

      await saveAddressIfNeeded();

      if (!data || !data.success) {
        toast.error(
          data?.message ||
            "Failed to create order. Please try again."
        );
        setLoading(false);
        return;
      }

      const orderNumber =
        data.orderNumber || data.orderId || null;

      toast.success(
        `Order placed successfully! ${
          orderNumber
            ? `Order: ${orderNumber}`
            : `ID: ${data.orderId}`
        }`
      );

      try {
        if (typeof clearCart === "function") {
          await clearCart();
        }
      } catch (e) {
        toast.error(
          "Failed to clear cart after order."
        );
      }

      navigate("/thankyou/" + data.orderId);
    } catch (err) {
      console.error("COD Order Error:", err);
      toast.error(
        "Failed to place COD order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;

    paymentMethod === "razorpay"
      ? handlePayment()
      : handleCODOrder();
  };

  const validateForm = () => {
    const newErrors = {};

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!contactEmail.trim()) {
      newErrors.contactEmail =
        "Email is required";
    } else if (!emailRegex.test(contactEmail)) {
      newErrors.contactEmail =
        "Enter a valid email";
    }

    if (addressMode === "new") {
      if (!firstName.trim()) {
        newErrors.firstName =
          "First name is required";
      }

      if (!lastName.trim()) {
        newErrors.lastName =
          "Last name is required";
      }

      if (!phone.trim()) {
        newErrors.phone =
          "Phone number is required";
      } else if (!/^[6-9]\d{9}$/.test(phone)) {
        newErrors.phone =
          "Enter a valid 10 digit mobile number";
      }

      if (!address.trim()) {
        newErrors.address =
          "Address is required";
      }

      if (!city.trim()) {
        newErrors.city =
          "City is required";
      }

      if (!state.trim()) {
        newErrors.state =
          "State is required";
      }

      if (!zip.trim()) {
        newErrors.zip =
          "PIN code is required";
      } else if (!/^\d{6}$/.test(zip)) {
        newErrors.zip =
          "Enter a valid PIN code";
      }
    }

    if (!items.length) {
      toast.error("Your cart is empty");
      return false;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(
        Object.values(newErrors)[0]
      );
      return false;
    }

    return true;
  };

  const renderInput = (
    value,
    setValue,
    placeholder,
    field,
    Icon
  ) => (
    <div>
      <div
        className={`group flex items-center gap-3 rounded-xl border bg-white px-4 transition-all ${
          errors[field]
            ? "border-red-400 ring-2 ring-red-100"
            : "border-gray-200 hover:border-gray-300 focus-within:border-black focus-within:ring-2 focus-within:ring-black/5"
        }`}
      >
        <Icon
          className={`h-4 w-4 shrink-0 ${
            errors[field]
              ? "text-red-500"
              : "text-gray-400 group-focus-within:text-black"
          }`}
        />

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
          className="h-12 w-full border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {errors[field] && (
        <p className="mt-1.5 px-1 text-xs font-medium text-red-500">
          {errors[field]}
        </p>
      )}
    </div>
  );

  if (!items.length) {
    return (
      <div className="min-h-[70vh] bg-[#f7f7f7] px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <PackageCheck className="h-7 w-7 text-gray-500" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add something you love before continuing to checkout.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-7 rounded-xl bg-black px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xl font-black tracking-tight sm:text-2xl">
              CHECKOUT
            </p>

            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <Lock className="h-3.5 w-3.5" />
              Secure checkout
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs font-medium text-gray-500 sm:flex">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Safe & secure payment
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
              1
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Complete your order
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Enter your details and choose a payment method.
              </p>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
          <main className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Mail className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Contact information
                    </h2>
                    <p className="text-xs text-gray-500">
                      We’ll use this to send your order updates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-7">
                {renderInput(
                  contactEmail,
                  setContactEmail,
                  "Email address",
                  "contactEmail",
                  Mail
                )}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition hover:bg-gray-100">
                  <Checkbox
                    id="news"
                    checked={subscribeNews}
                    onChange={(checked) =>
                      setSubscribeNews(checked)
                    }
                  />

                  <span>
                    Email me with news, offers and new arrivals
                  </span>
                </label>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Delivery address
                    </h2>
                    <p className="text-xs text-gray-500">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>
              </div>

              {addresses.length > 0 && (
                <div className="border-b border-gray-100 p-5 sm:px-7">
                  <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setAddressMode("saved")
                      }
                      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                        addressMode === "saved"
                          ? "bg-white text-black shadow-sm"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      Saved address
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAddressMode("new")
                      }
                      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                        addressMode === "new"
                          ? "bg-white text-black shadow-sm"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      New address
                    </button>
                  </div>
                </div>
              )}

              {addressMode === "saved" &&
                addresses.length > 0 && (
                  <div className="space-y-3 p-5 sm:p-7">
                    {addresses.map((addr) => {
                      const selected =
                        selectedAddress?._id ===
                        addr._id;

                      return (
                        <button
                          type="button"
                          key={addr._id}
                          onClick={() =>
                            setSelectedAddress(addr)
                          }
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-black bg-gray-50 ring-1 ring-black"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex gap-4">
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-black bg-black text-white"
                                  : "border-gray-300"
                              }`}
                            >
                              {selected && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold">
                                  {addr.name}
                                </p>

                                {addr.isDefault && (
                                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700">
                                    Default
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-sm leading-6 text-gray-600">
                                {addr.address}
                              </p>

                              <p className="text-sm text-gray-600">
                                {addr.city}, {addr.state} -{" "}
                                {addr.zip}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {addr.phone}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

              {addressMode === "new" && (
                <div className="space-y-4 p-5 sm:p-7">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {renderInput(
                      firstName,
                      setFirstName,
                      "First name",
                      "firstName",
                      User
                    )}

                    {renderInput(
                      lastName,
                      setLastName,
                      "Last name",
                      "lastName",
                      User
                    )}
                  </div>

                  {renderInput(
                    address,
                    setAddress,
                    "Street address",
                    "address",
                    Home
                  )}

                  {renderInput(
                    apartment,
                    setApartment,
                    "Apartment, suite, etc. (optional)",
                    "apartment",
                    Home
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {renderInput(
                      city,
                      setCity,
                      "City",
                      "city",
                      MapPin
                    )}

                    {renderInput(
                      state,
                      setState,
                      "State",
                      "state",
                      MapPin
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {renderInput(
                      zip,
                      setZip,
                      "PIN code",
                      "zip",
                      MapPin
                    )}

                    {renderInput(
                      country,
                      setCountry,
                      "Country",
                      "country",
                      MapPin
                    )}
                  </div>

                  {renderInput(
                    phone,
                    setPhone,
                    "10 digit mobile number",
                    "phone",
                    Phone
                  )}

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition hover:bg-gray-100">
                    <Checkbox
                      id="save"
                      checked={saveInfo}
                      onChange={(checked) => {
                        setSaveInfo(Boolean(checked));

                        if (!checked) {
                          localStorage.removeItem(
                            "checkoutInfo"
                          );
                        }
                      }}
                    />

                    <span>
                      Save this information for next time
                    </span>
                  </label>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Truck className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Shipping
                    </h2>
                    <p className="text-xs text-gray-500">
                      Fast, reliable delivery to your address.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex items-center justify-between rounded-2xl border border-black bg-gray-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Truck className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        Standard Delivery
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Estimated arrival:{" "}
                        {getDeliveryDate()}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                    FREE
                  </span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Payment method
                    </h2>
                    <p className="text-xs text-gray-500">
                      Choose how you’d like to pay.
                    </p>
                  </div>
                </div>
              </div>

              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <label
                  htmlFor="cod"
                  className={`flex cursor-pointer items-center gap-4 border-b border-gray-100 p-5 transition sm:p-6 ${
                    paymentMethod === "cod"
                      ? "bg-gray-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <RadioGroupItem
                    value="cod"
                    id="cod"
                  />

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <PackageCheck className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Pay when your order arrives
                    </p>
                  </div>

                  {paymentMethod === "cod" && (
                    <Check className="h-5 w-5" />
                  )}
                </label>

                <label
                  htmlFor="razorpay"
                  className={`flex cursor-pointer items-center gap-4 p-5 transition sm:p-6 ${
                    paymentMethod === "razorpay"
                      ? "bg-gray-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <RadioGroupItem
                    value="razorpay"
                    id="razorpay"
                  />

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">
                      Online Payment
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      UPI, Cards, Net Banking & Wallets
                    </p>
                  </div>

                  <div className="hidden items-center gap-1.5 sm:flex">
                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-gray-500 shadow-sm">
                      UPI
                    </span>

                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-gray-500 shadow-sm">
                      CARD
                    </span>
                  </div>

                  {paymentMethod === "razorpay" && (
                    <Check className="h-5 w-5" />
                  )}
                </label>
              </RadioGroup>
            </section>
          </main>

          <aside className="lg:sticky lg:top-16">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">
                      Order summary
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {items.length}{" "}
                      {items.length === 1
                        ? "item"
                        : "items"}{" "}
                      in your order
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    <PackageCheck className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div
                className="max-h-[420px] space-y-1 overflow-y-auto p-5"
                data-lenis-prevent
              >
                {items.map((item) => {
                  const isBundle =
                    !!item.bundle ||
                    !!item.customBundle;

                  const key = item.bundle
                    ? item.bundle._id
                    : item.customBundle
                    ? item._id
                    : `${item.product?._id}-${
                        item.size || "default"
                      }`;

                  const imageSrc = isBundle
                    ? item.mainImage ||
                      item.bundle?.images?.[0]
                    : item.product?.images?.[0];

                  const title = item.bundle
                    ? item.bundle.title
                    : item.customBundle
                    ? item.customBundle.title
                    : item.product?.title;

                  const quantity = item.quantity;

                  const price = item.bundle
                    ? item.bundle.price
                    : item.customBundle
                    ? item.customBundle.price
                    : item.product?.price || 0;

                  return (
                    <div
                      key={key}
                      className="border-b border-gray-100 py-4 last:border-none"
                    >
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={
                              imageSrc ||
                              "/placeholder.jpg"
                            }
                            alt={title}
                            className="h-20 w-16 rounded-xl border border-gray-200 bg-gray-50 object-cover"
                          />

                          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                            {quantity}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold leading-5">
                            {title}
                          </p>

                          {!isBundle &&
                            item.size && (
                              <span className="mt-1 inline-flex rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-600">
                                Size {item.size}
                              </span>
                            )}

                          <p className="mt-2 text-xs text-gray-400">
                            Delivery by{" "}
                            {getDeliveryDate()}
                          </p>
                        </div>

                        <p className="whitespace-nowrap text-sm font-bold">
                          ₹
                          {(
                            quantity * price
                          ).toFixed(2)}
                        </p>
                      </div>

                      {isBundle &&
                        item.bundleProducts
                          ?.length > 0 && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleBundle(key)
                              }
                              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-black"
                            >
                              {openBundles[key]
                                ? "Hide items"
                                : "View included items"}

                              <ChevronDown
                                className={`h-3.5 w-3.5 transition ${
                                  openBundles[key]
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </button>

                            {openBundles[key] && (
                              <div className="mt-3 ml-2 space-y-3 border-l border-gray-200 pl-4">
                                {item.bundleProducts.map(
                                  (bp, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3"
                                    >
                                      <img
                                        src={
                                          bp.product
                                            .images?.[0]
                                        }
                                        alt={
                                          bp.product
                                            .title
                                        }
                                        className="h-10 w-10 rounded-lg object-cover"
                                      />

                                      <div className="min-w-0">
                                        <p className="line-clamp-1 text-xs font-semibold">
                                          {
                                            bp
                                              .product
                                              .title
                                          }
                                        </p>

                                        {bp.size && (
                                          <p className="mt-0.5 text-[10px] text-gray-500">
                                            Size{" "}
                                            {bp.size}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 bg-gray-50/70 p-5">
                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />

                    <p className="text-sm font-semibold">
                      Discount code
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-white px-3 focus-within:border-black focus-within:ring-2 focus-within:ring-black/5">
                      <input
                        type="text"
                        placeholder="Enter code"
                        className="h-11 min-w-0 flex-1 bg-transparent text-sm uppercase outline-none placeholder:text-gray-400"
                        value={discountCode}
                        onChange={(e) =>
                          setDiscountCode(
                            e.target.value.toUpperCase()
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={
                        loadingDiscount ||
                        !discountCode.trim()
                      }
                      className="rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {loadingDiscount ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>

                  {discountError && (
                    <p className="mt-2 text-xs font-medium text-red-500">
                      {discountError}
                    </p>
                  )}

                  {discountSuccess && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green-600">
                      <Check className="h-3.5 w-3.5" />
                      {discountSuccess}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-semibold text-green-600">
                      FREE
                    </span>
                  </div>

                  {discountValue > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">
                        -₹
                        {discountValue.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-bold">
                          Total
                        </p>

                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">
                          Including all applicable charges
                        </p>
                      </div>

                      <p className="text-2xl font-black tracking-tight">
                        ₹{finalTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-wait disabled:bg-gray-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "razorpay"
                        ? "Pay securely"
                        : "Place order"}

                      <span className="text-white/60">
                        →
                      </span>
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-gray-400">
                  <Lock className="h-3.5 w-3.5" />
                  Secure & encrypted checkout
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                <ShieldCheck className="mx-auto h-5 w-5" />
                <p className="mt-1 text-[10px] font-semibold text-gray-500">
                  Secure
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                <Truck className="mx-auto h-5 w-5" />
                <p className="mt-1 text-[10px] font-semibold text-gray-500">
                  Fast delivery
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                <CreditCard className="mx-auto h-5 w-5" />
                <p className="mt-1 text-[10px] font-semibold text-gray-500">
                  Safe payment
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {processingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-5 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Processing payment
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Please don’t close or refresh this page while we
              confirm your payment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}