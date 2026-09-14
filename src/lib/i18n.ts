import { useSyncExternalStore } from "react";

const en = {
  "theme.toggle": "Toggle theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
  "language.toggle": "Change language",
  "intro.title": "Free & Open Source Image and Document Compressor",
  "intro.subtitle":
    "Shrink images and the pictures inside Word, Excel, PowerPoint and PDF files instantly and securely, right on your device. No uploads, no limits, no APIs. Works offline and keeps your files private.",
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
  "dropzone.idle":
    "Drag & drop images, Office or PDF files anywhere or click here to browse",
  "dropzone.active": "Drop your files here",
  "dropzone.upload": "Upload files",
  "actions.downloadAll": "Download All (ZIP)",
  "actions.reset": "Reset",
  "results.emptyTitle": "No Compressed Files",
  "results.emptyText":
    "Upload images or Word, Excel, PowerPoint and PDF files to see your results here.",
  "results.download": "Download {name}",
  "document.images": "{done} of {total} images compressed",
  "document.noImages": "No compressible images found",
  "document.signed": "Digitally signed, left unchanged",
  "document.unreadable": "Could not be opened: password-protected or damaged",
  "summary.totalOriginal": "Total original ({count} files)",
  "summary.totalOriginalOne": "Total original (1 file)",
  "summary.saved": "Saved",
  "summary.increase": "Size increase",
  "summary.final": "Final size",
  "progress.done": "Compression complete",
  "progress.running": "Compressing... {value}",
  "footer.version": "Version {version}, view source on GitHub",
  "toast.invalidFile":
    "Invalid file! Please upload only JPG, PNG, WEBP images or DOCX, XLSX, PPTX, PDF files.",
  "toast.tooManyFiles":
    "Too many files: only the first {max} of {count} files were added.",
  "toast.noZip": "No zip file available.",
  "toast.zipDone": "ZIP downloaded successfully!",
  "toast.zipFailed": "Failed to download ZIP.",
  "toast.imageDone": "File downloaded successfully!",
  "toast.imageFailed": "Failed to download file.",
};

type Key = keyof typeof en;

const tr: Record<Key, string> = {
  "theme.toggle": "Temayı değiştir",
  "theme.light": "Açık",
  "theme.dark": "Koyu",
  "theme.system": "Sistem",
  "language.toggle": "Dili değiştir",
  "intro.title": "Ücretsiz ve Açık Kaynak Görsel ve Belge Sıkıştırıcı",
  "intro.subtitle":
    "Görselleri ve Word, Excel, PowerPoint, PDF dosyalarındaki resimleri anında ve güvenle, doğrudan cihazınızda küçültün. Yükleme yok, sınır yok, API yok. Çevrimdışı çalışır ve dosyalarınızı gizli tutar.",
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
  "dropzone.idle":
    "Görselleri, Office veya PDF dosyalarını herhangi bir yere sürükleyip bırakın ya da seçmek için buraya tıklayın",
  "dropzone.active": "Dosyaları buraya bırakın",
  "dropzone.upload": "Dosya yükle",
  "actions.downloadAll": "Tümünü İndir (ZIP)",
  "actions.reset": "Sıfırla",
  "results.emptyTitle": "Sıkıştırılmış Dosya Yok",
  "results.emptyText":
    "Sonuçları burada görmek için görsel ya da Word, Excel, PowerPoint veya PDF dosyası yükleyin.",
  "results.download": "{name} dosyasını indir",
  "document.images": "{total} görselden {done} tanesi sıkıştırıldı",
  "document.noImages": "Sıkıştırılabilir görsel bulunamadı",
  "document.signed": "Dijital imzalı, değiştirilmedi",
  "document.unreadable": "Açılamadı: parola korumalı ya da bozuk",
  "summary.totalOriginal": "Toplam orijinal ({count} dosya)",
  "summary.totalOriginalOne": "Toplam orijinal (1 dosya)",
  "summary.saved": "Tasarruf",
  "summary.increase": "Boyut artışı",
  "summary.final": "Son boyut",
  "progress.done": "Sıkıştırma tamamlandı",
  "progress.running": "Sıkıştırılıyor... {value}",
  "footer.version": "Sürüm {version}, kaynak kodu GitHub'da görüntüle",
  "toast.invalidFile":
    "Geçersiz dosya! Lütfen yalnızca JPG, PNG, WEBP görselleri ya da DOCX, XLSX, PPTX, PDF dosyaları yükleyin.",
  "toast.tooManyFiles":
    "Çok fazla dosya: {count} dosyadan yalnızca ilk {max} tanesi eklendi.",
  "toast.noZip": "ZIP dosyası hazır değil.",
  "toast.zipDone": "ZIP başarıyla indirildi!",
  "toast.zipFailed": "ZIP indirilemedi.",
  "toast.imageDone": "Dosya başarıyla indirildi!",
  "toast.imageFailed": "Dosya indirilemedi.",
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
