type AdminNetworkEnv = {
  ADMIN_IP_ALLOWLIST?: string;
  NODE_ENV?: string;
};

type AdminNetworkDecision =
  | {
      allowed: true;
      clientIp: string | null;
      reason: "matched_allowlist" | "allowlist_not_required";
    }
  | {
      allowed: false;
      clientIp: string | null;
      reason:
        | "invalid_allowlist"
        | "missing_allowlist"
        | "missing_client_ip"
        | "not_in_allowlist";
    };

const clientIpHeaders = [
  "cf-connecting-ip",
  "true-client-ip",
  "x-real-ip",
  "x-forwarded-for"
] as const;

export function checkAdminNetworkAccess(
  headers: Pick<Headers, "get">,
  env: AdminNetworkEnv = process.env
): AdminNetworkDecision {
  const entries = parseAdminIpAllowlist(env.ADMIN_IP_ALLOWLIST);
  const clientIp = clientIpFromHeaders(headers);

  if (entries.length === 0) {
    if (env.NODE_ENV === "production") {
      return { allowed: false, clientIp, reason: "missing_allowlist" };
    }
    return { allowed: true, clientIp, reason: "allowlist_not_required" };
  }

  if (entries.some((entry) => !isValidAllowlistEntry(entry))) {
    return { allowed: false, clientIp, reason: "invalid_allowlist" };
  }

  if (!clientIp) {
    return { allowed: false, clientIp: null, reason: "missing_client_ip" };
  }

  const allowed = entries.some((entry) => ipMatchesEntry(clientIp, entry));
  return allowed
    ? { allowed: true, clientIp, reason: "matched_allowlist" }
    : { allowed: false, clientIp, reason: "not_in_allowlist" };
}

export function parseAdminIpAllowlist(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function clientIpFromHeaders(headers: Pick<Headers, "get">): string | null {
  for (const header of clientIpHeaders) {
    const value = headers.get(header);
    if (!value) continue;
    const first = value.split(",")[0]?.trim();
    const normalized = normalizeIp(first);
    if (normalized) return normalized;
  }
  return null;
}

function normalizeIp(value: string | undefined): string | null {
  if (!value || value.toLowerCase() === "unknown") return null;
  const withoutIpv6Brackets = value.replace(/^\[([^\]]+)\](?::\d+)?$/, "$1");
  const withoutIpv4Port = withoutIpv6Brackets.replace(
    /^(\d+\.\d+\.\d+\.\d+):\d+$/,
    "$1"
  );
  return withoutIpv4Port.replace(/^::ffff:/i, "");
}

function isValidAllowlistEntry(entry: string): boolean {
  if (entry.includes("/")) {
    const [ip, prefix] = entry.split("/");
    const prefixNumber = Number(prefix);
    return (
      parseIpv4(ip ?? "") !== null &&
      Number.isInteger(prefixNumber) &&
      prefixNumber >= 0 &&
      prefixNumber <= 32
    );
  }
  return parseIpv4(entry) !== null || isPlainIpv6(entry);
}

function ipMatchesEntry(ip: string, entry: string): boolean {
  if (entry.includes("/")) return ipv4CidrMatches(ip, entry);
  return ip === entry;
}

function ipv4CidrMatches(ip: string, cidr: string): boolean {
  const [rangeIp, prefix] = cidr.split("/");
  const target = parseIpv4(ip);
  const range = parseIpv4(rangeIp ?? "");
  const prefixNumber = Number(prefix);

  if (target === null || range === null || !Number.isInteger(prefixNumber))
    return false;
  if (prefixNumber === 0) return true;

  const mask = (0xffffffff << (32 - prefixNumber)) >>> 0;
  return (target & mask) === (range & mask);
}

function parseIpv4(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const octets = parts.map((part) => {
    if (!/^\d+$/.test(part)) return null;
    const octet = Number(part);
    return octet >= 0 && octet <= 255 ? octet : null;
  });

  if (octets.some((octet) => octet === null)) return null;
  return (
    (((octets[0] as number) << 24) |
      ((octets[1] as number) << 16) |
      ((octets[2] as number) << 8) |
      (octets[3] as number)) >>>
    0
  );
}

function isPlainIpv6(value: string): boolean {
  return value.includes(":") && /^[0-9a-f:]+$/i.test(value);
}
