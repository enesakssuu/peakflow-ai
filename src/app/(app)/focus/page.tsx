// ============================================================
// PeakFlow AI — Focus Mode Bridge Route
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getTasks } from '@/lib/firestore';
import { Brain } from 'lucide-react';

export default function FocusBridgePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function redirectOrCreateSession() {
      if (!firebaseUser) {
        router.push('/login');
        return;
      }

      try {
        const workspaceId = currentWorkspaceId === 'personal' ? null : currentWorkspaceId;
        const tasksList = await getTasks(firebaseUser.uid, workspaceId);
        
        // Find first active (uncompleted) task
        const activeTask = tasksList.find(t => t.status !== 'completed' && t.status !== 'done');
        
        if (activeTask) {
          router.replace(`/focus/${activeTask.id}`);
        } else if (tasksList.length > 0) {
          // Fallback to first task
          router.replace(`/focus/${tasksList[0].id}`);
        } else {
          // No tasks exist
          setErrorMsg(
            currentWorkspaceId === 'personal'
              ? 'You do not have any tasks. Please add a task in the dashboard to start a focus session.'
              : 'Workspace does not have any tasks. Add tasks to start focus mode.'
          );
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }
      } catch (err: any) {
        console.error('Failed to route focus session:', err);
        setErrorMsg('Error initializing focus mode. Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } finally {
        setLoading(false);
      }
    }

    redirectOrCreateSession();
  }, [firebaseUser, currentWorkspaceId, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg animate-pulse-soft mb-6">
        <Brain className="w-8 h-8 text-accent" />
      </div>
      <h2 className="text-xl font-bold mb-2">
        {loading ? 'Initializing Focus Session...' : 'Preparing Focus Mode'}
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        {loading 
          ? 'Finding your recommended tasks and establishing a cognitive workspace...'
          : errorMsg || 'Redirecting to your deep work space...'}
      </p>
    </div>
  );
}
