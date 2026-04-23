import type { VerifyTokenResponse } from "@/types";
import { axiosInstance } from "./axiosInstance";
import { v4 as uuidv4 } from "uuid";

export const verifyToken = async (
  token: string,
): Promise<VerifyTokenResponse> => {
  try {
    const response = await axiosInstance.get(
      `https://auth.api.zesty.io/verify`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const VerifyUserAccess = async (
  userZuid: string,
  token: string,
): Promise<boolean> => {
  try {
    const response = await axiosInstance.get(
      `https://accounts.api.zesty.io/v1/users/${userZuid}/instances`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const instanceData = response.data?.data ?? [];

    return (
      instanceData.filter((data: any) => data.ZUID === "8-e8e981c5f6-2twrfl")
        .length > 0
    );
  } catch (error) {
    return false;
  }
};

export const getInstanceMediaData = async () => {
  try {
    let instanceData = {
      mediaDriver: "",
      mediaBinZUID: "",
      mediaBucketName: "",
    };
    const accountResponse = await axiosInstance.get(
      `https://accounts.api.zesty.io/v1/instances/8-e8e981c5f6-2twrfl`,
    );

    if (
      accountResponse?.data?.data?.ID &&
      accountResponse.data.data.ID !== ""
    ) {
      const mediaResponse = await axiosInstance.get(
        `https://media-manager.api.zesty.io/site/${accountResponse.data.data.ID}/bins`,
      );

      instanceData = {
        mediaBinZUID: mediaResponse.data.data[0].id,
        mediaDriver: mediaResponse.data.data[0].storage_driver,
        mediaBucketName: mediaResponse.data.data[0].storage_name,
      };
    }

    return instanceData;
  } catch (error) {
    return {
      mediaDriver: "",
      mediaBinZUID: "",
      mediaBucketName: "",
    };
  }
};

export const fileUpload = async (
  file: Blob,
  fileName: string,
  binZUID = import.meta.env.VITE_MEDIA_ZUID,
  driver = import.meta.env.VITE_MEDIA_DRIVER,
  bucketName = import.meta.env.VITE_MEDIA_BUCKET_NAME,
) => {
  const uuid = uuidv4();
  if (!binZUID || !driver || !bucketName) {
    throw new Error("Missing media upload environment variables.");
  }

  const formData = new FormData();

  formData.append("file", file, fileName);
  formData.append("bin_id", binZUID);

  try {
    const response = await axiosInstance.post(
      `https://media-storage.api.zesty.io/upload/${driver}/${bucketName}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (response.status === 201 && response.data?.data?.length > 0) {
      await axiosInstance.post(
        `https://8-e8e981c5f6-2twrfl.api.zesty.io/v1/content/models/6-c29a99cfc8-c5gfdm/items`,
        {
          data: {
            record: response.data.data[0].id,
            comments: null,
            record_id: uuid,
          },
          web: {
            canonicalTagMode: 1,
            parentZUID: "0",
            pathPart: uuid,
            metaTitle: uuid,
          },
          meta: { langID: 1, contentModelZUID: "6-c29a99cfc8-c5gfdm" },
        },
      );
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};
