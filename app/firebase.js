// Pinned to the version already used by Averlen's account-action website.
export async function createFirebaseAdapter(config) {
  const [{ initializeApp }, sdk] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js'),
  ]);
  const auth = sdk.getAuth(initializeApp(config));
  await sdk.setPersistence(auth, sdk.browserLocalPersistence);
  const apple = () => { const provider = new sdk.OAuthProvider('apple.com'); provider.addScope('email'); provider.addScope('name'); return provider; };
  return {
    currentUser: () => auth.currentUser,
    subscribe: callback => sdk.onAuthStateChanged(auth, callback),
    token: (user, fresh) => sdk.getIdToken(user, fresh),
    signIn: (email, password) => sdk.signInWithEmailAndPassword(auth, email, password),
    signInApple: () => sdk.signInWithPopup(auth, apple()),
    signOut: () => sdk.signOut(auth),
    resetPassword: email => sdk.sendPasswordResetEmail(auth, email),
    provider: user => user?.providerData.some(provider => provider.providerId === 'password') ? 'password' : 'apple.com',
    reauthenticate: (user, password) => user.providerData.some(provider => provider.providerId === 'password')
      ? sdk.reauthenticateWithCredential(user, sdk.EmailAuthProvider.credential(user.email, password))
      : sdk.reauthenticateWithPopup(user, apple()),
  };
}
