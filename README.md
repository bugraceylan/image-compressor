# The Compressor

Browser-based compressor for images and for the pictures inside Word, Excel and PowerPoint files. Everything is processed locally in the browser; nothing is uploaded.

## Features

- JPG, PNG and WebP input
- Adjustable quality; PNG is re-encoded as JPG (transparent areas become white) so results open in Office and Outlook, JPG and WebP keep their format
- Optional resolution scaling from 10% to 100% of the original dimensions
- Removes metadata (EXIF: GPS location, camera model, date taken) by default; EXIF can be kept for JPEG
- At 100% resolution, output is never larger than needed: it falls back to the original file, or, when removing metadata from a JPEG, to a losslessly cleaned copy of it
- Word, Excel and PowerPoint (DOCX, XLSX, PPTX): pictures inside the document are compressed with the same settings (PNG becomes JPG, links are updated) and a smaller document is returned; password-protected files cannot be opened and digitally signed files are left unchanged
- Batch processing with single-file or ZIP download

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint
```

## Stack

React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, compressorjs, JSZip.

## Credits

Based on [abue-ammar/image-compressor](https://github.com/abue-ammar/image-compressor) (MIT).

## License

MIT, see [LICENSE](LICENSE).
