import { randomInt, randomBytes } from "crypto";

// Generates a secure random 32-byte key, encoded in base64
function generateBase64Key() {
    return randomBytes(32).toString("base64");
}

// Generates a secure random string of specified length
function generateRandomString(length = 64) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    let str = '';

    for (let i = 0; i < length; i++) {
        str += charset[randomInt(0, charset.length)];
    }

    return str;
}

const emailHmacKey = generateRandomString();
const dataEncryptionKey = generateBase64Key();

console.log(JSON.stringify({
    "Hashing:EmailHmacKey": emailHmacKey,
    "DataEncryption:Key": dataEncryptionKey,
}, null, 2));
