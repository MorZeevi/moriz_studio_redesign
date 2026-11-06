"use client";
import Image, { type ImageProps } from "next/image";
import { mediaVariant, transformableMedia } from "@/lib/media-variants";
/** Keep private CMS files out of the shared Next optimizer. */
export default function CmsImage(props: ImageProps) {
  const privateSource =
    typeof props.src === "string" && props.src.startsWith("/media/");
  if (!privateSource) return <Image {...props} />;
  return (
    <Image
      {...props}
      unoptimized={!transformableMedia(String(props.src))}
      loader={({ src, width }) => mediaVariant(src, width)}
    />
  );
}
