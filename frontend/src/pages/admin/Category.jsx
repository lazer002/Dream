import { useState, useEffect } from "react";
import { useAuth } from "../../state/AuthContext.jsx";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";

export default function CategoriesAdmin() {
  const { api } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", photo: null });
  const [editId, setEditId] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/getCategory");
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

const saveCategory = async () => {
  if (!form.name.trim()) {
    alert("Category name is required");
    return;
  }

  try {
    if (!form.slug || !form.slug.trim()) {
      form.slug = form.name.toLowerCase().replace(/\s+/g, "-");
    }

    let photoUrl = null;

    // Upload image if selected
    if (form.photo) {
      const imageData = new FormData();
      imageData.append("file", form.photo);

      const { data } = await api.post("/admin/upload/image", imageData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Image upload response:", data); // you can inspect this
      photoUrl = data.url; // replace with actual field from response
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      ...(photoUrl && { photo: photoUrl }),
    };

    if (editId) {
      // Edit
      const { data } = await api.put(`/admin/category/${editId}`, payload);
      if (!data.success) throw new Error(data.message || "Update failed");
    } else {
      // Create
      const { data } = await api.post("/admin/createCategory", payload);
      if (!data.success) throw new Error(data.message || "Create failed");
    }

    setOpen(false);
    setForm({ name: "", slug: "", photo: null });
    setEditId(null);
    fetchCategories();
  } catch (err) {
    console.error(err);
    alert(err.message || "Something went wrong");
  }
};


  const confirmDelete = async () => {
    try {
      const { data } = await api.delete(`/admin/category/${deleteId}`);
      if (!data.success) throw new Error(data.message || "Delete failed");
      setDeleteOpen(false);
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    }
  };

  const openEditModal = (category) => {
    setForm({ name: category.name, slug: category.slug || "", photo: null });
    setEditId(category._id);
    setOpen(true);
  };

  const openCreateModal = () => {
    setForm({ name: "", slug: "", photo: null });
    setEditId(null);
    setOpen(true);
  };

  return (
    <div className=" mx-auto py-2">
      <Card>
        <div className="flex justify-between p-5">
          <div className="text-2xl font-semibold">Categories</div>
          <Button onClick={openCreateModal} className="bg-blue-800 text-white hover:bg-blue-900">
            Add Category
          </Button>
        </div>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      {c.photo ? <img src={c.photo} alt={c.name} className="h-10 w-10 object-cover rounded" /> : "No Image"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEditModal(c)}
                        className="border-blue-800 text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => {
                          setDeleteId(c._id);
                          setDeleteOpen(true);
                        }}
                        className="bg-blue-800 text-white hover:bg-blue-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-full rounded-2xl shadow-lg bg-white flex flex-col">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="optional, auto-generated from name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
              />
              {editId && form.photo && (
                <img
                  src={URL.createObjectURL(form.photo)}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded mt-2"
                />
              )}
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-white px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setForm({ name: "", slug: "", photo: null });
                setEditId(null);
              }}
              className="border-blue-800 text-blue-800 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button className="bg-blue-800 text-white hover:bg-blue-900" onClick={saveCategory}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM MODAL */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm rounded-xl bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 px-6">
            Are you sure you want to delete this category? This action cannot be undone.
          </p>
          <DialogFooter className="flex justify-end gap-3 pt-4 px-6 pb-4">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border-blue-800 text-blue-800 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-blue-800 text-white hover:bg-blue-900"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
