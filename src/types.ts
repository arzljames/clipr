export type VerifyTokenResponse = {
  message: string;
  status: string;
  data: number | null;
  meta: {
    userId?: number;
    userZuid?: string;
  };
  code: number;
};
