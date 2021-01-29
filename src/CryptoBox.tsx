import { useState } from "react";

export default function CryptoBox() {
    const [keyPair, setKeyPair] = useState<CryptoKeyPair>();
    const [exportedPublicKey, setExportedPublicKey] = useState<JsonWebKey>();

    async function onSignUp() {
        const keyParams: RsaHashedKeyGenParams = {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        };
        const kp = await window.crypto.subtle.generateKey(keyParams, true, ["sign", "verify"]) as CryptoKeyPair;
        setKeyPair(kp);
        setExportedPublicKey(await crypto.subtle.exportKey('jwk', kp.publicKey));
    }

    return (
        <main>
            <button onClick={onSignUp}>Sign up (create pair)</button>
            <div>
                Public Key:
                <code lang='JSON'>
                    <pre>
                        {JSON.stringify(exportedPublicKey, null, 2)}
                    </pre>
                </code>
            </div>
        </main>
    );
}