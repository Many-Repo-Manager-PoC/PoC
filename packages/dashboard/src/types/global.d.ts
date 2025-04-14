// Extend the User type to include accessToken
declare module "@auth/core/types" {
  interface User {
    accessToken?: string;
  }
}
