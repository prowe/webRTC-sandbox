import { useState } from "react";

export default function CryptoBox() {
    const [keyPair, setKeyPair] = useState<CryptoKeyPair>();
    const [exportedPublicKey, setExportedPublicKey] = useState<JsonWebKey>();

    async function onSignUp() {
        const keyParams: EcKeyGenParams = {
            name: "ECDSA",
            namedCurve: "P-384",
        };
        const kp = await window.crypto.subtle.generateKey(keyParams, true, ["sign", "verify"]);
        setKeyPair(kp);
        setExportedPublicKey(await crypto.subtle.exportKey('jwk', kp.publicKey));
    }

    return (
        <main>
            <button onClick={onSignUp}>Sign up (create pair</button>
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