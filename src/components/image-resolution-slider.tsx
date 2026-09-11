const ImageResolutionSlider = ({
  value,
  onResolutionChange,
}: {
  value: number;
  onResolutionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div className="animate-fadeIn animate-delay-150 w-full">
      <label className="text-base font-bold">
        Resolution: {value}%
        {value === 100 && (
          <span className="text-muted-foreground ml-1">(Original)</span>
        )}
      </label>
      <p className="text-muted-foreground text-sm">
        Lower resolution = smaller dimensions and file size
      </p>
      <div className="relative mb-4">
        <input
          type="range"
          aria-label="Resolution"
          className="range range-sm h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
          value={value}
          min={10}
          max={100}
          step={10}
          onChange={onResolutionChange}
        />
        <div className="mt-1 flex justify-between text-sm">
          <span>10%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default ImageResolutionSlider;
