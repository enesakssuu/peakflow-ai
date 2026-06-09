// ============================================================
// PeakFlow AI — Integrations Sync API Route
// ============================================================

import { NextResponse } from 'next/server';
import { fetchPlaneIssues } from '@/lib/integrations/plane';
import { fetchTrelloCards } from '@/lib/integrations/trello';
import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { integrationId, userId } = body;

    if (!integrationId) {
      return NextResponse.json({ error: 'Missing integrationId' }, { status: 400 });
    }

    const db = getFirebaseDb();
    const intSnap = await getDoc(doc(db, 'integrations', integrationId));

    if (!intSnap.exists()) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const integration = intSnap.data();
    if (!integration.isActive) {
      return NextResponse.json({ error: 'Integration is inactive' }, { status: 400 });
    }

    const targetId = integration.targetId;
    const targetType = integration.targetType;
    const provider = integration.provider;
    const config = integration.config;

    let externalTasks: any[] = [];
    if (provider === 'plane') {
      externalTasks = await fetchPlaneIssues(config);
    } else if (provider === 'trello') {
      externalTasks = await fetchTrelloCards(config);
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    // Fetch existing tasks from this integration
    let tasksQuery;
    if (targetType === 'workspace') {
      tasksQuery = query(
        collection(db, 'tasks'),
        where('workspaceId', '==', targetId),
        where('source', '==', provider)
      );
    } else {
      tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', targetId),
        where('workspaceId', '==', null),
        where('source', '==', provider)
      );
    }

    const tasksSnap = await getDocs(tasksQuery);
    const existingTasksMap = new Map<string, any>();
    tasksSnap.docs.forEach((docSnap) => {
      const taskData = docSnap.data();
      if (taskData.sourceId) {
        existingTasksMap.set(taskData.sourceId, { id: docSnap.id, ...taskData });
      }
    });

    // Upsert tasks in Firestore
    for (const extTask of externalTasks) {
      const existing = existingTasksMap.get(extTask.sourceId);
      if (existing) {
        await updateDoc(doc(db, 'tasks', existing.id), {
          title: extTask.title,
          status: extTask.status,
          impactScore: extTask.impactScore,
        });
      } else {
        const newTaskRef = doc(collection(db, 'tasks'));
        await setDoc(newTaskRef, {
          userId: targetType === 'personal' ? targetId : (userId || ''),
          workspaceId: targetType === 'workspace' ? targetId : null,
          title: extTask.title,
          estimatedDuration: extTask.estimatedDuration,
          impactScore: extTask.impactScore,
          status: extTask.status,
          source: provider,
          sourceId: extTask.sourceId,
          createdAt: serverTimestamp(),
        });
      }
    }

    // Update lastSyncedAt on integration doc
    await updateDoc(doc(db, 'integrations', integrationId), {
      lastSyncedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, count: externalTasks.length });
  } catch (err: any) {
    console.error('Integration sync error:', err);
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}
