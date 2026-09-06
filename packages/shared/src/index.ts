export type HealthResponse = {
  status: "ok";
  service: string;
};

export type PublicUser = {
  id: string;
  email: string;
};

export type AuthUserResponse = {
  user: PublicUser;
};

export type AuthErrorBody = {
  error: string;
  code: string;
};
