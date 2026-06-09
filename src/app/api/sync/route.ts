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
    } else if (['google_calendar', 'slack', 'notion', 'jira', 'clickup', 'gmail'].includes(provider)) {
      if (provider === 'google_calendar') {
        externalTasks = [
          { sourceId: 'cal-1', title: 'Deep Work: Core API Refactoring', status: 'todo', estimatedDuration: 60, impactScore: 5 },
          { sourceId: 'cal-2', title: 'Product alignment call sync', status: 'todo', estimatedDuration: 30, impactScore: 2 }
        ];
      } else if (provider === 'slack') {
        externalTasks = [
          { sourceId: 'slack-1', title: 'Review bug reported in #prod-alerts', status: 'todo', estimatedDuration: 15, impactScore: 4 }
        ];
      } else if (provider === 'notion') {
        externalTasks = [
          { sourceId: 'notion-1', title: 'Draft product specification document', status: 'todo', estimatedDuration: 45, impactScore: 4 },
          { sourceId: 'notion-2', title: 'Brainstorm marketing launch notes', status: 'todo', estimatedDuration: 30, impactScore: 3 }
        ];
      } else if (provider === 'jira') {
        externalTasks = [
          { sourceId: 'jira-1', title: 'PF-289: Resolve database indexing latency', status: 'todo', estimatedDuration: 90, impactScore: 5 },
          { sourceId: 'jira-2', title: 'PF-144: Add security headers check', status: 'todo', estimatedDuration: 20, impactScore: 3 }
        ];
      } else if (provider === 'clickup') {
        externalTasks = [
          { sourceId: 'click-1', title: 'Design landing page pricing block', status: 'todo', estimatedDuration: 40, impactScore: 4 }
        ];
      } else if (provider === 'gmail') {
        externalTasks = [
          { sourceId: 'mail-1', title: 'Respond to security review questions', status: 'todo', estimatedDuration: 30, impactScore: 4 }
        ];
      }
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
