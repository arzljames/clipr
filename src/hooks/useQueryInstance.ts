import { fileUpload, getScreenRecordsList } from "@/lib/services";
import { useMutation, useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { queryClient } from "@/lib/queryClient";

type FileUploadInput = {
  file: Blob;
  fileName: string;
};

export const useFileUpload = () => {
  return useMutation({
    mutationFn: async ({ file, fileName }: FileUploadInput) => {
      const uniqueId = uuidv4();
      return fileUpload(uniqueId, file, fileName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["screen_records_list"],
      });
    },
  });
};

export const useScreenRecordsList = () => {
  return useQuery({
    queryKey: ["screen_records_list"],
    queryFn: () => getScreenRecordsList(),
  });
};
