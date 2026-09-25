import React, { useMemo, useState } from "react";
import {
  Package,
  Search,
  ChevronRight,
  Clock3,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useOrdersQuery } from "@/store/api";

const STATUS_TABS = [
  {
    key: "all",
    label: "All Orders",
  },
  {
    key: "processing",
    label: "Processing",
  },
  {
    key: "shipped",
    label: "Shipped",
  },
  {
    key: "delivered",
    label: "Delivered",
  },
  {
    key: "cancelled",
    label: "Cancelled",
  },
];

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getLatestStatus = (order) => {
  if (
    Array.isArray(order?.statusHistory) &&
    order.statusHistory.length
  ) {
    return (
      order.statusHistory[
        order.statusHistory.length - 1
      ]?.status ||
      order.orderStatus ||
      "confirmed"
    );
  }

  return order?.orderStatus || "confirmed";
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();

  if (
    [
      "pending",
      "confirmed",
      "processing",
      "placed",
    ].includes(value)
  ) {
    return "processing";
  }

  if (
    [
      "dispatched",
      "shipped",
      "out for delivery",
    ].includes(value)
  ) {
    return "shipped";
  }

  if (value === "delivered") {
    return "delivered";
  }

  if (
    [
      "cancelled",
      "canceled",
      "returned",
    ].includes(value)
  ) {
    return "cancelled";
  }

  return "processing";
};

const getStatusConfig = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "delivered") {
    return {
      label: "Delivered",
      icon: CheckCircle2,
      className:
        "bg-[#B6FF2E] text-black",
    };
  }

  if (normalized === "shipped") {
    return {
      label:
        status === "out for delivery"
          ? "Out for Delivery"
          : "Shipped",
      icon: Truck,
      className:
        "bg-black text-white",
    };
  }

  if (normalized === "cancelled") {
    return {
      label:
        String(status || "")
          .toLowerCase()
          .includes("return")
          ? "Returned"
          : "Cancelled",
      icon: XCircle,
      className:
        "bg-gray-100 text-gray-700",
    };
  }

  return {
    label:
      status === "pending"
        ? "Pending"
        : "Processing",
    icon: Clock3,
    className:
      "bg-gray-100 text-gray-700",
  };
};

function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-3
        py-1.5
        text-[9px]
        font-black
        uppercase
        tracking-[0.15em]
        ${config.className}
      `}
    >
      <Icon className="h-3 w-3" />

      {config.label}
    </span>
  );
}

function ProductPreview({ item }) {
  return (
    <div
      className="
        h-[92px]
        w-[74px]
        shrink-0
        overflow-hidden
        rounded-xl
        bg-[#F5F5F5]
      "
    >
      <img
        src={
          item?.mainImage ||
          "/images/placeholder-400.png"
        }
        alt={item?.title || "Product"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function OrderCard({ order }) {
  const navigate = useNavigate();

  const status = getLatestStatus(order);

  const itemCount = useMemo(() => {
    return (order?.items || []).reduce(
      (total, item) =>
        total +
        Number(item?.quantity || 0),
      0
    );
  }, [order?.items]);

  const firstItem = order?.items?.[0];

  const extraItems = Math.max(
    0,
    Number(order?.items?.length || 0) - 1
  );

  const hasCustomBundle =
    order?.items?.some(
      (item) => item?.customBundle === true
    );

  return (
    <article
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[#E7E7E7]
        bg-white
        transition
        hover:border-black
      "
    >
      {/* TOP */}
      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-gray-100
          px-5
          py-5
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Order
            </p>

            <p className="text-sm font-black tracking-tight">
              #{order?.orderNumber}
            </p>

            <StatusBadge status={status} />
          </div>

          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
            Placed on {formatDate(order?.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Total
            </p>

            <p className="mt-1 text-lg font-black">
              {formatPrice(order?.total)}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/order-details/${encodeURIComponent(
                  order?.orderNumber
                )}`
              )
            }
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-gray-200
              transition
              hover:border-black
              hover:bg-black
              hover:text-white
            "
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PRODUCT */}
      <div className="px-5 py-5 sm:px-6">
        <div className="flex gap-4">
          <ProductPreview item={firstItem} />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {firstItem?.customBundle ? (
                  <span
                    className="
                      inline-flex
                      rounded-full
                      bg-[#F1F8E9]
                      px-2.5
                      py-1
                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      text-[#176B2A]
                    "
                  >
                    Custom Bundle
                  </span>
                ) : (
                  <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    Product
                  </span>
                )}

                <h3 className="mt-1 truncate text-sm font-bold">
                  {firstItem?.title ||
                    "Product"}
                </h3>

                {!firstItem?.customBundle &&
                  firstItem?.variant && (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">
                      Size:{" "}
                      {firstItem.variant}
                    </p>
                  )}

                <p className="mt-1 text-[10px] text-gray-500">
                  Qty:{" "}
                  {firstItem?.quantity || 1}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black">
                  {formatPrice(
                    firstItem?.total
                  )}
                </p>

                {firstItem?.quantity > 1 && (
                  <p className="mt-1 text-[9px] text-gray-400">
                    {formatPrice(
                      firstItem?.price
                    )}{" "}
                    each
                  </p>
                )}
              </div>
            </div>

            {hasCustomBundle &&
              firstItem?.bundleProducts?.length >
                0 && (
                <div className="mt-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#176B2A]">
                    {firstItem.bundleProducts.length}{" "}
                    items in bundle
                  </span>
                </div>
              )}

            {extraItems > 0 && (
              <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">
                + {extraItems} more item
                {extraItems > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* OTHER ITEMS */}
        {order?.items?.length > 1 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap gap-2">
              {order.items
                .slice(1, 5)
                .map((item, index) => (
                  <div
                    key={
                      item?._id ||
                      item?.productId ||
                      index
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      bg-[#F7F7F7]
                      px-2
                      py-1.5
                    "
                  >
                    <img
                      src={
                        item?.mainImage ||
                        "/images/placeholder-400.png"
                      }
                      alt=""
                      className="
                        h-7
                        w-7
                        rounded-full
                        object-cover
                      "
                    />

                    <span className="max-w-[150px] truncate text-[9px] font-semibold">
                      {item?.title}
                    </span>
                  </div>
                ))}

              {order.items.length > 5 && (
                <span
                  className="
                    flex
                    items-center
                    rounded-full
                    bg-black
                    px-3
                    py-1.5
                    text-[9px]
                    font-black
                    text-white
                  "
                >
                  +{order.items.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div
        className="
          flex
          flex-col
          gap-3
          border-t
          border-gray-100
          bg-[#FAFAFA]
          px-5
          py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-gray-500" />

          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">
            {order?.fulfillmentStatus ||
              "Unfulfilled"}
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/order-details/${encodeURIComponent(
                order?.orderNumber
              )}`
            )
          }
          className="
            flex
            items-center
            gap-2
            self-start
            text-[9px]
            font-black
            uppercase
            tracking-[0.2em]
            transition
            hover:opacity-50
            sm:self-auto
          "
        >
          View Order Details

          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

export default function Orders() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useOrdersQuery();

  const orders = data?.orders || [];

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] =
    useState("all");

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const status = getLatestStatus(order);
      const normalized =
        normalizeStatus(status);

      const matchesTab =
        activeTab === "all" ||
        normalized === activeTab;

      const matchesSearch =
        !query ||
        String(
          order?.orderNumber || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(
          order?.publicOrderId || ""
        )
          .toLowerCase()
          .includes(query) ||
        (order?.items || []).some(
          (item) =>
            String(
              item?.title || ""
            )
              .toLowerCase()
              .includes(query)
        );

      return (
        matchesTab &&
        matchesSearch
      );
    });
  }, [orders, search, activeTab]);

  const counts = useMemo(() => {
    return {
      all: orders.length,

      processing: orders.filter(
        (order) =>
          normalizeStatus(
            getLatestStatus(order)
          ) === "processing"
      ).length,

      shipped: orders.filter(
        (order) =>
          normalizeStatus(
            getLatestStatus(order)
          ) === "shipped"
      ).length,

      delivered: orders.filter(
        (order) =>
          normalizeStatus(
            getLatestStatus(order)
          ) === "delivered"
      ).length,

      cancelled: orders.filter(
        (order) =>
          normalizeStatus(
            getLatestStatus(order)
          ) === "cancelled"
      ).length,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-6 w-6 animate-spin" />

            <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400">
              Loading orders
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F5F5]">
            <Package className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-xl font-black uppercase tracking-tight">
            Unable to load orders
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            We couldn't load your orders right now.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="
              mt-6
              bg-black
              px-7
              py-3
              text-[10px]
              font-black
              uppercase
              tracking-[0.2em]
              text-white
              transition
              hover:bg-[#B6FF2E]
              hover:text-black
            "
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* HEADER */}
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-[1300px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-400">
                GARRIB / Account
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                My Orders
              </h1>

              <p className="mt-3 max-w-lg text-sm leading-6 text-gray-500">
                Track your orders, view delivery
                progress and manage your purchases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-12
                  min-w-[120px]
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                "
              >
                <ShoppingBag className="h-4 w-4" />

                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-gray-400">
                    Orders
                  </p>

                  <p className="text-sm font-black">
                    {orders.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTROLS */}
      <section className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1300px] px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* TABS */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {STATUS_TABS.map((tab) => {
                const active =
                  activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.key)
                    }
                    className={`
                      flex
                      shrink-0
                      items-center
                      gap-2
                      rounded-full
                      px-4
                      py-2.5
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      transition
                      ${
                        active
                          ? "bg-black text-white"
                          : "bg-[#F5F5F5] text-gray-500 hover:bg-gray-200"
                      }
                    `}
                  >
                    {tab.label}

                    <span
                      className={`
                        flex
                        h-5
                        min-w-5
                        items-center
                        justify-center
                        rounded-full
                        px-1
                        text-[8px]
                        font-black
                        ${
                          active
                            ? "bg-[#B6FF2E] text-black"
                            : "bg-white text-gray-500"
                        }
                      `}
                    >
                      {counts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SEARCH */}
            <div className="relative w-full lg:max-w-[300px]">
              <Search
                className="
                  absolute
                  left-4
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search orders..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-[#FAFAFA]
                  pl-11
                  pr-4
                  text-xs
                  outline-none
                  transition
                  focus:border-black
                "
              />
            </div>
          </div>
        </div>
      </section>

      {/* LIST */}
      <section className="mx-auto max-w-[1100px] px-5 py-7 sm:px-8 lg:py-10">
        {isFetching && (
          <div className="mb-5 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {!filteredOrders.length ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F5F5F5]">
              <Package className="h-8 w-8" />
            </div>

            <p className="mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
              No matching orders
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Nothing here yet
            </h2>

            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Try changing your search or selecting
              another order status.
            </p>

            {(search || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveTab("all");
                }}
                className="
                  mt-6
                  bg-black
                  px-7
                  py-3
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-white
                  transition
                  hover:bg-[#B6FF2E]
                  hover:text-black
                "
              >
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => (
              <OrderCard
                key={
                  order?.id ||
                  order?._id ||
                  order?.publicOrderId ||
                  order?.orderNumber
                }
                order={order}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}