import { useSyncExternalStore } from "react";

const en = {
  "theme.toggle": "Toggle theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "language.toggle": "Change language",
  "intro.title": "Free & Open Source Image Compressor",
  "intro.subtitle":
    "Compress images instantly and securely, right on your device. No uploads, no limits, no APIs. Works offline and keeps your files private.",
  "quality.label": "Image Quality: {value}",
  "quality.hint": "Higher quality = larger file size",
  "quality.recommended": "Recommended",
  "quality.moderate": "Moderate",
  "quality.notRecommended": "Not Recommended",
  "quality.low": "Low",
  "quality.fair": "Fair",
  "quality.okay": "Okay",
  "quality.good": "Good",
  "quality.high": "High",
  "quality.max": "Max",
  "resolution.label": "Resolution: {value}",
  "resolution.original": "(Original)",
  "resolution.hint": "Lower resolution = smaller dimensions and file size",
  "resolution.aria": "Resolution",
  "metadata.label": "Remove metadata",
  "metadata.hint":
    "Strips EXIF data such as GPS location, camera model and date taken. If unchecked, EXIF is kept for JPEG files only.",
  "dropzone.idle": "Drag & drop images anywhere",
  "dropzone.active": "Drop your images here",
  "dropzone.upload": "Upload image file",
  "actions.downloadAll": "Download All (ZIP)",
  "actions.reset": "Reset",
  "results.emptyTitle": "No Compressed Images",
  "results.emptyText":
    "Upload images and compress them to see your results here. Your compressed images will appear in this section.",
  "results.download": "Download {name}",
  "summary.totalOriginal": "Total original ({count} images)",
  "summary.totalOriginalOne": "Total original (1 image)",
  "summary.saved": "Saved",
  "summary.increase": "Size increase",
  "summary.final": "Final size",
  "progress.done": "Compression complete",
  "progress.running": "Compressing... {value}",
  "footer.version": "Version {version}, view source on GitHub",
  "toast.invalidFile":
    "Invalid file! Please upload only JPG, JPEG, PNG, or WEBP files.",
  "toast.noZip": "No zip file available.",
  "toast.zipDone": "ZIP downloaded successfully!",
  "toast.zipFailed": "Failed to download ZIP.",
  "toast.imageDone": "Image downloaded successfully!",
  "toast.imageFailed": "Failed to download image.",
};

type Key = keyof typeof en;

const tr: Record<Key, string> = {
  "theme.toggle": "Temayı değiştir",
  "theme.light": "Açık",
  "theme.dark": "Koyu",
  "theme.system": "Sistem",
  "language.toggle": "Dili değiştir",
  "intro.title": "Ücretsiz ve Açık Kaynak Görsel Sıkıştırıcı",
  "intro.subtitle":
    "Görsellerinizi anında ve güvenle, doğrudan cihazınızda sıkıştırın. Yükleme yok, sınır yok, API yok. Çevrimdışı çalışır ve dosyalarınızı gizli tutar.",
  "quality.label": "Görsel Kalitesi: {value}",
  "quality.hint": "Daha yüksek kalite = daha büyük dosya",
  "quality.recommended": "Önerilen",
  "quality.moderate": "Orta",
  "quality.notRecommended": "Önerilmez",
  "quality.low": "Düşük",
  "quality.fair": "Vasat",
  "quality.okay": "Makul",
  "quality.good": "İyi",
  "quality.high": "Yüksek",
  "quality.max": "Maks.",
  "resolution.label": "Çözünürlük: {value}",
  "resolution.original": "(Orijinal)",
  "resolution.hint": "Daha düşük çözünürlük = daha küçük boyut ve dosya",
  "resolution.aria": "Çözünürlük",
  "metadata.label": "Meta verileri kaldır",
  "metadata.hint":
    "GPS konumu, kamera modeli ve çekim tarihi gibi EXIF verilerini siler. İşaret kaldırılırsa EXIF yalnızca JPEG dosyalarında korunur.",
  "dropzone.idle": "Görselleri herhangi bir yere sürükleyip bırakın",
  "dropzone.active": "Görselleri buraya bırakın",
  "dropzone.upload": "Görsel dosyası yükle",
  "actions.downloadAll": "Tümünü İndir (ZIP)",
  "actions.reset": "Sıfırla",
  "results.emptyTitle": "Sıkıştırılmış Görsel Yok",
  "results.emptyText":
    "Sonuçları burada görmek için görsel yükleyip sıkıştırın. Sıkıştırılan görseller bu bölümde görünecek.",
  "results.download": "{name} dosyasını indir",
  "summary.totalOriginal": "Toplam orijinal ({count} görsel)",
  "summary.totalOriginalOne": "Toplam orijinal (1 görsel)",
  "summary.saved": "Tasarruf",
  "summary.increase": "Boyut artışı",
  "summary.final": "Son boyut",
  "progress.done": "Sıkıştırma tamamlandı",
  "progress.running": "Sıkıştırılıyor... {value}",
  "footer.version": "Sürüm {version}, kaynak kodu GitHub'da görüntüle",
  "toast.invalidFile":
    "Geçersiz dosya! Lütfen yalnızca JPG, JPEG, PNG veya WEBP dosyası yükleyin.",
  "toast.noZip": "ZIP dosyası hazır değil.",
  "toast.zipDone": "ZIP başarıyla indirildi!",
  "toast.zipFailed": "ZIP indirilemedi.",
  "toast.imageDone": "Görsel başarıyla indirildi!",
  "toast.imageFailed": "Görsel indirilemedi.",
};

export type Lang = "en" | "tr";

const dictionaries: Record<Lang, Record<Key, string>> = { en, tr };
const STORAGE_KEY = "lang";

// A saved choice from the switcher wins; otherwise follow the browser language.
export const detectLang = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "tr") return saved;
  } catch {
    // Storage blocked: fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
};

// Module-level store so non-React code (toasts) can translate too.
let current: Lang = detectLang();
document.documentElement.lang = current;
const listeners = new Set<() => void>();

export const setLang = (lang: Lang) => {
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
  listeners.forEach((notify) => notify());
};

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

export const useLang = () => useSyncExternalStore(subscribe, () => current);

export const t = (key: Key, vars: Record<string, string | number> = {}) =>
  dictionaries[current][key].replace(/\{(\w+)\}/g, (_, name: string) =>
    String(vars[name] ?? `{${name}}`)
  );

/** Returns t and re-renders the calling component when the language changes. */
export const useT = () => {
  useLang();
  return t;
};

export const formatNumber = (value: number, digits: number) =>
  new Intl.NumberFormat(current, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(value);

// "60%" in English, "%60" in Turkish.
export const formatPercent = (value: number, digits = 0) =>
  new Intl.NumberFormat(current, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
