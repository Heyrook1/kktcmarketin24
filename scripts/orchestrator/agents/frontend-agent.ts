import path from "node:path";

import { collectFilesRecursively, readTextFile, type Logger } from "../core";

export interface FrontendAgent {
  uiKontrol: () => Promise<void>;
  eksikSayfalar: () => Promise<void>;
}

interface FrontendAgentDependencies {
  projectDirectory: string;
  log: Logger;
}

interface RouteMissingReport {
  route: string;
  file: string;
}

export function createFrontendAgent({ projectDirectory, log }: FrontendAgentDependencies): FrontendAgent {
  async function uiKontrol(): Promise<void> {
    const rootLayoutPath = path.join(projectDirectory, "app", "layout.tsx");
    const rootPagePath = path.join(projectDirectory, "app", "page.tsx");

    const rootLayoutContent = readTextFile(rootLayoutPath);
    const rootPageContent = readTextFile(rootPagePath);

    if (!rootLayoutContent.includes("<body")) {
      throw new Error("app/layout.tsx dosyasinda body etiketi bulunamadi.");
    }

    if (rootPageContent.trim().length < 20) {
      throw new Error("app/page.tsx dosya icerigi beklenenden kisa.");
    }

    log("Temel UI dosyalari dogrulandi (layout + ana sayfa).");
  }

  async function eksikSayfalar(): Promise<void> {
    const oncelikliRotalar = [
      "/",
      "/products",
      "/cart",
      "/checkout",
      "/contact",
      "/login",
      "/vendor-panel",
      "/super-admin",
    ];

    const appDirectory = path.join(projectDirectory, "app");
    const pageFiles = collectFilesRecursively(appDirectory, (fileName) => fileName === "page.tsx");
    const routeSet = new Set(
      pageFiles.map((absoluteFilePath) => {
        const relativePath = path.relative(appDirectory, absoluteFilePath).replace(/\\/gu, "/");
        const routePath = relativePath.replace(/\/page\.tsx$/u, "");
        if (routePath.length === 0) {
          return "/";
        }
        return `/${routePath}`;
      }),
    );

    const eksikRotalar: RouteMissingReport[] = [];
    for (const route of oncelikliRotalar) {
      if (routeSet.has(route)) {
        continue;
      }

      const olasiDosya = route === "/" ? "app/page.tsx" : path.join("app", route.slice(1), "page.tsx");
      eksikRotalar.push({ route, file: olasiDosya });
    }

    if (eksikRotalar.length > 0) {
      const detay = eksikRotalar.map((entry) => `${entry.route} -> ${entry.file}`).join(", ");
      throw new Error(`Eksik oncelikli sayfalar: ${detay}`);
    }

    log(`Oncelikli sayfa kontrolu tamamlandi. Toplam sayfa: ${routeSet.size}`);
  }

  return {
    uiKontrol,
    eksikSayfalar,
  };
}
