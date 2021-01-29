
export interface SignupButtonProps {
    onSignup: (keyPair: CryptoKeyPair) => Promise<void>;
}

export default function SignupButton({onSignup}: SignupButtonProps) {
    async function onClickCreateAccount() {
        const keyParams: RsaHashedKeyGenParams = {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        };
        const kp = await window.crypto.subtle.generateKey(keyParams, true, ["sign", "verify"]) as CryptoKeyPair;
        await onSignup(kp);
    }

    return (
        <button onClick={onClickCreateAccount}>Create a local account</button>
    );
}