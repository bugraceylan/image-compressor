import { useT } from "@/lib/i18n";

const RemoveMetadataToggle = ({
  checked,
  onStripMetadataChange,
}: {
  checked: boolean;
  onStripMetadataChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const t = useT();

  return (
    <div className="animate-fadeIn animate-delay-150 mb-4 w-full">
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="accent-primary mt-1 size-4 shrink-0 cursor-pointer"
          checked={checked}
          onChange={onStripMetadataChange}
        />
        <span>
          <span className="text-base font-bold">{t("metadata.label")}</span>
          <span className="text-muted-foreground block text-sm">
            {t("metadata.hint")}
          </span>
        </span>
      </label>
    </div>
  );
};

export default RemoveMetadataToggle;
