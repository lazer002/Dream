import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import api from "@/utils/config";

const RETURN_STATUS_STEPS = [
  "submitted",
  "awaiting_shipment",
  "received",
  "inspecting",
  "approved",
  "refunded",
  "completed",
  "rejected",
  "cancelled",
];

const STATUS_LABELS = {
  submitted: "Submitted",
  awaiting_shipment: "Awaiting Shipment",
  received: "Received",
  inspecting: "Inspecting",
  approved: "Approved",
  refunded: "Refunded",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const actionLabelMap = {
  exchange: "Exchange",
  refund: "Refund",
  repair: "Repair",
};

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return amount;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹ ${amount}`;
  }
};

// 🎨 Status badge styles
const getStatusBadgeClasses = (status) => {
  switch (status) {
    case "submitted":
      return "border-blue-500 bg-blue-50 text-blue-800";
    case "awaiting_shipment":
      return "border-amber-500 bg-amber-50 text-amber-800";
    case "received":
      return "border-sky-500 bg-sky-50 text-sky-800";
    case "inspecting":
      return "border-purple-500 bg-purple-50 text-purple-800";
    case "approved":
      return "border-emerald-500 bg-emerald-50 text-emerald-800";
    case "refunded":
      return "border-teal-500 bg-teal-50 text-teal-800";
    case "completed":
      return "border-stone-600 bg-stone-900 text-stone-50"; // darker "done"
    case "rejected":
      return "border-red-500 bg-red-50 text-red-800";
    case "cancelled":
      return "border-zinc-400 bg-zinc-50 text-zinc-700";
    default:
      return "border-gray-300 bg-gray-50 text-gray-800";
  }
};

// 🎨 Type badge styles
const getTypeBadgeClasses = (typeLabel) => {
  switch (typeLabel) {
    case "Exchange":
      return "bg-indigo-50 text-indigo-800 border border-indigo-200";
    case "Refund":
      return "bg-rose-50 text-rose-800 border border-rose-200";
    case "Repair":
      return "bg-amber-50 text-amber-800 border border-amber-200";
    case "Mixed":
      return "bg-slate-900 text-slate-50 border border-slate-900";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
};


export default function AdminReturnListPage() {
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  async function loadReturns() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/returns", {
        params: { limit: 100 },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setReturns(data);
    } catch (e) {
      console.error("Failed to load returns", e);
      setError("Failed to load returns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReturns();
  }, []);

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;

      const s = search.trim().toLowerCase();
      const matchSearch =
        !s ||
        (r.rmaNumber && r.rmaNumber.toLowerCase().includes(s)) ||
        (r.orderNumber && r.orderNumber.toLowerCase().includes(s)) ||
        (r.guestEmail && r.guestEmail.toLowerCase().includes(s));

      return matchStatus && matchSearch;
    });
  }, [returns, statusFilter, search]);

  const statusTabs = ["All", ...RETURN_STATUS_STEPS];

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  // derive type + thumbnail + subtotal per return
  const getReturnType = (r) => {
    if (!Array.isArray(r.items) || r.items.length === 0) return "-";
    const actions = Array.from(
      new Set(
        r.items
          .map((it) => it.action)
          .filter(Boolean)
      )
    );
    if (actions.length === 1) {
      const key = actions[0];
      return actionLabelMap[key] || key;
    }
    return "Mixed";
  };

  const getThumbnail = (r) => {
    if (!Array.isArray(r.items) || r.items.length === 0) return null;
    const firstItem = r.items[0];
    if (Array.isArray(firstItem.photos) && firstItem.photos.length > 0) {
      return firstItem.photos[0];
    }
    return null;
  };

  const getSubtotal = (r) => {
    if (!Array.isArray(r.items) || r.items.length === 0) return 0;
    return r.items.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
      0
    );
  };

  return (
    <div className="mx-auto">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                <span>Return Management</span>
              </div>
              <CardTitle className="text-2xl font-bold">
                Returns
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage customer return & exchange requests.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadReturns}
                className="border-blue-800 text-blue-800 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters row: tabs + search */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6 mb-2">
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-gray-100 rounded-full px-1 flex justify-center md:justify-start gap-2">
                {statusTabs.map((statusKey) => (
                  <TabsTrigger
                    key={statusKey}
                    value={statusKey}
                    className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full px-5 py-2 text-sm font-medium transition-all duration-200"
                  >
                    {statusKey === "All"
                      ? "All"
                      : STATUS_LABELS[statusKey]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="w-full md:w-80 flex items-center border-b border-gray-300 focus-within:border-black transition-colors duration-200">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <Input
                type="text"
                placeholder="Search by RMA, order or email..."
                className="flex-1 border-none focus:ring-0 bg-transparent py-2 text-sm placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <p className="text-sm text-red-600 mb-3">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading returns...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>RMA</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
      <TableBody>
  {filteredReturns.length === 0 ? (
    <TableRow>
      <TableCell
        colSpan={9}
        className="text-center text-sm text-gray-500 py-6"
      >
        No returns match the current filters.
      </TableCell>
    </TableRow>
  ) : (
    filteredReturns.map((r) => {
      const thumb = getThumbnail(r);
      const typeLabel = getReturnType(r);
      const subtotal = getSubtotal(r);

      return (
        <TableRow
          key={r._id}
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() =>
            navigate(
              `/admin/returnslist/${encodeURIComponent(r.rmaNumber)}`
            )
          }
        >
          {/* Image */}
          <TableCell>
            {thumb ? (
              <img
                src={thumb}
                alt={r.items?.[0]?.title || "Return thumbnail"}
                className="w-12 h-12 object-cover rounded border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200" />
            )}
          </TableCell>

          {/* RMA */}
          <TableCell className="font-medium">
            {r.rmaNumber}
          </TableCell>

          {/* Order */}
          <TableCell>{r.orderNumber || "-"}</TableCell>

          {/* Type – colorful pill */}
          <TableCell>
            <span
              className={
                "px-2 py-1 text-xs font-medium rounded-full " +
                getTypeBadgeClasses(typeLabel)
              }
            >
              {typeLabel}
            </span>
          </TableCell>

          {/* Customer */}
          <TableCell className="text-gray-500 text-sm">
            {r.guestEmail || "-"}
          </TableCell>

          {/* Status – colorful Badge */}
          <TableCell>
            <Badge
              variant="outline"
              className={
                "px-3 py-1 text-xs font-medium rounded-full " +
                getStatusBadgeClasses(r.status)
              }
            >
              {STATUS_LABELS[r.status] || r.status}
            </Badge>
          </TableCell>

          {/* Items count */}
          <TableCell className="text-sm text-gray-700">
            {Array.isArray(r.items) ? r.items.length : 0}
          </TableCell>

          {/* Total value */}
          <TableCell className="text-sm font-medium">
            {subtotal ? formatCurrency(subtotal) : "-"}
          </TableCell>

          {/* Created */}
          <TableCell className="text-xs text-gray-500 whitespace-nowrap">
            {formatDate(r.createdAt)}
          </TableCell>
        </TableRow>
      );
    })
  )}
</TableBody>

            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
