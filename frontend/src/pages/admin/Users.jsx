import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  Trash2,
  ShieldCheck,
  Loader2,
  User,
  Users as UsersIcon,
  UserCog,
  RefreshCw,
  Mail,
} from "lucide-react";
import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} from "@/store/api";

export default function Users() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const {
    data: usersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetUsersQuery();

  const [updateUserRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = useMemo(() => {
    if (Array.isArray(usersResponse)) return usersResponse;

    return (
      usersResponse?.items ||
      usersResponse?.users ||
      usersResponse?.data ||
      []
    );
  }, [usersResponse]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const regularUsers = users.filter((u) => u.role === "user").length;

    return {
      total,
      admins,
      regularUsers,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((u) => {
      const matchesRole =
        roleFilter === "all" || u.role === roleFilter;

      const matchesSearch =
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  async function setRole(id, role) {
    try {
      setUpdatingRoleId(id);

      await updateUserRole({
        id,
        role,
      }).unwrap();
    } catch (error) {
      console.error("UPDATE USER ROLE:", error);
    } finally {
      setUpdatingRoleId(null);
    }
  }

  async function remove(id) {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setDeletingId(id);

      await deleteUser(id).unwrap();
    } catch (error) {
      console.error("DELETE USER:", error);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
              <UsersIcon size={18} />
            </div>

            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Administration
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            User Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View, filter, and manage user access and roles.
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

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Total Users
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                <UsersIcon className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Regular Users
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.regularUsers}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                <User className="h-5 w-5 text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Administrators
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.admins}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={roleFilter}
          onValueChange={setRoleFilter}
          className="w-full lg:w-auto"
        >
          <TabsList className="h-10 rounded-full bg-gray-100 p-1">
            <TabsTrigger
              value="all"
              className="rounded-full px-5 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              All
            </TabsTrigger>

            <TabsTrigger
              value="user"
              className="rounded-full px-5 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Users
            </TabsTrigger>

            <TabsTrigger
              value="admin"
              className="rounded-full px-5 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Admins
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-black lg:w-80">
          <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />

          <Input
            type="text"
            placeholder="Search by name or email..."
            className="h-10 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs font-medium text-gray-400 hover:text-black"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card
        className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm"
        data-lenis-prevent
      >
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="hidden grid-cols-[minmax(240px,1fr)_180px_260px] border-b bg-gray-50/80 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 md:grid">
            <span>User</span>
            <span className="text-center">Role</span>
            <span className="text-right">Actions</span>
          </div>

          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-5 w-5 text-gray-400" />
              </div>

              <p className="font-semibold text-gray-900">
                No users found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or role filter.
              </p>

              {(search || roleFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((u) => {
                const isAdmin = u.role === "admin";
                const isDeleting = deletingId === u._id;
                const isUpdatingRole =
                  updatingRoleId === u._id;

                return (
                  <div
                    key={u._id}
                    className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-gray-50/70 md:grid md:grid-cols-[minmax(240px,1fr)_180px_260px] md:items-center"
                  >
                    {/* User */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${
                          isAdmin
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.name?.trim()?.charAt(0)?.toUpperCase() || (
                          <User size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-gray-900">
                            {u.name || "Unnamed User"}
                          </span>

                          {isAdmin && (
                            <Badge className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                              ADMIN
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-gray-500">
                          <Mail className="h-3.5 w-3.5 shrink-0" />

                          <span className="truncate">
                            {u.email || "No email"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center justify-start md:justify-center">
                      <Badge
                        className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium leading-none ${
                          isAdmin
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isAdmin ? (
                          <ShieldCheck
                            size={14}
                            className="shrink-0"
                          />
                        ) : (
                          <User
                            size={14}
                            className="shrink-0"
                          />
                        )}

                        <span>
                          {isAdmin ? "Administrator" : "User"}
                        </span>
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <Select
                        value={u.role}
                        disabled={
                          isUpdatingRole || isDeleting
                        }
                        onValueChange={(value) =>
                          setRole(u._id, value)
                        }
                      >
                        <SelectTrigger className="h-9 w-[130px] rounded-full border-gray-200 bg-gray-50 text-sm capitalize focus:ring-1 focus:ring-black">
                          {isUpdatingRole ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Updating
                            </div>
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="user">
                            User
                          </SelectItem>

                          <SelectItem value="admin">
                            Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting || isUpdatingRole}
                        onClick={() => remove(u._id)}
                        className="h-9 w-9 rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result count */}
      {!isLoading && users.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>
            Showing {filteredUsers.length} of {users.length} users
          </span>

          {isFetching && (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating...
            </span>
          )}
        </div>
      )}
    </div>
  );
}