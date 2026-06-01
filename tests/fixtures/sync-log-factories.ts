import { SyncLog } from "@/lib/db/schema/sync-logs";

export function createMockSyncLog(overrides: Partial<SyncLog> = {}): SyncLog {
  return {
    id: "mock-log-uuid",
    startedAt: new Date("2026-05-28T00:00:00Z"),
    completedAt: new Date("2026-05-28T00:05:00Z"),
    status: "success",
    propertiesFetched: 15,
    propertiesCreated: 2,
    propertiesUpdated: 5,
    propertiesRemoved: 1,
    agentsSynced: 2,
    translationsQueued: 0,
    tagsQueued: 0,
    imagesOptimized: 10,
    errors: [],
    errorMessage: null,
    officeGuid: "guid-pz",
    details: {},
    ...overrides,
  };
}
