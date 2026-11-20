# The Compressor

Browser-only compressor for images, videos and the pictures inside Office/PDF files
(React, TypeScript, Vite). Nothing is uploaded; keep it that way.

## Checks

```bash
npm run lint
npm run build
```

## Releasing a version

A release is a pushed `v*` tag; `.github/workflows/release.yml` then publishes the
Docker image and deploys GitHub Pages (https://bugraceylan.github.io/image-compressor/).

On every release, when the change affects what the app does, update all of these
in the same release:

1. `package.json` / `package-lock.json` version (`npm version X.Y.Z --no-git-tag-version`;
   minor for a new feature, patch for fixes). The footer shows this version.
2. `README.md`: the intro sentence, Features list, and Stack line.
3. `index.html`: `description`, `og:description` and `keywords` meta tags.
4. In-app texts in `src/lib/i18n.ts` (English and Turkish): intro, drop zone,
   empty state, invalid-file toast.
5. The GitHub repository About section (description, website, topics). It is not
   in the repository and cannot be edited from Claude Code sessions: give the user
   the updated text below and ask them to paste it (repo page → gear icon next to
   About). Keep the text below in sync with what the About section should say.

Cloud sessions cannot push tags (the git proxy returns 403). Push the commits to
`master`, then ask the user to create the tag, e.g. on GitHub: Releases → Draft a
new release → tag `vX.Y.Z` on `master` → Publish (a draft does not create the tag).
Afterwards verify the deploy: the release workflow run succeeded and the live site's
footer shows the new version.

### GitHub About text

- Description: Free, open-source image, video and document compressor that runs
  entirely in your browser: JPG, PNG, WebP, MP4, MOV, WebM, Word, Excel,
  PowerPoint and PDF. Nothing is uploaded.
- Website: https://bugraceylan.github.io/image-compressor/
- Topics: image-compression, video-compression, pdf-compression, docx, xlsx, pptx,
  webcodecs, react, typescript, vite, offline, privacy
