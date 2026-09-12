import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
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
import {
  Search,
  RefreshCw,
  RotateCcw,
  Package,
  Clock3,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Mail,
  ShoppingBag,
  Filter,
  X,
  ArrowUpDown,
  Loader2
} from "lucide-react";

import { useGetReturnsQuery } from "@/store/api";

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

const ACTION_LABELS = {
  exchange: "Exchange",
  refund: "Refund",
  repair: "Repair",
};

const formatCurrency = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadgeClasses = (status) => {
  switch (status) {
    case "submitted":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "awaiting_shipment":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "received":
      return "border-sky-200 bg-sky-50 text-sky-700";

    case "inspecting":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "refunded":
      return "border-teal-200 bg-teal-50 text-teal-700";

    case "completed":
      return "border-gray-900 bg-gray-900 text-white";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "cancelled":
      return "border-gray-200 bg-gray-50 text-gray-500";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "submitted":
      return Clock3;

    case "awaiting_shipment":
    case "received":
      return Package;

    case "approved":
    case "refunded":
    case "completed":
      return CheckCircle2;

    case "rejected":
    case "cancelled":
      return XCircle;

    default:
      return RotateCcw;
  }
};

const getTypeBadgeClasses = (type) => {
  switch (type) {
    case "Exchange":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "Refund":
      return "bg-rose-50 text-rose-700 border-rose-200";

    case "Repair":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Mixed":
      return "bg-gray-900 text-white border-gray-900";

    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const getReturnType = (returnItem) => {
  if (
    !Array.isArray(returnItem?.items) ||
    returnItem.items.length === 0
  ) {
    return "-";
  }

  const actions = [
    ...new Set(
      returnItem.items
        .map((item) => item.action)
        .filter(Boolean)
    ),
  ];

  if (actions.length === 1) {
    return ACTION_LABELS[actions[0]] || actions[0];
  }

  return actions.length > 1 ? "Mixed" : "-";
};

const getThumbnail = (returnItem) => {
  if (
    !Array.isArray(returnItem?.items) ||
    !returnItem.items.length
  ) {
    return null;
  }

  const firstItem = returnItem.items[0];

  if (
    Array.isArray(firstItem?.photos) &&
    firstItem.photos.length
  ) {
    return firstItem.photos[0];
  }

  return null;
};

const getSubtotal = (returnItem) => {
  if (!Array.isArray(returnItem?.items)) {
    return 0;
  }

  return returnItem.items.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) *
        (Number(item.qty) || 0),
    0
  );
};

export default function AdminReturnListPage() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const {
    data: returnsResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetReturnsQuery({
    limit: 100,
  });

  const returns = useMemo(() => {
    if (Array.isArray(returnsResponse)) {
      return returnsResponse;
    }

    return (
      returnsResponse?.items ||
      returnsResponse?.returns ||
      returnsResponse?.data ||
      []
    );
  }, [returnsResponse]);

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return returns.filter((returnItem) => {
      const matchesStatus =
        statusFilter === "All" ||
        returnItem.status === statusFilter;

      const matchesSearch =
        !query ||
        String(returnItem.rmaNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(returnItem.orderNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(returnItem.guestEmail || "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [returns, statusFilter, search]);

  const stats = useMemo(() => {
    const pendingStatuses = [
      "submitted",
      "awaiting_shipment",
      "received",
      "inspecting",
    ];

    return {
      total: returns.length,

      pending: returns.filter((item) =>
        pendingStatuses.includes(item.status)
      ).length,

      completed: returns.filter(
        (item) => item.status === "completed"
      ).length,

      rejected: returns.filter(
        (item) =>
          item.status === "rejected" ||
          item.status === "cancelled"
      ).length,
    };
  }, [returns]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  const hasFilters =
    Boolean(search.trim()) || statusFilter !== "All";

  const statusTabs = ["All", ...RETURN_STATUS_STEPS];

  return (
    <div className="mx-auto w-full p-6 sm:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
              <RotateCcw className="h-4 w-4" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Order Management
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Returns
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review and manage customer return, refund, and
            exchange requests.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-10 rounded-full border-gray-200 px-4"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              isFetching ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* STATS */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Total Returns
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <RotateCcw className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.completed}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Rejected
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.rejected}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER CARD */}
      <Card className="mb-6 overflow-hidden rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* SEARCH */}
            <div className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-black xl:max-w-md">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />

              <Input
                type="text"
                placeholder="Search RMA, order number or email..."
                className="h-10 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-black"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* STATUS */}
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full xl:w-auto"
            >
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-gray-100 p-1 xl:w-auto">
                {statusTabs.map((statusKey) => (
                  <TabsTrigger
                    key={statusKey}
                    value={statusKey}
                    className="rounded-lg px-3 py-2 text-xs font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    {statusKey === "All"
                      ? "All"
                      : STATUS_LABELS[statusKey]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {hasFilters && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredReturns.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {returns.length}
                </span>{" "}
                returns
              </p>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 rounded-full text-xs"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm">
        <CardContent className="p-0">
          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>

              <p className="font-semibold text-gray-900">
                Failed to load returns
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Something went wrong while loading the
                return requests.
              </p>

              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-5 rounded-full"
              >
                Try again
              </Button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">
                  Loading returns...
                </p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!isLoading &&
            !isError &&
            filteredReturns.length === 0 && (
              <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <RotateCcw className="h-6 w-6 text-gray-400" />
                </div>

                <p className="font-semibold text-gray-900">
                  No returns found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {hasFilters
                    ? "Try changing your filters or search."
                    : "There are no return requests yet."}
                </p>

                {hasFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-5 rounded-full"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}

          {/* DATA */}
          {!isLoading &&
            !isError &&
            filteredReturns.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100 bg-gray-50/70 hover:bg-gray-50/70">
                        <TableHead className="h-11 pl-5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Return
                        </TableHead>

                        <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Order
                        </TableHead>

                        <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Type
                        </TableHead>

                        <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Customer
                        </TableHead>

                        <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Status
                        </TableHead>

                        <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Items
                        </TableHead>

                        <TableHead className="h-11 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Value
                        </TableHead>

                        <TableHead className="h-11 pr-5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Created
                        </TableHead>

                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredReturns.map((returnItem) => {
                        const thumb =
                          getThumbnail(returnItem);

                        const typeLabel =
                          getReturnType(returnItem);

                        const subtotal =
                          getSubtotal(returnItem);

                        const StatusIcon =
                          getStatusIcon(
                            returnItem.status
                          );

                        return (
                          <TableRow
                            key={returnItem._id}
                            className="group cursor-pointer border-gray-100 transition-colors hover:bg-gray-50/70"
                            onClick={() =>
                              navigate(
                                `/admin/returnslist/${encodeURIComponent(
                                  returnItem.rmaNumber
                                )}`
                              )
                            }
                          >
                            {/* RETURN */}
                            <TableCell className="py-4 pl-5">
                              <div className="flex min-w-[210px] items-center gap-3">
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt={
                                      returnItem.items?.[0]
                                        ?.title ||
                                      "Return"
                                    }
                                    className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-gray-200"
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                                    <ShoppingBag className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-gray-900">
                                    {returnItem.rmaNumber ||
                                      "-"}
                                  </p>

                                  <p className="mt-0.5 text-xs text-gray-400">
                                    Return request
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* ORDER */}
                            <TableCell>
                              <span className="font-medium text-gray-700">
                                {returnItem.orderNumber ||
                                  "-"}
                              </span>
                            </TableCell>

                            {/* TYPE */}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getTypeBadgeClasses(
                                  typeLabel
                                )}`}
                              >
                                {typeLabel}
                              </Badge>
                            </TableCell>

                            {/* CUSTOMER */}
                            <TableCell>
                              <div className="flex min-w-[180px] items-center gap-2 text-sm text-gray-500">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                                <span className="truncate">
                                  {returnItem.guestEmail ||
                                    "-"}
                                </span>
                              </div>
                            </TableCell>

                            {/* STATUS */}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClasses(
                                  returnItem.status
                                )}`}
                              >
                                <StatusIcon className="h-3 w-3" />

                                <span>
                                  {STATUS_LABELS[
                                    returnItem.status
                                  ] ||
                                    returnItem.status ||
                                    "Unknown"}
                                </span>
                              </Badge>
                            </TableCell>

                            {/* ITEMS */}
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Package className="h-3.5 w-3.5 text-gray-400" />

                                <span>
                                  {Array.isArray(
                                    returnItem.items
                                  )
                                    ? returnItem.items.length
                                    : 0}
                                </span>
                              </div>
                            </TableCell>

                            {/* VALUE */}
                            <TableCell className="text-right">
                              <span className="font-semibold text-gray-900">
                                {subtotal
                                  ? formatCurrency(
                                      subtotal
                                    )
                                  : "-"}
                              </span>
                            </TableCell>

                            {/* DATE */}
                            <TableCell className="pr-5 text-right">
                              <span className="whitespace-nowrap text-xs text-gray-500">
                                {formatDate(
                                  returnItem.createdAt
                                )}
                              </span>
                            </TableCell>

                            {/* ARROW */}
                            <TableCell className="pr-4">
                              <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-700" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                  <p className="text-xs text-gray-400">
                    Showing {filteredReturns.length}{" "}
                    return
                    {filteredReturns.length === 1
                      ? ""
                      : "s"}
                  </p>

                  {isFetching && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Updating...
                    </div>
                  )}
                </div>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}