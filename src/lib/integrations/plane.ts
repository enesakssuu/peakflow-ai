// ============================================================
// PeakFlow AI — Plane.so Integration Helper
// ============================================================

export async function fetchPlaneIssues(config: {
  host?: string;
  apiKey?: string;
  workspaceSlug?: string;
  projectSlug?: string;
}) {
  const host = config.host || 'https://app.plane.so';
  const apiKey = config.apiKey;
  const workspace = config.workspaceSlug;
  const project = config.projectSlug;

  if (!apiKey || !workspace || !project) {
    throw new Error('Missing Plane.so configuration parameters');
  }

  // Clean host URL (remove trailing slash)
  const cleanHost = host.replace(/\/$/, '');
  const url = `${cleanHost}/api/v1/workspaces/${workspace}/projects/${project}/issues/`;

  const res = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Plane API responded with status ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const issues = Array.isArray(data) ? data : data.results || [];

  return issues.map((issue: any) => {
    // Map status group to 'todo' | 'in_progress' | 'completed'
    const planeGroup = issue.state_detail?.group || 'unstarted';
    let status: 'todo' | 'in_progress' | 'completed' = 'todo';
    if (planeGroup === 'started') {
      status = 'in_progress';
    } else if (planeGroup === 'completed') {
      status = 'completed';
    }

    // Map priority ('urgent', 'high', 'medium', 'low', 'none') to 1-5
    const priority = issue.priority || 'none';
    let impactScore = 3;
    if (priority === 'urgent') impactScore = 5;
    else if (priority === 'high') impactScore = 4;
    else if (priority === 'medium') impactScore = 3;
    else if (priority === 'low') impactScore = 2;
    else if (priority === 'none') impactScore = 1;

    return {
      sourceId: issue.id,
      title: issue.name,
      estimatedDuration: 45, // default to 45 min focus block
      impactScore,
      status,
    };
  });
}
