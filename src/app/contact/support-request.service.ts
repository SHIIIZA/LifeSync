import { Injectable } from '@angular/core';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';

export interface SupportRequest {
  requestId: string;
  name: string;
  email: string;
  topic: string;
  reference: string;
  message: string;
}

interface SupportResponse {
  accepted: boolean;
  messageId: string;
}

@Injectable({ providedIn: 'root' })
export class SupportRequestService {
  private readonly supportApp =
    getApps().find((app) => app.name === 'lifesync-support') ??
    initializeApp(environment.supportFirebase, 'lifesync-support');
  private readonly supportAuth = getAuth(this.supportApp);
  private readonly supportDb = getFirestore(this.supportApp);

  async save(request: SupportRequest): Promise<SupportResponse> {
    const user =
      this.supportAuth.currentUser ??
      (await signInAnonymously(this.supportAuth)).user;
    const requestRef = doc(this.supportDb, 'supportRequests', request.requestId);
    const existingRequest = await getDoc(requestRef);

    if (existingRequest.exists()) {
      const saved = existingRequest.data();
      if (
        saved['submitterUid'] !== user.uid ||
        saved['name'] !== request.name ||
        saved['email'] !== request.email ||
        saved['topic'] !== request.topic ||
        saved['reference'] !== request.reference ||
        saved['message'] !== request.message
      ) {
        throw new Error('This request ID is already associated with another message.');
      }
      return { accepted: true, messageId: request.requestId };
    }

    await setDoc(requestRef, {
      name: request.name,
      email: request.email,
      topic: request.topic,
      reference: request.reference,
      message: request.message,
      submitterUid: user.uid,
      createdAt: serverTimestamp(),
    });

    return { accepted: true, messageId: request.requestId };
  }
}
