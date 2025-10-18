import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../state/AuthContext.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { api } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    lastOrders: [],
    revenueData: [],
  });

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const MetricCard = ({ title, value, trend }) => (
    <Card className="p-5 border shadow-sm hover:shadow-md transition">
      <CardHeader className="flex justify-between items-start">
        <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            {trend > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />} {Math.abs(trend)}%
          </span>
        )}
      </CardHeader>
      <CardContent className="text-2xl font-bold mt-2">{value}</CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Users" value={stats.users} trend={5} />
        <MetricCard title="Products" value={stats.products} />
        <MetricCard title="Orders" value={stats.orders} trend={-2} />
        <MetricCard title="Revenue" value={`$${stats.revenue.toFixed(2)}`} />
      </div>

      {/* Charts & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Revenue (Last 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link
              to="/admin/products"
              className="border rounded-md p-3 hover:bg-gray-50 text-center font-medium"
            >
              Manage Products
            </Link>
            <Link
              to="/admin/products/new"
              className="border rounded-md p-3 hover:bg-gray-50 text-center font-medium"
            >
              Add Product
            </Link>
            <Link
              to="/admin/users"
              className="border rounded-md p-3 hover:bg-gray-50 text-center font-medium"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/orders"
              className="border rounded-md p-3 hover:bg-gray-50 text-center font-medium"
            >
              Manage Orders
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {stats.lastOrders.map((o) => (
            <div key={o._id} className="py-3 flex justify-between items-center text-sm">
              <div>
                <div className="font-medium">{o.items?.[0]?.title || "Order"}</div>
                <div className="text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="font-semibold">${o.subtotal?.toFixed(2)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
