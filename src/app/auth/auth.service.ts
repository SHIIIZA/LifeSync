import { Injectable, signal } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly uid = signal<string | null>(null);
  readonly email = signal<string | null>(null);
  readonly displayName = signal<string | null>(null);
  readonly photoUrl = signal<string | null>(null);

  constructor(private auth: Auth) {
    authState(this.auth).subscribe((u) => {
      this.uid.set(u?.uid ?? null);
      this.email.set(u?.email ?? null);
      this.displayName.set(u?.displayName ?? null);
      this.photoUrl.set(u?.photoURL ?? null);
    });
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async signup(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(credential.user, { displayName });
    this.displayName.set(displayName);
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
