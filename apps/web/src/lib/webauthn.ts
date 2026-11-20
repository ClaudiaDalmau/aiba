import "server-only";
import { createHash, createPublicKey, verify as cryptoVerify, randomBytes } from "node:crypto";
import { badRequest } from "./errors";

/**
 * Minimal WebAuthn (passkeys) server: registration with attestation "none" and assertion verification.
 * The fingerprint / face check happens on the user's device (userVerification "required");
 * the server only ever sees a public key and signatures. No biometric data is received or stored.
 */

export const b64u = {
  enc: (b: Buffer | Uint8Array) => Buffer.from(b).toString("base64url"),
  dec: (s: string) => Buffer.from(s, "base64url"),
};

export const newChallenge = () => b64u.enc(randomBytes(32));

// ---- tiny CBOR decoder (enough for attestationObject and COSE keys)
function decodeCbor(buf: Buffer): unknown {
  let pos = 0;
  const readLen = (info: number): number => {
    if (info < 24) return info;
    if (info === 24) return buf[pos++];
    if (info === 25) {
      const v = buf.readUInt16BE(pos);
      pos += 2;
      return v;
    }
    if (info === 26) {
      const v = buf.readUInt32BE(pos);
      pos += 4;
      return v;
    }
    if (info === 27) {
      const v = Number(buf.readBigUInt64BE(pos));
      pos += 8;
      return v;
    }
    throw badRequest("Unsupported CBOR length");
  };
  const item = (): unknown => {
    const b = buf[pos++];
    const major = b >> 5;
    const info = b & 31;
    switch (major) {
      case 0:
        return readLen(info);
      case 1:
        return -1 - readLen(info);
      case 2: {
        const n = readLen(info);
        const v = buf.subarray(pos, pos + n);
        pos += n;
        return v;
      }
      case 3: {
        const n = readLen(info);
        const v = buf.subarray(pos, pos + n).toString("utf8");
        pos += n;
        return v;
      }
      case 4: {
        const n = readLen(info);
        return Array.from({ length: n }, () => item());
      }
      case 5: {
        const n = readLen(info);
        const m = new Map<unknown, unknown>();
        for (let i = 0; i < n; i++) {
          const k = item();
          m.set(k, item());
        }
        return m;
      }
      case 7:
        if (info === 20) return false;
        if (info === 21) return true;
        if (info === 22 || info === 23) return null;
        throw badRequest("Unsupported CBOR value");
      default:
        throw badRequest("Unsupported CBOR type");
    }
  };
  return item();
}

/** Byte length of the first CBOR item (the COSE key inside authData is followed by optional extensions). */
function coseToJwk(cose: Map<unknown, unknown>): { jwk: JsonWebKey; alg: number } {
  const kty = cose.get(1);
  const alg = Number(cose.get(3));
  if (kty === 2) {
    const x = cose.get(-2) as Buffer;
    const y = cose.get(-3) as Buffer;
    if (cose.get(-1) !== 1) throw badRequest("Unsupported curve");
    return { jwk: { kty: "EC", crv: "P-256", x: b64u.enc(x), y: b64u.enc(y) }, alg: alg || -7 };
  }
  if (kty === 3) {
    return { jwk: { kty: "RSA", n: b64u.enc(cose.get(-1) as Buffer), e: b64u.enc(cose.get(-2) as Buffer) }, alg: alg || -257 };
  }
  throw badRequest("Unsupported key type");
}

type ClientData = { type: string; challenge: string; origin: string };

function checkClientData(raw: Buffer, type: string, challenge: string, origin: string) {
  const cd = JSON.parse(raw.toString("utf8")) as ClientData;
  if (cd.type !== type) throw badRequest("Wrong ceremony type");
  if (cd.challenge !== challenge) throw badRequest("This request expired. Try again.");
  if (cd.origin !== origin) throw badRequest("Wrong origin");
}

function parseAuthData(ad: Buffer, rpId: string) {
  const rpIdHash = ad.subarray(0, 32);
  if (!rpIdHash.equals(createHash("sha256").update(rpId).digest())) throw badRequest("Wrong relying party");
  const flags = ad[32];
  if (!(flags & 0x01)) throw badRequest("User presence missing");
  if (!(flags & 0x04)) throw badRequest("Your device didn't verify you (fingerprint, face or device PIN). Try again.");
  return { flags, counter: ad.readUInt32BE(33) };
}

export function verifyRegistration(input: { clientDataJSON: string; attestationObject: string }, expected: { challenge: string; origin: string; rpId: string }) {
  checkClientData(b64u.dec(input.clientDataJSON), "webauthn.create", expected.challenge, expected.origin);
  const att = decodeCbor(b64u.dec(input.attestationObject)) as Map<string, unknown>;
  const ad = att.get("authData") as Buffer;
  const { flags, counter } = parseAuthData(ad, expected.rpId);
  if (!(flags & 0x40)) throw badRequest("No credential data");
  let p = 37 + 16; // rpIdHash + flags + counter + aaguid
  const idLen = ad.readUInt16BE(p);
  p += 2;
  const credentialId = ad.subarray(p, p + idLen);
  p += idLen;
  const cose = decodeCbor(ad.subarray(p)) as Map<unknown, unknown>;
  const { jwk, alg } = coseToJwk(cose);
  // Make sure node can load the key.
  createPublicKey({ key: jwk, format: "jwk" });
  return { credentialId: b64u.enc(credentialId), publicKey: jwk, alg, counter };
}

export function verifyAssertion(
  input: { clientDataJSON: string; authenticatorData: string; signature: string },
  key: { publicKey: JsonWebKey; alg: number; counter: number },
  expected: { challenge: string; origin: string; rpId: string },
) {
  const cdRaw = b64u.dec(input.clientDataJSON);
  checkClientData(cdRaw, "webauthn.get", expected.challenge, expected.origin);
  const ad = b64u.dec(input.authenticatorData);
  const { counter } = parseAuthData(ad, expected.rpId);
  const data = Buffer.concat([ad, createHash("sha256").update(cdRaw).digest()]);
  const pub = createPublicKey({ key: key.publicKey, format: "jwk" });
  const ok = cryptoVerify("sha256", data, pub, b64u.dec(input.signature));
  if (!ok) throw badRequest("Signature check failed");
  if (key.counter > 0 && counter > 0 && counter <= key.counter) throw badRequest("This passkey looks cloned. Contact support.");
  return { counter };
}
