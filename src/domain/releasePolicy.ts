export interface ReleasePolicy {
  channel: "internal" | "release";
  updaterArtifactsEnabled: boolean;
  requiresSigningKey: boolean;
  requiresHttpsEndpoint: boolean;
  canClaimAutoUpdateReady: boolean;
}

export function currentReleasePolicy(): ReleasePolicy {
  return {
    channel: "internal",
    updaterArtifactsEnabled: false,
    requiresSigningKey: true,
    requiresHttpsEndpoint: true,
    canClaimAutoUpdateReady: false
  };
}

