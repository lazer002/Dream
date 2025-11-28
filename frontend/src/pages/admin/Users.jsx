import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../state/AuthContext.jsx";
import {
  Card,
  CardHeader,
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
import { Search, Trash2, ShieldCheck, Loader2, User } from "lucide-react";
import api from "@/utils/config";
export default function Users() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get("/admin");
      setUsers(data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setRole(id, role) {
    await api.patch(`/admin/${id}`, { role });
    await load();
  }

  async function remove(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    await api.delete(`/admin/${id}`);
    await load();
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole =
        roleFilter === "all" ? true : u.role === roleFilter;
      const matchesSearch =
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  return (
    <div className=" mx-auto p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            User Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            View, filter, and manage user roles with ease.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        {/* Tabs Section */}
        <Tabs
          value={roleFilter}
          onValueChange={setRoleFilter}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-gray-100 rounded-full px-1 flex justify-center md:justify-start">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-black data-[state=active]:shadow-sm rounded-full transition-all duration-200 data-[state=active]:text-white px-5 py-2 text-sm font-medium"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="data-[state=active]:bg-black data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:text-white rounded-full px-5 py-2 text-sm font-medium"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="data-[state=active]:bg-black data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:text-white rounded-full px-5 py-2 text-sm font-medium"
            >
              Admins
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Bar */}
        <div className="w-full md:w-80 flex items-center border-b border-gray-300 focus-within:border-black transition-colors duration-200">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <Input
            type="text"
            placeholder="Search users..."
            className="flex-1 border-none focus:ring-0 bg-transparent py-2 text-sm placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>


      {/* Table Card */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">


        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              No users found.
            </div>
          ) : (
            <div className="divide-y border rounded-lg bg-white shadow-sm">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Left: Name + Email */}
                  <div className="flex flex-col min-w-[200px]">
                    <span className="font-medium text-gray-900">{u.name}</span>
                    <span className="text-sm text-gray-500">{u.email}</span>
                  </div>

                  {/* Center: Role Badge */}
                  <div className="flex items-center justify-center min-w-[120px]">
                    {u.role === "admin" ? (
                      <Badge className="flex items-center gap-1.5 h-8 px-3 bg-black text-white rounded-full text-sm font-medium leading-none">
                        <ShieldCheck size={14} className="shrink-0" />
                        <span>Admin</span>
                      </Badge>
                    ) : (
                      <Badge className="flex items-center gap-1.5 h-8 px-3 bg-gray-100 text-gray-800 rounded-full text-sm font-medium leading-none">
                        <User size={14} className="shrink-0" />
                        <span>User</span>
                      </Badge>
                    )}
                  </div>

                  {/* Right: Role Dropdown + Delete */}
                  <div className="flex items-center gap-3 min-w-[200px] justify-end">
                    <Select
                      value={u.role}
                      onValueChange={(value) => setRole(u._id, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8 rounded-full border-gray-200 bg-gray-50 focus:ring-1 focus:ring-black capitalize text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(u._id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

          )}
        </CardContent>
      </Card>
    </div>
  );
}
