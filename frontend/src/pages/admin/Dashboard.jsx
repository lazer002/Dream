import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Box,
  CheckCircle2,
  Clock3,
  DollarSign,
  Package,
  Plus,
  RefreshCcw,
  ShoppingBag,
  Truck,
  Users,
  XCircle,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/utils/config";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
  },

  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className:
      "bg-blue-50 text-blue-700 border-blue-200",
  },

  dispatched: {
    label: "Dispatched",
    icon: Truck,
    className:
      "bg-indigo-50 text-indigo-700 border-indigo-200",
  },

  shipped: {
    label: "Shipped",
    icon: Truck,
    className:
      "bg-sky-50 text-sky-700 border-sky-200",
  },

  "out for delivery": {
    label: "Out for delivery",
    icon: Truck,
    className:
      "bg-orange-50 text-orange-700 border-orange-200",
  },

  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    className:
      "bg-green-50 text-green-700 border-green-200",
  },

  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className:
      "bg-red-50 text-red-700 border-red-200",
  },

  refunded: {
    label: "Refunded",
    icon: RefreshCcw,
    className:
      "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
}) {
  const positive = Number(trend || 0) >= 0;

  return (
    <Card className="border-gray-200 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Icon className="h-5 w-5 text-gray-700" />
          </div>

          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                positive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}

              {Math.abs(Number(trend))}%
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-400">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  const config =
    STATUS_CONFIG[key] || {
      label: status || "Unknown",
      icon: Clock3,
      className:
        "bg-gray-100 text-gray-700 border-gray-200",
    };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    lastOrders: [],
    revenueData: [],
    topProducts: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);

      const { data } = await api.get(
        "/admin/stats"
      );

      setStats({
        users: Number(data?.users || 0),
        products: Number(data?.products || 0),
        orders: Number(data?.orders || 0),
        revenue: Number(data?.revenue || 0),
        lastOrders: Array.isArray(
          data?.lastOrders
        )
          ? data.lastOrders
          : [],
        revenueData: Array.isArray(
          data?.revenueData
        )
          ? data.revenueData
          : [],
        topProducts: Array.isArray(
          data?.topProducts
        )
          ? data.topProducts
          : [],
      });
    } catch (error) {
      console.error(
        "FAILED TO LOAD DASHBOARD:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(
      fetchStats,
      60000
    );

    return () => clearInterval(interval);
  }, []);

  const orderSummary = useMemo(() => {
    const orders = stats.lastOrders || [];

    return {
      pending: orders.filter(
        (o) =>
          o.orderStatus?.toLowerCase() ===
          "pending"
      ).length,

      confirmed: orders.filter(
        (o) =>
          o.orderStatus?.toLowerCase() ===
          "confirmed"
      ).length,

      shipped: orders.filter((o) =>
        [
          "shipped",
          "dispatched",
          "out for delivery",
        ].includes(
          o.orderStatus?.toLowerCase()
        )
      ).length,

      delivered: orders.filter(
        (o) =>
          o.orderStatus?.toLowerCase() ===
          "delivered"
      ).length,
    };
  }, [stats.lastOrders]);

  return (
    <div
      className="min-h-full bg-gray-50"
      data-lenis-prevent
    >
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        {/* =====================================
            HEADER
        ===================================== */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                Dashboard
              </h1>

              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                Live
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Overview of your store performance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchStats}
              disabled={refreshing}
              className="h-9"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </Button>

            <Button
              asChild
              className="h-9 bg-black text-white hover:bg-gray-800"
            >
              <Link to="/admin/new/products">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* =====================================
            METRICS
        ===================================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(
              stats.revenue
            )}
            icon={DollarSign}
            trend={4}
            description="Compared with previous period"
          />

          <MetricCard
            title="Total Orders"
            value={formatNumber(
              stats.orders
            )}
            icon={ShoppingBag}
            trend={3}
            description="Orders placed"
          />

          <MetricCard
            title="Total Products"
            value={formatNumber(
              stats.products
            )}
            icon={Package}
            trend={2}
            description="Products in catalog"
          />

          <MetricCard
            title="Customers"
            value={formatNumber(
              stats.users
            )}
            icon={Users}
            trend={8}
            description="Registered customers"
          />
        </div>

        {/* =====================================
            SALES + ORDER STATUS
        ===================================== */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* SALES CHART */}
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  Sales Overview
                </CardTitle>

                <CardDescription className="mt-1">
                  Revenue and order activity over the last 30 days
                </CardDescription>
              </div>

              <div className="rounded-lg border bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                Last 30 days
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-[320px] w-full">
                {stats.revenueData?.length ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={stats.revenueData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopOpacity={0.2}
                          />

                          <stop
                            offset="100%"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        strokeOpacity={0.15}
                      />

                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        tick={{
                          fontSize: 11,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          boxShadow:
                            "0 4px 12px rgba(0,0,0,.08)",
                        }}
                        formatter={(value, name) =>
                          name === "revenue"
                            ? [
                                formatCurrency(
                                  value
                                ),
                                "Revenue",
                              ]
                            : [
                                value,
                                "Orders",
                              ]
                        }
                      />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#111827"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-gray-400">
                    No sales data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ORDER PIPELINE */}
          <Card className="border-gray-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Order Pipeline
              </CardTitle>

              <CardDescription>
                Current order activity
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {[
                {
                  label: "Pending",
                  value:
                    orderSummary.pending,
                  icon: Clock3,
                },
                {
                  label: "Confirmed",
                  value:
                    orderSummary.confirmed,
                  icon: CheckCircle2,
                },
                {
                  label: "In Transit",
                  value:
                    orderSummary.shipped,
                  icon: Truck,
                },
                {
                  label: "Delivered",
                  value:
                    orderSummary.delivered,
                  icon: CheckCircle2,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>

                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                    </div>

                    <span className="text-lg font-bold text-gray-950">
                      {item.value}
                    </span>
                  </div>
                );
              })}

              <Button
                asChild
                variant="outline"
                className="mt-2 w-full"
              >
                <Link to="/admin/orders">
                  View All Orders
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* =====================================
            TOP PRODUCTS + QUICK ACTIONS
        ===================================== */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* TOP PRODUCTS */}
          <Card className="border-gray-200 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  Top Products
                </CardTitle>

                <CardDescription>
                  Best performing products
                </CardDescription>
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
              >
                <Link to="/admin/products">
                  View all
                </Link>
              </Button>
            </CardHeader>

            <CardContent>
              {stats.topProducts?.length ? (
                <div className="divide-y">
                  {stats.topProducts
                    .slice(0, 6)
                    .map((product, index) => (
                      <div
                        key={
                          product._id ||
                          index
                        }
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-5 text-xs font-semibold text-gray-400">
                            #{index + 1}
                          </span>

                          <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                            {product.thumbnail ? (
                              <img
                                src={
                                  product.thumbnail
                                }
                                alt={
                                  product.title
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Box className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {product.title}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatNumber(
                                product.unitsSold
                              )}{" "}
                              units sold
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(
                              product.revenue
                            )}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            Revenue
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-gray-400">
                  No product sales yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* QUICK ACTIONS */}
          <Card className="border-gray-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                Quick Actions
              </CardTitle>

              <CardDescription>
                Frequently used admin actions
              </CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-2">
              <Link
                to="/admin/new/products"
                className="group rounded-lg border p-4 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <Plus className="h-5 w-5 text-gray-600" />

                <p className="mt-3 text-sm font-semibold">
                  Add Product
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Create a product
                </p>
              </Link>

              <Link
                to="/admin/new/bundles"
                className="group rounded-lg border p-4 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <Package className="h-5 w-5 text-gray-600" />

                <p className="mt-3 text-sm font-semibold">
                  Add Bundle
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Create a bundle
                </p>
              </Link>

              <Link
                to="/admin/inventory"
                className="group rounded-lg border p-4 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <Box className="h-5 w-5 text-gray-600" />

                <p className="mt-3 text-sm font-semibold">
                  Inventory
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Manage stock
                </p>
              </Link>

              <Link
                to="/admin/orders"
                className="group rounded-lg border p-4 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <ShoppingBag className="h-5 w-5 text-gray-600" />

                <p className="mt-3 text-sm font-semibold">
                  Orders
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Manage orders
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* =====================================
            RECENT ORDERS
        ===================================== */}
        <Card className="border-gray-200 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">
                Recent Orders
              </CardTitle>

              <CardDescription>
                Latest customer transactions
              </CardDescription>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link to="/admin/orders">
                View Orders
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {stats.lastOrders?.length ? (
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-[minmax(260px,1fr)_150px_140px_130px] border-y bg-gray-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    <span>Order</span>
                    <span>Date</span>
                    <span>Amount</span>
                    <span>Status</span>
                  </div>

                  {stats.lastOrders
                    .slice(0, 8)
                    .map((order) => {
                      const firstItem =
                        order.items?.[0];

                      return (
                        <Link
                          key={order._id}
                          to={`/admin/orders/${order._id}`}
                          className="grid grid-cols-[minmax(260px,1fr)_150px_140px_130px] items-center border-b px-5 py-3.5 transition hover:bg-gray-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                              {firstItem?.mainImage ? (
                                <img
                                  src={
                                    firstItem.mainImage
                                  }
                                  alt={
                                    firstItem.title ||
                                    "Product"
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-800">
                                {firstItem?.title ||
                                  "Order"}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {order.orderNumber
                                  ? `#${order.orderNumber}`
                                  : `#${String(
                                      order._id
                                    ).slice(
                                      -8
                                    )}`}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs text-gray-500">
                            {order.createdAt
                              ? new Date(
                                  order.createdAt
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </span>

                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              order.total ||
                                order.subtotal
                            )}
                          </span>

                          <StatusBadge
                            status={
                              order.orderStatus
                            }
                          />
                        </Link>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center text-sm text-gray-400">
                No orders yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* =====================================
            FOOTER INFO
        ===================================== */}
        <div className="flex flex-col gap-2 pb-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Dashboard updates automatically every
            60 seconds.
          </span>

          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            System operational
          </div>
        </div>
      </div>
    </div>
  );
}