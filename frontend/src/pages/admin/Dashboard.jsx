import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../state/AuthContext.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { ArrowUp, ArrowDown, Package, Users, ShoppingBag, DollarSign, RefreshCcw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  const api  = useAuth();
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

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ icon: Icon, title, value, trend }) => (
    <Card className="p-5 border bg-white dark:bg-neutral-900 transition hover:shadow-md">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className="text-neutral-500" size={18} />
          <CardTitle className="text-sm text-neutral-500 font-medium">{title}</CardTitle>
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-semibold flex items-center ${
              trend >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {Math.abs(trend)}%
          </span>
        )}
      </CardHeader>
      <CardContent className="text-3xl font-semibold tracking-tight mt-1">
        {value}
      </CardContent>
    </Card>
  );

  const formatCurrency = (num) => `₹${num?.toLocaleString("en-IN")}`;

  const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    dispatched: "bg-indigo-100 text-indigo-800",
    shipped: "bg-sky-100 text-sky-800",
    "out for delivery": "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-200 text-gray-800",
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <Button
          variant="outline"
          onClick={fetchStats}
          className="flex items-center gap-2"
        >
          <RefreshCcw size={16} /> Refresh
        </Button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          title="Users"
          value={stats.users}
          trend={8}
        />
        <MetricCard
          icon={Package}
          title="Products"
          value={stats.products}
          trend={2}
        />
        <MetricCard
          icon={ShoppingBag}
          title="Orders"
          value={stats.orders}
          trend={3}
        />
        <MetricCard
          icon={DollarSign}
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          trend={4}
        />
      </div>

      {/* REVENUE CHART + TOP PRODUCTS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="p-4 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle>Revenue & Orders (Last 30 days)</CardTitle>
            <CardDescription>
              Monitor daily sales and order volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(v, n) =>
                    n === "revenue" ? formatCurrency(v) : v
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="p-4 bg-white dark:bg-neutral-900">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performers by sales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topProducts?.length ? (
              stats.topProducts.slice(0, 5).map((p) => (
                <div key={p._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-10 h-10 rounded-md object-cover border"
                    />
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-neutral-500">
                        {p.unitsSold} sold
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatCurrency(p.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QUICK LINKS */}
      <Card className="p-4 bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/admin/products", label: "Manage Products" },
            { to: "/admin/products/new", label: "Add Product" },
            { to: "/admin/users", label: "Manage Users" },
            { to: "/admin/orders", label: "Manage Orders" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="border rounded-md p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-center text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* RECENT ORDERS */}
      <Card className="bg-white dark:bg-neutral-900">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest transactions</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {stats.lastOrders?.length ? (
            stats.lastOrders.slice(0, 6).map((o) => (
              <div
                key={o._id}
                className="py-3 flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={o.items?.[0]?.mainImage}
                    alt={o.items?.[0]?.title}
                    className="w-10 h-10 rounded-md border object-cover"
                  />
                  <div>
                    <div className="font-medium">{o.items?.[0]?.title}</div>
                    <div className="text-neutral-500 text-xs">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(o.total || o.subtotal)}
                  </p>
                  <Badge
                    className={`${STATUS_COLORS[o.orderStatus?.toLowerCase()] || "bg-gray-200 text-gray-800"
                      } text-[11px]`}
                  >
                    {o.orderStatus}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 py-6 text-center">No orders yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
