import { ensureCriticalUiPagesExist, ensureFilesExist } from "./file-checks.ts";

const criticalUiComponentPaths = [
  "components/layout/site-header.tsx",
  "components/layout/footer.tsx",
  "components/product/product-card.tsx",
  "components/shared/search-bar.tsx",
];

export async function uiKontrol(): Promise<void> {
  await ensureFilesExist({
    checkName: "Frontend UI kontrolu",
    relativePaths: criticalUiComponentPaths,
  });
}

export async function eksikSayfalar(): Promise<void> {
  await ensureCriticalUiPagesExist();
}
