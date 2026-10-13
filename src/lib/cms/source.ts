/**
 * Which product owns the Projects this app reads and writes. The database
 * resolves the real owner from the signed-in user (private.cms_admins); these
 * constants only scope queries and name the matching storage bucket, and no
 * request value ever feeds into them.
 */
export const CMS_SOURCE = "moriz";
export const CMS_MEDIA_BUCKET = "project-media";
