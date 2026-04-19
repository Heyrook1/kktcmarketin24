import {
  writeScopeLog,
  getProjectRoot,
  loadDotEnvLocal,
} from "./agents/shared"
import * as qa from "./agents/qa-agent"
import * as backend from "./agents/backend-agent"
import * as frontend from "./agents/frontend-agent"

process.env.PROJECT_DIR = process.env.PROJECT_DIR ?? getProjectRoot()
loadDotEnvLocal()

const ORCHESTRATOR_SCOPE = "ORCHESTRATOR"

async function sabahRutini() {
  writeScopeLog(ORCHESTRATOR_SCOPE, "=== SABAH RUTINI BASLIYOR ===")
  await guvenliCalistir("QA -> Site Taramasi", async () => qa.tamTarama())
  await guvenliCalistir("Backend -> API Sagligi", async () => backend.apiSagligi())
  writeScopeLog(ORCHESTRATOR_SCOPE, "=== SABAH RUTINI TAMAMLANDI ===")
}

async function ogleRutini() {
  writeScopeLog(ORCHESTRATOR_SCOPE, "=== OGLE RUTINI BASLIYOR ===")
  await guvenliCalistir("Frontend -> UI Kontrol", async () => frontend.uiKontrol())
  await guvenliCalistir(
    "Backend -> Supabase Kontrol",
    async () => backend.supabaseKontrol(),
  )
  writeScopeLog(ORCHESTRATOR_SCOPE, "=== OGLE RUTINI TAMAMLANDI ===")
}

async function geceRutini() {
  writeScopeLog(ORCHESTRATOR_SCOPE, "=== GECE RUTINI BASLIYOR ===")
  await guvenliCalistir(
    "Frontend -> Eksik Sayfalar",
    async () => frontend.eksikSayfalar(),
  )
  await guvenliCalistir("QA -> Kalite Kontrol", async () => qa.kaliteKontrol())
  writeScopeLog(ORCHESTRATOR_SCOPE, "=== GECE RUTINI TAMAMLANDI ===")
}

async function guvenliCalistir(isim: string, fn: () => Promise<void>) {
  try {
    writeScopeLog(ORCHESTRATOR_SCOPE, `START ${isim}`)
    await fn()
    writeScopeLog(ORCHESTRATOR_SCOPE, `SUCCESS ${isim}`)
    return
  } catch (error) {
    if (error instanceof Error) {
      writeScopeLog(ORCHESTRATOR_SCOPE, `ERROR ${isim} - ${error.message}`)
      return
    }

    writeScopeLog(ORCHESTRATOR_SCOPE, `ERROR ${isim} - Unknown error`)
  }
}

let sonSabahGunu = -1
let sonOgleGunu = -1
let sonGeceGunu = -1

function kontrol() {
  const simdi = new Date()
  const saat = simdi.getHours()
  const dakika = simdi.getMinutes()
  const gun = simdi.getDate()

  if (saat === 9 && dakika === 0 && sonSabahGunu !== gun) {
    sonSabahGunu = gun
    void sabahRutini()
  }

  if (saat === 14 && dakika === 0 && sonOgleGunu !== gun) {
    sonOgleGunu = gun
    void ogleRutini()
  }

  if (saat === 22 && dakika === 0 && sonGeceGunu !== gun) {
    sonGeceGunu = gun
    void geceRutini()
  }
}

function baslat() {
  writeScopeLog(ORCHESTRATOR_SCOPE, "Marketin24 yazilim takimi baslatildi")
  writeScopeLog(ORCHESTRATOR_SCOPE, `Proje: ${process.env.PROJECT_DIR ?? ""}`)
  writeScopeLog(
    ORCHESTRATOR_SCOPE,
    "Calisma saatleri: 09:00 sabah | 14:00 ogle | 22:00 gece",
  )

  writeScopeLog(ORCHESTRATOR_SCOPE, "Ilk calistirma hemen basliyor")
  void sabahRutini().then(() => {
    writeScopeLog(
      ORCHESTRATOR_SCOPE,
      "Ilk calistirma tamamlandi. Zamanli gorevler bekleniyor",
    )
  })

  setInterval(kontrol, 60 * 1000)
}

baslat()
