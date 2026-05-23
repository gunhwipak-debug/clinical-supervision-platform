type LoginUser = {
  passwordHash: string | null;
  status: string;
};

type VerifyPassword = (plaintext: string, hash: string) => Promise<boolean>;

export type LoginPasswordCheck = {
  userCanAuthenticate: boolean;
  passwordMatches: boolean;
};

export async function verifyLoginPassword(input: {
  user: LoginUser | null;
  password: string;
  dummyHash: string;
  verifyPassword: VerifyPassword;
}): Promise<LoginPasswordCheck> {
  const user = input.user;
  let userCanAuthenticate = false;
  let hash = input.dummyHash;

  if (user?.status === "active" && typeof user.passwordHash === "string") {
    userCanAuthenticate = true;
    hash = user.passwordHash;
  }

  const passwordMatches = await input.verifyPassword(input.password, hash);

  return {
    userCanAuthenticate,
    passwordMatches: userCanAuthenticate && passwordMatches
  };
}
