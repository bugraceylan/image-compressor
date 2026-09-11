import { Download, RefreshCcw } from "lucide-react";
import { downloadZip } from "@/lib/download";
import { useT } from "@/lib/i18n";
import { Button } from "./ui/button";

interface ActionButtonsProps {
  zipFile: Blob | null;
  onReset: () => void;
  hasCompressedImages: boolean;
  hasFileList: boolean;
}

const ActionButtons = ({
  zipFile,
  onReset,
  hasCompressedImages,
  hasFileList,
}: ActionButtonsProps) => {
  const t = useT();

  if (!hasCompressedImages || !hasFileList) {
    return null;
  }

  return (
    <div className="animate-fadeInFast mt-4 flex justify-end gap-x-4">
      <Button variant="default" onClick={() => downloadZip(zipFile)}>
        <Download />
        {t("actions.downloadAll")}
      </Button>
      <Button variant="destructive" onClick={onReset}>
        <RefreshCcw />
        {t("actions.reset")}
      </Button>
    </div>
  );
};

export default ActionButtons;
