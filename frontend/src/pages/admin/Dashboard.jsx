import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  DollarSign,
  Package,
  Plus,
  RefreshCcw,
  ShoppingBag,
  Truck,
  Users,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Wallet,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
import { useGetAdminStatsQuery } from "@/store/api";

const RANGE_OPTIONS = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  dispatched: {
    label: "Dispatched",
    icon: Truck,
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  "out for delivery": {
    label: "Out for delivery",
    icon: Truck,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const CHART_TOOLTIP = {
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(0,0,0,.08)",
};

const PIE_STOPS = [
  "#111827",
  "#4b5563",
  "#9ca3af",
  "#d1d5db",
  "#6b7280",
  "#374151",
];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const formatPercent = (value) => {
  const n = Number(value || 0);
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
};

const titleCase = (value) =>
  String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  alert = false,
}) {
  const hasTrend = trend !== undefined && trend !== null;
  const positive = Number(trend || 0) >= 0;

  return (
    <Card className="overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              alert ? "bg-red-50" : "bg-gray-100"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                alert ? "text-red-600" : "text-gray-700"
              }`}
            />
          </div>

          {hasTrend && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                positive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(Number(trend || 0)).toFixed(1)}%
            </span>
          )}
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
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
      label: titleCase(status) || "Unknown",
      icon: Clock3,
      className: "bg-gray-100 text-gray-700 border-gray-200",
    };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-1 font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
      <div>
        <CardTitle className="text-base font-bold text-gray-950">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
      </div>
      {action}
    </CardHeader>
  );
}

function EmptyState({ text = "No data available" }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
      {text}
    </div>
  );
}

function LoadingBlock({ className = "h-20" }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
  );
}

export default function AdminDashboard() {
  const [range, setRange] = useState(30);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAdminStatsQuery(range, {
    pollingInterval: 60000,
    refetchOnMountOrArgChange: true,
  });

  const overview = data?.overview || {};
  const revenue = data?.revenue || {};
  const growth = data?.growth || {};
  const customers = data?.customers || {};
  const revenueData = Array.isArray(data?.revenueData)
    ? data.revenueData
    : [];
  const orderStatusData = Array.isArray(data?.orderStatusData)
    ? data.orderStatusData
    : [];
  const paymentStatusData = Array.isArray(data?.paymentStatusData)
    ? data.paymentStatusData
    : [];
  const fulfillmentData = Array.isArray(data?.fulfillmentData)
    ? data.fulfillmentData
    : [];
  const sourceData = Array.isArray(data?.sourceData)
    ? data.sourceData
    : [];
  const topProducts = Array.isArray(data?.topProducts)
    ? data.topProducts
    : [];
  const topCategories = Array.isArray(data?.topCategories)
    ? data.topCategories
    : [];
  const lastOrders = Array.isArray(data?.lastOrders)
    ? data.lastOrders
    : [];

  const chartData = useMemo(
    () =>
      revenueData.map((item) => ({
        ...item,
        revenue: Number(item.revenue || 0),
        orders: Number(item.orders || 0),
      })),
    [revenueData]
  );

  const orderChartData = useMemo(
    () =>
      orderStatusData
        .map((item) => ({
          name: titleCase(item._id),
          value: Number(item.count || 0),
          revenue: Number(item.revenue || 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [orderStatusData]
  );

  const paymentChartData = useMemo(
    () =>
      paymentStatusData.map((item) => ({
        name: titleCase(item._id),
        value: Number(item.count || 0),
        amount: Number(item.amount || 0),
      })),
    [paymentStatusData]
  );

const categoryChartData = useMemo(
  () =>
    topCategories
      .map((item) => ({
        name: item.name || "Uncategorized",
        revenue: Number(item.revenue || 0),
        quantity: Number(item.quantity || 0),
      }))
      .slice(0, 6),
  [topCategories]
);

  const rangeLabel =
    RANGE_OPTIONS.find((item) => item.value === range)?.label || "30D";

  return (
    <div className="min-h-full bg-gray-50" data-lenis-prevent>
      <div className="mx-auto w-full max-w-[1800px] space-y-6 pb-8">
        {/* HEADER */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                  Dashboard
                </h1>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Real-time overview of your store performance and operations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      range === option.value
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-500 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-9 rounded-xl"
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${
                    isFetching ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>

              <Button
                asChild
                className="h-9 rounded-xl bg-black text-white hover:bg-gray-800"
              >
                <Link to="/admin/new/products">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
            <span>
              Analytics: <b className="text-gray-600">{rangeLabel}</b>
            </span>
            <span className="hidden h-3 w-px bg-gray-200 sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Auto refresh every 60 seconds
            </span>
            {isFetching && !isLoading && (
              <>
                <span className="hidden h-3 w-px bg-gray-200 sm:block" />
                <span className="font-medium text-gray-600">Updating...</span>
              </>
            )}
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  Unable to load dashboard
                </p>
                <p className="text-xs text-red-600">
                  Check your admin session and API connection.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-red-200 bg-white"
            >
              Retry
            </Button>
          </div>
        )}

        {/* PRIMARY KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <>
              <LoadingBlock className="h-[145px]" />
              <LoadingBlock className="h-[145px]" />
              <LoadingBlock className="h-[145px]" />
              <LoadingBlock className="h-[145px]" />
            </>
          ) : (
            <>
              <MetricCard
                title="Revenue"
                value={formatCurrency(revenue.total)}
                icon={DollarSign}
                trend={growth.revenue}
                description={`${formatNumber(
                  revenue.orders
                )} paid orders in selected period`}
              />

              <MetricCard
                title="Orders"
                value={formatNumber(revenue.orders)}
                icon={ShoppingBag}
                trend={growth.orders}
                description={`${formatNumber(
                  overview.orders
                )} total orders in store`}
              />

              <MetricCard
                title="Average Order Value"
                value={formatCurrency(revenue.averageOrderValue)}
                icon={Wallet}
                description="Average revenue per paid order"
              />

              <MetricCard
                title="New Customers"
                value={formatNumber(customers.newUsers)}
                icon={Users}
                trend={growth.users}
                description={`${formatNumber(
                  customers.uniqueCustomers
                )} unique customers in period`}
              />
            </>
          )}
        </div>

        {/* SECONDARY KPI ROW */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8">
          {[
            ["Paid", overview.paidOrders, CreditCard, false],
            ["Pending Payment", overview.pendingPayments, Clock3, false],
            ["Delivered", overview.deliveredOrders, CheckCircle2, false],
            ["Cancelled", overview.cancelledOrders, XCircle, true],
            ["Returns", overview.returnedOrders, RotateCcw, true],
            ["Products", overview.products, Package, false],
            ["Low Stock", overview.lowStockProducts, AlertTriangle, true],
            ["Out of Stock", overview.outOfStockProducts, Box, true],
          ].map(([label, value, Icon, alert]) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {label}
                </p>
                <Icon
                  className={`h-4 w-4 ${
                    alert ? "text-red-500" : "text-gray-400"
                  }`}
                />
              </div>
              <p
                className={`mt-2 text-xl font-bold ${
                  alert && Number(value || 0) > 0
                    ? "text-red-600"
                    : "text-gray-950"
                }`}
              >
                {formatNumber(value)}
              </p>
            </div>
          ))}
        </div>

        {/* REVENUE + ORDER PIPELINE */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Revenue Analytics"
              description={`Revenue and order activity for the last ${range} days`}
              action={
                <div className="hidden items-center gap-4 text-xs text-gray-500 sm:flex">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-900" />
                    Revenue
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    Orders
                  </span>
                </div>
              }
            />

            <CardContent>
              <div className="h-[360px]">
                {isLoading ? (
                  <LoadingBlock className="h-full" />
                ) : chartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 5,
                        left: -18,
                        bottom: 0,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="adminRevenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopOpacity={0.22} />
                          <stop offset="100%" stopOpacity={0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="4 4"
                        strokeOpacity={0.18}
                      />

                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                      />

                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          value >= 1000
                            ? `₹${Math.round(value / 1000)}k`
                            : `₹${value}`
                        }
                      />

                      <Tooltip
                        contentStyle={CHART_TOOLTIP}
                        formatter={(value, name) =>
                          name === "revenue"
                            ? [formatCurrency(value), "Revenue"]
                            : [formatNumber(value), "Orders"]
                        }
                      />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#111827"
                        strokeWidth={2.5}
                        fill="url(#adminRevenueGradient)"
                        dot={false}
                        activeDot={{ r: 5 }}
                      />

                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#9ca3af"
                        strokeWidth={1.5}
                        fill="transparent"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState text="No revenue data available" />
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    Revenue
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {formatCurrency(revenue.total)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    Subtotal
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {formatCurrency(revenue.subtotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    Shipping
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {formatCurrency(revenue.shipping)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    Discounts
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {formatCurrency(revenue.discount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Order Pipeline"
              description="Distribution across order statuses"
              action={
                <Link
                  to="/admin/orders"
                  className="text-xs font-bold text-gray-500 hover:text-black"
                >
                  View all
                </Link>
              }
            />

            <CardContent>
              {orderChartData.length ? (
                <div className="space-y-4">
                  {orderChartData.slice(0, 7).map((item) => {
                    const total = Math.max(Number(revenue.orders || 0), 1);
                    const percent = Math.min(
                      100,
                      (item.value / total) * 100
                    );

                    return (
                      <div key={item.name}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600">
                            {item.name}
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            {formatNumber(item.value)}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gray-900 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="No order status data" />
              )}

              <Button
                asChild
                variant="outline"
                className="mt-6 w-full rounded-xl"
              >
                <Link to="/admin/orders">
                  Manage Orders
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PERFORMANCE GRID */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* TOP PRODUCTS */}
          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm xl:col-span-2">
            <SectionHeader
              title="Top Products"
              description="Best performing products by units and revenue"
              action={
                <Button asChild variant="ghost" size="sm" className="rounded-xl">
                  <Link to="/admin/products">
                    View all
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              }
            />

            <CardContent className="pt-0">
              {topProducts.length ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[40px_minmax(220px,1fr)_110px_130px] border-y bg-gray-50 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      <span>#</span>
                      <span>Product</span>
                      <span>Units</span>
                      <span className="text-right">Revenue</span>
                    </div>

                    <div className="divide-y">
                      {topProducts.slice(0, 8).map((product, index) => {
                        const title =
                          product?._id?.title ||
                          product?.title ||
                          "Unknown product";
                        const image =
                          product?.image ||
                          product?.thumbnail ||
                          product?.mainImage;

                        const units =
                          product?.quantity ??
                          product?.unitsSold ??
                          0;

                        const productRevenue =
                          product?.revenue || 0;

                        return (
                          <div
                            key={`${product?._id?.productId || product?._id || title}-${index}`}
                            className="grid grid-cols-[40px_minmax(220px,1fr)_110px_130px] items-center px-3 py-3.5"
                          >
                            <span className="text-xs font-bold text-gray-400">
                              {index + 1}
                            </span>

                            <div className="flex min-w-0 items-center gap-3">
                              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border bg-gray-100">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Box className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-800">
                                  {title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-400">
                                  Product performance
                                </p>
                              </div>
                            </div>

                            <span className="text-sm font-semibold text-gray-700">
                              {formatNumber(units)}
                            </span>

                            <span className="text-right text-sm font-bold text-gray-950">
                              {formatCurrency(productRevenue)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState text="No product sales yet" />
              )}
            </CardContent>
          </Card>

          {/* PAYMENT */}
          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Payment Overview"
              description="Payment status for selected period"
            />

            <CardContent className="pt-0">
              {paymentChartData.length ? (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {paymentChartData.map((_, index) => (
                            <Cell
                              key={`payment-${index}`}
                              fill={PIE_STOPS[index % PIE_STOPS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          contentStyle={CHART_TOOLTIP}
                          formatter={(value) => [
                            formatNumber(value),
                            "Orders",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {paymentChartData.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              background:
                                PIE_STOPS[index % PIE_STOPS.length],
                            }}
                          />
                          <span className="text-xs font-semibold text-gray-600">
                            {item.name}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-gray-900">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState text="No payment data" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* CATEGORY + SOURCE */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Category Performance"
              description="Revenue contribution by category"
            />

            <CardContent className="pt-0">
              {categoryChartData.length ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        strokeDasharray="4 4"
                        strokeOpacity={0.15}
                      />

                      <XAxis
                        type="number"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                          value >= 1000
                            ? `₹${Math.round(value / 1000)}k`
                            : `₹${value}`
                        }
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        contentStyle={CHART_TOOLTIP}
                        formatter={(value) => [
                          formatCurrency(value),
                          "Revenue",
                        ]}
                      />

                      <Bar
                        dataKey="revenue"
                        radius={[0, 8, 8, 0]}
                        barSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="No category data" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Sales Channels"
              description="Where your orders are coming from"
            />

            <CardContent className="pt-0">
              {sourceData.length ? (
                <div className="space-y-4">
                  {sourceData.map((item) => {
                    const totalRevenue = Math.max(
                      sourceData.reduce(
                        (sum, current) =>
                          sum + Number(current.revenue || 0),
                        0
                      ),
                      1
                    );

                    const percentage =
                      (Number(item.revenue || 0) / totalRevenue) * 100;

                    return (
                      <div key={item._id || "unknown"}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {titleCase(item._id || "Unknown")}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {formatNumber(item.count)} orders
                            </p>
                          </div>

                          <p className="text-sm font-bold">
                            {formatCurrency(item.revenue)}
                          </p>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gray-900"
                            style={{
                              width: `${Math.min(100, percentage)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState text="No channel data" />
              )}

              <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Revenue growth
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatPercent(growth.revenue)} compared with previous
                      period
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OPERATIONS */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Fulfillment"
              description="Operational order state"
            />

            <CardContent className="pt-0">
              {fulfillmentData.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {fulfillmentData.map((item) => (
                    <div
                      key={item._id || "unknown"}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Truck className="h-4 w-4 text-gray-600" />
                      </div>

                      <p className="mt-4 text-xs font-semibold capitalize text-gray-500">
                        {item._id || "Unknown"}
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-950">
                        {formatNumber(item.count)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No fulfillment data" />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Store Health"
              description="Items that may require attention"
              action={
                <Link
                  to="/admin/inventory"
                  className="text-xs font-bold text-gray-500 hover:text-black"
                >
                  Inventory
                </Link>
              }
            />

            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  to="/admin/inventory"
                  className="rounded-2xl border border-red-100 bg-red-50 p-4 transition hover:border-red-200"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <p className="mt-4 text-xs font-semibold text-red-700">
                    Out of Stock
                  </p>
                  <p className="mt-1 text-2xl font-bold text-red-800">
                    {formatNumber(overview.outOfStockProducts)}
                  </p>
                </Link>

                <Link
                  to="/admin/inventory"
                  className="rounded-2xl border border-amber-100 bg-amber-50 p-4 transition hover:border-amber-200"
                >
                  <Box className="h-5 w-5 text-amber-600" />
                  <p className="mt-4 text-xs font-semibold text-amber-700">
                    Low Stock
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-800">
                    {formatNumber(overview.lowStockProducts)}
                  </p>
                </Link>

                <Link
                  to="/admin/orders"
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-gray-200"
                >
                  <Clock3 className="h-5 w-5 text-gray-600" />
                  <p className="mt-4 text-xs font-semibold text-gray-600">
                    Pending Payments
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatNumber(overview.pendingPayments)}
                  </p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RECENT ORDERS */}
        <Card className="rounded-3xl border-gray-200 bg-white shadow-sm">
          <SectionHeader
            title="Recent Orders"
            description="Latest customer transactions"
            action={
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link to="/admin/orders">
                  View Orders
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            }
          />

          <CardContent className="p-0">
            {lastOrders.length ? (
              <div className="overflow-x-auto">
                <div className="min-w-[850px]">
                  <div className="grid grid-cols-[minmax(300px,1fr)_150px_140px_150px_130px] border-y bg-gray-50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    <span>Order</span>
                    <span>Customer</span>
                    <span>Date</span>
                    <span>Amount</span>
                    <span>Status</span>
                  </div>

                  <div className="divide-y">
                    {lastOrders.slice(0, 10).map((order) => {
                      const firstItem = order.items?.[0];

                      return (
                        <Link
                          key={order._id || order.publicOrderId}
                          to={`/admin/orders/${order._id || order.publicOrderId}`}
                          className="grid grid-cols-[minmax(300px,1fr)_150px_140px_150px_130px] items-center px-5 py-3.5 transition hover:bg-gray-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border bg-gray-100">
                              {firstItem?.mainImage ? (
                                <img
                                  src={firstItem.mainImage}
                                  alt={firstItem.title || "Product"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-gray-800">
                                {firstItem?.title || "Order"}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                #
                                {order.orderNumber ||
                                  String(order._id || "").slice(-8)}
                                {order.items?.length > 1
                                  ? ` +${order.items.length - 1} more`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <span className="truncate pr-3 text-xs text-gray-500">
                            {order.email || "Guest customer"}
                          </span>

                          <span className="text-xs text-gray-500">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </span>

                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(order.total)}
                            </p>
                            <p className="mt-0.5 text-[10px] uppercase text-gray-400">
                              {order.paymentMethod || "—"}
                            </p>
                          </div>

                          <StatusBadge status={order.orderStatus} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-52 items-center justify-center text-sm text-gray-400">
                No orders yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              title: "Add Product",
              description: "Create a new product",
              icon: Plus,
              to: "/admin/new/products",
            },
            {
              title: "Add Bundle",
              description: "Create a bundle",
              icon: Package,
              to: "/admin/new/bundles",
            },
            {
              title: "Inventory",
              description: "Manage stock",
              icon: Box,
              to: "/admin/inventory",
            },
            {
              title: "Orders",
              description: "Manage customer orders",
              icon: ShoppingBag,
              to: "/admin/orders",
            },
          ].map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                to={action.to}
                className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 transition group-hover:bg-black group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {action.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {action.description}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:text-gray-700" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing analytics for the last {range} days.
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Admin analytics operational
          </span>
        </div>
      </div>
    </div>
  );
}