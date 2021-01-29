import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import Chat2 from "./Chat2";
import SignupButton from "./SignupButton";


interface FollowingListEntry {
  alias: string;
  publicKey: JsonWebKey;
}
interface FollowingListProps {
  entries: FollowingListEntry[];
  setEntries: Dispatch<SetStateAction<FollowingListEntry[]>>;
}

function FollowingList({entries, setEntries}: FollowingListProps) {
  function unfollow(entry: FollowingListEntry) {
    setEntries(entries => entries.filter(e => e !== entry));
  }

  function onFollow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElements = event.currentTarget.elements;
    const aliasInput = formElements.namedItem('alias') as HTMLInputElement;
    const jwkInput = formElements.namedItem('jwk') as HTMLInputElement;
    const entry: FollowingListEntry = {
      alias: aliasInput.value,
      publicKey: JSON.parse(jwkInput.value),
    };
    setEntries(entries => [...entries, entry]);
    event.currentTarget.reset();
  }

  return (
    <section>
      <ul>
        {entries.map((entry, index) => (
          <li key={index}>
            {entry.alias} <button onClick={() => unfollow(entry)}>Unfollow</button>
          </li>
        ))}
      </ul>
      <form onSubmit={onFollow}>
        <label>
          Alias:
          <input name='alias' required />
        </label>
        <label>
          JWK:
          <textarea required name='jwk' />
        </label>
        <button type='submit'>Follow</button>
      </form>
    </section>
  );
}

function App() {
  const [following, setFollowing] = useState<FollowingListEntry[]>([]);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair>();
  const [publicKey, setPublicKey] = useState<JsonWebKey>();

  async function onSignup(key: CryptoKeyPair) {
    setKeyPair(key);
    setPublicKey(await crypto.subtle.exportKey("jwk", key.publicKey));
  }

  return (
    <div>
      <h1>Hello Web RTC</h1>
      <div>
        Public Key:
        <code lang="JSON">
          <pre>{JSON.stringify(publicKey, null, 2)}</pre>
        </code>
      </div>
      <SignupButton onSignup={onSignup} />
      <FollowingList entries={following} setEntries={setFollowing} />
      {keyPair && <Chat2 keyPair={keyPair}/>}
    </div>
  );
}

export default App;
