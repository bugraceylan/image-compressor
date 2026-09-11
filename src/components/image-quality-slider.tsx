import { formatPercent, useT } from "@/lib/i18n";

type QualityKey =
  | "quality.recommended"
  | "quality.moderate"
  | "quality.notRecommended";

const ImageQualitySlider = ({
  value,
  onImageQualityChange,
}: {
  value: number;
  onImageQualityChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const t = useT();
  const quality = Math.round((value / 100) * 10) / 10;

  const getImageQualityInfo = (
    q: number
  ): { key: QualityKey | null; color: string } => {
    if (q === 0) return { key: "quality.notRecommended", color: "#e14f42" };
    if (q === 0.2 || q === 0.4)
      return { key: "quality.moderate", color: "#f3d35f" };
    if (q === 0.6 || q === 0.8)
      return { key: "quality.recommended", color: "#3fc97f" };
    if (q === 1) return { key: "quality.notRecommended", color: "#e14f42" };
    if (Math.abs(q - 0.6) < 0.05 || Math.abs(q - 0.8) < 0.05)
      return { key: "quality.recommended", color: "#3fc97f" };
    if (Math.abs(q - 0.2) < 0.05 || Math.abs(q - 0.4) < 0.05)
      return { key: "quality.moderate", color: "#f3d35f" };
    if (Math.abs(q - 1) < 0.05)
      return { key: "quality.notRecommended", color: "#e14f42" };
    return { key: null, color: "#000" };
  };

  const { key, color } = getImageQualityInfo(quality);

  return (
    <div className="animate-fadeIn animate-delay-150 w-full">
      <label className="text-base font-bold">
        {t("quality.label", { value: formatPercent(value) })}
        {key && (
          <span style={{ color }} className="ml-1">
            ({t(key)})
          </span>
        )}
      </label>
      <p className="text-muted-foreground text-sm">{t("quality.hint")}</p>
      <div className="relative mb-4">
        <input
          type="range"
          className="range range-sm h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
          value={value}
          min={0}
          max={100}
          step={20}
          onChange={onImageQualityChange}
        />
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-destructive">{t("quality.low")}</span>
          <span className="text-warning">{t("quality.fair")}</span>
          <span className="text-warning">{t("quality.okay")}</span>
          <span className="text-success">{t("quality.good")}</span>
          <span className="text-success">{t("quality.high")}</span>
          <span className="text-destructive">{t("quality.max")}</span>
        </div>
      </div>
    </div>
  );
};

export default ImageQualitySlider;
