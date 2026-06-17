import config from "../config/config.js";

const IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

const uploadToImageKit = async (fields) => {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });

  const response = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")}`,
    },
    body: formData,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || "ImageKit upload failed");
  }

  return body;
};

async function uploadImage({ buffer, folder = '/Varnika-products' }) {
    const res = await uploadToImageKit({
        file: new Blob([buffer]),
        fileName: crypto.randomUUID(),
        folder,
    });
    return {
        url: res.url,
        thumbnail: res.thumbnailUrl || res.url,
        id: res.fileId,
    };
}

async function uploadVideo({buffer,originalname, folder = '/varnika-videos'}){
    const ext = originalname?.split(".").pop() || "mp4";

    const res = await uploadToImageKit({
        file: new Blob([buffer]),
        fileName: `${crypto.randomUUID()}.${ext}`,
        folder,
        useUniqueFileName: "false"
    });
    return{
        url: res.url,
        thumbnail: `${res.thumbnailUrl || res.url}?tr=so-1`,
        id: res.fileId
    }
}


export { uploadImage, uploadVideo };
