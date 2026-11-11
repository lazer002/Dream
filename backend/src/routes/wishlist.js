import { guestId as validGuestId } from "../utils/validate.js";
import express from "express";
import { User } from "../models/User.js";
import { Guest } from "../models/Guest.js";
import { Product } from "../models/Product.js";
import { Bundle } from "../models/Bundle.js";
import {
  requireAuth,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

/* =====================================================
   HELPERS
===================================================== */

function idsToStrings(arr) {
  if (!Array.isArray(arr)) return [];

  return arr
    .map((id) => String(id))
    .filter(Boolean);
}

async function getWishlistOwner(req) {
  const userId = req.user?.id;

  const guestId = String(
    validGuestId(req.headers["x-guest-id"]) || ""
  ).trim();

  

  /*
   * ===================================================
   * LOGGED-IN USER
   * ===================================================
   */

  if (userId) {
    const user =
      await User.findById(userId);

    return {
      type: "user",
      doc: user,
    };
  }

  /*
   * ===================================================
   * GUEST USER
   * ===================================================
   */

  if (guestId) {
    let guest =
      await Guest.findOne({
        guestId,
      });

    if (!guest) {
      guest = await Guest.create({
        guestId,
        wishlist: [],
        cart: [],
      });
    }

    return {
      type: "guest",
      doc: guest,
    };
  }

  return null;
}

/* =====================================================
   NORMALIZE WISHLIST
===================================================== */

async function normalizeWishlistToPublicIds(
  items = []
) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return [];
  }

  const values =
    idsToStrings(items);

  const objectIds =
    values.filter((id) =>
      /^[a-f\d]{24}$/i.test(id)
    );

  const publicIds =
    values.filter(
      (id) =>
        !/^[a-f\d]{24}$/i.test(id)
    );

  if (!objectIds.length) {
    return [
      ...new Set(publicIds),
    ];
  }

  const products =
    await Product.find({
      _id: {
        $in: objectIds,
      },
    })
      .select("_id publicId")
      .lean();

  const objectIdToPublicId =
    new Map(
      products.map((product) => [
        String(product._id),
        String(product.publicId),
      ])
    );

  const normalized =
    values
      .map((id) => {
        if (
          objectIdToPublicId.has(id)
        ) {
          return objectIdToPublicId.get(
            id
          );
        }

        return id;
      })
      .filter(Boolean);

  return [
    ...new Set(normalized),
  ];
}

/* =====================================================
   GET WISHLIST
===================================================== */

router.get(
  "/",
  optionalAuth,
  async (req, res) => {
    try {
      const owner =
        await getWishlistOwner(req);

      if (!owner?.doc) {
        return res.json({
          success: true,
          items: [],
        });
      }

      const items =
        await normalizeWishlistToPublicIds(
          owner.doc.wishlist || []
        );

      /*
       * Save normalized IDs for both
       * guest and logged-in users.
       */
      if (
        JSON.stringify(items) !==
        JSON.stringify(
          idsToStrings(
            owner.doc.wishlist || []
          )
        )
      ) {
        owner.doc.wishlist = items;

        await owner.doc.save();
      }

      return res.json({
        success: true,
        items,
      });
    } catch (error) {
      console.error(
        "GET WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to get wishlist",
      });
    }
  }
);

/* =====================================================
   ADD WISHLIST
   PRODUCT + BUNDLE
===================================================== */

router.post(
  "/wishadd",
  optionalAuth,
  async (req, res) => {
    try {
      const owner =
        await getWishlistOwner(req);

      if (!owner?.doc) {
        return res.status(400).json({
          success: false,
          error:
            "Missing user or guestId",
        });
      }

      const publicId =
        String(
          req.body.productId ||
          req.body.publicId ||
          ""
        ).trim();

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error:
            "Product or bundle publicId is required",
        });
      }

      /*
       * =================================================
       * TRY PRODUCT
       * =================================================
       */

      const product =
        await Product.findOne({
          publicId,
          active: true,
        })
          .select("publicId")
          .lean();

      /*
       * =================================================
       * TRY BUNDLE
       * =================================================
       */

      const bundle =
        !product
          ? await Bundle.findOne({
              publicId,
              active: true,
            })
              .select("publicId")
              .lean()
          : null;

      /*
       * Neither exists.
       */

      if (!product && !bundle) {
        return res.status(404).json({
          success: false,
          error:
            "Product or bundle not found",
        });
      }

      const finalPublicId =
        String(
          product?.publicId ||
          bundle?.publicId
        );

      /*
       * =================================================
       * CURRENT WISHLIST
       * =================================================
       */

      const current =
        await normalizeWishlistToPublicIds(
          owner.doc.wishlist || []
        );

      /*
       * =================================================
       * ADD
       * =================================================
       */

      if (
        !current.includes(
          finalPublicId
        )
      ) {
        current.push(
          finalPublicId
        );
      }

      owner.doc.wishlist = [
        ...new Set(current),
      ];

      await owner.doc.save();

      return res.json({
        success: true,
        type: product
          ? "product"
          : "bundle",
        items:
          owner.doc.wishlist,
      });
    } catch (error) {
      console.error(
        "ADD WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to add wishlist",
      });
    }
  }
);

/* =====================================================
   REMOVE WISHLIST
   PRODUCT + BUNDLE
===================================================== */

router.post(
  "/wishremove",
  optionalAuth,
  async (req, res) => {
    try {
      const owner =
        await getWishlistOwner(req);

      if (!owner?.doc) {
        return res.status(400).json({
          success: false,
          error:
            "Missing user or guestId",
        });
      }

      const publicId =
        String(
          req.body.productId ||
          req.body.publicId ||
          ""
        ).trim();

      if (!publicId) {
        return res.status(400).json({
          success: false,
          error:
            "Product or bundle publicId is required",
        });
      }

      /*
       * Verify that the ID belongs to
       * either a product or bundle.
       */

      const product =
        await Product.findOne({
          publicId,
          active: true,
        })
          .select("publicId")
          .lean();

      const bundle =
        !product
          ? await Bundle.findOne({
              publicId,
              active: true,
            })
              .select("publicId")
              .lean()
          : null;

      /*
       * If product/bundle was deleted or
       * inactive, still remove the ID
       * from wishlist.
       */

      const current =
        await normalizeWishlistToPublicIds(
          owner.doc.wishlist || []
        );

      owner.doc.wishlist =
        current.filter(
          (id) =>
            id !== publicId
        );

      await owner.doc.save();

      return res.json({
        success: true,
        type: product
          ? "product"
          : bundle
          ? "bundle"
          : "unknown",
        items:
          owner.doc.wishlist,
      });
    } catch (error) {
      console.error(
        "REMOVE WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to remove wishlist",
      });
    }
  }
);

/* =====================================================
   SYNC GUEST → USER
===================================================== */

router.post(
  "/sync",
  requireAuth,
  async (req, res) => {
    try {
      const guestId =
        String(
          validGuestId(req.headers["x-guest-id"]) || ""
        ).trim();

      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error:
            "Unauthorized",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          error:
            "User not found",
        });
      }

      /*
       * =================================================
       * NO GUEST ID
       * =================================================
       */

      if (!guestId) {
        const items =
          await normalizeWishlistToPublicIds(
            user.wishlist || []
          );

        return res.json({
          success: true,
          items,
        });
      }

      /*
       * =================================================
       * FIND GUEST
       * =================================================
       */

      const guest =
        await Guest.findOne({
          guestId,
        });

      /*
       * No guest data.
       */

      if (!guest) {
        const items =
          await normalizeWishlistToPublicIds(
            user.wishlist || []
          );

        return res.json({
          success: true,
          items,
        });
      }

      /*
       * =================================================
       * USER WISHLIST
       * =================================================
       */

      const existingWishlist =
        await normalizeWishlistToPublicIds(
          user.wishlist || []
        );

      /*
       * =================================================
       * GUEST WISHLIST
       * =================================================
       */

      let guestWishlist =
        await normalizeWishlistToPublicIds(
          guest.wishlist || []
        );

      /*
       * =================================================
       * VALIDATE GUEST PRODUCTS
       * =================================================
       */

      if (
        guestWishlist.length
      ) {
        const products =
          await Product.find({
            publicId: {
              $in: guestWishlist,
            },
            active: true,
          })
            .select("publicId")
            .lean();

        const validProductIds =
          new Set(
            products.map(
              (product) =>
                String(
                  product.publicId
                )
            )
          );

        /*
         * Bundles can also exist in wishlist.
         */

        const bundles =
          await Bundle.find({
            publicId: {
              $in: guestWishlist,
            },
            active: true,
          })
            .select("publicId")
            .lean();

        const validBundleIds =
          new Set(
            bundles.map(
              (bundle) =>
                String(
                  bundle.publicId
                )
            )
          );

        guestWishlist =
          guestWishlist.filter(
            (id) =>
              validProductIds.has(
                id
              ) ||
              validBundleIds.has(
                id
              )
          );
      }

      /*
       * =================================================
       * MERGE
       * =================================================
       */

      const merged = [
        ...new Set([
          ...existingWishlist,
          ...guestWishlist,
        ]),
      ];

      /*
       * =================================================
       * SAVE USER
       * =================================================
       */

      user.wishlist =
        merged;

      await user.save();

      /*
       * =================================================
       * DELETE GUEST
       * =================================================
       *
       * Only after successful merge.
       */

      // Only the wishlist moved to the account: clear it, but keep the guest's
      // other data (saved addresses) instead of deleting the whole document.
      await Guest.updateOne({ guestId }, { $set: { wishlist: [] } });

      return res.json({
        success: true,
        items: merged,
      });
    } catch (error) {
      console.error(
        "SYNC WISHLIST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to sync wishlist",
      });
    }
  }
);

export default router;