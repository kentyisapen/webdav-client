// src/utils/helpers.ts

export const getPathSegments = (path: string): string[] => {
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  return trimmedPath.split("/").filter((segment) => segment.length > 0);
};
