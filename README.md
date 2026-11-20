# The Compressor

Browser-based compressor for images, videos and for the pictures inside Word, Excel, PowerPoint and PDF files. Everything is processed locally in the browser; nothing is uploaded.

Live: https://bugraceylan.github.io/image-compressor/

## Features

- Input: JPG, PNG and WebP images, MP4, MOV, M4V, WebM and MKV videos, Word, Excel and PowerPoint files (DOCX, XLSX, PPTX) and PDF
- Adjustable quality; PNG is re-encoded as JPG (transparent areas become white) so results open in Office and Outlook, JPG and WebP keep their format
- Optional resolution scaling from 10% to 100% of the original dimensions
- Removes metadata by default: EXIF (GPS location, camera model, date taken) from images, document properties (author, last modified by, title, company, manager) from Word, Excel and PowerPoint files and document properties (author, title, creating app, XMP) from PDFs; EXIF can be kept for JPEG. PDF/A and PDF/UA files keep their conformance claims in XMP, so they stay valid; Office custom properties (e.g. sensitivity labels) are kept
- At 100% resolution, output is never larger than needed: it falls back to the original file, or, when removing metadata from a JPEG, to a losslessly cleaned copy of it
- Word, Excel and PowerPoint: pictures inside the document are compressed with the same settings (PNG becomes JPG, links are updated) and a smaller document is returned; all other content stays byte-identical
- PDF (typically exported from Office): photos are recompressed with the quality and resolution settings; screenshots, charts and logos are only re-encoded at full resolution so their text stays sharp; text, vector graphics and fonts are untouched
- Videos: re-encoded with the browser's own (usually hardware-accelerated) encoders via WebCodecs into MP4, H.264 with AAC where available, using the same quality and resolution settings; removing metadata drops tags such as title and location. At 100% resolution a larger result falls back to the original, or when removing metadata to a copy remuxed without tags. Videos the browser cannot decode or encode are reported and left unchanged. Every setting change re-encodes the batch, which can take a while for long videos
- Documents are only replaced when the result is smaller (or when metadata was removed); password-protected files are reported as unreadable and digitally signed files are left unchanged
- Drag and drop anywhere on the page, up to 1000 files per batch, single-file or ZIP download, total size summary
- English and Turkish interface (follows the browser language, switchable in the header)

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint
```

## Deployment

Changing the version in `package.json` on `master` runs `.github/workflows/release.yml`, which creates the `v<version>` tag and releases it:

```bash
npm version 1.2.3 --no-git-tag-version
git commit -am "Bump version to 1.2.3" && git push origin master
```

- Only pushes made as the repository owner release; a `package.json` change without a new version releases nothing. Pushing a `v*` tag by hand or running the workflow from the Actions tab also releases
- The Docker image is published to `ghcr.io/bugraceylan/image-compressor:<version>` and `:latest` (nginx, port 8080)
- The site is deployed to GitHub Pages: https://bugraceylan.github.io/image-compressor/
- After a successful release, `.github/workflows/cleanup.yml` keeps only the three newest releases: older `v*` tags and every image version not tagged with one of them (including untagged ones) are deleted. Run it manually from the Actions tab; a manual run is a dry run by default and only lists what would be deleted

Run the image locally:

```bash
docker run -d -p 8080:8080 ghcr.io/bugraceylan/image-compressor:latest
```

## Stack

React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, compressorjs, JSZip, @cantoo/pdf-lib (loaded only when a PDF is added), Mediabunny (loaded only when a video is added).

## Credits

Based on [abue-ammar/image-compressor](https://github.com/abue-ammar/image-compressor) (MIT).

## License

MIT, see [LICENSE](LICENSE).
