import { put, get } from "@vercel/blob";

// Sensitive provider documents (ID proof) live in a PRIVATE Blob store, separate
// from the public store used for product images and profile photos. Nothing in
// this store has a public URL — files can only be read through a server route
// that checks who is asking.
const storeId = process.env.BLOB_PRIVATE_READ_WRITE_TOKEN_STORE_ID;

export async function putPrivateDoc(pathname: string, file: File) {
  if (!storeId) throw new Error("BLOB_PRIVATE_READ_WRITE_TOKEN_STORE_ID is not set");
  return put(pathname, file, {
    access: "private",
    storeId,
    addRandomSuffix: true, // unguessable pathnames
  });
}

export async function getPrivateDoc(pathname: string) {
  if (!storeId) throw new Error("BLOB_PRIVATE_READ_WRITE_TOKEN_STORE_ID is not set");
  return get(pathname, { access: "private", storeId });
}