import { useEffect, useState } from "react";
import { useAuth } from "../../state/AuthContext.jsx";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pencil,
  Trash2,
  Plus,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import api from "@/utils/config";

const EMPTY_FORM = {
  name: "",
  slug: "",
  photo: null,
};

export default function CategoriesAdmin() {
  const { user } = useAuth();

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [editId, setEditId] =
    useState(null);

  const [deleteId, setDeleteId] =
    useState(null);

  const [preview, setPreview] =
    useState(null);

  const fetchCategories = async () => {
    setLoading(true);

    try {
      const { data } =
        await api.get(
          "/admin/getCategory"
        );

      if (data?.success) {
        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        );
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error(
        "FETCH CATEGORIES ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
    });

    setEditId(null);
    setPreview(null);
  };

  const closeForm = () => {
    if (saving) return;

    setOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setOpen(true);
  };

  const openEditModal = (category) => {
    setEditId(category._id);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      photo: null,
    });

    setPreview(
      category.photo || null
    );

    setOpen(true);
  };

  const handleNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug:
        editId || prev.slug
          ? prev.slug
          : value
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-"),
    }));
  };

  const handlePhotoChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Image must be smaller than 5MB"
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      photo: file,
    }));

    const objectUrl =
      URL.createObjectURL(file);

    setPreview(objectUrl);
  };

  const uploadPhoto = async () => {
    if (!form.photo) {
      return null;
    }

    const imageData = new FormData();

    imageData.append(
      "files",
      form.photo
    );

    const { data } =
      await api.post(
        "/admin/upload/images",
        imageData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    console.log(
      "IMAGE UPLOAD RESPONSE:",
      data
    );

    return (
      data?.url ||
      data?.image?.url ||
      data?.images?.[0]?.url ||
      data?.files?.[0]?.url ||
      data?.data?.url ||
      null
    );
  };

  const saveCategory = async () => {
    const name =
      form.name.trim();

    if (!name) {
      alert(
        "Category name is required"
      );
      return;
    }

    const slug =
      form.slug.trim() ||
      name
        .toLowerCase()
        .replace(
          /[^a-z0-9\s-]/g,
          ""
        )
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    setSaving(true);

    try {
      let photoUrl = null;

      if (form.photo) {
        photoUrl =
          await uploadPhoto();

        if (!photoUrl) {
          throw new Error(
            "Image upload succeeded but no image URL was returned"
          );
        }
      }

      const payload = {
        name,
        slug,
        ...(photoUrl
          ? {
              photo: photoUrl,
            }
          : {}),
      };

      console.log(
        "CATEGORY PAYLOAD:",
        payload
      );

      let response;

      if (editId) {
        response =
          await api.put(
            `/admin/category/${editId}`,
            payload
          );
      } else {
        response =
          await api.post(
            "/admin/createCategory",
            payload
          );
      }

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message ||
            response?.data?.error ||
            "Category save failed"
        );
      }

      setOpen(false);
      resetForm();

      await fetchCategories();
    } catch (error) {
      console.error(
        "SAVE CATEGORY ERROR:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const { data } =
        await api.delete(
          `/admin/category/${deleteId}`
        );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Delete failed"
        );
      }

      setDeleteOpen(false);
      setDeleteId(null);

      await fetchCategories();
    } catch (error) {
      console.error(
        "DELETE CATEGORY ERROR:",
        error
      );

      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto py-4">
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Categories
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your product categories
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="
              gap-2
              bg-blue-800
              text-white
              hover:bg-blue-900
            "
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-800" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center">
              <ImageIcon className="mb-3 h-10 w-10 text-gray-300" />

              <p className="text-sm font-medium text-gray-600">
                No categories found
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Create your first category
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Name
                  </TableHead>

                  <TableHead>
                    Slug
                  </TableHead>

                  <TableHead>
                    Photo
                  </TableHead>

                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {categories.map(
                  (category) => (
                    <TableRow
                      key={category._id}
                    >
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>

                      <TableCell>
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {category.slug ||
                            "-"}
                        </span>
                      </TableCell>

                      <TableCell>
                        {category.photo ? (
                          <img
                            src={
                              category.photo
                            }
                            alt={
                              category.name
                            }
                            className="
                              h-12
                              w-12
                              rounded-lg
                              object-cover
                              ring-1
                              ring-gray-200
                            "
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-lg
                            bg-gray-100
                          ">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                            className="
                              border-blue-800
                              text-blue-800
                              hover:bg-blue-50
                            "
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            onClick={() =>
                              openDeleteModal(
                                category._id
                              )
                            }
                            className="
                              bg-blue-800
                              text-white
                              hover:bg-blue-900
                            "
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT */}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            closeForm();
          } else {
            setOpen(true);
          }
        }}
      >
        <DialogContent className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editId
                ? "Edit Category"
                : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            {/* NAME */}
            <div className="space-y-2">
              <Label>
                Category Name
              </Label>

              <Input
                value={form.name}
                disabled={saving}
                placeholder="e.g. Jackets"
                onChange={(event) =>
                  handleNameChange(
                    event.target.value
                  )
                }
              />
            </div>

            {/* SLUG */}
            <div className="space-y-2">
              <Label>
                Slug
              </Label>

              <Input
                value={form.slug}
                disabled={saving}
                placeholder="jackets"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: event.target.value
                      .toLowerCase()
                      .replace(
                        /[^a-z0-9-]/g,
                        "-"
                      )
                      .replace(
                        /-+/g,
                        "-"
                      ),
                  }))
                }
              />
            </div>

            {/* PHOTO */}
            <div className="space-y-2">
              <Label>
                Category Photo
              </Label>

              <Input
                type="file"
                accept="image/*"
                disabled={saving}
                onChange={(event) =>
                  handlePhotoChange(
                    event.target.files?.[0]
                  )
                }
              />

              {preview && (
                <div className="relative mt-3 w-fit">
                  <img
                    src={preview}
                    alt="Preview"
                    className="
                      h-28
                      w-28
                      rounded-xl
                      object-cover
                      ring-1
                      ring-gray-200
                    "
                  />

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setForm(
                        (prev) => ({
                          ...prev,
                          photo: null,
                        })
                      );

                      setPreview(
                        editId
                          ? categories.find(
                              (c) =>
                                c._id ===
                                editId
                            )?.photo ||
                              null
                          : null
                      );
                    }}
                    className="
                      absolute
                      -right-2
                      -top-2
                      flex
                      h-6
                      w-6
                      items-center
                      justify-center
                      rounded-full
                      bg-black
                      text-xs
                      text-white
                    "
                  >
                    ×
                  </button>
                </div>
              )}

              {editId && !form.photo && (
                <p className="text-xs text-gray-400">
                  Leave empty to keep the
                  existing photo.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              variant="outline"
              disabled={saving}
              onClick={closeForm}
              className="
                border-blue-800
                text-blue-800
                hover:bg-blue-50
              "
            >
              Cancel
            </Button>

            <Button
              disabled={saving}
              onClick={saveCategory}
              className="
                min-w-24
                bg-blue-800
                text-white
                hover:bg-blue-900
              "
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : editId ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(value) => {
          if (!deleting) {
            setDeleteOpen(value);

            if (!value) {
              setDeleteId(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Delete Category
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm leading-6 text-gray-600">
            Are you sure you want to delete
            this category? This action cannot
            be undone.
          </p>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() =>
                setDeleteOpen(false)
              }
              className="
                border-blue-800
                text-blue-800
                hover:bg-blue-50
              "
            >
              Cancel
            </Button>

            <Button
              disabled={deleting}
              onClick={confirmDelete}
              className="
                bg-red-600
                text-white
                hover:bg-red-700
              "
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}