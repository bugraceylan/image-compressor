const RemoveMetadataToggle = ({
  checked,
  onStripMetadataChange,
}: {
  checked: boolean;
  onStripMetadataChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
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
          <span className="text-base font-bold">Remove metadata</span>
          <span className="text-muted-foreground block text-sm">
            Strips EXIF data such as GPS location, camera model and date taken.
            If unchecked, EXIF is kept for JPEG files only.
          </span>
        </span>
      </label>
    </div>
  );
};

export default RemoveMetadataToggle;
