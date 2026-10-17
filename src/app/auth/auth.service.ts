import { Injectable, signal } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, runTransaction } from '@angular/fire/firestore';

class AuthFlowError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'AuthFlowError';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly uid = signal<string | null>(null);
  readonly email = signal<string | null>(null);
  readonly displayName = signal<string | null>(null);
  readonly photoUrl = signal<string | null>(null);

  constructor(private auth: Auth, private firestore: Firestore) {
    authState(this.auth).subscribe((u) => {
      this.uid.set(u?.uid ?? null);
      this.email.set(u?.email ?? null);
      this.displayName.set(u?.displayName ?? null);
      this.photoUrl.set(u?.photoURL ?? null);
    });
  }

  async login(identifier: string, password: string) {
    const value = identifier.trim();
    let email = value;
    if (!value.includes('@')) {
      if (!/^[a-zA-Z0-9._-]{2,30}$/.test(value)) {
        throw new AuthFlowError('auth/invalid-credential', 'Invalid login credentials.');
      }
      const usernameSnapshot = await getDoc(
        doc(this.firestore, 'usernames', value.toLowerCase()),
      );
      const mappedEmail: unknown = usernameSnapshot.data()?.['email'];
      if (!usernameSnapshot.exists() || typeof mappedEmail !== 'string') {
        throw new AuthFlowError('auth/invalid-credential', 'Invalid login credentials.');
      }
      email = mappedEmail;
    }
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async signup(email: string, password: string, username: string) {
    const trimmedUsername = username.trim();
    if (!/^[a-zA-Z0-9._-]{2,30}$/.test(trimmedUsername)) {
      throw new AuthFlowError('auth/invalid-username', 'Invalid username.');
    }
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    try {
      await updateProfile(credential.user, { displayName: trimmedUsername });
      const usernameRef = doc(
        this.firestore,
        'usernames',
        trimmedUsername.toLowerCase(),
      );
      await runTransaction(this.firestore, async (transaction) => {
        const existing = await transaction.get(usernameRef);
        if (existing.exists()) {
          throw new AuthFlowError('auth/username-already-in-use', 'Username is taken.');
        }
        transaction.set(usernameRef, {
          uid: credential.user.uid,
          email: credential.user.email,
        });
      });
    } catch (error: unknown) {
      try {
        await deleteUser(credential.user);
      } catch {
        throw new AuthFlowError(
          'auth/signup-cleanup-failed',
          'Unable to clean up an incomplete account.',
        );
      }
      throw error;
    }
    this.displayName.set(trimmedUsername);
    return credential;
  }

  logout() {
    return signOut(this.auth);
  }

  async updateDisplayName(name: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not signed in');
    await updateProfile(user, { displayName: name });
    this.displayName.set(name);
  }

  async resetPassword(email: string) {
    await sendPasswordResetEmail(this.auth, email);
  }
}
