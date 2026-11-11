// Shared rules for admin image pickers (matches what the backend accepts).
import toast from "react-hot-toast";

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
export const MAX_IMAGE_FILES = 10;

/**
 * Keeps only JPG/PNG/WEBP files up to 8MB, at most 10 in total
 * (`alreadySelected` counts images already picked). Toasts what was skipped.
 */
export function pickImageFiles(fileList, alreadySelected = 0) {
  const kept = [];
  let wrongType = 0;
  let tooBig = 0;
  let overLimit = 0;

  Array.from(fileList || []).forEach((file) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      wrongType += 1;
    } else if (file.size > MAX_IMAGE_SIZE) {
      tooBig += 1;
    } else if (alreadySelected + kept.length >= MAX_IMAGE_FILES) {
      overLimit += 1;
    } else {
      kept.push(file);
    }
  });

  const skipped = [];
  if (wrongType) skipped.push(`${wrongType} not JPG/PNG/WEBP`);
  if (tooBig) skipped.push(`${tooBig} over 8MB`);
  if (overLimit) skipped.push(`${overLimit} over the ${MAX_IMAGE_FILES}-image limit`);

  if (skipped.length) {
    toast.error(`Skipped ${skipped.join(", ")}.`);
  }

  return kept;
}
