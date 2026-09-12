import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  FolderTree,
  X,
} from "lucide-react";

import {
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUploadAdminImagesMutation,
} from "@/store/api";

const EMPTY_FORM = {
  name: "",
  slug: "",
  photo: null,
};

const createSlug = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function CategoriesAdmin() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [preview, setPreview] = useState(null);

  const {
    data: categoriesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminCategoriesQuery();

  const [createCategory, { isLoading: creating }] =
    useCreateCategoryMutation();

  const [updateCategory, { isLoading: updating }] =
    useUpdateCategoryMutation();

  const [deleteCategory, { isLoading: deleting }] =
    useDeleteCategoryMutation();

  const [uploadAdminImages, { isLoading: uploading }] =
    useUploadAdminImagesMutation();

  const categories = useMemo(() => {
    if (Array.isArray(categoriesResponse)) {
      return categoriesResponse;
    }

    return (
      categoriesResponse?.categories ||
      categoriesResponse?.items ||
      categoriesResponse?.data ||
      []
    );
  }, [categoriesResponse]);

  const saving = creating || updating || uploading;

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
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

    setPreview(category.photo || null);
    setOpen(true);
  };

  const handleNameChange = (value) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug:
        editId || prev.slug
          ? prev.slug
          : createSlug(value),
    }));
  };

  const handlePhotoChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm((prev) => ({
      ...prev,
      photo: file,
    }));

    setPreview(URL.createObjectURL(file));
  };

  const removeSelectedPhoto = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setForm((prev) => ({
      ...prev,
      photo: null,
    }));

    if (editId) {
      const existing = categories.find(
        (category) => category._id === editId
      );

      setPreview(existing?.photo || null);
    } else {
      setPreview(null);
    }
  };

  const uploadPhoto = async () => {
    if (!form.photo) {
      return null;
    }

    const imageData = new FormData();

    imageData.append("files", form.photo);

    const response = await uploadAdminImages(
      imageData
    ).unwrap();

    return (
      response?.url ||
      response?.image?.url ||
      response?.images?.[0]?.url ||
      response?.files?.[0]?.url ||
      response?.data?.url ||
      null
    );
  };

  const saveCategory = async () => {
    const name = form.name.trim();

    if (!name) {
      alert("Category name is required");
      return;
    }

    const slug =
      form.slug.trim() || createSlug(name);

    try {
      let photoUrl = null;

      if (form.photo) {
        photoUrl = await uploadPhoto();

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

      if (editId) {
        await updateCategory({
          id: editId,
          data: payload,
        }).unwrap();
      } else {
        await createCategory(payload).unwrap();
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("SAVE CATEGORY ERROR:", error);

      alert(
        error?.data?.message ||
          error?.data?.error ||
          error?.message ||
          "Something went wrong"
      );
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteCategory(deleteId).unwrap();

      setDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("DELETE CATEGORY ERROR:", error);

      alert(
        error?.data?.message ||
          error?.data?.error ||
          error?.message ||
          "Something went wrong"
      );
    }
  };

  return (
    <div className="mx-auto w-full p-6 sm:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
              <FolderTree className="h-4 w-4" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Catalog
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Organize and manage your product categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 rounded-full border-gray-200"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          <Button
            onClick={openCreateModal}
            className="h-10 rounded-full bg-black px-5 text-white hover:bg-gray-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* STAT */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Total Categories
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {categories.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
              <FolderTree className="h-5 w-5 text-gray-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="hidden grid-cols-[minmax(240px,1fr)_220px_120px_150px] border-b bg-gray-50/80 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 md:grid">
            <span>Category</span>
            <span>Slug</span>
            <span>Photo</span>
            <span className="text-right">Actions</span>
          </div>

          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <FolderTree className="h-6 w-6 text-gray-400" />
              </div>

              <p className="font-semibold text-gray-900">
                No categories found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Create your first product category.
              </p>

              <Button
                onClick={openCreateModal}
                className="mt-5 rounded-full bg-black text-white hover:bg-gray-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-gray-50/70 md:grid md:grid-cols-[minmax(240px,1fr)_220px_120px_150px] md:items-center"
                >
                  {/* CATEGORY */}
                  <div className="flex items-center gap-3">
                    {category.photo ? (
                      <img
                        src={category.photo}
                        alt={category.name || "Category"}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-gray-200"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {category.name || "Unnamed Category"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Category
                      </p>
                    </div>
                  </div>

                  {/* SLUG */}
                  <div>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-medium text-gray-600"
                    >
                      {category.slug || "-"}
                    </Badge>
                  </div>

                  {/* PHOTO */}
                  <div>
                    {category.photo ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                        No photo
                      </span>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        openEditModal(category)
                      }
                      className="h-9 w-9 rounded-full border-gray-200 text-gray-600 hover:border-black hover:bg-black hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        openDeleteModal(category._id)
                      }
                      className="h-9 w-9 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
        <DialogContent className="max-w-md overflow-hidden rounded-2xl bg-white p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            {/* NAME */}
            <div className="space-y-2">
              <Label>Category Name</Label>

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
              <Label>Slug</Label>

              <Input
                value={form.slug}
                disabled={saving}
                placeholder="jackets"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: createSlug(
                      event.target.value
                    ),
                  }))
                }
              />

              <p className="text-xs text-gray-400">
                Used in category URLs.
              </p>
            </div>

            {/* PHOTO */}
            <div className="space-y-2">
              <Label>Category Photo</Label>

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
                <div className="relative mt-4 w-fit">
                  <img
                    src={preview}
                    alt="Category preview"
                    className="h-32 w-32 rounded-xl object-cover ring-1 ring-gray-200"
                  />

                  <button
                    type="button"
                    disabled={saving}
                    onClick={removeSelectedPhoto}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {editId && !form.photo && (
                <p className="text-xs text-gray-400">
                  Leave empty to keep the existing photo.
                </p>
              )}

              <p className="text-xs text-gray-400">
                JPG, PNG, WEBP · Maximum 5MB
              </p>
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              variant="outline"
              disabled={saving}
              onClick={closeForm}
              className="rounded-full border-gray-200"
            >
              Cancel
            </Button>

            <Button
              disabled={saving}
              onClick={saveCategory}
              className="min-w-28 rounded-full bg-black text-white hover:bg-gray-800"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading
                    ? "Uploading"
                    : "Saving"}
                </>
              ) : editId ? (
                "Update Category"
              ) : (
                "Create Category"
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

          <div className="py-2">
            <p className="text-sm leading-6 text-gray-600">
              Are you sure you want to delete this
              category? This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>

            <Button
              disabled={deleting}
              onClick={confirmDelete}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}