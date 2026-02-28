import type { GameNode } from '@/lib/types/game';
import { terminalCoreNodes } from './terminal-core.nodes';
import { newsroomDemoNodes } from './newsroom-demo.nodes';

export type NodeSetMap = Record<string, GameNode>;

export interface CampaignNodeSetInfo {
  id: string;
  displayName: string;
  description: string;
}

const NODE_SET_REGISTRY: Record<string, NodeSetMap> = {
  'terminal-core': terminalCoreNodes,
  'newsroom-demo': newsroomDemoNodes,
};

const NODE_SET_META: CampaignNodeSetInfo[] = [
  {
    id: 'terminal-core',
    displayName: 'Terminal Core',
    description: 'Current production story graph.',
  },
  {
    id: 'newsroom-demo',
    displayName: 'Newsroom Demo',
    description: 'Short satirical newsroom investigation campaign.',
  },
];

const FALLBACK_NODE_SET_ID = 'terminal-core';

export function resolveCampaignNodeSet(nodeSetId?: string | null): { nodeSetId: string; nodes: NodeSetMap } {
  if (nodeSetId && NODE_SET_REGISTRY[nodeSetId]) {
    return { nodeSetId, nodes: NODE_SET_REGISTRY[nodeSetId] };
  }
  return {
    nodeSetId: FALLBACK_NODE_SET_ID,
    nodes: NODE_SET_REGISTRY[FALLBACK_NODE_SET_ID],
  };
}

export function listAvailableNodeSets(): CampaignNodeSetInfo[] {
  return [...NODE_SET_META];
}
