import { formatPercent, useT } from "@/lib/i18n";

const ImageResolutionSlider = ({
  value,
  onResolutionChange,
}: {
  value: number;
  onResolutionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const t = useT();

  return (
    <div className="animate-fadeIn animate-delay-150 w-full">
      <label className="text-base font-bold">
        {t("resolution.label", { value: formatPercent(value) })}
        {value === 100 && (
          <span className="text-muted-foreground ml-1">
            {t("resolution.original")}
          </span>
        )}
      </label>
      <p className="text-muted-foreground text-sm">{t("resolution.hint")}</p>
      <div className="relative mb-4">
        <input
          type="range"
          aria-label={t("resolution.aria")}
          className="range range-sm h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
          value={value}
          min={10}
          max={100}
          step={10}
          onChange={onResolutionChange}
        />
        <div className="mt-1 flex justify-between text-sm">
          <span>{formatPercent(10)}</span>
          <span>{formatPercent(100)}</span>
        </div>
      </div>
    </div>
  );
};

export default ImageResolutionSlider;
