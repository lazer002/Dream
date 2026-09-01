import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Box,
  Heart,
  MapPin,
  User,
  LogOut,
  Mail,
  Phone,
  Search,
  RefreshCcw,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  ShoppingBag,
  ChevronRight,
  Package,
  CreditCard,
  Truck,
  CalendarDays,
  ShieldCheck,
  Camera,
  RotateCcw,
  AlertTriangle,
  MapPinned,
} from "lucide-react";

import { useAuth } from "../state/AuthContext.jsx";
import { useWishlist } from "@/state/WishlistContext";
import { useCart } from "@/state/CartContext";
import api from "@/utils/config";
import {
  useOrdersQuery,
  useCancelOrderMutation,
  useAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetProductsByIdsQuery,
} from "@/store/api";
import toast from "react-hot-toast";

/* =====================================================
   HELPERS
===================================================== */

const formatCurrency = (value) => {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAvatar = (user) => {
  if (user?.avatar) return user.avatar;

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name || "User"
  )}&background=111111&color=ffffff&size=256`;
};

const getOrderStatus = (order) =>
  String(
    order?.orderStatus ||
      order?.status ||
      "pending"
  ).toLowerCase();

const getOrderNumber = (order) =>
  order?.orderNumber ||
  order?._id ||
  order?.id ||
  "—";

const getProductImage = (item) =>
  item?.mainImage ||
  item?.image ||
  item?.images?.[0] ||
  "";

const getProductPublicId = (item) =>
  item?.publicId ||
  item?.product?.publicId ||
  null;

  
const getBundleId = (item) =>
  item?.publicId ||
  item?.bundle?.publicId ||
  item?.bundle?.id ||
  null;

/* =====================================================
   MODAL
===================================================== */

function Modal({
  children,
  onClose,
  className = "",
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative z-10 max-h-[94vh] w-full overflow-y-auto rounded-[30px] bg-white shadow-2xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({ status }) {
  const normalized = String(
    status || "pending"
  ).toLowerCase();

  const config = {
    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    },

    confirmed: {
      label: "Confirmed",
      className:
        "bg-blue-50 text-blue-700 border-blue-200",
    },

    processing: {
      label: "Processing",
      className:
        "bg-violet-50 text-violet-700 border-violet-200",
    },

    shipped: {
      label: "Shipped",
      className:
        "bg-indigo-50 text-indigo-700 border-indigo-200",
    },

    delivered: {
      label: "Delivered",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    },

    fulfilled: {
      label: "Fulfilled",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    },

    completed: {
      label: "Completed",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    },

    cancelled: {
      label: "Cancelled",
      className:
        "bg-red-50 text-red-700 border-red-200",
    },

    canceled: {
      label: "Cancelled",
      className:
        "bg-red-50 text-red-700 border-red-200",
    },

    failed: {
      label: "Failed",
      className:
        "bg-red-50 text-red-700 border-red-200",
    },
  };

  const item =
    config[normalized] || {
      label:
        normalized.charAt(0).toUpperCase() +
        normalized.slice(1),
      className:
        "bg-neutral-50 text-neutral-700 border-neutral-200",
    };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {item.label}
    </span>
  );
}

/* =====================================================
   PROFILE
===================================================== */

export default function Profile() {
  const {
    user,
    logout,
    setUser,
    loading,
    authStatus,
  } = useAuth();

  const [activeTab, setActiveTab] =
    useState("orders");

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  if (
    loading ||
    authStatus === "loading"
  ) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-56 rounded-[32px] bg-white" />
            <div className="h-[500px] rounded-[32px] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (
    authStatus === "unauthenticated" ||
    !user
  ) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    {
      id: "orders",
      label: "Orders & Returns",
      icon: <Package size={17} />,
    },
    {
      id: "wishlist",
      label: "My Wishlist",
      icon: <Heart size={17} />,
    },
    {
      id: "addresses",
      label: "Saved Addresses",
      icon: <MapPin size={17} />,
    },
    {
      id: "account",
      label: "Account Settings",
      icon: <User size={17} />,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-6">

          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
            <div className="relative overflow-hidden px-6 py-7 sm:px-9 sm:py-9">
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-neutral-100" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <img
                    src={getAvatar(user)}
                    alt={user.name || "User"}
                    onError={(event) => {
                      event.currentTarget.src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.name || "User"
                        )}&background=111111&color=ffffff&size=256`;
                    }}
                    className="h-24 w-24 rounded-[28px] object-cover ring-4 ring-neutral-100 sm:h-28 sm:w-28"
                  />

                  <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-black text-white">
                    <Check size={13} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                      {user.name || "My Account"}
                    </h1>

                    {user.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <ShieldCheck size={13} />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-1 text-sm text-neutral-500 sm:flex-row sm:items-center sm:gap-4">
                    <span className="flex items-center gap-2">
                      <Mail size={14} />
                      {user.email}
                    </span>

                    {user.phone && (
                      <span className="flex items-center gap-2">
                        <Phone size={14} />
                        {user.phone}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs text-neutral-400">
                    Member since{" "}
                    {formatShortDate(
                      user.createdAt
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowLogoutConfirm(true)
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* =================================================
                TABS
            ================================================= */}

            <div className="border-t border-neutral-200 px-4 py-4 sm:px-6">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {tabs.map((tab) => {
                  const active =
                    activeTab === tab.id;

                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() =>
                        setActiveTab(tab.id)
                      }
                      className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all sm:px-5 ${
                        active
                          ? "bg-black text-white shadow-lg shadow-black/10"
                          : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-black"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* =================================================
              CONTENT
          ================================================= */}

          <section className="rounded-[32px] border border-neutral-200 bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.035)] sm:p-8">
            {activeTab === "orders" && (
              <OrdersContent />
            )}

            {activeTab === "wishlist" && (
              <WishlistContent />
            )}

            {activeTab === "addresses" && (
              <AddressesContent />
            )}

            {activeTab === "account" && (
              <AccountContent
                user={user}
                setUser={setUser}
              />
            )}
          </section>
        </div>
      </div>

      {/* =================================================
          LOGOUT MODAL
      ================================================= */}

      {showLogoutConfirm && (
        <Modal
          onClose={() =>
            setShowLogoutConfirm(false)
          }
          className="max-w-md"
        >
          <div className="p-7 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <LogOut size={21} />
            </div>

            <h3 className="mt-5 text-2xl font-bold tracking-tight text-neutral-950">
              Sign out?
            </h3>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              You will be signed out of this
              device. Your account data and
              orders will remain safe.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowLogoutConfirm(false)
                }
                className="h-12 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="h-12 rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =====================================================
   ORDERS
===================================================== */

function OrdersContent() {
  const { add, addBundle } =
    useCart();

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrdersQuery();

  const [cancelOrderMutation, { isLoading: cancelling }] =
    useCancelOrderMutation();

  const orders = useMemo(() => {
    const rawOrders = Array.isArray(ordersData?.orders)
      ? ordersData.orders
      : [];

    return rawOrders.map((order) => ({
      ...order,
      total:
        order.total ??
        order.totalPrice ??
        order.amount ??
        0,
      createdAt:
        order.createdAt ||
        order.created_at,
      itemCount:
        Array.isArray(order.items)
          ? order.items.length
          : order.itemCount || 0,
    }));
  }, [ordersData]);

  const loading = ordersLoading;

  const error =
    ordersError?.data?.error ||
    ordersError?.data?.message ||
    ordersError?.error ||
    "";

  const [query, setQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [sortDir, setSortDir] =
    useState("desc");

  const [refreshing, setRefreshing] =
    useState(false);

  const [modalOrder, setModalOrder] =
    useState(null);

  const [cancelOrder, setCancelOrder] =
    useState(null);

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    const search =
      query.trim().toLowerCase();

    if (search) {
      list = list.filter((order) => {
        const number =
          String(
            order.orderNumber ||
              order._id ||
              order.id ||
              ""
          ).toLowerCase();

        const email =
          String(
            order.email || ""
          ).toLowerCase();

        const items =
          Array.isArray(order.items) &&
          order.items.some((item) =>
            String(
              item.title ||
                item.productName ||
                ""
            )
              .toLowerCase()
              .includes(search)
          );

        return (
          number.includes(search) ||
          email.includes(search) ||
          items
        );
      });
    }

    if (statusFilter !== "all") {
      list = list.filter(
        (order) =>
          getOrderStatus(order) ===
          statusFilter
      );
    }

    list.sort((a, b) => {
      const first =
        new Date(
          a.createdAt
        ).getTime() || 0;

      const second =
        new Date(
          b.createdAt
        ).getTime() || 0;

      return sortDir === "desc"
        ? second - first
        : first - second;
    });

    return list;
  }, [
    orders,
    query,
    statusFilter,
    sortDir,
  ]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetchOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelOrder) return;

    try {
      setCancelling(true);

      const result = await cancelOrderMutation(
        cancelOrder._id || cancelOrder.id
      ).unwrap();

      toast.success(
        result?.message ||
          "Order cancelled successfully"
      );

      setCancelOrder(null);
      setModalOrder(null);
      await refetchOrders();
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Unable to cancel order"
      );
    }
  };

  const handleReorder = async (order) => {
    try {
      if (!Array.isArray(order?.items)) {
        return;
      }

      for (const item of order.items) {
        const publicId =
          getProductPublicId(item);

        const bundleId =
          getBundleId(item);

        if (publicId) {
          await add(
            publicId,
            item.variant ??
              item.size
          );
        }

        if (bundleId && item.bundle) {
          await addBundleToCart(
            item.bundle,
            item.selectedSizes ||
              item.sizes ||
              {}
          );
        }
      }

      toast.success(
        "Items added to cart"
      );
    } catch (err) {
      console.error(
        "REORDER ERROR:",
        err
      );

      toast.error(
        "Unable to reorder"
      );
    }
  };

  const canCancel = (order) =>
    ["pending", "confirmed"].includes(
      getOrderStatus(order)
    );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-[28px] border border-neutral-200 p-5"
          >
            <div className="flex gap-5">
              <div className="h-28 w-28 rounded-2xl bg-neutral-100" />

              <div className="flex-1 space-y-4">
                <div className="h-5 w-1/3 rounded bg-neutral-100" />
                <div className="h-4 w-1/4 rounded bg-neutral-100" />
                <div className="h-4 w-1/2 rounded bg-neutral-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            Account
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950">
            Orders & Returns
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Track your purchases and manage
            your orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">
            {orders.length}{" "}
            {orders.length === 1
              ? "order"
              : "orders"}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-neutral-200 px-4 text-sm font-semibold transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCcw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>
      </div>

      {/* CONTROLS */}

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="flex h-12 items-center rounded-2xl border border-neutral-200 bg-white px-4 transition focus-within:border-black">
          <Search
            size={17}
            className="shrink-0 text-neutral-400"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Search orders, products..."
            className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
          className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-black"
        >
          <option value="all">
            All statuses
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="confirmed">
            Confirmed
          </option>
          <option value="processing">
            Processing
          </option>
          <option value="shipped">
            Shipped
          </option>
          <option value="delivered">
            Delivered
          </option>
          <option value="fulfilled">
            Fulfilled
          </option>
          <option value="completed">
            Completed
          </option>
          <option value="cancelled">
            Cancelled
          </option>
        </select>

        <select
          value={sortDir}
          onChange={(event) =>
            setSortDir(
              event.target.value
            )
          }
          className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-black"
        >
          <option value="desc">
            Newest first
          </option>
          <option value="asc">
            Oldest first
          </option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle
            size={17}
          />
          {error}
        </div>
      )}

      {!filteredOrders.length ? (
        <EmptyState
          icon={<Package size={25} />}
          title={
            query ||
            statusFilter !== "all"
              ? "No matching orders"
              : "No orders yet"
          }
          description={
            query ||
            statusFilter !== "all"
              ? "Try changing your search or filter."
              : "Your completed purchases will appear here."
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(
            (order) => {
              const firstItem =
                order.items?.[0];

              const image =
                getProductImage(
                  firstItem
                );

              const publicId =
                getProductPublicId(
                  firstItem
                );

              const bundleId =
                getBundleId(
                  firstItem
                );

              const productUrl =
                publicId
                  ? `/product/${publicId}`
                  : bundleId
                  ? `/bundle/${bundleId}`
                  : null;

              return (
                <article
                  key={
                    order._id ||
                    order.id
                  }
                  className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white transition duration-300 hover:border-neutral-300 hover:shadow-[0_18px_50px_rgba(0,0,0,0.07)]"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
                      {/* IMAGE */}

                      <div className="flex min-w-0 flex-1 gap-5">
                        {productUrl ? (
                          <Link
                            to={
                              productUrl
                            }
                            className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-neutral-100"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={
                                  firstItem?.title ||
                                  "Product"
                                }
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                No image
                              </div>
                            )}
                          </Link>
                        ) : (
                          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                            {image ? (
                              <img
                                src={image}
                                alt={
                                  firstItem?.title ||
                                  "Product"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                No image
                              </div>
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setModalOrder(
                                  order
                                )
                              }
                              className="text-lg font-bold text-neutral-950 transition hover:underline"
                            >
                              #
                              {String(
                                getOrderNumber(
                                  order
                                )
                              ).slice(
                                -14
                              )}
                            </button>

                            <StatusBadge
                              status={getOrderStatus(
                                order
                              )}
                            />
                          </div>

                          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                            <CalendarDays
                              size={14}
                            />
                            {formatDate(
                              order.createdAt
                            )}
                          </p>

                          {firstItem?.title && (
                            <p className="mt-3 line-clamp-2 text-base font-semibold text-neutral-900">
                              {
                                firstItem.title
                              }
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
                            <span>
                              <strong className="text-neutral-800">
                                {
                                  order.itemCount
                                }
                              </strong>{" "}
                              {order.itemCount ===
                              1
                                ? "item"
                                : "items"}
                            </span>

                            <span>
                              Payment:{" "}
                              <strong className="text-neutral-800">
                                {order.paymentStatus ||
                                  "Paid"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* TOTAL */}

                      <div className="flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between xl:w-[290px] xl:border-t-0 xl:border-l xl:pl-6 xl:pt-0">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                            Total
                          </p>

                          <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
                            {formatCurrency(
                              order.total
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setModalOrder(
                              order
                            )
                          }
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                        >
                          View
                          <ChevronRight
                            size={15}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {/* ORDER MODAL */}

      {modalOrder && (
        <OrderModal
          order={modalOrder}
          onClose={() =>
            setModalOrder(null)
          }
          onReorder={() =>
            handleReorder(
              modalOrder
            )
          }
          onCancel={() =>
            setCancelOrder(
              modalOrder
            )
          }
          canCancel={canCancel(
            modalOrder
          )}
        />
      )}

      {/* CANCEL MODAL */}

      {cancelOrder && (
        <Modal
          onClose={() =>
            !cancelling &&
            setCancelOrder(null)
          }
          className="max-w-md"
        >
          <div className="p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle
                size={22}
              />
            </div>

            <h3 className="mt-5 text-2xl font-bold tracking-tight">
              Cancel order?
            </h3>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Are you sure you want to
              cancel order #
              {getOrderNumber(
                cancelOrder
              )}
              ? This action cannot be
              undone.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() =>
                  setCancelOrder(
                    null
                  )
                }
                className="h-12 rounded-2xl border border-neutral-200 text-sm font-semibold disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={
                  handleCancel
                }
                className="h-12 rounded-2xl bg-black text-sm font-semibold text-white disabled:opacity-50"
              >
                {cancelling
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =====================================================
   ORDER MODAL
===================================================== */

function OrderModal({
  order,
  onClose,
  onReorder,
  onCancel,
  canCancel,
}) {
  const status =
    getOrderStatus(order);

  return (
    <Modal
      onClose={onClose}
      className="max-w-6xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="truncate text-xl font-bold text-neutral-950 sm:text-2xl">
              Order #
              {getOrderNumber(
                order
              )}
            </h3>

            <StatusBadge
              status={status}
            />
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            {formatDate(
              order.createdAt
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 transition hover:bg-neutral-50"
        >
          <X size={17} />
        </button>
      </div>

      <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[300px_1fr]">
        {/* SIDEBAR */}

        <div className="space-y-4">
          <InfoCard
            icon={
              <CreditCard
                size={17}
              />
            }
            title="Payment"
          >
            <p className="font-semibold text-neutral-900">
              {order.paymentMethod
                ? String(
                    order.paymentMethod
                  ).toUpperCase()
                : "—"}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Status:{" "}
              {order.paymentStatus ||
                "Paid"}
            </p>
          </InfoCard>

          <InfoCard
            icon={
              <Truck size={17} />
            }
            title="Delivery address"
          >
            <AddressDisplay
              address={
                order.shippingAddress
              }
            />
          </InfoCard>

          <InfoCard
            icon={
              <ShoppingBag
                size={17}
              />
            }
            title="Order summary"
          >
            <div className="space-y-3 text-sm">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(
                  order.subtotal ??
                    order.total ??
                    order.amount
                )}
              />

              <SummaryRow
                label="Shipping"
                value={
                  order.shippingFee
                    ? formatCurrency(
                        order.shippingFee
                      )
                    : "Free"
                }
              />

              {Number(
                order.couponDiscount
              ) > 0 && (
                <SummaryRow
                  label="Discount"
                  value={`-${formatCurrency(
                    order.couponDiscount
                  )}`}
                />
              )}

              <div className="border-t border-neutral-200 pt-3">
                <SummaryRow
                  label="Total"
                  value={formatCurrency(
                    order.total
                  )}
                  strong
                />
              </div>
            </div>
          </InfoCard>
        </div>

        {/* MAIN */}

        <div className="space-y-6">
          {/* PROGRESS */}

          <InfoCard
            icon={
              <Truck size={17} />
            }
            title="Order progress"
          >
            {Array.isArray(
              order.statusHistory
            ) &&
            order.statusHistory.length ? (
              <div className="space-y-5">
                {order.statusHistory.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item._id ||
                        item.id ||
                        index
                      }
                      className="flex gap-4"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                          <Check
                            size={13}
                          />
                        </div>

                        {index <
                          order
                            .statusHistory
                            .length -
                            1 && (
                          <div className="absolute top-7 h-8 w-px bg-neutral-200" />
                        )}
                      </div>

                      <div className="min-w-0 pb-2">
                        <p className="font-semibold capitalize text-neutral-900">
                          {
                            item.status
                          }
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">
                          {formatDate(
                            item.updatedAt
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                No status history
                available.
              </div>
            )}
          </InfoCard>

          {/* ITEMS */}

          <InfoCard
            icon={
              <Package size={17} />
            }
            title={`Items (${
              order.itemCount ??
              order.items?.length ??
              0
            })`}
          >
            <div className="space-y-3">
              {Array.isArray(
                order.items
              ) &&
              order.items.length ? (
                order.items.map(
                  (
                    item,
                    index
                  ) => {
                    const image =
                      getProductImage(
                        item
                      );

                    return (
                      <div
                        key={
                          item._id ||
                          item.id ||
                          `${getProductPublicId(
                            item
                          )}-${index}`
                        }
                        className="flex gap-4 rounded-2xl border border-neutral-200 p-4"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                item.title ||
                                "Product"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <p className="font-semibold text-neutral-900">
                              {item.title ||
                                "Item"}
                            </p>

                            <p className="font-bold text-neutral-950">
                              {formatCurrency(
                                item.price
                              )}
                            </p>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                            {(
                              item.variant ??
                              item.size
                            ) && (
                              <span>
                                Variant:{" "}
                                {item.variant ??
                                  item.size}
                              </span>
                            )}

                            <span>
                              Qty:{" "}
                              {item.quantity ||
                                1}
                            </span>

                            {item.sku && (
                              <span>
                                SKU:{" "}
                                {
                                  item.sku
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <p className="text-sm text-neutral-500">
                  No items found.
                </p>
              )}
            </div>
          </InfoCard>

          {/* ACTIONS */}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onReorder}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <RotateCcw
                size={16}
              />
              Reorder
            </button>

            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <X size={16} />
                Cancel Order
              </button>
            )}

            <a
              href={`mailto:support@yourdomain.com?subject=${encodeURIComponent(
                `Order ${getOrderNumber(
                  order
                )}`
              )}`}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-neutral-200 px-5 text-sm font-semibold transition hover:bg-neutral-50"
            >
              <Mail size={16} />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* =====================================================
   WISHLIST
===================================================== */

function WishlistContent() {
  const {
    wishlist,
    removeFromWishlist,
    loading: wishlistLoading,
  } = useWishlist();

  const {
    add,
  } = useCart();

  const wishlistKey = wishlist.join(",");

  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
  } = useGetProductsByIdsQuery(wishlistKey, {
    skip: !wishlist.length,
  });

  const products = Array.isArray(productsData?.items)
    ? productsData.items
    : [];

  const loading = productsLoading || productsFetching;

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [sizeModalOpen, setSizeModalOpen] =
    useState(false);

  const [removingId, setRemovingId] =
    useState(null);

  const handleRemove = async (
    product
  ) => {
    const publicId = product.publicId;

    if (!publicId) {
      toast.error("Product publicId is missing");
      return;
    }

    try {
      setRemovingId(
        String(publicId)
      );

      await removeFromWishlist(
        publicId
      );
    } finally {
      setRemovingId(null);
    }
  };

  const openCartModal = (
    product
  ) => {
    const inventory =
      product.inventory || {};

    const sizes =
      Object.entries(
        inventory
      );

    if (!sizes.length) {
      add(
        product.publicId 
      );

      toast.success(
        "Added to cart"
      );

      return;
    }

    setSelectedProduct(
      product
    );

    setSizeModalOpen(true);
  };

  const handleSize = (
    size
  ) => {
    if (!selectedProduct) {
      return;
    }

    add(
      selectedProduct.publicId,
      size
    );

    setSizeModalOpen(false);
    setSelectedProduct(null);

    toast.success(
      "Added to cart"
    );
  };

  const availableCount =
    products.filter(
      (product) => {
        const inventory =
          Object.values(
            product.inventory || {}
          );

        return inventory.some(
          (qty) =>
            Number(qty) > 0
        );
      }
    ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            Saved
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950">
            My Wishlist
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Products you've saved for
            later.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-semibold">
            <Heart
              size={15}
            />

            {products.length} items
          </div>

          {availableCount > 0 && (
            <div className="hidden rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 sm:block">
              {availableCount} available
            </div>
          )}
        </div>
      </div>

      {loading ||
      wishlistLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="animate-pulse rounded-[28px] border border-neutral-200 p-4"
              >
                <div className="flex gap-4">
                  <div className="h-32 w-32 rounded-2xl bg-neutral-100" />

                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 rounded bg-neutral-100" />
                    <div className="h-4 w-1/2 rounded bg-neutral-100" />
                    <div className="h-6 w-1/3 rounded bg-neutral-100" />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      ) : !products.length ? (
        <EmptyState
          icon={
            <Heart
              size={26}
            />
          }
          title="Your wishlist is empty"
          description="Save products you love and find them here whenever you're ready."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map(
            (product) => {
              const publicId =
                product.publicId;

              const image =
                product.images?.[0] ||
                product.mainImage ||
                "";

              const inventory =
                product.inventory || {};

              const available =
                Object.values(
                  inventory
                ).some(
                  (qty) =>
                    Number(qty) > 0
                );

              return (
                <article
                  key={String(publicId)}
                  className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-4 transition duration-300 hover:border-neutral-300 hover:shadow-[0_18px_50px_rgba(0,0,0,0.07)]"
                >
                  <div className="flex gap-4">
                    <Link
                      to={`/product/${publicId}`}
                      className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-neutral-100"
                    >
                      {image ? (
                        <img
                          src={
                            image
                          }
                          alt={
                            product.title ||
                            "Product"
                          }
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                          No image
                        </div>
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to={`/product/${publicId}`}
                          className="min-w-0"
                        >
                          <h3 className="line-clamp-2 font-semibold text-neutral-950 transition hover:underline">
                            {
                              product.title
                            }
                          </h3>
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(
                              product
                            )
                          }
                          disabled={
                            removingId ===
                            String(publicId)
                          }
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {removingId ===
                          String(
                            publicId
                          ) ? (
                            <RefreshCcw
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={15}
                            />
                          )}
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-neutral-400">
                        Saved for later
                      </p>

                      <p className="mt-3 text-xl font-bold tracking-tight text-neutral-950">
                        {formatCurrency(
                          product.price
                        )}
                      </p>

                      <div className="mt-auto flex items-center gap-2 pt-4">
                        <button
                          type="button"
                          disabled={
                            !available
                          }
                          onClick={() =>
                            openCartModal(
                              product
                            )
                          }
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-black px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                        >
                          <ShoppingBag
                            size={14}
                          />

                          {available
                            ? "Add to Cart"
                            : "Out of Stock"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {/* SIZE MODAL */}

  {sizeModalOpen && selectedProduct && (
  <Modal
    onClose={() => {
      setSizeModalOpen(false);
      setSelectedProduct(null);
    }}
    className="max-w-md"
  >
    <div className="p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            Product
          </p>

          <h3 className="mt-1 text-xl font-bold">
            Select size
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            setSizeModalOpen(false);
            setSelectedProduct(null);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 transition hover:bg-black hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-6 flex gap-4 rounded-2xl bg-neutral-50 p-3">
        <img
          src={selectedProduct.images?.[0] || ""}
          alt={selectedProduct.title}
          className="h-20 w-20 rounded-xl object-cover"
        />

        <div className="min-w-0">
          <p className="line-clamp-2 font-semibold">
            {selectedProduct.title}
          </p>

          <p className="mt-1 font-bold">
            {formatCurrency(selectedProduct.price)}
          </p>
        </div>
      </div>

      {/* SIZES */}
      <div className="mt-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
          Available sizes
        </p>

        {Array.isArray(selectedProduct.sizes) &&
        selectedProduct.sizes.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {selectedProduct.sizes
              .filter(
                (size) => size.active !== false
              )
              .map((size) => {
                const sizeName = String(size.name);

                const qty = Number(
                  selectedProduct.inventory?.stock?.[
                    sizeName
                  ] ?? 0
                );

                const trackInventory =
                  selectedProduct.inventory
                    ?.trackInventory !== false;

                const allowBackorder =
                  selectedProduct.inventory
                    ?.allowBackorder === true;

                const available =
                  !trackInventory ||
                  qty > 0 ||
                  allowBackorder;

                return (
                  <button
                    key={
                      size._id ||
                      sizeName
                    }
                    type="button"
                    disabled={!available}
                    onClick={() =>
                      handleSize(sizeName)
                    }
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      available
                        ? "border-neutral-200 bg-white hover:border-black hover:bg-black hover:text-white"
                        : "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300"
                    }`}
                  >
                    <span className="block">
                      {sizeName}
                    </span>

                    <span className="mt-1 block text-[10px] font-medium opacity-60">
                      {!trackInventory
                        ? "Available"
                        : qty > 0
                        ? `${qty} left`
                        : allowBackorder
                        ? "Backorder"
                        : "Out"}
                    </span>
                  </button>
                );
              })}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center">
            <p className="text-sm font-semibold">
              No sizes available
            </p>
          </div>
        )}
      </div>

   
    </div>
  </Modal>
)}
    </div>
  );
}

/* =====================================================
   ADDRESSES
===================================================== */

function AddressesContent() {
  const {
    data: addressData,
    isLoading: addressesLoading,
    isFetching: addressesFetching,
  } = useAddressesQuery();

  const addresses = Array.isArray(addressData?.addresses)
    ? addressData.addresses
    : [];

  const [addAddress, { isLoading: isAddingAddress }] =
    useAddAddressMutation();

  const [updateAddress, { isLoading: isUpdatingAddress }] =
    useUpdateAddressMutation();

  const [deleteAddress, { isLoading: isDeletingAddress }] =
    useDeleteAddressMutation();

  const loading = addressesLoading || addressesFetching;

  const [defaultingId, setDefaultingId] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const saving = isAddingAddress || isUpdatingAddress;

  const [deletingIdState, setDeletingIdState] = useState(null);
  const deletingId = isDeletingAddress ? deletingIdState : null;

  const handleSave = async (
    payload
  ) => {
    try {
      if (editing?._id) {
        await updateAddress({
          id: editing._id,
          ...payload,
        }).unwrap();
      } else {
        await addAddress(payload).unwrap();
      }

      setModalOpen(false);
      setEditing(null);

      toast.success(
        editing
          ? "Address updated"
          : "Address added"
      );
    } catch (err) {
      console.error(
        "SAVE ADDRESS ERROR:",
        err
      );

      throw err;
    }
  };

  const handleDelete =
    async (address) => {
      if (address.isDefault) {
        toast.error(
          "Default address cannot be deleted"
        );
        return;
      }

      try {
        setDeletingIdState(address._id);
        await deleteAddress(address._id).unwrap();

        toast.success(
          "Address deleted"
        );
      } catch (err) {
        console.error(
          "DELETE ADDRESS ERROR:",
          err
        );

        toast.error(
          err?.data?.message ||
            err?.error ||
            "Failed to delete address"
        );
      } finally {
        setDeletingIdState(null);
      }
    };

  const handleDefault =
    async (address) => {
      try {
        setDefaultingId(
          address._id
        );

        await updateAddress({
          id: address._id,
          isDefault: true,
        }).unwrap();

        toast.success(
          "Default address updated"
        );
      } catch (err) {
        console.error(
          "DEFAULT ADDRESS ERROR:",
          err
        );

        toast.error(
          err?.data?.message ||
            err?.error ||
            "Failed to update default address"
        );
      } finally {
        setDefaultingId(null);
      }
    };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-40 animate-pulse rounded-[28px] bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            Delivery
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Saved Addresses
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Manage your delivery
            addresses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <Plus size={16} />
          Add Address
        </button>
      </div>

      {!addresses.length ? (
        <EmptyState
          icon={
            <MapPinned
              size={26}
            />
          }
          title="No saved addresses"
          description="Add an address to make checkout faster."
          action={
            <button
              type="button"
              onClick={() =>
                setModalOpen(true)
              }
              className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Add Address
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {addresses.map(
            (address) => (
              <article
                key={address._id}
                className={`rounded-[28px] border p-5 transition sm:p-6 ${
                  address.isDefault
                    ? "border-black bg-neutral-50/50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
                      <MapPin
                        size={18}
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-neutral-950">
                          {address.name ||
                            "Address"}
                        </h3>

                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            <Check
                              size={11}
                            />
                            Default
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-sm leading-6 text-neutral-600">
                        <p>
                          {
                            address.address
                          }
                        </p>

                        <p>
                          {
                            address.city
                          }
                          ,{" "}
                          {
                            address.state
                          }{" "}
                          —{" "}
                          {
                            address.zip
                          }
                        </p>

                        {address.phone && (
                          <p className="flex items-center gap-2 text-neutral-500">
                            <Phone
                              size={13}
                            />
                            {
                              address.phone
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {!address.isDefault && (
                      <button
                        type="button"
                        disabled={
                          defaultingId ===
                          address._id
                        }
                        onClick={() =>
                          handleDefault(
                            address
                          )
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-xs font-semibold transition hover:border-black disabled:opacity-50"
                      >
                        {defaultingId ===
                        address._id ? (
                          <RefreshCcw
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Check
                            size={13}
                          />
                        )}
                        Set Default
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditing(
                          address
                        );
                        setModalOpen(
                          true
                        );
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-xs font-semibold transition hover:border-black hover:bg-neutral-50"
                    >
                      <Pencil
                        size={13}
                      />
                      Edit
                    </button>

                    {!address.isDefault && (
                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          address._id
                        }
                        onClick={() =>
                          handleDelete(
                            address
                          )
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId ===
                        address._id ? (
                          <RefreshCcw
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={13}
                          />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      {modalOpen && (
        <AddressModal
          initial={editing}
          saving={saving}
          onClose={() => {
            if (saving) return;

            setModalOpen(false);
            setEditing(null);
          }}
          onSave={
            handleSave
          }
        />
      )}
    </div>
  );
}

/* =====================================================
   ADDRESS MODAL
===================================================== */

function AddressModal({
  initial,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] =
    useState({
      name:
        initial?.name || "",
      phone:
        initial?.phone || "",
      address:
        initial?.address || "",
      city:
        initial?.city || "",
      state:
        initial?.state || "",
      zip:
        initial?.zip || "",
      isDefault:
        Boolean(
          initial?.isDefault
        ),
    });

  const [error, setError] =
    useState("");

  const update =
    (field) =>
    (event) => {
      setForm(
        (current) => ({
          ...current,
          [field]:
            event.target.value,
        })
      );
    };

  const submit = async () => {
    const name =
      form.name.trim();

    const phone =
      form.phone.trim();

    const address =
      form.address.trim();

    const city =
      form.city.trim();

    const state =
      form.state.trim();

    const zip =
      form.zip.trim();

    if (
      !name ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zip
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    if (
      !/^[0-9]{10}$/.test(
        phone
      )
    ) {
      setError(
        "Enter a valid 10-digit phone number."
      );
      return;
    }

    if (
      !/^[0-9]{6}$/.test(
        zip
      )
    ) {
      setError(
        "Enter a valid 6-digit PIN code."
      );
      return;
    }

    try {
      setError("");

      await onSave({
        name,
        phone,
        address,
        city,
        state,
        zip,
        isDefault:
          form.isDefault,
      });
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.error ||
          "Failed to save address."
      );
    }
  };

  return (
    <Modal
      onClose={onClose}
      className="max-w-xl"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              Delivery
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight">
              {initial
                ? "Edit address"
                : "Add address"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-7 space-y-5">
          <Input
            label="Full name"
            value={form.name}
            onChange={update(
              "name"
            )}
            placeholder="Enter full name"
          />

          <Input
            label="Phone number"
            value={form.phone}
            onChange={update(
              "phone"
            )}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            maxLength={10}
          />

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-500">
              Street address
            </label>

            <textarea
              value={
                form.address
              }
              onChange={update(
                "address"
              )}
              rows={3}
              placeholder="House number, street, area"
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="City"
              value={
                form.city
              }
              onChange={update(
                "city"
              )}
              placeholder="City"
            />

            <Input
              label="State"
              value={
                form.state
              }
              onChange={update(
                "state"
              )}
              placeholder="State"
            />
          </div>

          <Input
            label="PIN code"
            value={form.zip}
            onChange={update(
              "zip"
            )}
            placeholder="6-digit PIN"
            inputMode="numeric"
            maxLength={6}
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 p-4">
            <input
              type="checkbox"
              checked={
                form.isDefault
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    isDefault:
                      event.target
                        .checked,
                  })
                )
              }
              className="h-4 w-4 accent-black"
            />

            <div>
              <p className="text-sm font-semibold">
                Make this my default
                address
              </p>

              <p className="mt-0.5 text-xs text-neutral-500">
                Use this address
                automatically at checkout.
              </p>
            </div>
          </label>

          {error && (
            <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-neutral-200 text-sm font-semibold disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="h-12 flex-1 rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : initial
              ? "Update Address"
              : "Save Address"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* =====================================================
   ACCOUNT
===================================================== */

function AccountContent({
  user,
  setUser,
}) {
  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState(user?.name || "");

  const [phone, setPhone] =
    useState(user?.phone || "");

  const [avatarPreview, setAvatarPreview] =
    useState(
      user?.avatar || ""
    );

  const [avatarFile, setAvatarFile] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const fileInputRef =
    useRef(null);

  useEffect(() => {
    setName(
      user?.name || ""
    );

    setPhone(
      user?.phone || ""
    );

    setAvatarPreview(
      user?.avatar || ""
    );
  }, [
    user?.name,
    user?.phone,
    user?.avatar,
  ]);

  useEffect(() => {
    return () => {
      if (
        avatarPreview?.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }
    };
  }, [avatarPreview]);

  const pickAvatar = (
    file
  ) => {
    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      toast.error(
        "Please select an image"
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      toast.error(
        "Image must be smaller than 5MB"
      );
      return;
    }

    if (
      avatarPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setAvatarFile(file);

    setAvatarPreview(
      URL.createObjectURL(
        file
      )
    );
  };

  const save = async () => {
    const trimmedName =
      name.trim();

    if (!trimmedName) {
      toast.error(
        "Name is required"
      );
      return;
    }

    try {
      setSaving(true);

      let avatarUrl =
        user?.avatar || "";

      if (avatarFile) {
        const formData =
          new FormData();

        formData.append(
          "file",
          avatarFile
        );

        const uploadResponse =
          await api.post(
            "/upload/image",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        avatarUrl =
          uploadResponse.data
            ?.url || avatarUrl;
      }

      const payload = {};

      if (
        trimmedName !==
        (user?.name || "")
      ) {
        payload.name =
          trimmedName;
      }

      if (
        phone.trim() !==
        (user?.phone || "")
      ) {
        payload.phone =
          phone.trim();
      }

      if (
        avatarUrl !==
        (user?.avatar || "")
      ) {
        payload.avatar =
          avatarUrl;
      }

      if (
        !Object.keys(
          payload
        ).length
      ) {
        toast("No changes made");
        setEditing(false);
        return;
      }

      const response =
        await api.put(
          "/user/update",
          payload
        );

      const updatedUser =
        response.data?.user;

      if (updatedUser) {
        setUser(
          updatedUser
        );

        setAvatarPreview(
          updatedUser.avatar ||
            ""
        );
      }

      setAvatarFile(null);
      setEditing(false);

      toast.success(
        "Profile updated successfully"
      );
    } catch (err) {
      console.error(
        "PROFILE UPDATE ERROR:",
        err
      );

      toast.error(
        err?.response?.data
          ?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (
      avatarPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        avatarPreview
      );
    }

    setName(
      user?.name || ""
    );

    setPhone(
      user?.phone || ""
    );

    setAvatarPreview(
      user?.avatar || ""
    );

    setAvatarFile(null);
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            Personal
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Account Settings
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Manage your personal
            information.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() =>
              setEditing(true)
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <Pencil
              size={15}
            />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* PROFILE IMAGE */}

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={
                  avatarPreview ||
                  getAvatar(user)
                }
                alt={
                  user?.name ||
                  "User"
                }
                className="h-40 w-40 rounded-[36px] object-cover shadow-xl ring-4 ring-white"
              />

              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow-lg"
                >
                  <Camera
                    size={17}
                  />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) =>
                pickAvatar(
                  event.target
                    .files?.[0]
                )
              }
            />

            <h3 className="mt-5 text-lg font-bold">
              {user?.name}
            </h3>

            <p className="mt-1 break-all text-sm text-neutral-500">
              {user?.email}
            </p>

            {editing && (
              <p className="mt-4 text-xs leading-5 text-neutral-400">
                JPG, PNG or WebP
                <br />
                Maximum 5MB
              </p>
            )}
          </div>
        </div>

        {/* FORM */}

        <div className="rounded-[28px] border border-neutral-200 p-6 sm:p-7">
          <div className="space-y-5">
            <Input
              label="Full name"
              value={name}
              disabled={!editing}
              onChange={(event) =>
                setName(
                  event.target
                    .value
                )
              }
              placeholder="Your name"
            />

            <Input
              label="Phone number"
              value={phone}
              disabled={!editing}
              onChange={(event) =>
                setPhone(
                  event.target
                    .value
                )
              }
              placeholder="Phone number"
            />

            <Input
              label="Email address"
              value={
                user?.email || ""
              }
              disabled
              readOnly
              placeholder="Email"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <AccountInfo
                label="Account type"
                value={
                  user?.provider ===
                  "google"
                    ? "Google"
                    : "Email"
                }
              />

              <AccountInfo
                label="Member since"
                value={formatShortDate(
                  user?.createdAt
                )}
              />
            </div>

            {editing && (
              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    cancelEdit
                  }
                  className="h-12 rounded-2xl border border-neutral-200 px-5 text-sm font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="h-12 rounded-2xl bg-black px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECURITY */}

      <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-neutral-900 shadow-sm">
            <ShieldCheck
              size={19}
            />
          </div>

          <div>
            <h3 className="font-bold text-neutral-950">
              Account security
            </h3>

            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Keep your account
              information up to date and
              use a strong password for
              your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   SMALL COMPONENTS
===================================================== */

function Input({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  inputMode,
  maxLength,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </label>

      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`h-12 w-full rounded-2xl border px-4 text-sm outline-none transition ${
          disabled
            ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-500"
            : "border-neutral-200 bg-white focus:border-black"
        }`}
      />
    </div>
  );
}

function AccountInfo({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-neutral-900">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
        {icon}
        {title}
      </div>

      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong
          ? "text-base font-bold text-neutral-950"
          : ""
      }`}
    >
      <span
        className={
          strong
            ? "text-neutral-950"
            : "text-neutral-500"
        }
      >
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}

function AddressDisplay({
  address,
}) {
  if (!address) {
    return (
      <p className="text-sm text-neutral-500">
        No shipping address available.
      </p>
    );
  }

  return (
    <div className="text-sm leading-6 text-neutral-600">
      <p className="font-semibold text-neutral-900">
        {address.firstName ||
          address.name ||
          ""}{" "}
        {address.lastName || ""}
      </p>

      <p>
        {address.address ||
          ""}
      </p>

      {address.apartment && (
        <p>
          {address.apartment}
        </p>
      )}

      <p>
        {address.city || ""}
        {address.city &&
        address.state
          ? ", "
          : ""}
        {address.state || ""}
        {address.zip
          ? ` - ${address.zip}`
          : ""}
      </p>

      {address.country && (
        <p>
          {address.country}
        </p>
      )}

      {address.phone && (
        <p className="mt-2 flex items-center gap-2 text-neutral-500">
          <Phone size={13} />
          {address.phone}
        </p>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-neutral-200 bg-neutral-50/50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-900 shadow-sm">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold text-neutral-950">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}