import { access } from "node:fs/promises";
import path from "node:path";

type FileCheckOptions = {
  checkName: string;
  relativePaths: string[];
};

const criticalUiPagePaths = [
  "app/page.tsx",
  "app/products/page.tsx",
  "app/categories/page.tsx",
  "app/cart/page.tsx",
  "app/checkout/page.tsx",
  "app/login/page.tsx",
];

async function assertFilesExist(
  projectDir: string,
  files: string[],
  checkLabel: string,
): Promise<void> {
  const missingFiles: string[] = [];

  for (const filePath of files) {
    const fullPath = path.join(projectDir, filePath);
    try {
      await access(fullPath);
    } catch {
      missingFiles.push(filePath);
    }
  }

  if (missingFiles.length === 0) {
    return;
  }

  throw new Error(
    `${checkLabel} kontrolu basarisiz. Eksik dosyalar: ${missingFiles.join(", ")}`,
  );
}

export async function ensureFilesExist({
  checkName,
  relativePaths,
}: FileCheckOptions): Promise<void> {
  const projectDir = process.env.PROJECT_DIR ?? process.cwd();
  await assertFilesExist(projectDir, relativePaths, checkName);
}

export async function ensureCriticalUiPagesExist(): Promise<void> {
  await ensureFilesExist({
    checkName: "Kritik UI sayfa kontrolu",
    relativePaths: criticalUiPagePaths,
  });
}
