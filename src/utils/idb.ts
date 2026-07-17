const DB_NAME = "IqamaImagesDB";
const STORE_NAME = "images";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

// ─── VULN-08 fix: AES-GCM encryption for all PII stored in IndexedDB ──────────
// A persistent 256-bit encryption key is derived via PBKDF2 from a random salt
// stored in localStorage. Data persists across sessions but remains encrypted
// at rest, protecting against direct IndexedDB inspection.

const SESSION_KEY_NAME = "iqama_encryption_salt";

async function getSessionKey(): Promise<CryptoKey> {
  // Retrieve or create a persistent random salt (localStorage survives tab close)
  let saltB64 = localStorage.getItem(SESSION_KEY_NAME);
  if (!saltB64) {
    const salt = window.crypto.getRandomValues(new Uint8Array(32));
    saltB64 = btoa(String.fromCharCode(...salt));
    localStorage.setItem(SESSION_KEY_NAME, saltB64);
  }

  const saltBytes = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));

  // Import the salt as PBKDF2 key material
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    saltBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive a 256-bit AES-GCM key
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("iqama-idb-v1"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Safe base64 encoder for large Uint8Arrays — avoids call stack overflow
// that occurs when using btoa(String.fromCharCode(...largeArray))
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 8192; // 8 KB at a time — stays well within call stack limits
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function encryptString(plaintext: string): Promise<string> {
  const key = await getSessionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Combine iv (12 bytes) + ciphertext, encode as base64 (chunked — safe for large images)
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return uint8ToBase64(combined);
}

async function decryptString(b64: string): Promise<string> {
  const key = await getSessionKey();
  // atob returns a binary string; charCodeAt per-char is safe (no spread needed)
  const binaryStr = atob(b64);
  const combined = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    combined[i] = binaryStr.charCodeAt(i);
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// ─────────────────────────────────────────────────────────────────────────────

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event: Event) => {
      reject(new Error("Failed to open IndexedDB database: " + (event.target as IDBOpenDBRequest).error?.message));
    };
  });
}

/**
 * Saves an encrypted base64 image data string associated with an Iqama record ID.
 * VULN-08: Data is AES-GCM encrypted before storage.
 */
export async function saveIqamaImage(id: string, base64Data: string): Promise<void> {
  const db = await getDB();
  const encrypted = await encryptString(base64Data);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(encrypted, id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

/**
 * Retrieves and decrypts the base64 image data string for a given Iqama record ID.
 * VULN-08: Data is decrypted after retrieval.
 */
export async function getIqamaImage(id: string): Promise<string | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = async () => {
      if (!request.result) {
        resolve(null);
        return;
      }
      try {
        const decrypted = await decryptString(request.result);
        resolve(decrypted);
      } catch {
        // Decryption failure (e.g. stale session key) — treat as missing
        resolve(null);
      }
    };
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

/**
 * Deletes the base64 image data string for a given Iqama record ID.
 */
export async function deleteIqamaImage(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

/**
 * Clears all cached image files from IndexedDB.
 */
export async function clearAllIqamaImages(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

/**
 * Saves the parsed Iqama text records list to IndexedDB — AES-GCM encrypted.
 * VULN-08 fix: plaintext JSON is now encrypted before storage.
 */
export async function saveIqamaRecords(records: any[]): Promise<void> {
  const db = await getDB();
  const encrypted = await encryptString(JSON.stringify(records));
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(encrypted, "iqama_text_records");

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

/**
 * Retrieves and decrypts the parsed Iqama text records list from IndexedDB.
 * VULN-08 fix: data is decrypted after retrieval.
 */
export async function getIqamaRecords(): Promise<any[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("iqama_text_records");

    request.onsuccess = async () => {
      if (!request.result) {
        resolve([]);
        return;
      }
      try {
        const decrypted = await decryptString(request.result);
        resolve(JSON.parse(decrypted));
      } catch {
        // Decryption failure (e.g. new session or corrupted data) — return empty
        resolve([]);
      }
    };
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

/**
 * Clears the parsed Iqama text records list from IndexedDB.
 */
export async function clearAllIqamaRecords(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete("iqama_text_records");

    request.onsuccess = () => resolve();
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}
