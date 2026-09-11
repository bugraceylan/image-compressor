import { version } from "../../package.json";

const Footer = () => {
  return (
    <footer className="bg-background text-foreground border-border w-full border-t">
      <div className="container mx-auto flex h-14 items-center justify-end px-4">
        <a
          href="https://github.com/bugraceylan/image-compressor"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Version ${version}, view source on GitHub`}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          v{version}
        </a>
      </div>
    </footer>
  );
};

export default Footer;
